<template>
  <GroupManageModal
    :visible="visible"
    :groups="groups"
    @update:visible="$emit('update:visible', $event)"
    @reorder="$emit('reorder', $event)"
    @rename="$emit('rename', $event)"
    @delete="$emit('delete', $event)"
  />
</template>

<script setup>
import GroupManageModal from "./GroupManageModal.vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  groups: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:visible", "reorder", "rename", "delete"]);
</script>
