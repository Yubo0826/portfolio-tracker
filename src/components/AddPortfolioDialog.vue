<script setup>
const props = defineProps({
  visible: Boolean,
  modelValue: {
    type: Object,
    default: () => ({ name: '', description: '' })
  },
  editingId: [String, Number],
  loading: Boolean
})
</script>
<template>
  <Dialog v-model:visible="props.visible" :header="dialogTitle" modal :style="{ width: '50vw' }">
      <span class="text-surface-500 dark:text-surface-400 block mb-8">Update your information.</span>
      <div class="flex items-center gap-4 mb-4">
          <label for="name" class="font-semibold w-24">Name</label>
          <InputText id="name" class="flex-auto" autocomplete="off" v-model="newPortfolio.name" />
      </div>
      <div class="flex items-center gap-4 mb-8">
          <label for="description" class="font-semibold w-24">Description</label>
          <FloatLabel variant="on">
              <Textarea id="over_label" v-model="newPortfolio.description" rows="5" cols="30" style="resize: none" />
              <label for="on_label">On Label</label>
          </FloatLabel>
      </div>
      <div class="flex justify-end gap-2">
          <Button type="button" label="Cancel" severity="secondary" @click="dialogVisible = false"></Button>
          <Button type="button" label="Save" @click="clickSave"></Button>
      </div>
  </Dialog>
</template>