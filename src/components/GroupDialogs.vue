<template>
  <!-- 新建分组对话框 -->
  <el-dialog
    :model-value="showCreateGroup"
    @update:model-value="$emit('update:showCreateGroup', $event)"
    title="新建分组"
    width="500px"
  >
    <div class="create-group-content">
      <el-form :model="newGroup" label-width="80px">
        <el-form-item label="分组名称">
          <el-input
            :model-value="newGroup.name"
            @update:model-value="
              $emit('update:newGroup', { ...newGroup, name: $event })
            "
            placeholder="请输入分组名称"
          />
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="$emit('update:showCreateGroup', false)"
          >取消</el-button
        >
        <el-button type="primary" @click="createGroup">确定</el-button>
      </div>
    </div>
  </el-dialog>

  <!-- 编辑分组对话框 -->
  <el-dialog
    :model-value="showEditGroup"
    @update:model-value="$emit('update:showEditGroup', $event)"
    title="编辑分组"
    width="500px"
  >
    <div class="edit-group-content">
      <el-form :model="editingGroup" label-width="80px">
        <el-form-item label="分组名称">
          <el-input
            :model-value="editingGroup.name"
            @update:model-value="
              $emit('update:editingGroup', { ...editingGroup, name: $event })
            "
            placeholder="请输入分组名称"
          />
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="$emit('update:showEditGroup', false)"
          >取消</el-button
        >
        <el-button type="danger" @click="deleteGroup">删除分组</el-button>
        <el-button type="primary" @click="updateGroup">保存</el-button>
      </div>
    </div>
  </el-dialog>

  <!-- 图片分组选择对话框 -->
  <el-dialog
    :model-value="showImageGroup"
    @update:model-value="$emit('update:showImageGroup', $event)"
    title="选择分组"
    width="400px"
  >
    <div class="image-group-content">
      <div class="group-options">
        <div
          v-for="group in groups"
          :key="group.id"
          class="group-option"
          :class="{ selected: selectedImageGroupId === group.id }"
          @click="selectImageGroup(group.id)"
        >
          <el-icon><icon-folder /></el-icon>
          <span class="group-name">{{ group.name }}</span>
          <span class="group-count">({{ group.imageCount }})</span>
        </div>
      </div>
      <div class="dialog-footer">
        <el-button @click="$emit('update:showImageGroup', false)"
          >取消</el-button
        >
        <el-button type="primary" @click="moveImageToGroup">确定</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import {
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElIcon,
} from "element-plus";
import { Folder as IconFolder } from "@element-plus/icons-vue";

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
.create-group-content,
.edit-group-content,
.image-group-content {
}

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
