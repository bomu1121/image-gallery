<template>
  <div class="dialog-usage-example">
    <h2>自定义对话框使用示例</h2>

    <div class="example-buttons">
      <el-button @click="showConfirmDialog">确认对话框</el-button>
      <el-button @click="showWarningDialog">警告对话框</el-button>
      <el-button @click="showErrorDialog">错误对话框</el-button>
      <el-button @click="showSuccessDialog">成功对话框</el-button>
      <el-button @click="showDeleteDialog">删除确认</el-button>
      <el-button @click="showCustomDialog">自定义对话框</el-button>
    </div>

    <!-- 自定义对话框 -->
    <CustomDialog
      v-model:visible="dialogVisible"
      :title="dialogConfig.title"
      :message="dialogConfig.message"
      :type="dialogConfig.type"
      :show-cancel-button="dialogConfig.showCancelButton"
      :confirm-button-text="dialogConfig.confirmButtonText"
      :cancel-button-text="dialogConfig.cancelButtonText"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElButton } from "element-plus";
import CustomDialog from "./CustomDialog.vue";
import { useCustomDialog } from "@/composables/useCustomDialog.js";

// 使用自定义对话框组合式函数
const {
  dialogVisible,
  dialogConfig,
  confirm,
  warning,
  error,
  success,
  deleteConfirm,
} = useCustomDialog();

// 显示确认对话框
const showConfirmDialog = async () => {
  try {
    await confirm({
      title: "确认操作",
      message: "您确定要执行此操作吗？",
    });
    console.log("用户确认了操作");
  } catch (err) {
    console.log("用户取消了操作");
  }
};

// 显示警告对话框
const showWarningDialog = async () => {
  try {
    await warning("这是一个警告信息，请仔细阅读！");
    console.log("用户确认了警告");
  } catch (err) {
    console.log("用户取消了警告");
  }
};

// 显示错误对话框
const showErrorDialog = async () => {
  try {
    await error("操作失败，请检查网络连接后重试。");
    console.log("用户确认了错误信息");
  } catch (err) {
    console.log("用户取消了错误信息");
  }
};

// 显示成功对话框
const showSuccessDialog = async () => {
  await success("操作成功完成！");
  console.log("用户确认了成功信息");
};

// 显示删除确认对话框
const showDeleteDialog = async () => {
  try {
    await deleteConfirm("删除后将无法恢复，确定要删除吗？");
    console.log("用户确认删除");
    // 这里执行删除操作
  } catch (err) {
    console.log("用户取消了删除");
  }
};

// 显示自定义对话框
const showCustomDialog = async () => {
  try {
    await confirm({
      title: "自定义对话框",
      message: "这是一个自定义样式的对话框，符合我们的设计风格。",
      type: "info",
      confirmButtonText: "好的",
      cancelButtonText: "算了",
    });
    console.log('用户点击了"好的"');
  } catch (err) {
    console.log('用户点击了"算了"');
  }
};

// 处理确认事件
const handleConfirm = () => {
  if (dialogConfig.value._onConfirm) {
    dialogConfig.value._onConfirm();
  }
};

// 处理取消事件
const handleCancel = () => {
  if (dialogConfig.value._onCancel) {
    dialogConfig.value._onCancel();
  }
};
</script>

<style scoped>
.dialog-usage-example {
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
