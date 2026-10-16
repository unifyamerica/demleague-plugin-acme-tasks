import {
  DataProxy,
  ModuleCallsProxy,
  PluginActor,
  PluginActorForbiddenError,
  PluginCallUnavailableError,
  PluginPage,
  PluginRecord,
} from '@unifyamerica/demleague-plugin-sdk';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NOTES, NoteSummary, Task } from './task.interface';

// The user's latest notes, or why there are none to show: Notes isn't available (not installed, or not turned
// on in this organization) or the user may not read notes
export interface RecentNotes {
  available: boolean;
  notes: NoteSummary[];
}

@Injectable()
export class TasksService {
  constructor(
    private readonly data: DataProxy,
    private readonly modules: ModuleCallsProxy,
  ) {}

  private get tasks() {
    return this.data.collection<Task>('tasks');
  }

  async list(actor: PluginActor): Promise<PluginPage<PluginRecord<Task>>> {
    return this.tasks.find({
      filter: { ownerId: actor.id },
      sort: { done: 1, updatedAt: -1 },
      limit: 100,
    });
  }

  async create(
    actor: PluginActor,
    dto: CreateTaskDto,
  ): Promise<PluginRecord<Task>> {
    return this.tasks.insert({
      ownerId: actor.id,
      title: dto.title,
      done: false,
      noteId: null,
    });
  }

  // Someone else's task is reported as not found, so ids can't be probed
  async findOwn(actor: PluginActor, id: string): Promise<PluginRecord<Task>> {
    const task = await this.tasks.findById(id);
    if (!task || task.ownerId !== actor.id) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(
    actor: PluginActor,
    id: string,
    dto: UpdateTaskDto,
  ): Promise<PluginRecord<Task>> {
    await this.findOwn(actor, id);
    const updated = await this.tasks.update(id, dto);
    if (!updated) {
      throw new NotFoundException('Task not found');
    }
    return updated;
  }

  async remove(actor: PluginActor, id: string): Promise<void> {
    await this.findOwn(actor, id);
    await this.tasks.remove(id);
  }

  /**
   * Calls the Notes module. It runs there, for the same user in the same organization, so it only returns
   * their own notes. Dependencies between modules are soft: when Notes isn't there, or the user may not read
   * notes, the page shows tasks without them.
   */
  async recentNotes(): Promise<RecentNotes> {
    try {
      const notes = await this.modules.call<NoteSummary[]>(
        NOTES,
        'notes.list',
        { limit: 5 },
      );
      return { available: true, notes };
    } catch (error) {
      if (
        error instanceof PluginCallUnavailableError ||
        error instanceof PluginActorForbiddenError
      ) {
        return { available: false, notes: [] };
      }
      throw error;
    }
  }

  /**
   * Keeps a note about the task in the Notes module (`notes.create`, which Notes exports to acme.tasks only) and
   * remembers its id. Errors from the call reach the user as they are, e.g. 503 PLUGIN_CALL_UNAVAILABLE when
   * Notes isn't turned on in the organization.
   */
  async addNote(actor: PluginActor, id: string): Promise<PluginRecord<Task>> {
    const task = await this.findOwn(actor, id);
    if (task.noteId) {
      return task;
    }
    const note = await this.modules.call<{ id: string }>(
      NOTES,
      'notes.create',
      { title: `Task: ${task.title}` },
    );
    return (await this.tasks.update(id, { noteId: note.id })) ?? task;
  }
}
