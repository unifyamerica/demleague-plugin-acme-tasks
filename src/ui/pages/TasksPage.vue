<script setup lang="ts">
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import { storeToRefs } from '@unifyamerica/demleague-plugin-sdk/vue';
import { onMounted, ref } from 'vue';
import {
  useAbility,
  useConfirm,
  useCurrentOrganization,
  useI18n,
  useToast,
} from '../plugin';
import { useTasksStore } from '../stores/tasks';
import type { Task } from '../types';

const { t } = useI18n();
const { can } = useAbility();
const toast = useToast();
const confirm = useConfirm();
const organization = useCurrentOrganization();
const store = useTasksStore();
const { tasks, recentNotes, loading } = storeToRefs(store);

const title = ref('');
const saving = ref(false);

onMounted(async () => {
  store.reset();
  if (!organization.value) return;

  try {
    await store.load();
  } catch (error) {
    toast.error(error);
  }
});

const add = async () => {
  if (!title.value.trim()) return;

  saving.value = true;
  try {
    await store.create(title.value.trim());
    title.value = '';
  } catch (error) {
    toast.error(error);
  } finally {
    saving.value = false;
  }
};

const toggle = async (task: Task) => {
  try {
    await store.setDone(task.id, !task.done);
  } catch (error) {
    toast.error(error);
  }
};

const keepNote = async (task: Task) => {
  try {
    await store.keepNote(task.id);
    toast.success(t('pages.tasks.noteSaved'));
  } catch (error) {
    toast.error(error);
  }
};

const remove = async (task: Task) => {
  const confirmed = await confirm({
    message: t('pages.tasks.confirmDelete', { title: task.title }),
    severity: 'danger',
    confirmText: t('buttons.delete'),
  });
  if (!confirmed) return;

  try {
    await store.remove(task.id);
    toast.success(t('pages.tasks.deleted'));
  } catch (error) {
    toast.error(error);
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold">{{ t('pages.tasks.title') }}</h1>
      <p v-if="organization" class="text-surface-500">
        {{ t('pages.tasks.subtitle', { organization: organization.name }) }}
      </p>
    </div>

    <Message v-if="!organization" severity="info" :closable="false">
      {{ t('pages.tasks.noOrganization') }}
    </Message>

    <div v-else class="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section class="flex flex-col gap-4">
        <form
          v-if="can('create', 'Task')"
          class="flex gap-2"
          @submit.prevent="add"
        >
          <InputText
            v-model="title"
            class="flex-1"
            maxlength="200"
            :placeholder="t('fields.title')"
            :aria-label="t('fields.title')"
          />
          <Button
            type="submit"
            :label="t('pages.tasks.add')"
            icon="pi pi-plus"
            :loading="saving"
            :disabled="!title.trim()"
          />
        </form>

        <p v-if="!loading && !tasks.length" class="text-surface-500">
          {{ t('pages.tasks.empty') }}
        </p>

        <ul class="flex flex-col gap-2">
          <li
            v-for="task in tasks"
            :key="task.id"
            class="flex items-center gap-3 rounded-lg border border-surface-200 bg-surface-0 px-4 py-2"
          >
            <Checkbox
              :model-value="task.done"
              binary
              :disabled="!can('update', 'Task')"
              :aria-label="t('pages.tasks.done')"
              @update:model-value="toggle(task)"
            />
            <span
              class="flex-1 break-words"
              :class="{ 'text-surface-500 line-through': task.done }"
            >
              {{ task.title }}
            </span>
            <Tag
              v-if="task.noteId"
              :value="t('pages.tasks.noteKept')"
              severity="info"
              icon="pi pi-book"
            />
            <!-- Only offered while the Notes module can be used here -->
            <Button
              v-else-if="recentNotes.available && can('update', 'Task')"
              icon="pi pi-book"
              :aria-label="t('pages.tasks.keepNote')"
              text
              rounded
              @click="keepNote(task)"
            />
            <Button
              v-if="can('delete', 'Task')"
              icon="pi pi-trash"
              :aria-label="t('buttons.delete')"
              severity="danger"
              text
              rounded
              @click="remove(task)"
            />
          </li>
        </ul>
      </section>

      <aside
        class="flex flex-col gap-3 rounded-lg border border-surface-200 bg-surface-0 p-4"
      >
        <h2 class="font-semibold">{{ t('pages.notes.title') }}</h2>
        <p v-if="!recentNotes.available" class="text-surface-500">
          {{ t('pages.notes.unavailable') }}
        </p>
        <p v-else-if="!recentNotes.notes.length" class="text-surface-500">
          {{ t('pages.notes.empty') }}
        </p>
        <ul v-else class="flex flex-col gap-2">
          <li
            v-for="note in recentNotes.notes"
            :key="note.id"
            class="flex items-center justify-between gap-2"
          >
            <span class="break-words">{{ note.title }}</span>
            <Tag
              v-if="note.pinned"
              :value="t('pages.notes.pinned')"
              severity="secondary"
            />
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>
