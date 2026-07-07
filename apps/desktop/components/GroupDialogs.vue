<template>
  <!-- 新建分组对话框 -->
  <CreateGroupModal
    :visible="showCreateGroup"
    :initial-data="newGroup"
    @update:visible="$emit('update:showCreateGroup', $event)"
    @confirm="handleCreateGroupConfirm"
    @cancel="handleCreateGroupCancel"
  />

  <!-- 编辑分组对话框 -->
  <EditGroupModal
    :visible="showEditGroup"
    :group-data="editingGroup"
    @update:visible="$emit('update:showEditGroup', $event)"
    @confirm="handleEditGroupConfirm"
    @delete="handleEditGroupDelete"
    @cancel="handleEditGroupCancel"
  />

  <!-- 图片分组选择对话框 -->
  <SelectGroupModal
    :visible="showImageGroup"
    :groups="groups"
    :selected-group-id="selectedImageGroupId"
    @update:visible="$emit('update:showImageGroup', $event)"
    @confirm="handleSelectGroupConfirm"
    @cancel="handleSelectGroupCancel"
    @select="selectImageGroup"
  />
</template>

<script setup>
import { ElForm, ElFormItem, ElInput, ElButton, ElIcon } from "element-plus";
import { Folder as IconFolder } from "@element-plus/icons-vue";
import CreateGroupModal from "./CreateGroupModal.vue";
import EditGroupModal from "./EditGroupModal.vue";
import SelectGroupModal from "./SelectGroupModal.vue";

const props = defineProps({
  showCreateGroup: Boolean,
  showEditGroup: Boolean,
  showImageGroup: Boolean,
  newGroup: Object,
  editingGroup: Object,
  groups: Array,
  selectedImageGroupId: Number,
});

const emit = defineEmits([
  "update:showCreateGroup",
  "update:showEditGroup",
  "update:showImageGroup",
  "update:newGroup",
  "update:editingGroup",
  "createGroup",
  "updateGroup",
  "deleteGroup",
  "selectImageGroup",
  "moveImageToGroup",
]);

// 新建分组确认
function handleCreateGroupConfirm(groupData) {
  // 更新newGroup数据
  emit("update:newGroup", groupData);
  emit("createGroup");
}

// 新建分组取消
function handleCreateGroupCancel() {
  emit("update:showCreateGroup", false);
}

// 编辑分组确认
function handleEditGroupConfirm(groupData) {
  // 更新editingGroup数据
  emit("update:editingGroup", groupData);
  emit("updateGroup");
}

// 编辑分组删除
function handleEditGroupDelete(groupId) {
  emit("update:editingGroup", { ...props.editingGroup, id: groupId });
  emit("deleteGroup");
}

// 编辑分组取消
function handleEditGroupCancel() {
  emit("update:showEditGroup", false);
}

// 选择分组确认
function handleSelectGroupConfirm(groupId) {
  emit("moveImageToGroup");
}

// 选择分组取消
function handleSelectGroupCancel() {
  emit("update:showImageGroup", false);
}

const createGroup = () => {
  emit("createGroup");
};

const updateGroup = () => {
  emit("updateGroup");
};

const deleteGroup = () => {
  emit("deleteGroup");
};

const selectImageGroup = (groupId) => {
  emit("selectImageGroup", groupId);
};

const moveImageToGroup = () => {
  emit("moveImageToGroup");
};
</script>

<style scoped>
.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

.group-options {
  max-height: 300px;
  overflow-y: auto;
}

.group-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
}

.group-option:hover {
  background: #f5f5f5;
  border-color: #409eff;
}

.group-option.selected {
  background: #e8f4fd;
  border-color: #409eff;
}

.group-option .el-icon {
  color: #409eff;
  font-size: 18px;
}

.group-option .group-name {
  flex: 1;
  font-weight: 500;
}

.group-option .group-count {
  font-size: 12px;
  color: #666;
}
</style>
