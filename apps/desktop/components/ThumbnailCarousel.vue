<template>
  <div class="thumbnail-carousel" ref="carouselRef">
    <!-- 左导航按钮 -->
    <div
      class="carousel-nav carousel-nav-left"
      :class="{ disabled: !canScrollLeft }"
      @click="scrollLeft"
    >
      <el-icon><ArrowLeft /></el-icon>
    </div>

    <!-- 右导航按钮 -->
    <div
      class="carousel-nav carousel-nav-right"
      :class="{ disabled: !canScrollRight }"
      @click="scrollRight"
    >
      <el-icon><ArrowRight /></el-icon>
    </div>

    <div class="carousel-content" ref="carouselContentRef">
      <div
        v-for="(item, index) in items"
        :key="getItemKey(item, index)"
        class="carousel-thumbnail"
        :class="{ active: currentIndex === index }"
        @click="handleItemClick(index)"
      >
        <img :src="getItemImage(item)" :alt="getItemAlt(item)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { ArrowLeft, ArrowRight } from "@/utils/icons.js";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
  getItemKey: {
    type: Function,
    default: (item, index) => item.id || index,
  },
  getItemImage: {
    type: Function,
    default: (item) => item.image || item.src || item.url,
  },
  getItemAlt: {
    type: Function,
    default: (item) => item.name || item.alt || item.title || "",
  },
  scrollAmount: {
    type: Number,
    default: 200,
  },
});

const emit = defineEmits(["item-click", "scroll-state-change"]);

const carouselRef = ref(null);
const carouselContentRef = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

// 检查滚动状态
function checkScrollState() {
  if (!carouselContentRef.value) return;

  const { scrollLeft, scrollWidth, clientWidth } = carouselContentRef.value;

  // 更精确的滚动状态检测
  const newCanScrollLeft = scrollLeft > 5; // 允许5px的误差
  const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - 5; // 允许5px的误差

  canScrollLeft.value = newCanScrollLeft;
  canScrollRight.value = newCanScrollRight;

  // 调试日志（生产环境可移除）
  // console.log('滚动状态检测:', {
  //   scrollLeft,
  //   scrollWidth,
  //   clientWidth,
  //   canScrollLeft: newCanScrollLeft,
  //   canScrollRight: newCanScrollRight
  // });

  // 发送滚动状态变化事件
  emit("scroll-state-change", {
    canScrollLeft: newCanScrollLeft,
    canScrollRight: newCanScrollRight,
  });
}

// 向左滚动
function scrollLeft(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!carouselContentRef.value || !canScrollLeft.value) return;

  carouselContentRef.value.scrollBy({
    left: -props.scrollAmount,
    behavior: "smooth",
  });

  // 延迟检查滚动状态，等待滚动动画完成
  setTimeout(checkScrollState, 300);
}

// 向右滚动
function scrollRight(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!carouselContentRef.value || !canScrollRight.value) return;

  carouselContentRef.value.scrollBy({
    left: props.scrollAmount,
    behavior: "smooth",
  });

  // 延迟检查滚动状态，等待滚动动画完成
  setTimeout(checkScrollState, 300);
}

// 处理项目点击
function handleItemClick(index) {
  emit("item-click", index);
}

// 滚动到指定索引的项目
function scrollToIndex(index) {
  if (!carouselContentRef.value) return;

  nextTick(() => {
    const thumbnails = carouselContentRef.value.querySelectorAll(
      ".carousel-thumbnail"
    );
    const targetThumbnail = thumbnails[index];

    if (targetThumbnail) {
      const container = carouselContentRef.value;
      const containerRect = container.getBoundingClientRect();
      const thumbnailRect = targetThumbnail.getBoundingClientRect();

      // 如果缩略图不在可视区域内，滚动到中心位置
      if (
        thumbnailRect.left < containerRect.left ||
        thumbnailRect.right > containerRect.right
      ) {
        const scrollLeft =
          targetThumbnail.offsetLeft -
          (container.clientWidth - targetThumbnail.offsetWidth) / 2;
        container.scrollTo({
          left: Math.max(0, scrollLeft),
          behavior: "smooth",
        });

        // 延迟检查滚动状态
        setTimeout(checkScrollState, 300);
      }
    }
  });
}

// 监听当前索引变化，自动滚动到对应位置
watch(
  () => props.currentIndex,
  (newIndex) => {
    scrollToIndex(newIndex);
  }
);

// 监听项目数组变化，重新检查滚动状态
watch(
  () => props.items,
  () => {
    nextTick(() => {
      setTimeout(checkScrollState, 100);
    });
  },
  { deep: true }
);

onMounted(() => {
  // 延迟检查滚动状态，等待DOM更新
  nextTick(() => {
    setTimeout(() => {
      checkScrollState();
      // 添加滚动事件监听器
      if (carouselContentRef.value) {
        carouselContentRef.value.addEventListener("scroll", checkScrollState);
      }
    }, 200); // 增加延迟时间确保DOM完全渲染
  });
});

onBeforeUnmount(() => {
  // 移除滚动事件监听器
  if (carouselContentRef.value) {
    carouselContentRef.value.removeEventListener("scroll", checkScrollState);
  }
});

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  checkScrollState,
});
</script>

<style scoped>
.thumbnail-carousel {
  position: relative;
  height: 100px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10;
  overflow: hidden;
  pointer-events: none;
}

/* 创建一个隐形的触发区域 */
.thumbnail-carousel::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  pointer-events: auto;
  z-index: 1;
}

.thumbnail-carousel:hover {
  opacity: 1;
  pointer-events: auto;
}

/* 导航按钮样式 */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20; /* 提高z-index确保在最上层 */
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  opacity: 0.9;
  user-select: none;
  pointer-events: auto; /* 确保可以接收点击事件 */
}

.carousel-nav:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.9);
  transform: translateY(-50%) scale(1.1);
}

.carousel-nav.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none; /* 禁用时不允许点击 */
}

.carousel-nav.disabled:hover {
  opacity: 0.3;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
}

.carousel-nav-left {
  left: 12px;
}

.carousel-nav-right {
  right: 12px;
}

.carousel-nav .el-icon {
  font-size: 18px;
  color: white;
}

.carousel-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 60px; /* 增加padding确保不与箭头重合 */
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
  z-index: 2;
  pointer-events: auto; /* 确保内容可以接收点击事件 */
}

.carousel-content::-webkit-scrollbar {
  height: 4px;
}

.carousel-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.carousel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.carousel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.carousel-thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
}

.carousel-thumbnail:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.5);
}

.carousel-thumbnail.active {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
}

.carousel-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.2s ease;
}

.carousel-thumbnail:hover img {
  transform: scale(1.1);
}
</style>
