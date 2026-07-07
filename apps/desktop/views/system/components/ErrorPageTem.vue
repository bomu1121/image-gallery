<template>
  <div class="error-page-tem">
    <div class="error-image">
      <img :src="image" alt="" />
    </div>
    <div class="error-title">{{ title }}</div>
    <div class="error-tip">{{ tip }}</div>
    <div class="back-home" v-if="backHome">
      <el-button type="primary" link @click="handleBackHome"
        >返回首页</el-button
      >
    </div>
  </div>
</template>

<script>
export default {
  name: "ErrorPageTem",
};
</script>

<script setup>
const $router = useRouter();

const props = defineProps({
  image: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "",
  },
  tip: {
    type: String,
    default: "",
  },
  backHome: {
    type: Boolean,
    default: false,
  },
});

const handleBackHome = () => {
  $router.replace("/");
};

onMounted(() => {});
</script>

<style lang="less" scoped>
.error-page-tem {
  height: 100vh;
  .flex-col;
  .col-center;
  .row-center;
  .error-image {
    img {
      width: 400px;
    }
  }
  .error-title {
    margin-top: 20px;
    font-size: 36px;
  }
  .error-tip {
    margin-top: 20px;
    font-size: 20px;
    color: var(--minorFontColor);
  }
  .back-home {
    margin-top: 20px;
    :deep(.el-button) {
      font-size: 18px;
    }
  }
}
</style>
