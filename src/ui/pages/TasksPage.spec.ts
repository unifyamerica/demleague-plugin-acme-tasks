import {
  installTestPluginHost,
  uninstallTestPluginHost,
  type TestPluginHost,
} from '@unifyamerica/demleague-plugin-sdk/vue/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PrimeVue from 'primevue/config';
import { afterEach, describe, expect, it } from 'vitest';
import type {
  RecentNotes,
  Task,
  TasksPage as TasksPageResponse,
} from '../types';
import TasksPage from './TasksPage.vue';

const organization = {
  id: 'o1',
  name: 'Acme',
  slug: 'acme',
  description: null,
};

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  ownerId: 'u1',
  title: 'Call Ann',
  done: false,
  noteId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const page = (items: Task[]): TasksPageResponse => ({
  items,
  total: items.length,
  limit: 100,
  skip: 0,
});

const notesAvailable: RecentNotes = {
  available: true,
  notes: [
    {
      id: 'n1',
      title: 'Groceries',
      pinned: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('TasksPage', () => {
  let host: TestPluginHost;

  const render = () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(TasksPage, { global: { plugins: [pinia, PrimeVue] } });
  };

  afterEach(() => uninstallTestPluginHost());

  it("shows the user's tasks and latest notes, and keeps a note about a task", async () => {
    host = installTestPluginHost({
      organization,
      abilities: ['read Task', 'create Task', 'update Task', 'delete Task'],
      responses: {
        'GET /tasks': page([task()]),
        'GET /notes': notesAvailable,
        'POST /tasks/t1/note': task({ noteId: 'n2' }),
      },
    });
    const wrapper = render();
    await flushPromises();

    expect(wrapper.text()).toContain('Call Ann');
    expect(wrapper.text()).toContain('Groceries');

    await wrapper.find('[aria-label="pages.tasks.keepNote"]').trigger('click');
    await flushPromises();

    expect(host.requests.map((r) => `${r.method} ${r.path}`)).toContain(
      'POST /tasks/t1/note',
    );
    expect(host.toasts).toEqual([
      { severity: 'success', detail: 'pages.tasks.noteSaved' },
    ]);
  });

  it("hides the notes parts when the Notes module isn't available", async () => {
    host = installTestPluginHost({
      organization,
      abilities: ['read Task', 'update Task'],
      responses: {
        'GET /tasks': page([task()]),
        'GET /notes': { available: false, notes: [] },
      },
    });
    const wrapper = render();
    await flushPromises();

    expect(wrapper.text()).toContain('pages.notes.unavailable');
    expect(wrapper.find('[aria-label="pages.tasks.keepNote"]').exists()).toBe(
      false,
    );
  });

  it('asks for an organization instead of loading without one', async () => {
    host = installTestPluginHost({ organization: null });
    const wrapper = render();
    await flushPromises();

    expect(wrapper.text()).toContain('pages.tasks.noOrganization');
    expect(host.requests).toEqual([]);
  });
});
