import {
  CurrentActor,
  PluginActor,
  RequireAbility,
} from '@unifyamerica/demleague-plugin-sdk';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

// ℹ️ Mounted by the host at /plugins/acme/tasks. Every route is declared in the manifest's `endpoints`, and the
// abilities are checked in the request's organization (`X-Tenant`).
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequireAbility('read', 'Task')
  list(@CurrentActor() actor: PluginActor) {
    return this.tasksService.list(actor);
  }

  @Post()
  @RequireAbility('create', 'Task')
  create(@CurrentActor() actor: PluginActor, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(actor, dto);
  }

  @Patch(':id')
  @RequireAbility('update', 'Task')
  update(
    @CurrentActor() actor: PluginActor,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(actor, id, dto);
  }

  @Delete(':id')
  @RequireAbility('delete', 'Task')
  @HttpCode(204)
  async remove(
    @CurrentActor() actor: PluginActor,
    @Param('id') id: string,
  ): Promise<void> {
    await this.tasksService.remove(actor, id);
  }

  // Also needs the Notes module's own `create Note` ability, checked by the host when it runs `notes.create`
  @Post(':id/note')
  @RequireAbility('update', 'Task')
  addNote(@CurrentActor() actor: PluginActor, @Param('id') id: string) {
    return this.tasksService.addNote(actor, id);
  }
}

@Controller('notes')
export class RecentNotesController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @RequireAbility('read', 'Task')
  recent() {
    return this.tasksService.recentNotes();
  }
}
