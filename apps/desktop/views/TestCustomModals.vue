<template>
  <div class="test-custom-modals">
    <h2>自定义弹窗测试页面</h2>

    <div class="test-section">
      <h3>新建分组测试</h3>
      <el-button @click="showCreateGroupModal">测试新建分组弹窗</el-button>

      <CreateGroupModal
        v-model:visible="createGroupVisible"
        :initial-data="{ name: '', description: '' }"
        @confirm="handleCreateGroupConfirm"
        @cancel="handleCreateGroupCancel"
      />
    </div>

    <div class="test-section">
      <h3>编辑分组测试</h3>
      <el-button @click="showEditGroupModal">测试编辑分组弹窗</el-button>

      <EditGroupModal
        v-model:visible="editGroupVisible"
        :group-data="testGroupData"
        @confirm="handleEditGroupConfirm"
        @delete="handleEditGroupDelete"
        @cancel="handleEditGroupCancel"
      />
    </div>

    <div class="test-section">
      <h3>测试结果</h3>
      <div class="test-results">
        <p><strong>最后操作:</strong> {{ lastAction }}</p>
        <p>
          <strong>分组数据:</strong>
          {{ JSON.stringify(lastGroupData, null, 2) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElButton } from "element-plus";
import CreateGroupModal from "@/components/CreateGroupModal.vue";
import EditGroupModal from "@/components/EditGroupModal.vue";

// 弹窗状态
const createGroupVisible = ref(false);
const editGroupVisible = ref(false);

// 测试数据
const testGroupData = ref({
  id: 1,
  name: "测试分组",
  description: "这是一个测试分组",
  imageCount: 5,
});

// 测试结果
const lastAction = ref("");
const lastGroupData = ref({});

// 显示新建分组弹窗
const showCreateGroupModal = () => {
  createGroupVisible.value = true;
};

// 显示编辑分组弹窗
const showEditGroupModal = () => {
  editGroupVisible.value = true;
};

// 新建分组确认
const handleCreateGroupConfirm = (groupData) => {
  lastAction.value = "新建分组确认";
  lastGroupData.value = groupData;
  console.log("新建分组数据:", groupData);
};

// 新建分组取消
const handleCreateGroupCancel = () => {
  lastAction.value = "新建分组取消";
  lastGroupData.value = {};
  console.log("新建分组取消");
};

// 编辑分组确认
const handleEditGroupConfirm = (groupData) => {
  lastAction.value = "编辑分组确认";
  lastGroupData.value = groupData;
  console.log("编辑分组数据:", groupData);
};

// 编辑分组删除
const handleEditGroupDelete = (groupId) => {
  lastAction.value = "编辑分组删除";
  lastGroupData.value = { id: groupId };
  console.log("删除分组ID:", groupId);
};

// 编辑分组取消
const handleEditGroupCancel = () => {
  lastAction.value = "编辑分组取消";
  lastGroupData.value = {};
  console.log("编辑分组取消");
};
</script>

<style scoped>
.test-custom-modals {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.test-section h3 {
  margin-top: 0;
  color: #2c3e50;
}

.test-results {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
}

.test-results p {
  margin: 8px 0;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}
</style>
