<template>
  <ErrorPageTem :image="errImage" :title="title" :backHome="true" />
</template>

<script>
export default {
  name: "NotFoundPage",
};
</script>

<script setup>
import ErrorPageTem from "./components/ErrorPageTem.vue";
import errImage from "@/static/images/error/404.png";

const title = "页面未找到";

onMounted(() => {});
</script>

<style lang="less" scoped></style>
