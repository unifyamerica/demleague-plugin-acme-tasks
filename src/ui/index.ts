import en from './i18n/en';
import { tasksUi } from './plugin';

/**
 * The plugin's SPA UI, bundled by the DemLeagueOS SPA (`frontend/src/plugins.config.ts`). Its page lives under
 * `/apps/acme/tasks` and works in the user's current organization.
 */
export default tasksUi.define({
  routes: [
    {
      path: '',
      name: 'list',
      component: () => import('./pages/TasksPage.vue'),
      ability: { action: 'read', subject: 'Task' },
      titleKey: 'pages.tasks.title',
    },
  ],
  mainMenu: [{ labelKey: 'nav.tasks', icon: 'pi pi-check-square', to: 'list' }],
  i18n: { en },
});
