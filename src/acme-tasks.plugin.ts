import { PluginModule } from '@unifyamerica/demleague-plugin-sdk';
import { ACME_TASKS_MANIFEST } from './manifest';
import {
  RecentNotesController,
  TasksController,
} from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

@PluginModule({
  manifest: ACME_TASKS_MANIFEST,
  controllers: [TasksController, RecentNotesController],
  providers: [TasksService],
})
export class AcmeTasksPlugin {}
