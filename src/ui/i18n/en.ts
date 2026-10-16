// The plugin's own messages: `t('nav.tasks')` from `useI18n()` (the SPA files them under `plugins.acme.tasks`)
export default {
  nav: {
    tasks: 'Tasks',
  },
  fields: {
    title: 'New task',
  },
  pages: {
    tasks: {
      title: 'Tasks',
      subtitle: 'Private to you, in {organization}',
      noOrganization: 'Pick an organization to keep tasks in.',
      empty: 'No tasks yet.',
      add: 'Add',
      done: 'Done',
      keepNote: 'Keep a note about it',
      noteKept: 'Note kept in Notes',
      noteSaved: 'Note created in Notes',
      confirmDelete: 'Delete "{title}"?',
      deleted: 'Task deleted',
    },
    notes: {
      title: 'Your latest notes',
      empty: 'No notes yet.',
      unavailable: 'Turn on the Notes module to see your latest notes here.',
      pinned: 'Pinned',
    },
  },
  buttons: {
    delete: 'Delete',
  },
};
