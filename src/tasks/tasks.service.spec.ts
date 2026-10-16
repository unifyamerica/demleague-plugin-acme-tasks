import {
  PluginActor,
  PluginActorForbiddenError,
  PluginCallUnavailableError,
  PluginValidationError,
} from '@unifyamerica/demleague-plugin-sdk';
import {
  createPluginTestHarness,
  PluginTestHarness,
} from '@unifyamerica/demleague-plugin-sdk/testing';
import { NotFoundException } from '@nestjs/common';
import { AcmeTasksPlugin } from '../acme-tasks.plugin';
import { TasksService } from './tasks.service';

const orgA = { id: 'org-a', name: 'A', slug: 'a', description: null };
const ada: PluginActor = {
  id: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  memberships: [{ organizationId: 'org-a', roles: ['member'] }],
};
const bob: PluginActor = {
  id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  memberships: [{ organizationId: 'org-a', roles: ['member'] }],
};

const NOTE = {
  id: 'n1',
  title: 'Groceries',
  pinned: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TasksService', () => {
  let harness: PluginTestHarness;
  let service: TasksService;

  beforeEach(async () => {
    harness = await createPluginTestHarness(AcmeTasksPlugin, {
      actor: ada,
      tenant: orgA,
    });
    service = harness.module.get(TasksService);
  });

  afterEach(() => harness.close());

  it("keeps each user's tasks to themselves, open ones first", async () => {
    const done = await service.create(ada, { title: 'Done' });
    await service.update(ada, done.id, { done: true });
    await service.create(ada, { title: 'Open' });
    const bobs = await service.create(bob, { title: "Bob's" });

    const { items } = await service.list(ada);
    expect(items.map((task) => task.title)).toEqual(['Open', 'Done']);
    await expect(service.findOwn(ada, bobs.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('recentNotes (calls acme.notes → notes.list)', () => {
    it("returns the user's latest notes when Notes is available", async () => {
      harness.calls.stub('acme.notes', 'notes.list', () => [NOTE]);

      await expect(service.recentNotes()).resolves.toEqual({
        available: true,
        notes: [NOTE],
      });
      expect(harness.calls.calls).toEqual([
        {
          namespace: 'acme.notes',
          operation: 'notes.list',
          input: { limit: 5 },
        },
      ]);
    });

    it("degrades when Notes isn't installed or turned on (no stub)", async () => {
      await expect(service.recentNotes()).resolves.toEqual({
        available: false,
        notes: [],
      });
    });

    it('degrades when the user may not read notes', async () => {
      harness.calls.stub('acme.notes', 'notes.list', () => {
        throw new PluginActorForbiddenError('Insufficient permissions');
      });

      await expect(service.recentNotes()).resolves.toEqual({
        available: false,
        notes: [],
      });
    });

    it('lets other errors through', async () => {
      harness.calls.stub('acme.notes', 'notes.list', () => {
        throw new PluginValidationError('limit must be an integer');
      });

      await expect(service.recentNotes()).rejects.toThrow(
        PluginValidationError,
      );
    });
  });

  describe('addNote (calls acme.notes → notes.create)', () => {
    it('creates the note in Notes once and remembers it', async () => {
      const task = await service.create(ada, { title: 'Call Ann' });
      harness.calls.stub('acme.notes', 'notes.create', (input) => ({
        id: 'n9',
        title: (input as { title: string }).title,
      }));

      const updated = await service.addNote(ada, task.id);
      await service.addNote(ada, task.id);

      expect(updated.noteId).toBe('n9');
      expect(harness.calls.calls).toEqual([
        {
          namespace: 'acme.notes',
          operation: 'notes.create',
          input: { title: 'Task: Call Ann' },
        },
      ]);
    });

    it("fails with PLUGIN_CALL_UNAVAILABLE when Notes isn't available", async () => {
      const task = await service.create(ada, { title: 'Call Ann' });

      await expect(service.addNote(ada, task.id)).rejects.toThrow(
        PluginCallUnavailableError,
      );
      expect((await service.findOwn(ada, task.id)).noteId).toBeNull();
    });

    it("never calls Notes for someone else's task", async () => {
      const task = await service.create(bob, { title: "Bob's" });

      await expect(service.addNote(ada, task.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(harness.calls.calls).toEqual([]);
    });
  });
});
