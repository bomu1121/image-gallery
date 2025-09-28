<template>
  <div class="modal-examples">
    <h2>自定义弹窗组件示例</h2>

    <div class="example-buttons">
      <el-button @click="showCenterModal">居中弹窗</el-button>
      <el-button @click="showTopModal">顶部弹窗</el-button>
      <el-button @click="showBottomModal">底部弹窗</el-button>
      <el-button @click="showLeftModal">左侧弹窗</el-button>
      <el-button @click="showRightModal">右侧弹窗</el-button>
      <el-button @click="showFullscreenModal">全屏弹窗</el-button>
      <el-button @click="showConfirmModal">确认对话框</el-button>
    </div>

    <!-- 居中弹窗 -->
    <CustomModal
      v-model:visible="centerModalVisible"
      title="居中弹窗"
      position="center"
      width="500px"
      height="400px"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    >
      <p>这是一个居中显示的弹窗，背景可以正常滚动。</p>
      <p>弹窗内容可以很长，会自动显示滚动条。</p>
      <div
        style="
          height: 200px;
          background: #f5f5f5;
          padding: 20px;
          margin: 20px 0;
        "
      >
        <p>模拟长内容区域</p>
        <p>这里可以放置任何内容</p>
      </div>
    </CustomModal>

    <!-- 顶部弹窗 -->
    <CustomModal
      v-model:visible="topModalVisible"
      title="顶部弹窗"
      position="top"
      width="600px"
      height="300px"
    >
      <p>这是一个从顶部滑入的弹窗。</p>
      <p>适合显示通知或提示信息。</p>
    </CustomModal>

    <!-- 底部弹窗 -->
    <CustomModal
      v-model:visible="bottomModalVisible"
      title="底部弹窗"
      position="bottom"
      width="100%"
      height="400px"
    >
      <p>这是一个从底部滑入的弹窗。</p>
      <p>适合移动端或需要底部操作的场景。</p>
    </CustomModal>

    <!-- 左侧弹窗 -->
    <CustomModal
      v-model:visible="leftModalVisible"
      title="左侧弹窗"
      position="left"
      width="400px"
      height="100%"
    >
      <p>这是一个从左侧滑入的弹窗。</p>
      <p>适合侧边栏或导航面板。</p>
    </CustomModal>

    <!-- 右侧弹窗 -->
    <CustomModal
      v-model:visible="rightModalVisible"
      title="右侧弹窗"
      position="right"
      width="400px"
      height="100%"
    >
      <p>这是一个从右侧滑入的弹窗。</p>
      <p>适合侧边栏或详情面板。</p>
    </CustomModal>

    <!-- 全屏弹窗 -->
    <CustomModal
      v-model:visible="fullscreenModalVisible"
      title="全屏弹窗"
      fullscreen
    >
      <div style="padding: 40px; text-align: center">
        <h3>全屏弹窗</h3>
        <p>这个弹窗占据了整个屏幕。</p>
        <p>适合展示重要内容或进行全屏操作。</p>
      </div>
    </CustomModal>

    <!-- 确认对话框 -->
    <CustomModal
      v-model:visible="confirmModalVisible"
      title="确认操作"
      position="center"
      width="400px"
      height="auto"
      show-footer
      confirm-text="删除"
      cancel-text="取消"
      @confirm="handleDelete"
      @cancel="handleCancel"
    >
      <p>您确定要删除这个项目吗？</p>
      <p style="color: #f56c6c; font-size: 14px">此操作不可撤销。</p>
    </CustomModal>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElButton } from "element-plus";
import CustomModal from "./CustomModal.vue";

// 弹窗状态
const centerModalVisible = ref(false);
const topModalVisible = ref(false);
const bottomModalVisible = ref(false);
const leftModalVisible = ref(false);
const rightModalVisible = ref(false);
const fullscreenModalVisible = ref(false);
const confirmModalVisible = ref(false);

// 显示弹窗的方法
const showCenterModal = () => {
  centerModalVisible.value = true;
};

const showTopModal = () => {
  topModalVisible.value = true;
};

const showBottomModal = () => {
  bottomModalVisible.value = true;
};

const showLeftModal = () => {
  leftModalVisible.value = true;
};

const showRightModal = () => {
  rightModalVisible.value = true;
};

const showFullscreenModal = () => {
  fullscreenModalVisible.value = true;
};

const showConfirmModal = () => {
  confirmModalVisible.value = true;
};

// 处理确认
const handleConfirm = () => {
  console.log("确认操作");
};

// 处理取消
const handleCancel = () => {
  console.log("取消操作");
};

// 处理删除
const handleDelete = () => {
  console.log("删除操作");
  confirmModalVisible.value = false;
};
</script>

<style scoped>
.modal-examples {
  padding: 20px;
}

.example-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}
</style>
