import { ref } from 'vue';
import { tasksUi, useApi } from '../plugin';
import type { RecentNotes, Task, TasksPage } from '../types';

// The user's tasks in the current organization, and their latest notes from the Notes module. Store id:
// `acme.tasks/tasks`.
export const useTasksStore = tasksUi.defineStore('tasks', () => {
  const api = useApi();
  const tasks = ref<Task[]>([]);
  const recentNotes = ref<RecentNotes>({ available: false, notes: [] });
  const loading = ref(false);

  async function load() {
    loading.value = true;
    try {
      // Both come from this plugin's API: it calls the Notes module for the notes
      const [page, notes] = await Promise.all([
        api.get<TasksPage>('/tasks'),
        api.get<RecentNotes>('/notes'),
      ]);
      tasks.value = page.items;
      recentNotes.value = notes;
    } finally {
      loading.value = false;
    }
  }

  async function create(title: string) {
    await api.post<Task>('/tasks', { title });
    await load();
  }

  async function setDone(id: string, done: boolean) {
    await api.patch<Task>(`/tasks/${id}`, { done });
    await load();
  }

  // Creates the note in the Notes module (through this plugin's API), then shows it among the latest notes
  async function keepNote(id: string) {
    await api.post<Task>(`/tasks/${id}/note`);
    await load();
  }

  async function remove(id: string) {
    await api.delete(`/tasks/${id}`);
    tasks.value = tasks.value.filter((task) => task.id !== id);
  }

  // Organization switches re-create the page, which loads again: never show another organization's tasks
  function reset() {
    tasks.value = [];
    recentNotes.value = { available: false, notes: [] };
  }

  return {
    tasks,
    recentNotes,
    loading,
    load,
    create,
    setDone,
    keepNote,
    remove,
    reset,
  };
});
