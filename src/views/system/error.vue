<template>
  <ErrorPageTem :image="errImage" :title="title" :tip="tip" backHome />
</template>

<script>
export default {
  name: "ErrorPage",
};
</script>

<script setup>
import ErrorPageTem from "./components/ErrorPageTem.vue";
import errImage from "@/static/images/error/500.png";

const title = "系统异常";
const tip = "系统异常! 请联系管理员";

onMounted(() => {});
</script>

<style lang="less" scoped></style>
