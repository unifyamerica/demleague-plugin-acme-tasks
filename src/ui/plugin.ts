import { createPluginUi } from '@unifyamerica/demleague-plugin-sdk/vue';
import { ACME_TASKS_MANIFEST } from '../manifest';

// Everything the UI gets from the platform, bound to this plugin's namespace: its own API endpoints, routes,
// abilities and messages, and read-only views of the user and their current organization.
export const tasksUi = createPluginUi(ACME_TASKS_MANIFEST);

export const {
  useAbility,
  useApi,
  useConfirm,
  useCurrentOrganization,
  useI18n,
  useToast,
} = tasksUi;
