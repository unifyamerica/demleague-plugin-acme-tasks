// The API's responses, as JSON (see `src/tasks`)

export interface Task {
  id: string;
  ownerId: string;
  title: string;
  done: boolean;
  noteId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TasksPage {
  items: Task[];
  total: number;
  limit: number;
  skip: number;
}

export interface NoteSummary {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
}

// `GET /notes`: the user's latest notes from the Notes module, `available: false` when it can't be used here
export interface RecentNotes {
  available: boolean;
  notes: NoteSummary[];
}
