import { ElMessage } from 'element-plus';

/**
 * 处理粘贴事件，提取图片文件
 * @param {ClipboardEvent} event - 粘贴事件
 * @returns {Promise<File[]>} 图片文件数组
 */
export async function handlePasteEvent(event) {
  const items = event.clipboardData?.items;
  if (!items) {
    return [];
  }

  const imageFiles = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // 检查是否为图片类型
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        imageFiles.push(file);
      }
    }
  }
  
  return imageFiles;
}

/**
 * 处理粘贴的图片文件，转换为适合存储的格式
 * @param {File[]} files - 图片文件数组
 * @returns {Promise<Object[]>} 处理后的图片记录数组
 */
export async function processPastedImages(files) {
  const processedImages = [];
  
  for (const file of files) {
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.warning(`文件 ${file.name} 不是图片格式，已跳过`);
        continue;
      }
      
      // 验证文件大小（限制为10MB）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        ElMessage.warning(`文件 ${file.name} 过大（超过10MB），已跳过`);
        continue;
      }
      
      // 转换为ArrayBuffer然后创建Blob
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      
      // 创建图片记录
      const record = {
        name: file.name || `粘贴图片_${Date.now()}.${getFileExtension(file.type)}`,
        type: file.type,
        size: file.size,
        blob,
        groupId: 0, // 默认归类到"未分组"
        createdAt: Date.now(),
        tags: [], // 初始化空的标签数组
      };
      
      processedImages.push(record);
    } catch (error) {
      console.error(`处理文件 ${file.name} 时出错:`, error);
      ElMessage.error(`处理文件 ${file.name} 失败`);
    }
  }
  
  return processedImages;
}

/**
 * 根据MIME类型获取文件扩展名
 * @param {string} mimeType - MIME类型
 * @returns {string} 文件扩展名
 */
function getFileExtension(mimeType) {
  const extensions = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
  };
  
  return extensions[mimeType] || 'jpg';
}

/**
 * 设置全局粘贴事件监听器
 * @param {Function} onPaste - 粘贴回调函数
 * @returns {Function} 清理函数
 */
export function setupGlobalPasteListener(onPaste) {
  const handlePaste = async (event) => {
    try {
      const imageFiles = await handlePasteEvent(event);
      if (imageFiles.length > 0) {
        const processedImages = await processPastedImages(imageFiles);
        if (processedImages.length > 0) {
          onPaste(processedImages);
        }
      }
    } catch (error) {
      console.error('处理粘贴事件时出错:', error);
      ElMessage.error('粘贴失败，请重试');
    }
  };
  
  // 添加事件监听器
  document.addEventListener('paste', handlePaste);
  
  // 返回清理函数
  return () => {
    document.removeEventListener('paste', handlePaste);
  };
}
