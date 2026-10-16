# @unifyamerica/demleague-plugin-acme-tasks

Example DemLeagueOS plugin, namespace `acme.tasks`, and **the example of one module calling another**. It gives
each user a private to-do list in each of their organizations, shows their latest notes from the
[acme-notes](https://github.com/unifyamerica/demleague-plugin-acme-notes) module next to it, and can keep a note
about a task in that module. It has an API part (`src/`, entry `.`) and a SPA UI (`src/ui/`, entry `./ui`).

It never imports acme-notes or touches its data. It calls the operations acme-notes **exports**, through the
host, for the current user in the current organization. New plugins start from the
[acme-notes template](https://github.com/unifyamerica/demleague-plugin-acme-notes); look here for how to use
another module.

Endpoints are mounted at `/plugins/acme/tasks`. Tasks are kept per organization (the request's `X-Tenant`):

| Method | Path | Who | What |
| --- | --- | --- | --- |
| GET / POST | `/tasks` | members and org admins of the organization (`Task` ability) | List (open first) / create own tasks |
| PATCH / DELETE | `/tasks/:id` | same, own tasks only (others' are 404) | Rename, tick off / delete |
| POST | `/tasks/:id/note` | same, `update Task` (plus acme-notes' `create Note`) | Keep a note about the task: calls `acme.notes` → `notes.create`, stores the note's id on the task |
| GET | `/notes` | same, `read Task` | The user's latest notes: calls `acme.notes` → `notes.list`; `{ available: false, notes: [] }` when Notes can't be used |

The UI adds a **Tasks** page to the sidebar (`/apps/acme/tasks`). It hides the notes panel's content and the
"Keep a note" buttons while Notes isn't available in the organization.

## How it calls acme-notes

1. **The provider exports the operations.** acme-notes' manifest has `exports` for `notes.list` (to any
   approved module) and `notes.create` (to `acme.tasks` by name), each with the ability its matching endpoint
   needs, implemented with `@ExportedOperation()` (see its README for the inputs and results).
2. **This plugin declares the calls** in `src/manifest.ts`:

   ```ts
   calls: { 'acme.notes': { operations: ['notes.list', 'notes.create'] } },
   ```

3. **The core team approves each connection** in this plugin's entry in DemLeagueOS'
   `api/namespace-registry.json`: `"approvedCalls": { "acme.notes": ["notes.list", "notes.create"] }`.
4. **The code calls them through `ModuleCallsProxy`** (`src/tasks/tasks.service.ts`), with the result shape
   declared locally (`src/tasks/task.interface.ts`): a plugin never imports another plugin's package.

```ts
const notes = await this.modules.call<NoteSummary[]>('acme.notes', 'notes.list', { limit: 5 });
```

The host runs the call **inside acme-notes**, as acme-notes, for the same user in the same organization: the
user needs acme-notes' `read Note` there, and the note `notes.create` writes belongs to them. Only plain JSON
crosses, copied both ways.

**The dependency is soft.** acme-notes may not be installed, or not turned on in an organization. Then calls
fail with `PluginCallUnavailableError`, and this plugin degrades: `GET /notes` answers
`{ available: false }` (also when the user may not read notes) and the page hides the notes parts, while
`POST /tasks/:id/note` lets the 503 `PLUGIN_CALL_UNAVAILABLE` through. Tasks keep working either way.

**Tests** stub the other module (`src/tasks/tasks.service.spec.ts`): `harness.calls.stub('acme.notes',
'notes.list', …)` for the available case; with no stub, the call fails like a module that isn't there.
`harness.calls.calls` records what was called.

The full contract is in the
[Plugin Developer Guide](https://github.com/unifyamerica/demleague-plugin-sdk/blob/main/PLUGIN_DEVELOPER_GUIDE.md)
(§11a, Calls between modules) and, for AI agents, in acme-notes'
[`PLUGIN_AI_CONTEXT.md`](https://github.com/unifyamerica/demleague-plugin-acme-notes/blob/main/PLUGIN_AI_CONTEXT.md)
(§2.7b).

## Releasing and installing

As for every module (see the [acme-notes README](https://github.com/unifyamerica/demleague-plugin-acme-notes)):
bump `version` in `package.json` and `src/manifest.ts`, merge, and push a `v<version>` tag. The org's release
workflow ([demleague-plugin-workflows](https://github.com/unifyamerica/demleague-plugin-workflows)) checks,
builds, attests and publishes it. The core team's install PR in DemLeagueOS pins the exact version in
`api/package.json` and `frontend/package.json`, adds it to both `plugins.config.ts` files, and adds its registry
entry with `approvedPermissions` (`data:read`, `data:write`), `approvedAbilityGrants` (`Task` for `member`),
`approvedUiSlots` (`main-menu`) and `approvedCalls`.

## Scripts

`npm run build`, `npm test` (Jest + Vitest), `npm run lint`, `npm run type-check` (`tsc` + `vue-tsc`)
