/**
 * 视觉特征提取器
 * 专门用于提取图片的视觉特征向量，支持基于视觉相似性的标签推荐
 */

export class VisualFeatureExtractor {
  constructor() {
    this.featureCache = new Map(); // 缓存特征向量
    this.apiConfig = {
      // OpenAI配置
      openai: {
        apiKey: "",
        baseURL: "https://api.openai.com/v1",
        model: "gpt-4-vision-preview",
      },
      // 硅基流动配置
      silicoflow: {
        apiKey: "",
        endpoint: "https://api.siliconflow.cn/v1/chat/completions",
        model: "deepseek-ai/DeepSeek-V3.1",
      },
      // 智谱AI配置
      zhipuAI: {
        apiKey: "",
        endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        model: "glm-4v",
      },
      // 月之暗面Kimi配置
      kimi: {
        apiKey: "",
        endpoint: "https://api.moonshot.cn/v1/chat/completions",
        model: "moonshot-vl-8k",
      },
      // 字节豆包配置
      doubao: {
        apiKey: "",
        endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        model: "doubao-pro-4k",
      },
    };

    // 初始化时加载用户配置
    this.loadConfigFromStorage();
  }

  /**
   * 提取图片的视觉特征向量
   * @param {Blob} imageBlob - 图片数据
   * @param {string} service - AI服务
   * @returns {Promise<Array>} 视觉特征向量
   */
  async extractVisualFeatures(imageBlob, service) {
    // 确保加载最新的用户配置
    this.loadConfigFromStorage();

    const base64 = await this.blobToBase64(imageBlob);

    // 使用专门针对视觉特征提取的提示词
    const visualPrompt = this.getVisualExtractionPrompt(service);

    console.log(`🤖 使用 ${service} 提取视觉特征`);
    console.log(`📊 Base64数据长度: ${base64.length} 字符`);
    console.log(`🎯 使用模型: ${this.apiConfig[service].model}`);

    const response = await fetch(this.apiConfig[service].endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig[service].apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.apiConfig[service].model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: visualPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "high", // 使用高分辨率分析
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${service} API错误: ${response.status}`, errorText);
      throw new Error(`${service} API错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    console.log(`💬 AI返回内容:`, content);

    if (!content) {
      throw new Error(`${service}返回空内容`);
    }

    return this.parseVisualFeatures(content);
  }

  /**
   * 获取视觉特征提取的提示词
   */
  getVisualExtractionPrompt(service) {
    return `请分析这张图片的视觉特征，提取可用于识别相似图片的关键特征。

分析重点：
1. 人物特征：面部特征、发型、服装风格、姿态
2. 视觉元素：颜色搭配、构图、光影效果
3. 背景环境：场景类型、物品特征
4. 整体风格：拍摄角度、画质、色调

请以JSON格式返回详细的视觉特征描述：
{
  "facial_features": ["特征1", "特征2"],
  "appearance": ["特征1", "特征2"],
  "visual_style": ["特征1", "特征2"],
  "background": ["特征1", "特征2"],
  "color_palette": ["主色调", "配色"],
  "composition": ["构图特征"],
  "unique_identifiers": ["独特标识"]
}

重点关注能够区分不同人物或场景的视觉特征。`;
  }

  /**
   * 解析视觉特征
   */
  parseVisualFeatures(content) {
    console.log(`📝 开始解析视觉特征: "${content}"`);

    try {
      // 尝试解析JSON格式
      const features = JSON.parse(content);
      console.log(`✅ JSON解析成功:`, features);
      return this.flattenVisualFeatures(features);
    } catch (error) {
      console.warn(`⚠️ JSON解析失败，使用文本解析:`, error);
      // 如果JSON解析失败，使用文本解析
      return this.parseTextVisualFeatures(content);
    }
  }

  /**
   * 展平视觉特征为向量
   */
  flattenVisualFeatures(features) {
    const vector = [];

    // 将各个维度的特征合并为一个向量
    Object.values(features).forEach((featureArray) => {
      if (Array.isArray(featureArray)) {
        vector.push(...featureArray.map((f) => f.toLowerCase().trim()));
      }
    });

    const filteredVector = vector.filter((f) => f.length > 0);
    console.log(`🎯 展平后的特征向量:`, filteredVector);
    return filteredVector;
  }

  /**
   * 从文本中解析视觉特征
   */
  parseTextVisualFeatures(text) {
    console.log(`📝 开始文本解析视觉特征: "${text}"`);

    // 过滤掉技术术语和无效词汇
    const invalidWords = new Set([
      "json",
      "features",
      "objects",
      "colors",
      "style",
      "format",
      "data",
      "分析",
      "特征",
      "向量",
      "格式",
      "描述",
      "内容",
      "图片",
      "图像",
      "请",
      "分析",
      "提取",
      "关键",
      "视觉",
      "元素",
      "要求",
      "输出",
      "具体",
      "词汇",
      "分隔",
      "重点",
      "关注",
      "人物",
      "装饰",
      "道具",
      "背景",
      "每个",
      "应该",
      "简洁",
      "中文",
      "不要",
      "技术",
      "术语",
      "说明",
      "解释",
      "文字",
      "最多",
      "重要",
      "示例",
      "格式",
      "返回",
    ]);

    // 按逗号分割，然后清理每个特征
    const features = text
      .split(/[,，、]/) // 支持多种分隔符
      .map((feature) => {
        // 清理特征：去除前后空格、标点符号、数字
        return feature
          .trim()
          .replace(/[^\u4e00-\u9fa5a-zA-Z]/g, "") // 只保留中文和英文字母
          .toLowerCase();
      })
      .filter((feature) => {
        // 过滤条件：长度2-8个字符，不是技术术语，不是空字符串
        return (
          feature.length >= 2 &&
          feature.length <= 8 &&
          !invalidWords.has(feature) &&
          feature.length > 0
        );
      });

    // 去重并限制数量
    const uniqueFeatures = [...new Set(features)].slice(0, 15);

    console.log(
      `✅ 文本解析到 ${uniqueFeatures.length} 个有效特征:`,
      uniqueFeatures
    );
    return uniqueFeatures;
  }

  /**
   * 将Blob转换为Base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 更新API配置
   */
  updateApiConfig(service, config) {
    if (this.apiConfig[service]) {
      this.apiConfig[service] = { ...this.apiConfig[service], ...config };
    }
  }

  /**
   * 从localStorage加载保存的配置
   */
  loadConfigFromStorage() {
    try {
      const savedConfig = localStorage.getItem("ai-service-config");
      if (savedConfig) {
        const config = JSON.parse(savedConfig);

        // 加载各服务配置
        if (config.openai) {
          this.apiConfig.openai = {
            ...this.apiConfig.openai,
            ...config.openai,
          };
        }
        if (config.silicoflow) {
          this.apiConfig.silicoflow = {
            ...this.apiConfig.silicoflow,
            ...config.silicoflow,
          };
        }
        if (config.zhipuAI) {
          this.apiConfig.zhipuAI = {
            ...this.apiConfig.zhipuAI,
            ...config.zhipuAI,
          };
        }
        if (config.kimi) {
          this.apiConfig.kimi = { ...this.apiConfig.kimi, ...config.kimi };
        }
        if (config.doubao) {
          this.apiConfig.doubao = {
            ...this.apiConfig.doubao,
            ...config.doubao,
          };
        }

        console.log("✅ 视觉特征提取器配置已从localStorage加载");
        return true;
      }
    } catch (err) {
      console.warn("❌ 加载视觉特征提取器配置失败:", err);
    }
    return false;
  }
}

// 创建单例实例
export const visualFeatureExtractor = new VisualFeatureExtractor();

// 导出类以便测试
export default VisualFeatureExtractor;
