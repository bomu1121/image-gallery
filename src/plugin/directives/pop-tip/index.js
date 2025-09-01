/**
 * 气泡提示
 * 使用: v-popTip
 *
 * value [String]: 需要气泡提示的内容, 无内容将不显示
 * arg [String]: 当为overflow 内容超出时显示;
 */
export default {
  mounted(el, binding) {
    const { arg, value } = binding;
    // 气泡容器
    let popEl = null;
    // 定时器
    let timer = null;
    const delay = 500;
    // 气泡位置偏移
    const offsetX = 10;
    const offsetY = 10;
    // 创建气泡
    const createPop = (clientX, clientY) => {
      popEl = document.createElement("div");
      popEl.innerText = value;
      // 设置样式
      popEl.style.position = "fixed";
      popEl.style.top = `${clientY + offsetX}px`;
      popEl.style.left = `${clientX + offsetY}px`;
      popEl.style.zIndex = `2008`;
      popEl.classList.add("directives-pop-tip");
      document.body.appendChild(popEl);
    };
    // 销毁气泡
    const destroyPop = () => {
      if (popEl) {
        popEl.parentNode.removeChild(popEl);
        popEl = null;
      }
    };
    // 内容长度比较
    const hasTextEllipsis = (element) => {
      // 获取元素的computed样式
      const style = window.getComputedStyle(element);
      // 获取元素的宽度
      const width = parseFloat(style.width);
      // 创建一个临时元素，用于测量文本宽度
      const temp = document.createElement("span");
      temp.style.position = "absolute";
      temp.style.whiteSpace = "nowrap";
      temp.style.letterSpacing = style.letterSpacing;
      temp.style.visibility = "hidden";
      temp.style.font = style.font; // 确保字体设置与目标元素一致
      temp.innerHTML = element.textContent;
      document.body.appendChild(temp);
      // 获取元素的文本宽度
      const textWidth = temp.getBoundingClientRect().width;
      document.body.removeChild(temp);
      // 比较元素宽度和文本宽度
      return textWidth > width;
    };
    // 鼠标事件
    const mousemove = (e) => {
      if (!popEl) {
        clearTimeout(timer);
        if (arg === "overflow" && !hasTextEllipsis(el)) return;
        timer = setTimeout(() => {
          const { clientX, clientY } = e;
          value && createPop(clientX, clientY);
        }, delay);
      } else {
        const { clientX, clientY } = e;
        popEl.style.top = `${clientY + offsetX}px`;
        popEl.style.left = `${clientX + offsetY}px`;
      }
    };
    const mouseleave = () => {
      clearTimeout(timer);
      destroyPop();
    };
    el.addEventListener("mousemove", mousemove);
    el.addEventListener("mouseleave", mouseleave);
  },
};
