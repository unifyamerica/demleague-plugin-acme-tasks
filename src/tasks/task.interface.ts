export interface Task {
  ownerId: string;
  title: string;
  done: boolean;
  // The note kept about it in the Notes module (`notes.create`), if any
  noteId: string | null;
}

// What the Notes module's `notes.list` returns. Declared here, not imported: a plugin only imports the SDK, never
// another plugin's package. Keep it in step with what acme.notes documents for the operation.
export interface NoteSummary {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

export const NOTES = 'acme.notes';
