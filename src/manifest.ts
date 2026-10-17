import { type PluginManifest } from '@unifyamerica/demleague-plugin-sdk/manifest';

// ℹ️ Everything this plugin needs from the platform. The core team approves its permissions, ability grants, UI
// slots and calls to other modules in the API's namespace registry. Imported by both the server code and the
// UI (`src/ui`), hence the NestJS-free `@unifyamerica/demleague-plugin-sdk/manifest`.
export const ACME_TASKS_MANIFEST: PluginManifest = {
  namespace: 'acme.tasks',
  version: '0.2.2',
  displayName: 'Tasks',
  description:
    'Private to-do lists for each user in each of their organizations, with their latest notes from the Notes module next to them',
  permissions: ['data:read', 'data:write'],
  endpoints: [
    {
      method: 'GET',
      path: '/tasks',
      summary: "List the current user's tasks in the organization",
    },
    { method: 'POST', path: '/tasks', summary: 'Create a task' },
    { method: 'PATCH', path: '/tasks/:id', summary: 'Update one of my tasks' },
    { method: 'DELETE', path: '/tasks/:id', summary: 'Delete one of my tasks' },
    {
      method: 'POST',
      path: '/tasks/:id/note',
      summary: 'Keep a note about one of my tasks (in the Notes module)',
    },
    {
      method: 'GET',
      path: '/notes',
      summary: 'My latest notes from the Notes module, if it is available',
    },
  ],
  collections: ['tasks'],
  // Members keep tasks in their organizations (org admins are members too)
  abilities: {
    Task: { organization: { member: ['read', 'create', 'update', 'delete'] } },
  },
  ui: { slots: ['main-menu'] },
  // The Notes module's operations this plugin calls (it exports them to us: `notes.list` to any approved module,
  // `notes.create` to acme.tasks by name). Soft dependency: without Notes, tasks still work and the notes parts
  // are hidden.
  calls: {
    'acme.notes': { operations: ['notes.list', 'notes.create'] },
  },
  limits: {
    requestsPerMinute: 120,
    requestsPerMinutePerUser: 60,
    dbOperationsPerMinute: 600,
    requestTimeoutMs: 5000,
    maxDocumentBytes: 4 * 1024,
    maxDocuments: 10_000,
    maxStorageBytes: 10 * 1024 * 1024,
  },
};
