<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="分组管理"
    width="720px"
  >
    <div class="manage-container">
      <div class="section-title">
        拖拽以调整分组顺序；点击名称可重命名
        <span class="divider">|</span>
        <span :class="['delete-mode-tip', { active: isDeleteMode }]"
          >删除模式：{{ isDeleteMode ? "开启" : "关闭" }}</span
        >
      </div>

      <!-- 分组列表（可横向换行） -->
      <draggable
        v-model="localGroups"
        item-key="id"
        :class="[
          'groups-wrap',
          { 'delete-mode': isDeleteMode, 'editing-mode': editingId !== null },
        ]"
        :animation="200"
        :force-fallback="true"
        :group="{ name: 'groups', pull: true, put: true }"
        :disabled="isDeleteMode || editingId !== null"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <div
            class="group-chip"
            :class="{
              disabled: element.id === 0,
              selected:
                isDeleteMode &&
                selectedIds.includes(element.id) &&
                element.id !== 0,
            }"
            :key="element.id"
            @click="onChipClick(element)"
          >
            <template v-if="editingId === element.id">
              <input
                ref="renameInputRef"
                v-model="editingName"
                class="rename-input inline"
                :disabled="element.id === 0"
                :style="{ width: editingWidth + 'px' }"
                @input="onRenameInput"
                @keyup.enter="confirmRename(element)"
                @blur="confirmRename(element)"
              />
            </template>
            <template v-else>
              <span class="name">{{ element.name }}</span>
              <span class="count">({{ element.imageCount || 0 }})</span>
            </template>
          </div>
        </template>
      </draggable>
      <!-- 隐藏的测量元素，用于自适应重命名输入宽度 -->
      <span ref="measureSpan" class="measure-span"></span>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <!-- 左侧：删除 / 删除选中 -->
        <el-button
          :type="isDeleteMode ? 'danger' : 'default'"
          plain
          @click="isDeleteMode ? confirmDelete() : toggleDeleteMode()"
          :disabled="isDeleteMode && selectedIds.length === 0"
        >
          {{ isDeleteMode ? `删除选中 (${selectedIds.length})` : "删除" }}
        </el-button>
        <!-- 右侧：保存顺序 / 取消选择 -->
        <el-button
          @click="isDeleteMode ? clearSelectionAndExit() : saveOrder()"
        >
          {{ isDeleteMode ? "取消选择" : "保存顺序" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { ElDialog, ElButton, ElInput, ElMessage } from "element-plus";
import draggable from "vuedraggable";

const props = defineProps({
  visible: { type: Boolean, default: false },
  groups: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:visible", "reorder", "rename", "delete"]);

const localGroups = ref([]);
const isDeleteMode = ref(false);
const selectedIds = ref([]);
const editingId = ref(null);
const editingName = ref("");
const editingWidth = ref(40);
const renameInputRef = ref(null);
const measureSpan = ref(null);

watch(
  () => props.groups,
  (val) => {
    // 创建本地副本，保持未分组在首位
    const cloned = (val || []).map((g, idx) => ({ ...g }));
    cloned.sort((a, b) => {
      if (a.id === 0) return -1;
      if (b.id === 0) return 1;
      const ao = typeof a.order === "number" ? a.order : a.createdAt || 0;
      const bo = typeof b.order === "number" ? b.order : b.createdAt || 0;
      return ao - bo;
    });
    localGroups.value = cloned;
  },
  { immediate: true, deep: true }
);

function onDragEnd() {
  // 仅重排，不立即提交，由“保存顺序”按钮提交
}

function toggleDeleteMode() {
  isDeleteMode.value = !isDeleteMode.value;
  if (!isDeleteMode.value) selectedIds.value = [];
  // 退出删除模式时，退出重命名状态
  if (isDeleteMode.value) editingId.value = null;
}

function onChipClick(group) {
  if (isDeleteMode.value) {
    if (group.id === 0) return; // 未分组不可删除
    const idx = selectedIds.value.indexOf(group.id);
    if (idx === -1) selectedIds.value.push(group.id);
    else selectedIds.value.splice(idx, 1);
    return;
  }
  startEdit(group);
}

function startEdit(group) {
  if (group.id === 0) return;
  if (isDeleteMode.value) return; // 删除模式下不进入编辑
  editingId.value = group.id;
  editingName.value = group.name;
  // 初始立刻变短
  editingWidth.value = 40;
  nextTick(() => {
    computeEditingWidth();
    try {
      renameInputRef.value &&
        renameInputRef.value.focus &&
        renameInputRef.value.focus();
    } catch {}
  });
}

function confirmRename(group) {
  if (group.id === 0) return;
  const name = (editingName.value || "").trim();
  editingId.value = null;
  if (!name || name === group.name) return;
  emit("rename", { id: group.id, name });
}

function onRenameInput() {
  computeEditingWidth();
}

function computeEditingWidth() {
  const span = measureSpan.value;
  if (!span) return;
  span.textContent = editingName.value || "";
  const w = span.offsetWidth;
  const minW = 40; // 最小宽度（点击后立刻变短）
  const maxW = 260; // 限制最大，避免过长
  editingWidth.value = Math.max(minW, Math.min(maxW, w + 12));
}

function confirmDelete() {
  if (selectedIds.value.length === 0) return;
  emit("delete", [...selectedIds.value]);
  selectedIds.value = [];
  isDeleteMode.value = false;
}

function clearSelectionAndExit() {
  selectedIds.value = [];
  isDeleteMode.value = false;
}

function saveOrder() {
  // 计算新的顺序，未分组固定为最前（order=0），其他顺序按当前索引从1开始
  const ordered = localGroups.value.map((g, idx) => ({ 
    id: g.id, 
    order: g.id === 0 ? 0 : idx 
  }));
  emit("reorder", ordered);
}
</script>

<!-- 单独提供全局（非 scoped）隐藏测量元素，避免被作用域哈希影响测量 -->
<style>
.measure-span {
  position: absolute;
  visibility: hidden;
  height: 0;
  overflow: hidden;
  white-space: pre;
  font-size: 14px;
  font-weight: 500;
}
</style>

<style scoped>
.manage-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  color: #606266;
  font-size: 14px;
}

.groups-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.groups-wrap.delete-mode .group-chip {
  cursor: pointer; /* 删除模式下用点击选择，不显示抓手 */
}
.groups-wrap.editing-mode .group-chip {
  cursor: text; /* 编辑模式下显示文本光标 */
}

.group-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  cursor: grab;
  user-select: none;
  position: relative;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease;
}
.group-chip.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.group-chip.selected {
  background: #fde2e2;
  border-color: #f56c6c;
  color: #f56c6c;
  transition: background-color 0.2s ease, border-color 0.2s ease,
    color 0.2s ease;
}
.group-chip .name {
  font-weight: 500;
}
.group-chip .count {
  font-size: 12px;
  opacity: 0.8;
}

.rename-input {
  width: 160px;
}
.rename-input.inline {
  border: none;
  outline: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: inherit;
}
.rename-input.inline:focus {
  outline: none;
}

.delete-title {
  margin-top: 8px;
  color: #f56c6c;
  font-size: 13px;
}

.delete-bin {
  min-height: 60px;
  border: 1px dashed #f56c6c;
  background: #fff7f7;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
}

.delete-item {
  padding: 4px 10px;
  background: #fde2e2;
  border: 1px solid #f56c6c;
  border-radius: 14px;
  color: #f56c6c;
}

.dialog-footer {
  text-align: right;
}

/* 隐藏测量用 span */
</style>
