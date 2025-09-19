/**
 * AI图片分析服务
 * 提供图片内容识别和标签推荐功能
 */

import analysisLogger from "@/utils/analysisLogger.js";
import { visualFeatureExtractor } from "./VisualFeatureExtractor.js";
import { visualSimilarityCalculator } from "./VisualSimilarityCalculator.js";

class AIImageAnalysisService {
  constructor() {
    this.apiConfig = {
      // OpenAI配置
      openai: {
        apiKey: "",
        baseURL: "https://api.openai.com/v1",
        model: "gpt-4-vision-preview",
      },
      // Google Vision API配置
      googleVision: {
        apiKey: "",
        endpoint: "https://vision.googleapis.com/v1/images:annotate",
      },
      // Azure Computer Vision配置
      azureVision: {
        endpoint: "",
        subscriptionKey: "",
        region: "eastus",
      },
      // 百度文心一言配置
      baiduErnie: {
        apiKey: "",
        secretKey: "",
        endpoint: "https://aip.baidubce.com/rest/2.0/wenxin/v1/genimg/analyze",
      },
      // 阿里通义千问配置
      alibabaQwen: {
        apiKey: "",
        endpoint:
          "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      },
      // 智谱AI配置
      zhipuAI: {
        apiKey: "",
        endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      },
      // 月之暗面Kimi配置
      kimi: {
        apiKey: "",
        endpoint: "https://api.moonshot.cn/v1/chat/completions",
      },
      // 字节豆包配置
      doubao: {
        apiKey: "",
        endpoint: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      },
      // 硅基流动配置
      silicoflow: {
        apiKey: "",
        endpoint: "https://api.siliconflow.cn/v1/chat/completions",
      },
    };

    this.existingTags = new Set(); // 存储现有标签
    this.tagFeatureDatabase = new Map(); // 标签特征数据库 {tag: {features: [], images: []}}
    this.similarityThreshold = 0.5; // 相似度阈值（宽松匹配）
    this.featureCache = new Map(); // 图片特征缓存 {imageId: featureVector}

    // 推荐方法配置
    this.recommendationMethod = "ai-direct-recommendation"; // 默认使用AI直接推荐
    this.supportedMethods = [
      "ai-direct-recommendation", // AI直接推荐（主要方法）
      "similarity-based",
      "semantic-analysis",
      "visual-similarity",
    ];

    // 新增：视觉相似性分析相关
    this.tagVisualDatabase = new Map(); // 标签视觉特征数据库 {tag: {visualFeatures: [], images: []}}
    this.visualSimilarityThreshold = 0.5; // 视觉相似度阈值（宽松匹配）
    this.visualFeatureCache = new Map(); // 图片视觉特征缓存 {imageId: visualFeatureVector}

    // 初始化时加载用户配置
    this.loadConfigFromStorage();
  }

  /**
   * 初始化服务，构建标签特征数据库
   */
  async initialize() {
    try {
      // 首先初始化分析日志记录器
      await analysisLogger.initialize();
      console.log("✅ AI分析日志记录器初始化完成");

      const { getAllImages } = await import("@/utils/idb.js");
      const images = await getAllImages();

      // 收集所有现有标签
      images.forEach((image) => {
        if (image.tags && Array.isArray(image.tags)) {
          image.tags.forEach((tag) => this.existingTags.add(tag.toLowerCase()));
        }
      });

      // 构建标签特征数据库
      await this.buildTagFeatureDatabase(images);

      console.log(
        `AI服务初始化完成，发现 ${this.existingTags.size} 个现有标签，构建了 ${this.tagFeatureDatabase.size} 个标签特征库`
      );
    } catch (error) {
      console.error("AI服务初始化失败:", error);
    }
  }

  /**
   * 构建标签特征数据库
   * @param {Array} images - 所有图片数据
   */
  async buildTagFeatureDatabase(images) {
    this.tagFeatureDatabase.clear();
    this.processingStats = {
      totalImages: images.length,
      processedImages: 0,
      failedImages: 0,
      tagGroups: 0,
      successfulTags: 0,
      failedTags: 0,
      startTime: Date.now(),
      details: [],
    };

    console.log(`🚀 开始构建标签特征数据库，共 ${images.length} 张图片`);

    // 按标签分组图片
    const tagGroups = new Map();
    images.forEach((image) => {
      if (image.tags && Array.isArray(image.tags)) {
        image.tags.forEach((tag) => {
          const normalizedTag = tag.toLowerCase();
          if (!tagGroups.has(normalizedTag)) {
            tagGroups.set(normalizedTag, []);
          }
          tagGroups.get(normalizedTag).push(image);
        });
      }
    });

    this.processingStats.tagGroups = tagGroups.size;
    console.log(`📊 发现 ${tagGroups.size} 个标签组`);

    // 为每个标签组提取特征
    for (const [tag, tagImages] of tagGroups) {
      console.log(`\n🏷️ ========== 处理标签组: "${tag}" ==========`);
      console.log(`📊 该标签包含 ${tagImages.length} 张图片`);

      if (tagImages.length >= 2) {
        // 至少需要2张图片才能构建特征库
        console.log(`✅ 图片数量满足要求 (≥2张)，开始构建特征库`);

        try {
          console.log(
            `🔍 开始处理标签 "${tag}"，包含 ${tagImages.length} 张图片`
          );
          const features = await this.extractTagFeatures(tag, tagImages);

          this.tagFeatureDatabase.set(tag, {
            features,
            images: tagImages,
            count: tagImages.length,
          });

          this.processingStats.successfulTags++;
          console.log(
            `✅ 标签 "${tag}" 特征提取成功，获得 ${features.length} 个特征向量`
          );

          // 显示特征库内容
          if (features.length > 0) {
            console.log(`📝 特征库内容预览:`);
            features.slice(0, 5).forEach((feature, index) => {
              console.log(
                `  ${index + 1}. ${
                  Array.isArray(feature) ? feature.join(", ") : feature
                }`
              );
            });
            if (features.length > 5) {
              console.log(`  ... 还有 ${features.length - 5} 个特征`);
            }
          }
        } catch (error) {
          this.processingStats.failedTags++;
          console.warn(`❌ 构建标签 "${tag}" 特征库失败:`, error);
          this.processingStats.details.push({
            tag,
            error: error.message,
            imageCount: tagImages.length,
          });
        }
      } else {
        console.log(
          `⏭️ 跳过标签 "${tag}"，图片数量不足 (${tagImages.length} < 2)`
        );
        console.log(`💡 提示: 需要至少2张图片才能构建有效的特征库`);
      }
    }

    this.processingStats.endTime = Date.now();
    this.processingStats.duration =
      this.processingStats.endTime - this.processingStats.startTime;

    console.log(`🎉 标签特征数据库构建完成！`);
    console.log(`📈 处理统计:`, this.processingStats);
  }

  /**
   * 提取标签特征向量
   * @param {string} tag - 标签名
   * @param {Array} images - 该标签的图片列表
   * @returns {Promise<Array>} 特征向量列表
   */
  async extractTagFeatures(tag, images) {
    const features = [];
    const tagStats = {
      tag,
      totalImages: images.length,
      processedImages: 0,
      successfulImages: 0,
      failedImages: 0,
      startTime: Date.now(),
    };

    console.log(`📸 开始为标签 "${tag}" 提取特征，共 ${images.length} 张图片`);

    // 获取当前配置的AI服务
    const currentService = this.getCurrentConfiguredService();
    if (!currentService) {
      throw new Error("没有配置AI服务");
    }

    console.log(`🤖 使用AI服务: ${currentService}`);

    // 为每张图片提取特征向量
    const imagesToProcess = images.slice(0, 10); // 限制最多10张图片
    console.log(`🔄 实际处理 ${imagesToProcess.length} 张图片（限制最多10张）`);

    for (let i = 0; i < imagesToProcess.length; i++) {
      const image = imagesToProcess[i];
      tagStats.processedImages++;

      try {
        console.log(
          `🔍 [${i + 1}/${imagesToProcess.length}] 处理图片: ${
            image.name || image.id
          }`
        );

        const featureVector = await this.extractImageFeature(
          image,
          currentService
        );

        if (featureVector && featureVector.length > 0) {
          features.push(featureVector);
          tagStats.successfulImages++;
          this.processingStats.processedImages++;
          console.log(
            `✅ 图片 ${image.name || image.id} 特征提取成功，获得 ${
              featureVector.length
            } 个特征`
          );
        } else {
          console.warn(`⚠️ 图片 ${image.name || image.id} 特征提取结果为空`);
        }
      } catch (error) {
        tagStats.failedImages++;
        this.processingStats.failedImages++;
        console.warn(`❌ 提取图片 ${image.name || image.id} 特征失败:`, error);
      }
    }

    tagStats.endTime = Date.now();
    tagStats.duration = tagStats.endTime - tagStats.startTime;
    tagStats.featureCount = features.length;

    console.log(`📊 标签 "${tag}" 处理完成:`, tagStats);

    return features;
  }

  /**
   * 提取单张图片的特征向量
   * @param {Object} image - 图片对象
   * @param {string} service - AI服务名
   * @returns {Promise<Array>} 特征向量
   */
  async extractImageFeature(image, service) {
    // 检查缓存
    if (this.featureCache.has(image.id)) {
      console.log(`💾 使用缓存特征: ${image.name || image.id}`);
      return this.featureCache.get(image.id);
    }

    try {
      console.log(`🔄 开始提取图片特征: ${image.name || image.id}`);

      // 获取图片blob
      let imageBlob;
      if (image.blob && image.blob instanceof Blob) {
        imageBlob = image.blob;
        console.log(
          `📁 使用图片blob数据，大小: ${(imageBlob.size / 1024).toFixed(2)}KB`
        );
      } else if (image.objectUrl) {
        console.log(`🌐 从URL获取图片数据: ${image.objectUrl}`);
        const response = await fetch(image.objectUrl);
        imageBlob = await response.blob();
        console.log(
          `📥 成功获取图片blob，大小: ${(imageBlob.size / 1024).toFixed(2)}KB`
        );
      } else {
        console.warn(`❌ 无法获取图片数据: ${image.name || image.id}`);
        return null;
      }

      // 验证图片数据
      if (!imageBlob || imageBlob.size === 0) {
        console.warn(`❌ 图片数据无效: ${image.name || image.id}`);
        return null;
      }

      console.log(`🚀 调用AI服务提取特征: ${service}`);

      // 调用AI服务提取特征
      const featureVector = await this.extractFeatureWithService(
        imageBlob,
        service
      );

      if (featureVector && featureVector.length > 0) {
        console.log(
          `✅ 特征提取成功: ${image.name || image.id} -> ${
            featureVector.length
          } 个特征`
        );
        console.log(`📝 特征内容:`, featureVector);

        // 缓存特征向量
        this.featureCache.set(image.id, featureVector);
      } else {
        console.warn(`⚠️ 特征提取结果为空: ${image.name || image.id}`);
      }

      return featureVector;
    } catch (error) {
      console.error(`❌ 提取图片特征失败: ${image.name || image.id}`, error);
      return null;
    }
  }

  /**
   * 获取当前配置的AI服务
   * @returns {string|null} 服务名称
   */
  getCurrentConfiguredService() {
    try {
      const config = localStorage.getItem("ai-service-config");
      if (config) {
        const parsedConfig = JSON.parse(config);
        const selectedProvider = parsedConfig.selectedProvider;
        if (selectedProvider && this.isServiceConfigured(selectedProvider)) {
          return selectedProvider;
        }
      }
    } catch (error) {
      console.warn("获取AI服务配置失败:", error);
    }
    return null;
  }

  /**
   * 使用指定服务提取图片特征向量
   * @param {Blob} imageBlob - 图片数据
   * @param {string} service - 服务名称
   * @returns {Promise<Array>} 特征向量
   */
  async extractFeatureWithService(imageBlob, service) {
    const base64 = await this.blobToBase64(imageBlob);

    switch (service) {
      case "silicoflow":
        return this.extractFeatureWithSilicoflow(base64);
      case "openai":
        return this.extractFeatureWithOpenAI(base64);
      case "zhipuAI":
        return this.extractFeatureWithZhipuAI(base64);
      case "kimi":
        return this.extractFeatureWithKimi(base64);
      case "doubao":
        return this.extractFeatureWithDoubao(base64);
      default:
        throw new Error(`不支持的服务: ${service}`);
    }
  }

  /**
   * 使用硅基流动提取特征向量
   */
  async extractFeatureWithSilicoflow(base64) {
    console.log(`🤖 调用硅基流动API，模型: ${this.apiConfig.silicoflow.model}`);
    console.log(`📊 Base64数据长度: ${base64.length} 字符`);

    const requestBody = {
      model: this.apiConfig.silicoflow.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `请分析这张图片的视觉特征，提取最关键的视觉元素。要求：
1. 只输出具体的视觉特征词汇，用逗号分隔
2. 重点关注：人物特征（发型、眼睛、表情、服装）、装饰品、道具、背景元素
3. 每个特征应该是2-4个字的简洁中文词汇
4. 不要输出技术术语、格式说明或解释文字
5. 最多输出10个最重要的特征

示例格式：大眼睛,长发,微笑,连衣裙,花朵装饰,蝴蝶结,可爱,清新,温柔,甜美`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 100,
      temperature: 0.1,
    };

    console.log(`📤 发送请求到: ${this.apiConfig.silicoflow.endpoint}`);
    console.log(`📋 请求体:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch(this.apiConfig.silicoflow.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.silicoflow.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📥 收到响应，状态码: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ 硅基流动API错误: ${response.status}`, errorText);
      throw new Error(`硅基流动API错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`📄 API响应数据:`, data);

    const content = data.choices[0]?.message?.content;
    console.log(`💬 AI返回内容:`, content);

    if (!content) {
      throw new Error("硅基流动返回空内容");
    }

    // 直接解析文本内容，不再尝试JSON解析
    const result = this.parseTextToFeatures(content);
    console.log(`🎯 最终特征向量:`, result);
    return result;
  }

  /**
   * 使用OpenAI提取特征向量
   */
  async extractFeatureWithOpenAI(base64) {
    const response = await fetch(
      `${this.apiConfig.openai.baseURL}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiConfig.openai.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.apiConfig.openai.model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: '请分析这张图片的视觉特征，提取关键特征向量。请以JSON格式返回特征描述，格式为：{"features": ["特征1", "特征2", "特征3"], "objects": ["对象1", "对象2"], "colors": ["颜色1", "颜色2"], "style": "风格描述"}',
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`,
                    detail: "low",
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI返回空内容");
    }

    try {
      const featureData = JSON.parse(content);
      return this.parseFeatureVector(featureData);
    } catch (parseError) {
      console.warn("OpenAI特征解析失败:", parseError);
      return this.parseTextToFeatures(content);
    }
  }

  /**
   * 使用智谱AI提取特征向量
   */
  async extractFeatureWithZhipuAI(base64) {
    const response = await fetch(this.apiConfig.zhipuAI.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.zhipuAI.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.apiConfig.zhipuAI.model || "glm-4v",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: '请分析这张图片的视觉特征，提取关键特征向量。请以JSON格式返回特征描述，格式为：{"features": ["特征1", "特征2", "特征3"], "objects": ["对象1", "对象2"], "colors": ["颜色1", "颜色2"], "style": "风格描述"}',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`智谱AI API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("智谱AI返回空内容");
    }

    try {
      const featureData = JSON.parse(content);
      return this.parseFeatureVector(featureData);
    } catch (parseError) {
      console.warn("智谱AI特征解析失败:", parseError);
      return this.parseTextToFeatures(content);
    }
  }

  /**
   * 使用Kimi提取特征向量
   */
  async extractFeatureWithKimi(base64) {
    const response = await fetch(this.apiConfig.kimi.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.kimi.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.apiConfig.kimi.model || "moonshot-vl-8k",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: '请分析这张图片的视觉特征，提取关键特征向量。请以JSON格式返回特征描述，格式为：{"features": ["特征1", "特征2", "特征3"], "objects": ["对象1", "对象2"], "colors": ["颜色1", "颜色2"], "style": "风格描述"}',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Kimi返回空内容");
    }

    try {
      const featureData = JSON.parse(content);
      return this.parseFeatureVector(featureData);
    } catch (parseError) {
      console.warn("Kimi特征解析失败:", parseError);
      return this.parseTextToFeatures(content);
    }
  }

  /**
   * 使用豆包提取特征向量
   */
  async extractFeatureWithDoubao(base64) {
    const response = await fetch(this.apiConfig.doubao.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.doubao.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.apiConfig.doubao.model || "doubao-pro-4k",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: '请分析这张图片的视觉特征，提取关键特征向量。请以JSON格式返回特征描述，格式为：{"features": ["特征1", "特征2", "特征3"], "objects": ["对象1", "对象2"], "colors": ["颜色1", "颜色2"], "style": "风格描述"}',
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`豆包 API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("豆包返回空内容");
    }

    try {
      const featureData = JSON.parse(content);
      return this.parseFeatureVector(featureData);
    } catch (parseError) {
      console.warn("豆包特征解析失败:", parseError);
      return this.parseTextToFeatures(content);
    }
  }

  /**
   * 解析特征向量
   * @param {Object} featureData - 特征数据
   * @returns {Array} 特征向量
   */
  parseFeatureVector(featureData) {
    const features = [];

    if (featureData.features) {
      features.push(...featureData.features);
    }
    if (featureData.objects) {
      features.push(...featureData.objects);
    }
    if (featureData.colors) {
      features.push(...featureData.colors);
    }
    if (featureData.style) {
      features.push(featureData.style);
    }

    return features
      .map((f) => f.toLowerCase().trim())
      .filter((f) => f.length > 0);
  }

  /**
   * 从文本中解析特征
   * @param {string} text - 文本内容
   * @returns {Array} 特征向量
   */
  parseTextToFeatures(text) {
    console.log(`📝 开始解析文本特征: "${text}"`);

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
    const uniqueFeatures = [...new Set(features)].slice(0, 10);

    console.log(
      `✅ 解析到 ${uniqueFeatures.length} 个有效特征:`,
      uniqueFeatures
    );
    return uniqueFeatures;
  }

  /**
   * 分析图片内容并推荐标签（支持多种推荐方法）
   * @param {Blob} imageBlob - 图片数据
   * @param {string} imageName - 图片名称
   * @param {string} preferredService - 优先使用的服务（可选）
   * @param {string} method - 推荐方法（可选，默认使用配置的方法）
   * @param {number} imageId - 图片ID（可选）
   * @returns {Promise<Array>} 推荐的标签列表
   */
  async analyzeImage(
    imageBlob,
    imageName = "",
    preferredService = null,
    method = null,
    imageId = null
  ) {
    const recommendationMethod = method || this.recommendationMethod;

    console.log(`🎯 使用推荐方法: ${recommendationMethod}`);

    switch (recommendationMethod) {
      case "similarity-based":
        return await this.analyzeImageWithSimilarityBasedRecommendation(
          imageBlob,
          imageName,
          preferredService,
          imageId
        );
      case "semantic-analysis":
        return await this.analyzeImageWithSemanticAnalysis(
          imageBlob,
          imageName,
          preferredService,
          imageId
        );
      case "visual-similarity":
        return await this.analyzeImageWithVisualSimilarity(
          imageBlob,
          imageName,
          preferredService,
          imageId
        );
      case "ai-direct-recommendation":
        return await this.analyzeImageWithAIDirectRecommendation(
          imageBlob,
          imageName,
          preferredService,
          imageId
        );
      default:
        console.warn(
          `❌ 不支持的推荐方法: ${recommendationMethod}，使用默认方法`
        );
        return await this.analyzeImageWithAIDirectRecommendation(
          imageBlob,
          imageName,
          preferredService,
          imageId
        );
    }
  }

  /**
   * 基于相似图集的标签推荐（新方法）
   * @param {Blob} imageBlob - 图片数据
   * @param {string} imageName - 图片名称
   * @param {string} preferredService - 优先使用的服务（可选）
   * @param {number} imageId - 图片ID（可选）
   * @returns {Promise<Array>} 推荐的标签列表
   */
  async analyzeImageWithSimilarityBasedRecommendation(
    imageBlob,
    imageName = "",
    preferredService = null,
    imageId = null
  ) {
    // 开始记录分析日志
    const currentService =
      preferredService || this.getCurrentConfiguredService();
    const currentModel = this.getCurrentModelName();
    const analysisId = await analysisLogger.startAnalysis({
      imageName,
      imageId: imageId,
      aiService: currentService,
      modelName: currentModel,
      analysisType: "similarity-based-recommendation",
    });

    try {
      console.log(
        `\n🎯 ========== 开始基于相似图集的标签推荐: ${imageName} ==========`
      );

      analysisLogger.addStep(analysisId, "开始相似图集推荐", {
        imageName,
        method: "similarity-based-recommendation",
      });

      // 获取当前配置的AI服务
      const currentService =
        preferredService || this.getCurrentConfiguredService();
      if (!currentService) {
        throw new Error("没有配置AI服务，请先配置API密钥");
      }

      console.log(`🤖 使用AI服务: ${currentService}`);
      analysisLogger.addStep(analysisId, "选择AI服务", {
        service: currentService,
      });

      // 1. 提取当前图片的视觉特征
      console.log(`🔄 开始提取当前图片视觉特征...`);
      const currentImageFeatures =
        await visualFeatureExtractor.extractVisualFeatures(
          imageBlob,
          currentService
        );

      if (!currentImageFeatures || currentImageFeatures.length === 0) {
        throw new Error("无法提取图片视觉特征");
      }

      console.log(`✅ 当前图片视觉特征提取成功:`, currentImageFeatures);
      analysisLogger.addStep(analysisId, "视觉特征提取完成", {
        featuresCount: currentImageFeatures.length,
        features: currentImageFeatures,
      });

      // 2. 搜索相似图片
      console.log(`🔍 开始搜索相似图片...`);
      const similarImages = await this.findSimilarImages(
        currentImageFeatures,
        currentService
      );

      console.log(`📊 找到 ${similarImages.length} 张相似图片`);
      analysisLogger.addStep(analysisId, "相似图片搜索完成", {
        similarImagesCount: similarImages.length,
        similarImages: similarImages.slice(0, 5).map((img) => ({
          id: img.id,
          name: img.name,
          similarity: img.similarity,
          tags: img.tags,
        })),
      });

      if (similarImages.length === 0) {
        console.log(`❌ 没有找到相似图片，无法推荐标签`);
        await analysisLogger.completeAnalysis(analysisId, [], {
          reason: "没有找到相似图片",
          analysisType: "similarity-based-recommendation",
        });
        return [];
      }

      // 3. 收集相似图片的标签
      console.log(`🏷️ 开始收集相似图片的标签...`);
      const tagRecommendations =
        this.collectTagsFromSimilarImages(similarImages);

      console.log(`📊 收集到 ${tagRecommendations.length} 个标签推荐`);
      analysisLogger.addStep(analysisId, "标签收集完成", {
        tagRecommendationsCount: tagRecommendations.length,
        tagRecommendations: tagRecommendations.slice(0, 10),
      });

      // 4. 按相似度和标签频率排序
      const finalRecommendations = tagRecommendations
        .sort((a, b) => {
          // 先按相似度排序，再按标签频率排序
          if (Math.abs(a.confidence - b.confidence) < 0.01) {
            return b.tagCount - a.tagCount;
          }
          return b.confidence - a.confidence;
        })
        .slice(0, 10); // 限制返回前10个推荐

      console.log(`\n🏆 ========== 最终推荐结果 ==========`);
      finalRecommendations.forEach((rec, index) => {
        console.log(
          `${index + 1}. ${rec.tag} - 相似度: ${(rec.confidence * 100).toFixed(
            1
          )}% - 出现次数: ${rec.tagCount}`
        );
      });

      // 完成分析日志记录
      await analysisLogger.completeAnalysis(analysisId, finalRecommendations, {
        featuresExtracted: currentImageFeatures.length,
        similarImagesFound: similarImages.length,
        recommendationsGenerated: finalRecommendations.length,
        analysisType: "similarity-based-recommendation",
      });

      return finalRecommendations;
    } catch (error) {
      console.error("❌ 基于相似图集的标签推荐失败:", error);
      await analysisLogger.failAnalysis(analysisId, error);
      return [];
    }
  }

  /**
   * 搜索相似图片
   * @param {Array} currentFeatures - 当前图片的特征向量
   * @param {string} service - AI服务名
   * @returns {Promise<Array>} 相似图片列表
   */
  async findSimilarImages(currentFeatures, service) {
    try {
      const { getAllImages } = await import("@/utils/idb.js");
      const allImages = await getAllImages();

      console.log(`📚 开始与 ${allImages.length} 张现有图片进行相似度比较`);

      const similarImages = [];
      const similarityThreshold = this.visualSimilarityThreshold || 0.3; // 降低阈值以找到更多相似图片

      for (const image of allImages) {
        try {
          // 检查图片是否有标签（只对有标签的图片进行相似度比较）
          if (!image.tags || image.tags.length === 0) {
            continue;
          }

          // 获取图片的视觉特征（优先使用缓存）
          let imageFeatures;
          if (this.visualFeatureCache.has(image.id)) {
            imageFeatures = this.visualFeatureCache.get(image.id);
            console.log(`💾 使用缓存特征: ${image.name || image.id}`);
          } else {
            // 提取图片特征
            const imageBlob = await this.getImageBlob(image);
            if (!imageBlob) continue;

            imageFeatures = await visualFeatureExtractor.extractVisualFeatures(
              imageBlob,
              service
            );

            if (imageFeatures && imageFeatures.length > 0) {
              // 缓存特征
              this.visualFeatureCache.set(image.id, imageFeatures);
            } else {
              continue;
            }
          }

          // 计算相似度
          const similarity =
            visualSimilarityCalculator.calculateVisualSimilarity(
              currentFeatures,
              imageFeatures
            );

          console.log(
            `🔍 图片 ${image.name || image.id} 相似度: ${(
              similarity * 100
            ).toFixed(1)}%`
          );

          if (similarity >= similarityThreshold) {
            similarImages.push({
              ...image,
              similarity,
            });
            console.log(`✅ 图片 ${image.name || image.id} 通过相似度检查！`);
          }
        } catch (error) {
          console.warn(`❌ 处理图片 ${image.name || image.id} 失败:`, error);
        }
      }

      // 按相似度排序
      similarImages.sort((a, b) => b.similarity - a.similarity);

      console.log(
        `🎯 相似图片搜索完成，找到 ${similarImages.length} 张相似图片`
      );

      return similarImages;
    } catch (error) {
      console.error("❌ 搜索相似图片失败:", error);
      return [];
    }
  }

  /**
   * 从相似图片中收集标签推荐
   * @param {Array} similarImages - 相似图片列表
   * @returns {Array} 标签推荐列表
   */
  collectTagsFromSimilarImages(similarImages) {
    const tagMap = new Map(); // {tag: {count: number, totalSimilarity: number, images: []}}

    console.log(`🏷️ 开始从 ${similarImages.length} 张相似图片收集标签`);

    for (const image of similarImages) {
      if (image.tags && Array.isArray(image.tags)) {
        for (const tag of image.tags) {
          const normalizedTag = tag.toLowerCase();

          if (!tagMap.has(normalizedTag)) {
            tagMap.set(normalizedTag, {
              count: 0,
              totalSimilarity: 0,
              images: [],
            });
          }

          const tagData = tagMap.get(normalizedTag);
          tagData.count++;
          tagData.totalSimilarity += image.similarity;
          tagData.images.push({
            id: image.id,
            name: image.name,
            similarity: image.similarity,
          });
        }
      }
    }

    // 转换为推荐格式
    const recommendations = [];
    for (const [tag, data] of tagMap) {
      const averageSimilarity = data.totalSimilarity / data.count;
      const confidence = Math.min(averageSimilarity, 1.0); // 确保不超过1

      recommendations.push({
        tag,
        confidence,
        tagCount: data.count,
        reason: `在 ${data.count} 张相似图片中发现，平均相似度: ${(
          averageSimilarity * 100
        ).toFixed(1)}%`,
        source: "similarity-based",
        similarImages: data.images.slice(0, 3), // 只保留前3张相似图片的信息
      });

      console.log(
        `📊 标签 "${tag}": 出现 ${data.count} 次，平均相似度: ${(
          averageSimilarity * 100
        ).toFixed(1)}%`
      );
    }

    console.log(`✅ 标签收集完成，共收集到 ${recommendations.length} 个标签`);

    return recommendations;
  }

  /**
   * 分析图片内容并推荐标签（原有方法，保留作为备用）
   * @param {Blob} imageBlob - 图片数据
   * @param {string} imageName - 图片名称
   * @param {string} preferredService - 优先使用的服务（可选）
   * @param {number} imageId - 图片ID（可选）
   * @returns {Promise<Array>} 推荐的标签列表
   */
  async analyzeImageWithSemanticAnalysis(
    imageBlob,
    imageName = "",
    preferredService = null,
    imageId = null
  ) {
    // 开始记录分析日志
    const currentService =
      preferredService || this.getCurrentConfiguredService();
    const currentModel = this.getCurrentModelName();
    const analysisId = await analysisLogger.startAnalysis({
      imageName,
      imageId: imageId,
      aiService: currentService,
      modelName: currentModel,
      analysisType: "similarity-based",
    });

    try {
      console.log(`\n🎯 ========== 开始分析图片: ${imageName} ==========`);
      console.log(`📊 当前相似度阈值: ${this.similarityThreshold}`);
      console.log(`🗄️ 标签特征库大小: ${this.tagFeatureDatabase.size} 个标签`);

      analysisLogger.addStep(analysisId, "开始分析", {
        imageName,
        similarityThreshold: this.similarityThreshold,
        tagDatabaseSize: this.tagFeatureDatabase.size,
      });

      // 获取当前配置的AI服务
      const currentService =
        preferredService || this.getCurrentConfiguredService();
      if (!currentService) {
        throw new Error("没有配置AI服务，请先配置API密钥");
      }

      console.log(`🤖 使用AI服务: ${currentService}`);
      analysisLogger.addStep(analysisId, "选择AI服务", {
        service: currentService,
      });

      // 提取待分析图片的特征向量
      console.log(`🔄 开始提取当前图片特征...`);
      const currentImageFeatures = await this.extractFeatureWithService(
        imageBlob,
        currentService
      );
      if (!currentImageFeatures || currentImageFeatures.length === 0) {
        throw new Error("无法提取图片特征");
      }

      console.log(`✅ 当前图片特征提取成功:`, currentImageFeatures);
      analysisLogger.addStep(analysisId, "特征提取完成", {
        featuresCount: currentImageFeatures.length,
        features: currentImageFeatures,
      });

      console.log(
        `🔍 开始与 ${this.tagFeatureDatabase.size} 个标签进行相似度比较...\n`
      );

      analysisLogger.addStep(analysisId, "开始相似度比较", {
        totalTags: this.tagFeatureDatabase.size,
        currentImageFeatures: currentImageFeatures,
      });

      // 与标签特征数据库进行相似度比较
      const recommendations = [];
      const comparisonDetails = [];

      for (const [tag, tagData] of this.tagFeatureDatabase) {
        if (tagData.features.length === 0) {
          console.log(`⏭️ 跳过标签 "${tag}"，特征库为空`);
          analysisLogger.addStep(analysisId, `跳过标签: ${tag}`, {
            reason: "特征库为空",
            tagData: {
              count: tagData.count,
              featuresCount: tagData.features.length,
            },
          });
          continue;
        }

        console.log(`\n🔍 ========== 比较标签: "${tag}" ==========`);
        console.log(`📸 该标签包含 ${tagData.count} 张图片`);
        console.log(`🎯 该标签的特征向量数量: ${tagData.features.length}`);

        // 记录开始比较这个标签
        analysisLogger.addStep(analysisId, `开始比较标签: ${tag}`, {
          tagCount: tagData.count,
          tagFeaturesCount: tagData.features.length,
          tagFeatures: tagData.features.slice(0, 5), // 只记录前5个特征避免日志过长
        });

        // 计算与标签特征库的相似度
        const similarity = this.calculateFeatureSimilarity(
          currentImageFeatures,
          tagData.features
        );

        console.log(`📊 相似度计算结果: ${(similarity * 100).toFixed(2)}%`);
        console.log(
          `🎚️ 阈值要求: ${(this.similarityThreshold * 100).toFixed(1)}%`
        );

        const comparisonDetail = {
          tag,
          similarity: similarity,
          threshold: this.similarityThreshold,
          passed: similarity >= this.similarityThreshold,
          tagCount: tagData.count,
          featureCount: tagData.features.length,
        };

        comparisonDetails.push(comparisonDetail);

        if (similarity >= this.similarityThreshold) {
          console.log(`✅ 标签 "${tag}" 通过相似度检查！`);
          recommendations.push({
            tag: tag,
            confidence: similarity,
            reason: `与标签"${tag}"的${tagData.count}张图片特征相似度: ${(
              similarity * 100
            ).toFixed(1)}%`,
            source: "feature-similarity",
            tagCount: tagData.count,
          });

          // 记录标签通过
          analysisLogger.addStep(analysisId, `标签通过: ${tag}`, {
            similarity: similarity,
            similarityPercent: (similarity * 100).toFixed(2),
            threshold: this.similarityThreshold,
            thresholdPercent: (this.similarityThreshold * 100).toFixed(1),
            passed: true,
            recommendation: {
              tag: tag,
              confidence: similarity,
              reason: `与标签"${tag}"的${tagData.count}张图片特征相似度: ${(
                similarity * 100
              ).toFixed(1)}%`,
            },
          });
        } else {
          console.log(`❌ 标签 "${tag}" 相似度不足，跳过`);

          // 记录标签未通过
          analysisLogger.addStep(analysisId, `标签未通过: ${tag}`, {
            similarity: similarity,
            similarityPercent: (similarity * 100).toFixed(2),
            threshold: this.similarityThreshold,
            thresholdPercent: (this.similarityThreshold * 100).toFixed(1),
            passed: false,
            reason: "相似度不足",
          });
        }
      }

      console.log(`\n📈 ========== 相似度比较总结 ==========`);
      comparisonDetails.forEach((detail) => {
        const status = detail.passed ? "✅" : "❌";
        console.log(
          `${status} ${detail.tag}: ${(detail.similarity * 100).toFixed(
            1
          )}% (阈值: ${(detail.threshold * 100).toFixed(1)}%)`
        );
      });

      // 记录相似度比较总结
      analysisLogger.addStep(analysisId, "相似度比较总结", {
        totalComparisons: comparisonDetails.length,
        passedComparisons: comparisonDetails.filter((d) => d.passed).length,
        failedComparisons: comparisonDetails.filter((d) => !d.passed).length,
        comparisons: comparisonDetails.map((detail) => ({
          tag: detail.tag,
          similarity: detail.similarity,
          similarityPercent: (detail.similarity * 100).toFixed(1),
          threshold: detail.threshold,
          thresholdPercent: (detail.threshold * 100).toFixed(1),
          passed: detail.passed,
          tagCount: detail.tagCount,
          featureCount: detail.featureCount,
        })),
      });

      console.log(`\n🎯 推荐结果排序前: ${recommendations.length} 个标签`);
      recommendations.forEach((rec, index) => {
        console.log(
          `${index + 1}. ${rec.tag} - 置信度: ${(rec.confidence * 100).toFixed(
            1
          )}%`
        );
      });

      // 记录排序前的推荐结果
      analysisLogger.addStep(analysisId, "推荐结果排序前", {
        totalRecommendations: recommendations.length,
        recommendations: recommendations.map((rec) => ({
          tag: rec.tag,
          confidence: rec.confidence,
          confidencePercent: (rec.confidence * 100).toFixed(1),
          reason: rec.reason,
          tagCount: rec.tagCount,
        })),
      });

      // 按相似度排序
      recommendations.sort((a, b) => b.confidence - a.confidence);

      console.log(`\n🏆 ========== 最终推荐结果 (前10个) ==========`);
      const finalRecommendations = recommendations.slice(0, 10);
      finalRecommendations.forEach((rec, index) => {
        console.log(
          `${index + 1}. ${rec.tag} - 置信度: ${(rec.confidence * 100).toFixed(
            1
          )}% - ${rec.reason}`
        );
      });

      // 记录最终推荐结果
      analysisLogger.addStep(analysisId, "最终推荐结果", {
        totalRecommendations: recommendations.length,
        finalRecommendationsCount: finalRecommendations.length,
        finalRecommendations: finalRecommendations.map((rec, index) => ({
          rank: index + 1,
          tag: rec.tag,
          confidence: rec.confidence,
          confidencePercent: (rec.confidence * 100).toFixed(1),
          reason: rec.reason,
          tagCount: rec.tagCount,
        })),
      });

      console.log(`\n🎉 ========== 图片分析完成 ==========\n`);

      // 完成分析日志记录
      await analysisLogger.completeAnalysis(analysisId, finalRecommendations, {
        featuresExtracted: currentImageFeatures.length,
        similarityComparisons: comparisonDetails.length,
        recommendationsGenerated: finalRecommendations.length,
        tagDatabaseSize: this.tagFeatureDatabase.size,
      });

      // 限制返回数量
      return finalRecommendations;
    } catch (error) {
      console.error("❌ 图片分析失败:", error);
      await analysisLogger.failAnalysis(analysisId, error);
      return [];
    }
  }

  /**
   * 计算特征相似度
   * @param {Array} currentFeatures - 当前图片特征
   * @param {Array} tagFeatures - 标签特征库
   * @returns {number} 相似度分数 (0-1)
   */
  calculateFeatureSimilarity(currentFeatures, tagFeatures) {
    console.log(`  🔢 开始计算特征相似度...`);
    console.log(`  📊 当前图片特征数量: ${currentFeatures.length}`);
    console.log(`  📊 标签特征库数量: ${tagFeatures.length}`);

    if (
      !currentFeatures ||
      !tagFeatures ||
      currentFeatures.length === 0 ||
      tagFeatures.length === 0
    ) {
      console.log(`  ❌ 特征数据无效，返回相似度: 0`);
      return 0;
    }

    // 计算当前特征与标签特征库中每个特征的相似度
    let totalSimilarity = 0;
    let matchCount = 0;
    const featureMatches = [];

    console.log(`  🔍 开始逐个比较特征...`);

    for (let i = 0; i < currentFeatures.length; i++) {
      const currentFeature = currentFeatures[i];
      let maxSimilarity = 0;
      let bestMatch = null;

      console.log(
        `    [${i + 1}/${currentFeatures.length}] 比较特征: "${currentFeature}"`
      );

      for (let j = 0; j < tagFeatures.length; j++) {
        const tagFeatureSet = tagFeatures[j];
        if (Array.isArray(tagFeatureSet)) {
          for (let k = 0; k < tagFeatureSet.length; k++) {
            const tagFeature = tagFeatureSet[k];
            const similarity = this.calculateStringSimilarity(
              currentFeature,
              tagFeature
            );

            if (similarity > maxSimilarity) {
              maxSimilarity = similarity;
              bestMatch = tagFeature;
            }
          }
        }
      }

      console.log(
        `      🎯 最佳匹配: "${bestMatch}" (相似度: ${(
          maxSimilarity * 100
        ).toFixed(1)}%)`
      );

      if (maxSimilarity > 0.5) {
        // 特征匹配阈值，提高到50%
        totalSimilarity += maxSimilarity;
        matchCount++;
        featureMatches.push({
          currentFeature,
          bestMatch,
          similarity: maxSimilarity,
        });
        console.log(
          `      ✅ 特征匹配成功！累计相似度: ${(totalSimilarity * 100).toFixed(
            1
          )}%`
        );
      } else {
        console.log(`      ❌ 特征匹配失败 (阈值: 50%)`);
      }
    }

    if (matchCount === 0) {
      console.log(`  ❌ 没有匹配的特征，返回相似度: 0`);
      return 0;
    }

    // 返回平均相似度
    const finalSimilarity = totalSimilarity / matchCount;

    console.log(`  📈 相似度计算完成:`);
    console.log(`    • 匹配特征数: ${matchCount}/${currentFeatures.length}`);
    console.log(`    • 总相似度: ${(totalSimilarity * 100).toFixed(1)}%`);
    console.log(`    • 平均相似度: ${(finalSimilarity * 100).toFixed(1)}%`);

    if (featureMatches.length > 0) {
      console.log(`    • 匹配详情:`);
      featureMatches.forEach((match, index) => {
        console.log(
          `      ${index + 1}. "${match.currentFeature}" ↔ "${
            match.bestMatch
          }" (${(match.similarity * 100).toFixed(1)}%)`
        );
      });
    }

    return finalSimilarity;
  }

  /**
   * 计算字符串相似度
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} 相似度 (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    console.log(`        🔤 计算字符串相似度: "${str1}" ↔ "${str2}"`);

    if (!str1 || !str2) {
      console.log(`        ❌ 字符串为空，返回相似度: 0`);
      return 0;
    }

    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    console.log(`        📝 标准化后: "${s1}" ↔ "${s2}"`);

    if (s1 === s2) {
      console.log(`        ✅ 完全匹配，返回相似度: 1.0`);
      return 1;
    }

    // 语义相似性检查
    const semanticSimilarity = this.calculateSemanticSimilarity(s1, s2);
    if (semanticSimilarity > 0.5) {
      console.log(
        `        🧠 语义相似匹配，返回相似度: ${semanticSimilarity.toFixed(2)}`
      );
      return semanticSimilarity;
    }

    // 包含关系检查
    if (s1.includes(s2) || s2.includes(s1)) {
      console.log(`        🔗 包含关系匹配，返回相似度: 0.8`);
      return 0.8;
    }

    // 使用编辑距离计算相似度
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength;

    console.log(
      `        📏 编辑距离: ${distance}, 最大长度: ${maxLength}, 相似度: ${(
        similarity * 100
      ).toFixed(1)}%`
    );

    return similarity;
  }

  /**
   * 计算语义相似度
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} 语义相似度分数 (0-1)
   */
  calculateSemanticSimilarity(str1, str2) {
    // 定义语义相似词汇组
    const semanticGroups = [
      ["眼睛", "大眼睛", "小眼睛", "蓝色眼睛", "紫色瞳孔", "眼镜"],
      ["头发", "长发", "短发", "黑色长发", "白色头发", "双马尾", "短刘海"],
      ["表情", "微笑", "闭眼", "可爱", "温柔", "甜美", "清新"],
      ["服装", "连衣裙", "领结", "蝴蝶结", "头饰"],
      ["装饰", "花朵装饰", "人物", "卡通人物"],
      ["风格", "可爱", "卖萌", "清新", "温柔", "甜美"],
    ];

    // 检查是否在同一语义组中
    for (const group of semanticGroups) {
      if (group.includes(str1) && group.includes(str2)) {
        return 0.7; // 语义相似度
      }
    }

    return 0;
  }

  /**
   * 计算编辑距离
   * @param {string} str1 - 字符串1
   * @param {string} str2 - 字符串2
   * @returns {number} 编辑距离
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  /**
   * 使用Google Vision API分析图片
   */
  async analyzeWithGoogleVision(imageBlob) {
    if (!this.apiConfig.googleVision.apiKey) {
      throw new Error("Google Vision API密钥未配置");
    }

    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch(
      `${this.apiConfig.googleVision.endpoint}?key=${this.apiConfig.googleVision.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64,
              },
              features: [
                { type: "LABEL_DETECTION", maxResults: 20 },
                { type: "OBJECT_LOCALIZATION", maxResults: 10 },
                { type: "TEXT_DETECTION", maxResults: 5 },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API错误: ${response.status}`);
    }

    const data = await response.json();
    const tags = [];

    // 提取标签
    if (data.responses && data.responses[0]) {
      const response = data.responses[0];

      // 标签检测结果
      if (response.labelAnnotations) {
        response.labelAnnotations.forEach((label) => {
          if (label.score > 0.7) {
            // 置信度阈值
            tags.push({
              tag: label.description.toLowerCase(),
              confidence: label.score,
              source: "google-vision",
            });
          }
        });
      }

      // 对象检测结果
      if (response.localizedObjectAnnotations) {
        response.localizedObjectAnnotations.forEach((obj) => {
          if (obj.score > 0.7) {
            tags.push({
              tag: obj.name.toLowerCase(),
              confidence: obj.score,
              source: "google-vision-object",
            });
          }
        });
      }

      // 文本检测结果
      if (response.textAnnotations && response.textAnnotations.length > 0) {
        const text = response.textAnnotations[0].description;
        if (text && text.length > 0) {
          tags.push({
            tag: `text: ${text.toLowerCase()}`,
            confidence: 0.8,
            source: "google-vision-text",
          });
        }
      }
    }

    return tags;
  }

  /**
   * 使用GPT-4 Vision分析图片
   */
  async analyzeWithGPTVision(imageBlob, imageName) {
    if (!this.apiConfig.openai.apiKey) {
      throw new Error("OpenAI API密钥未配置");
    }

    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch(
      `${this.apiConfig.openai.baseURL}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiConfig.openai.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.apiConfig.openai.model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `请分析这张图片的内容，并基于以下现有标签库推荐相关的标签。现有标签：${Array.from(
                    this.existingTags
                  ).join(
                    ", "
                  )}。请只推荐与现有标签相似或相关的标签，如果没有合适的标签，可以推荐一些通用的描述性标签。请以JSON格式返回，格式为：[{"tag": "标签名", "confidence": 0.8, "reason": "推荐理由"}]`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`,
                    detail: "low",
                  },
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAI API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return [];
    }

    try {
      const tags = JSON.parse(content);
      return tags.map((tag) => ({
        ...tag,
        source: "gpt-vision",
      }));
    } catch (parseError) {
      console.warn("GPT返回结果解析失败:", parseError);
      return [];
    }
  }

  /**
   * 过滤和排序标签
   */
  filterAndRankTags(allTags) {
    // 去重并计算相似度
    const tagMap = new Map();

    allTags.forEach((tagData) => {
      const tag = tagData.tag.toLowerCase().trim();

      if (tagMap.has(tag)) {
        // 如果已存在，取更高的置信度
        const existing = tagMap.get(tag);
        if (tagData.confidence > existing.confidence) {
          tagMap.set(tag, tagData);
        }
      } else {
        tagMap.set(tag, tagData);
      }
    });

    // 计算与现有标签的相似度
    const scoredTags = Array.from(tagMap.values()).map((tagData) => {
      const similarity = this.calculateTagSimilarity(tagData.tag);
      return {
        ...tagData,
        similarity,
        finalScore: tagData.confidence * 0.7 + similarity * 0.3,
      };
    });

    // 过滤和排序
    return scoredTags
      .filter((tag) => tag.finalScore > 0.5) // 最低分数阈值
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 10) // 最多返回10个标签
      .map((tag) => ({
        tag: tag.tag,
        confidence: tag.confidence,
        similarity: tag.similarity,
        source: tag.source,
        reason: tag.reason || `置信度: ${(tag.confidence * 100).toFixed(1)}%`,
      }));
  }

  /**
   * 计算标签与现有标签的相似度
   */
  calculateTagSimilarity(tag) {
    let maxSimilarity = 0;

    this.existingTags.forEach((existingTag) => {
      const similarity = this.stringSimilarity(tag, existingTag);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });

    return maxSimilarity;
  }

  /**
   * 计算字符串相似度（使用Levenshtein距离）
   */
  stringSimilarity(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * 使用百度文心一言分析图片
   */
  async analyzeWithBaiduErnie(imageBlob, imageName) {
    if (
      !this.apiConfig.baiduErnie.apiKey ||
      !this.apiConfig.baiduErnie.secretKey
    ) {
      throw new Error("百度文心一言API密钥未配置");
    }

    try {
      // 获取access_token
      const tokenResponse = await fetch(
        `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiConfig.baiduErnie.apiKey}&client_secret=${this.apiConfig.baiduErnie.secretKey}`,
        { method: "POST" }
      );
      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error("获取百度access_token失败");
      }

      const base64 = await this.blobToBase64(imageBlob);

      const response = await fetch(
        `https://aip.baidubce.com/rest/2.0/wenxin/v1/genimg/analyze?access_token=${tokenData.access_token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `image=${encodeURIComponent(
            base64
          )}&prompt=请分析这张图片的内容，并基于以下现有标签库推荐相关的标签。现有标签：${Array.from(
            this.existingTags
          ).join(
            ", "
          )}。请以JSON格式返回，格式为：[{"tag": "标签名", "confidence": 0.8, "reason": "推荐理由"}]`,
        }
      );

      if (!response.ok) {
        throw new Error(`百度文心一言API错误: ${response.status}`);
      }

      const data = await response.json();

      if (data.error_code) {
        throw new Error(`百度API错误: ${data.error_msg}`);
      }

      // 解析返回的文本内容
      const content = data.result || data.text || "";
      try {
        const tags = JSON.parse(content);
        return tags.map((tag) => ({
          ...tag,
          source: "baidu-ernie",
        }));
      } catch (parseError) {
        // 如果不是JSON格式，尝试提取标签
        const extractedTags = this.extractTagsFromText(content);
        return extractedTags.map((tag) => ({
          tag,
          confidence: 0.7,
          source: "baidu-ernie",
        }));
      }
    } catch (error) {
      console.error("百度文心一言分析失败:", error);
      return [];
    }
  }

  /**
   * 使用阿里通义千问分析图片
   */
  async analyzeWithAlibabaQwen(imageBlob, imageName) {
    if (!this.apiConfig.alibabaQwen.apiKey) {
      throw new Error("阿里通义千问API密钥未配置");
    }

    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch(this.apiConfig.alibabaQwen.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.alibabaQwen.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-vl-plus",
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `请分析这张图片的内容，并基于以下现有标签库推荐相关的标签。现有标签：${Array.from(
                    this.existingTags
                  ).join(
                    ", "
                  )}。请以JSON格式返回，格式为：[{"tag": "标签名", "confidence": 0.8, "reason": "推荐理由"}]`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64}`,
                  },
                },
              ],
            },
          ],
        },
        parameters: {
          temperature: 0.3,
          max_tokens: 500,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`阿里通义千问API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.output?.text || "";

    try {
      const tags = JSON.parse(content);
      return tags.map((tag) => ({
        ...tag,
        source: "alibaba-qwen",
      }));
    } catch (parseError) {
      const extractedTags = this.extractTagsFromText(content);
      return extractedTags.map((tag) => ({
        tag,
        confidence: 0.7,
        source: "alibaba-qwen",
      }));
    }
  }

  /**
   * 使用智谱AI分析图片
   */
  async analyzeWithZhipuAI(imageBlob, imageName) {
    if (!this.apiConfig.zhipuAI.apiKey) {
      throw new Error("智谱AI API密钥未配置");
    }

    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch(this.apiConfig.zhipuAI.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.zhipuAI.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "glm-4v-plus",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这张图片的内容，并基于以下现有标签库推荐相关的标签。现有标签：${Array.from(
                  this.existingTags
                ).join(
                  ", "
                )}。请以JSON格式返回，格式为：[{"tag": "标签名", "confidence": 0.8, "reason": "推荐理由"}]`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`智谱AI API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const tags = JSON.parse(content);
      return tags.map((tag) => ({
        ...tag,
        source: "zhipu-ai",
      }));
    } catch (parseError) {
      const extractedTags = this.extractTagsFromText(content);
      return extractedTags.map((tag) => ({
        tag,
        confidence: 0.7,
        source: "zhipu-ai",
      }));
    }
  }

  /**
   * 使用月之暗面Kimi分析图片
   */
  async analyzeWithKimi(imageBlob, imageName) {
    if (!this.apiConfig.kimi.apiKey) {
      throw new Error("Kimi API密钥未配置");
    }

    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch(this.apiConfig.kimi.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.kimi.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshot-vl-8k",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这张图片的内容，并基于以下现有标签库推荐相关的标签。现有标签：${Array.from(
                  this.existingTags
                ).join(
                  ", "
                )}。请以JSON格式返回，格式为：[{"tag": "标签名", "confidence": 0.8, "reason": "推荐理由"}]`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const tags = JSON.parse(content);
      return tags.map((tag) => ({
        ...tag,
        source: "kimi",
      }));
    } catch (parseError) {
      const extractedTags = this.extractTagsFromText(content);
      return extractedTags.map((tag) => ({
        tag,
        confidence: 0.7,
        source: "kimi",
      }));
    }
  }

  /**
   * 使用字节豆包分析图片
   */
  async analyzeWithDoubao(imageBlob, imageName) {
    if (!this.apiConfig.doubao.apiKey) {
      throw new Error("豆包 API密钥未配置");
    }

    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch(this.apiConfig.doubao.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.doubao.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "ep-20241218140320-8j8qm",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这张图片的内容，并基于以下现有标签库推荐相关的标签。现有标签：${Array.from(
                  this.existingTags
                ).join(
                  ", "
                )}。请以JSON格式返回，格式为：[{"tag": "标签名", "confidence": 0.8, "reason": "推荐理由"}]`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`豆包 API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const tags = JSON.parse(content);
      return tags.map((tag) => ({
        ...tag,
        source: "doubao",
      }));
    } catch (parseError) {
      const extractedTags = this.extractTagsFromText(content);
      return extractedTags.map((tag) => ({
        tag,
        confidence: 0.7,
        source: "doubao",
      }));
    }
  }

  /**
   * 使用硅基流动分析图片
   * @param {Blob} imageBlob - 图片数据
   * @param {string} imageName - 图片名称
   * @returns {Promise<Array>} 推荐的标签列表
   */
  async analyzeWithSilicoflow(imageBlob, imageName) {
    if (!this.apiConfig.silicoflow.apiKey) {
      throw new Error("硅基流动 API密钥未配置");
    }

    const base64 = await this.blobToBase64(imageBlob);

    const response = await fetch(this.apiConfig.silicoflow.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.silicoflow.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-VL-7B",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `请分析这张图片的内容，并基于以下现有标签库推荐相关的标签。现有标签：${Array.from(
                  this.existingTags
                ).join(
                  ", "
                )}。请以JSON格式返回，格式为：[{"tag": "标签名", "confidence": 0.8, "reason": "推荐理由"}]`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`硅基流动 API错误: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    try {
      const tags = JSON.parse(content);
      return tags.map((tag) => ({
        ...tag,
        source: "silicoflow",
      }));
    } catch (parseError) {
      const extractedTags = this.extractTagsFromText(content);
      return extractedTags.map((tag) => ({
        tag,
        confidence: 0.7,
        source: "silicoflow",
      }));
    }
  }

  /**
   * 使用Azure Computer Vision分析图片
   */
  async analyzeWithAzureVision(imageBlob) {
    if (
      !this.apiConfig.azureVision.subscriptionKey ||
      !this.apiConfig.azureVision.endpoint
    ) {
      throw new Error("Azure Computer Vision API密钥未配置");
    }

    const response = await fetch(
      `${this.apiConfig.azureVision.endpoint}/vision/v3.2/analyze?visualFeatures=Tags,Objects,Description`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key":
            this.apiConfig.azureVision.subscriptionKey,
          "Content-Type": "application/octet-stream",
        },
        body: imageBlob,
      }
    );

    if (!response.ok) {
      throw new Error(`Azure Vision API错误: ${response.status}`);
    }

    const data = await response.json();
    const tags = [];

    // 提取标签
    if (data.tags) {
      data.tags.forEach((tag) => {
        if (tag.confidence > 0.7) {
          tags.push({
            tag: tag.name.toLowerCase(),
            confidence: tag.confidence,
            source: "azure-vision",
          });
        }
      });
    }

    // 提取对象
    if (data.objects) {
      data.objects.forEach((obj) => {
        if (obj.confidence > 0.7) {
          tags.push({
            tag: obj.object.toLowerCase(),
            confidence: obj.confidence,
            source: "azure-vision-object",
          });
        }
      });
    }

    return tags;
  }

  /**
   * 从文本中提取标签
   */
  extractTagsFromText(text) {
    const tags = [];
    const lines = text.split("\n");

    lines.forEach((line) => {
      // 尝试匹配各种标签格式
      const patterns = [
        /标签[：:]\s*(.+)/i,
        /tag[：:]\s*(.+)/i,
        /(.+?)[：:]\s*\d+%/i,
        /"(.+?)"/g,
        /'(.+?)'/g,
      ];

      patterns.forEach((pattern) => {
        const matches = line.match(pattern);
        if (matches) {
          const tag = matches[1]?.trim();
          if (tag && tag.length > 0 && tag.length < 20) {
            tags.push(tag.toLowerCase());
          }
        }
      });
    });

    return [...new Set(tags)]; // 去重
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
   * 获取分析日志
   * @returns {Array} 分析日志列表
   */
  getAnalysisLogs() {
    return analysisLogger.getAllLogs();
  }

  /**
   * 获取指定分析日志
   * @param {string} analysisId - 分析ID
   * @returns {Object|null} 分析日志
   */
  getAnalysisLog(analysisId) {
    return analysisLogger.getLog(analysisId);
  }

  /**
   * 导出分析日志
   * @param {string} analysisId - 分析ID，如果为空则导出所有日志
   * @param {string} format - 导出格式：'json' 或 'text'
   * @returns {string} 导出的日志数据
   */
  exportAnalysisLogs(analysisId = null, format = "text") {
    if (format === "json") {
      return analysisLogger.exportLogs(analysisId);
    } else {
      return analysisLogger.exportLogsAsText(analysisId);
    }
  }

  /**
   * 清空分析日志
   */
  clearAnalysisLogs() {
    analysisLogger.clearLogs();
  }

  /**
   * 获取分析统计信息
   * @returns {Object} 统计信息
   */
  getAnalysisStatistics() {
    return analysisLogger.getStatistics();
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
        if (config.googleVision) {
          this.apiConfig.googleVision = {
            ...this.apiConfig.googleVision,
            ...config.googleVision,
          };
        }
        if (config.azureVision) {
          this.apiConfig.azureVision = {
            ...this.apiConfig.azureVision,
            ...config.azureVision,
          };
        }
        if (config.baiduErnie) {
          this.apiConfig.baiduErnie = {
            ...this.apiConfig.baiduErnie,
            ...config.baiduErnie,
          };
        }
        if (config.alibabaQwen) {
          this.apiConfig.alibabaQwen = {
            ...this.apiConfig.alibabaQwen,
            ...config.alibabaQwen,
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
        if (config.silicoflow) {
          this.apiConfig.silicoflow = {
            ...this.apiConfig.silicoflow,
            ...config.silicoflow,
          };
        }

        console.log("✅ AI服务配置已从localStorage加载");
        return true;
      }
    } catch (err) {
      console.warn("❌ 加载AI服务配置失败:", err);
    }
    return false;
  }

  /**
   * 获取可用的AI服务列表
   */
  getAvailableServices() {
    const services = [];

    if (this.apiConfig.openai.apiKey) services.push("openai");
    if (this.apiConfig.googleVision.apiKey) services.push("googleVision");
    if (this.apiConfig.azureVision.subscriptionKey)
      services.push("azureVision");
    if (this.apiConfig.baiduErnie.apiKey && this.apiConfig.baiduErnie.secretKey)
      services.push("baiduErnie");
    if (this.apiConfig.alibabaQwen.apiKey) services.push("alibabaQwen");
    if (this.apiConfig.zhipuAI.apiKey) services.push("zhipuAI");
    if (this.apiConfig.kimi.apiKey) services.push("kimi");
    if (this.apiConfig.doubao.apiKey) services.push("doubao");
    if (this.apiConfig.silicoflow.apiKey) services.push("silicoflow");

    return services;
  }

  /**
   * 获取当前配置的AI服务
   */
  getCurrentConfiguredService() {
    for (const [service, config] of Object.entries(this.apiConfig)) {
      if (config.apiKey && config.apiKey.trim() !== "") {
        return service;
      }
    }
    return null;
  }

  /**
   * 获取当前选择的模型名称
   */
  getCurrentModelName() {
    const currentService = this.getCurrentConfiguredService();
    if (!currentService) return null;

    const config = this.apiConfig[currentService];
    if (config && config.model) {
      return config.model;
    }
    return null;
  }

  /**
   * 检查指定服务是否已配置
   * @param {string} serviceName - 服务名称
   * @returns {boolean} 是否已配置
   */
  isServiceConfigured(serviceName) {
    switch (serviceName) {
      case "openai":
        return !!this.apiConfig.openai.apiKey;
      case "googleVision":
        return !!this.apiConfig.googleVision.apiKey;
      case "azureVision":
        return !!(
          this.apiConfig.azureVision.subscriptionKey &&
          this.apiConfig.azureVision.endpoint
        );
      case "baiduErnie":
        return !!(
          this.apiConfig.baiduErnie.apiKey &&
          this.apiConfig.baiduErnie.secretKey
        );
      case "alibabaQwen":
        return !!this.apiConfig.alibabaQwen.apiKey;
      case "zhipuAI":
        return !!this.apiConfig.zhipuAI.apiKey;
      case "kimi":
        return !!this.apiConfig.kimi.apiKey;
      case "doubao":
        return !!this.apiConfig.doubao.apiKey;
      case "silicoflow":
        return !!this.apiConfig.silicoflow.apiKey;
      default:
        return false;
    }
  }

  /**
   * 使用指定服务分析图片
   * @param {Blob} imageBlob - 图片数据
   * @param {string} imageName - 图片名称
   * @param {string} serviceName - 服务名称
   * @returns {Promise<Array>} 推荐的标签列表
   */
  async analyzeWithService(imageBlob, imageName, serviceName) {
    switch (serviceName) {
      case "openai":
        return this.analyzeWithGPTVision(imageBlob, imageName);
      case "googleVision":
        return this.analyzeWithGoogleVision(imageBlob);
      case "azureVision":
        return this.analyzeWithAzureVision(imageBlob);
      case "baiduErnie":
        return this.analyzeWithBaiduErnie(imageBlob, imageName);
      case "alibabaQwen":
        return this.analyzeWithAlibabaQwen(imageBlob, imageName);
      case "zhipuAI":
        return this.analyzeWithZhipuAI(imageBlob, imageName);
      case "kimi":
        return this.analyzeWithKimi(imageBlob, imageName);
      case "doubao":
        return this.analyzeWithDoubao(imageBlob, imageName);
      case "silicoflow":
        return this.analyzeWithSilicoflow(imageBlob, imageName);
      default:
        throw new Error(`未知的服务: ${serviceName}`);
    }
  }

  /**
   * 更新API配置
   * @param {string} serviceName - 服务名称
   * @param {Object} config - 配置对象
   */
  updateApiConfig(serviceName, config) {
    if (this.apiConfig[serviceName]) {
      Object.assign(this.apiConfig[serviceName], config);
    }
  }

  /**
   * 获取处理统计信息
   * @returns {Object} 处理统计
   */
  getProcessingStats() {
    return (
      this.processingStats || {
        message: "尚未开始处理",
        totalImages: 0,
        processedImages: 0,
        failedImages: 0,
        tagGroups: 0,
        successfulTags: 0,
        failedTags: 0,
        duration: 0,
      }
    );
  }

  /**
   * 获取标签特征数据库信息
   * @returns {Object} 特征数据库信息
   */
  getTagFeatureDatabaseInfo() {
    const info = {
      totalTags: this.tagFeatureDatabase.size,
      tags: [],
      totalImages: 0,
      totalFeatures: 0,
    };

    for (const [tag, data] of this.tagFeatureDatabase) {
      info.tags.push({
        tag,
        imageCount: data.count,
        featureCount: data.features.length,
      });
      info.totalImages += data.count;
      info.totalFeatures += data.features.length;
    }

    return info;
  }

  /**
   * 重置处理统计
   */
  resetProcessingStats() {
    this.processingStats = null;
    this.featureCache.clear();
    console.log("🔄 处理统计已重置");
  }

  /**
   * 获取API配置状态
   */
  getApiStatus() {
    return {
      openai: !!this.apiConfig.openai.apiKey,
      googleVision: !!this.apiConfig.googleVision.apiKey,
      azureVision: !!this.apiConfig.azureVision.subscriptionKey,
      baiduErnie: !!(
        this.apiConfig.baiduErnie.apiKey && this.apiConfig.baiduErnie.secretKey
      ),
      alibabaQwen: !!this.apiConfig.alibabaQwen.apiKey,
      zhipuAI: !!this.apiConfig.zhipuAI.apiKey,
      kimi: !!this.apiConfig.kimi.apiKey,
      doubao: !!this.apiConfig.doubao.apiKey,
      silicoflow: !!this.apiConfig.silicoflow.apiKey,
    };
  }

  /**
   * 测试API连接
   * @param {string} serviceName - 服务名称
   * @returns {Promise<Object>} 测试结果
   */
  async testApiConnection(serviceName) {
    const testResults = {
      success: false,
      message: "",
      responseTime: 0,
      error: null,
    };

    const startTime = Date.now();

    try {
      switch (serviceName) {
        case "openai":
          await this.testOpenAI();
          break;
        case "googleVision":
          await this.testGoogleVision();
          break;
        case "azureVision":
          await this.testAzureVision();
          break;
        case "baiduErnie":
          await this.testBaiduErnie();
          break;
        case "alibabaQwen":
          await this.testAlibabaQwen();
          break;
        case "zhipuAI":
          await this.testZhipuAI();
          break;
        case "kimi":
          await this.testKimi();
          break;
        case "doubao":
          await this.testDoubao();
          break;
        case "silicoflow":
          await this.testSilicoflow();
          break;
        default:
          throw new Error(`未知的服务: ${serviceName}`);
      }

      testResults.success = true;
      testResults.message = `${serviceName} API连接成功`;
    } catch (error) {
      testResults.success = false;
      testResults.message = `${serviceName} API连接失败: ${error.message}`;
      testResults.error = error.message;
    }

    testResults.responseTime = Date.now() - startTime;
    return testResults;
  }

  /**
   * 测试OpenAI API
   */
  async testOpenAI() {
    if (!this.apiConfig.openai.apiKey) {
      throw new Error("API密钥未配置");
    }

    const response = await fetch(this.apiConfig.openai.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.openai.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  /**
   * 测试Google Vision API
   */
  async testGoogleVision() {
    if (!this.apiConfig.googleVision.apiKey) {
      throw new Error("API密钥未配置");
    }

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiConfig.googleVision.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content:
                  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
              },
              features: [{ type: "LABEL_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  /**
   * 测试Azure Vision API
   */
  async testAzureVision() {
    if (
      !this.apiConfig.azureVision.subscriptionKey ||
      !this.apiConfig.azureVision.endpoint
    ) {
      throw new Error("订阅密钥或终结点未配置");
    }

    const response = await fetch(
      `${this.apiConfig.azureVision.endpoint}vision/v3.2/analyze?visualFeatures=Tags`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key":
            this.apiConfig.azureVision.subscriptionKey,
          "Content-Type": "application/octet-stream",
        },
        body: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), // 最小PNG图片
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  /**
   * 测试百度文心一言API
   */
  async testBaiduErnie() {
    if (
      !this.apiConfig.baiduErnie.apiKey ||
      !this.apiConfig.baiduErnie.secretKey
    ) {
      throw new Error("API密钥或Secret密钥未配置");
    }

    // 百度需要先获取access_token
    const tokenResponse = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiConfig.baiduErnie.apiKey}&client_secret=${this.apiConfig.baiduErnie.secretKey}`,
      { method: "POST" }
    );

    if (!tokenResponse.ok) {
      throw new Error("获取access_token失败");
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error("access_token获取失败");
    }
  }

  /**
   * 测试阿里通义千问API
   */
  async testAlibabaQwen() {
    if (!this.apiConfig.alibabaQwen.apiKey) {
      throw new Error("API密钥未配置");
    }

    const response = await fetch(this.apiConfig.alibabaQwen.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.alibabaQwen.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        input: {
          messages: [{ role: "user", content: "Hello" }],
        },
        parameters: {
          max_tokens: 10,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  /**
   * 测试智谱AI API
   */
  async testZhipuAI() {
    if (!this.apiConfig.zhipuAI.apiKey) {
      throw new Error("API密钥未配置");
    }

    // 使用用户选择的模型，如果没有选择则使用默认模型
    const model = this.apiConfig.zhipuAI.model || "glm-4v";

    const response = await fetch(this.apiConfig.zhipuAI.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.zhipuAI.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  /**
   * 测试Kimi API
   */
  async testKimi() {
    if (!this.apiConfig.kimi.apiKey) {
      throw new Error("API密钥未配置");
    }

    // 使用用户选择的模型，如果没有选择则使用默认模型
    const model = this.apiConfig.kimi.model || "moonshot-vl-8k";

    const response = await fetch(this.apiConfig.kimi.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.kimi.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  /**
   * 测试豆包API
   */
  async testDoubao() {
    if (!this.apiConfig.doubao.apiKey) {
      throw new Error("API密钥未配置");
    }

    // 使用用户选择的模型，如果没有选择则使用默认模型
    const model = this.apiConfig.doubao.model || "doubao-pro-4k";

    const response = await fetch(this.apiConfig.doubao.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.doubao.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  /**
   * 获取硅基流动可用模型列表（视觉模型）
   * @returns {Promise<Array>} 模型列表
   */
  async getSilicoflowModels() {
    if (!this.apiConfig.silicoflow.apiKey) {
      throw new Error("API密钥未配置");
    }

    try {
      // 获取所有可用模型列表
      const response = await fetch("https://api.siliconflow.cn/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiConfig.silicoflow.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `获取模型列表失败: ${response.status} - ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();

      // 直接返回所有模型，不再进行过滤
      const models = data.data || [];

      return models.map((model) => ({
        id: model.id,
        name: model.id.split("/").pop() || model.id,
        description: model.description || model.id,
      }));
    } catch (error) {
      console.warn("获取硅基流动模型列表失败，使用默认模型:", error);
      // 返回默认模型列表作为备选
      return [
        {
          id: "deepseek-ai/DeepSeek-V3.1",
          name: "DeepSeek-V3.1",
          description: "DeepSeek最新多模态模型",
        },
        {
          id: "Qwen/Qwen2.5-VL-72B-Instruct",
          name: "Qwen2.5-VL-72B-Instruct",
          description: "通义千问2.5多模态大模型",
        },
        {
          id: "THUDM/GLM-4.5V",
          name: "GLM-4.5V",
          description: "智谱4.5多模态模型",
        },
        {
          id: "deepseek-ai/deepseek-vl2",
          name: "deepseek-vl2",
          description: "DeepSeek多模态模型",
        },
        {
          id: "Qwen/Qwen-Image",
          name: "Qwen-Image",
          description: "通义千问图像模型",
        },
      ];
    }
  }

  /**
   * 测试硅基流动API
   */
  async testSilicoflow() {
    if (!this.apiConfig.silicoflow.apiKey) {
      throw new Error("API密钥未配置");
    }

    // 使用用户选择的模型，如果没有选择则使用默认模型
    const model =
      this.apiConfig.silicoflow.model || "deepseek-ai/DeepSeek-V3.1";

    const response = await fetch(this.apiConfig.silicoflow.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig.silicoflow.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API错误: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }
  }

  // ==================== 新增：视觉相似性分析功能 ====================

  /**
   * 初始化视觉标签数据库
   */
  async initializeVisualTagDatabase() {
    try {
      const { getAllImages } = await import("@/utils/idb.js");
      const images = await getAllImages();

      console.log(`🚀 开始构建视觉标签数据库，共 ${images.length} 张图片`);

      // 按标签分组图片
      const tagGroups = new Map();
      images.forEach((image) => {
        if (image.tags && Array.isArray(image.tags)) {
          image.tags.forEach((tag) => {
            const normalizedTag = tag.toLowerCase();
            if (!tagGroups.has(normalizedTag)) {
              tagGroups.set(normalizedTag, []);
            }
            tagGroups.get(normalizedTag).push(image);
          });
        }
      });

      console.log(`📊 发现 ${tagGroups.size} 个标签组`);

      // 为每个标签组提取视觉特征
      for (const [tag, tagImages] of tagGroups) {
        if (tagImages.length >= 1) {
          // 降低要求，单张图片也可以构建特征库
          console.log(`🔍 处理标签 "${tag}"，包含 ${tagImages.length} 张图片`);

          try {
            const visualFeatures = await this.extractTagVisualFeatures(
              tag,
              tagImages
            );

            this.tagVisualDatabase.set(tag, {
              visualFeatures,
              images: tagImages,
              count: tagImages.length,
              lastUpdated: Date.now(),
            });

            console.log(`✅ 标签 "${tag}" 视觉特征提取成功`);
          } catch (error) {
            console.warn(`❌ 构建标签 "${tag}" 视觉特征库失败:`, error);
          }
        }
      }

      console.log(`🎉 视觉标签数据库构建完成！`);
    } catch (error) {
      console.error("视觉标签数据库初始化失败:", error);
    }
  }

  /**
   * 为标签组提取视觉特征
   */
  async extractTagVisualFeatures(tag, images) {
    const visualFeatures = [];
    const currentService = this.getCurrentConfiguredService();

    if (!currentService) {
      throw new Error("没有配置AI服务");
    }

    // 限制处理图片数量，避免API调用过多
    const imagesToProcess = images.slice(0, 5);

    for (const image of imagesToProcess) {
      try {
        console.log(`🔄 提取图片视觉特征: ${image.name || image.id}`);

        const imageBlob = await this.getImageBlob(image);
        if (!imageBlob) continue;

        const features = await visualFeatureExtractor.extractVisualFeatures(
          imageBlob,
          currentService
        );

        if (features && features.length > 0) {
          visualFeatures.push(features);
          console.log(`✅ 图片 ${image.name || image.id} 视觉特征提取成功`);
        }
      } catch (error) {
        console.warn(
          `❌ 提取图片 ${image.name || image.id} 视觉特征失败:`,
          error
        );
      }
    }

    return visualFeatures;
  }

  /**
   * 获取图片Blob数据
   */
  async getImageBlob(image) {
    if (image.blob && image.blob instanceof Blob) {
      return image.blob;
    } else if (image.objectUrl) {
      const response = await fetch(image.objectUrl);
      return await response.blob();
    }
    return null;
  }

  /**
   * 基于视觉相似性分析图片并推荐标签
   * @param {Blob} imageBlob - 图片数据
   * @param {string} imageName - 图片名称
   * @param {string} preferredService - 优先使用的服务（可选）
   * @param {number} imageId - 图片ID（可选）
   * @returns {Promise<Array>} 推荐的标签列表
   */
  async analyzeImageWithVisualSimilarity(
    imageBlob,
    imageName = "",
    preferredService = null,
    imageId = null
  ) {
    // 开始记录分析日志
    const currentService =
      preferredService || this.getCurrentConfiguredService();
    const currentModel = this.getCurrentModelName();
    const analysisId = await analysisLogger.startAnalysis({
      imageName,
      imageId: imageId,
      aiService: currentService,
      modelName: currentModel,
      analysisType: "visual-similarity",
    });

    try {
      console.log(
        `\n🎯 ========== 开始视觉相似性分析: ${imageName} ==========`
      );

      analysisLogger.addStep(analysisId, "开始视觉相似性分析", {
        imageName,
        tagDatabaseSize: this.tagVisualDatabase.size,
      });

      // 初始化视觉标签数据库（如果还未初始化）
      if (this.tagVisualDatabase.size === 0) {
        await this.initializeVisualTagDatabase();
      }

      // 获取当前配置的AI服务
      const currentService =
        preferredService || this.getCurrentConfiguredService();
      if (!currentService) {
        throw new Error("没有配置AI服务，请先配置API密钥");
      }

      console.log(`🤖 使用AI服务: ${currentService}`);
      analysisLogger.addStep(analysisId, "选择AI服务", {
        service: currentService,
      });

      // 提取当前图片的视觉特征
      console.log(`🔄 开始提取当前图片视觉特征...`);
      const currentImageFeatures =
        await visualFeatureExtractor.extractVisualFeatures(
          imageBlob,
          currentService
        );

      if (!currentImageFeatures || currentImageFeatures.length === 0) {
        throw new Error("无法提取图片视觉特征");
      }

      console.log(`✅ 当前图片视觉特征提取成功:`, currentImageFeatures);
      analysisLogger.addStep(analysisId, "视觉特征提取完成", {
        featuresCount: currentImageFeatures.length,
        features: currentImageFeatures,
      });

      // 与标签视觉数据库进行相似度比较
      const recommendations = [];
      const comparisonDetails = [];

      console.log(
        `🔍 开始与 ${this.tagVisualDatabase.size} 个标签进行视觉相似度比较...`
      );

      for (const [tag, tagData] of this.tagVisualDatabase) {
        if (tagData.visualFeatures.length === 0) {
          console.log(`⏭️ 跳过标签 "${tag}"，视觉特征库为空`);
          continue;
        }

        console.log(`\n🔍 ========== 比较标签: "${tag}" ==========`);
        console.log(`📸 该标签包含 ${tagData.count} 张图片`);
        console.log(
          `🎯 该标签的视觉特征数量: ${tagData.visualFeatures.length}`
        );

        // 计算与标签视觉特征库的最大相似度
        let maxSimilarity = 0;
        let bestMatchIndex = -1;

        for (let i = 0; i < tagData.visualFeatures.length; i++) {
          const similarity =
            visualSimilarityCalculator.calculateVisualSimilarity(
              currentImageFeatures,
              tagData.visualFeatures[i]
            );

          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatchIndex = i;
          }
        }

        console.log(`📊 最大视觉相似度: ${(maxSimilarity * 100).toFixed(2)}%`);
        console.log(
          `🎚️ 阈值要求: ${(this.visualSimilarityThreshold * 100).toFixed(1)}%`
        );

        const comparisonDetail = {
          tag,
          similarity: maxSimilarity,
          threshold: this.visualSimilarityThreshold,
          passed: maxSimilarity >= this.visualSimilarityThreshold,
          tagCount: tagData.count,
          featureCount: tagData.visualFeatures.length,
          bestMatchIndex,
        };

        comparisonDetails.push(comparisonDetail);

        if (maxSimilarity >= this.visualSimilarityThreshold) {
          console.log(`✅ 标签 "${tag}" 通过视觉相似度检查！`);
          recommendations.push({
            tag: tag,
            confidence: maxSimilarity,
            reason: `与标签"${tag}"的视觉特征相似度: ${(
              maxSimilarity * 100
            ).toFixed(1)}%`,
            source: "visual-similarity",
            tagCount: tagData.count,
          });

          analysisLogger.addStep(analysisId, `标签通过: ${tag}`, {
            similarity: maxSimilarity,
            similarityPercent: (maxSimilarity * 100).toFixed(2),
            threshold: this.visualSimilarityThreshold,
            thresholdPercent: (this.visualSimilarityThreshold * 100).toFixed(1),
            passed: true,
          });
        } else {
          console.log(`❌ 标签 "${tag}" 视觉相似度不足，跳过`);

          analysisLogger.addStep(analysisId, `标签未通过: ${tag}`, {
            similarity: maxSimilarity,
            similarityPercent: (maxSimilarity * 100).toFixed(2),
            threshold: this.visualSimilarityThreshold,
            thresholdPercent: (this.visualSimilarityThreshold * 100).toFixed(1),
            passed: false,
            reason: "视觉相似度不足",
          });
        }
      }

      // 按相似度排序
      recommendations.sort((a, b) => b.confidence - a.confidence);

      console.log(`\n🏆 ========== 最终推荐结果 ==========`);
      const finalRecommendations = recommendations.slice(0, 10);
      finalRecommendations.forEach((rec, index) => {
        console.log(
          `${index + 1}. ${rec.tag} - 视觉相似度: ${(
            rec.confidence * 100
          ).toFixed(1)}%`
        );
      });

      // 完成分析日志记录
      await analysisLogger.completeAnalysis(analysisId, finalRecommendations, {
        featuresExtracted: currentImageFeatures.length,
        similarityComparisons: comparisonDetails.length,
        recommendationsGenerated: finalRecommendations.length,
        tagDatabaseSize: this.tagVisualDatabase.size,
        analysisType: "visual-similarity",
      });

      return finalRecommendations;
    } catch (error) {
      console.error("❌ 视觉相似性分析失败:", error);
      await analysisLogger.failAnalysis(analysisId, error);
      return [];
    }
  }

  /**
   * 更新标签的视觉特征库
   */
  async updateTagVisualFeatures(tag, newImage) {
    const normalizedTag = tag.toLowerCase();

    if (!this.tagVisualDatabase.has(normalizedTag)) {
      this.tagVisualDatabase.set(normalizedTag, {
        visualFeatures: [],
        images: [],
        count: 0,
        lastUpdated: Date.now(),
      });
    }

    const tagData = this.tagVisualDatabase.get(normalizedTag);

    try {
      const imageBlob = await this.getImageBlob(newImage);
      if (!imageBlob) return;

      const currentService = this.getCurrentConfiguredService();
      if (!currentService) return;

      const features = await visualFeatureExtractor.extractVisualFeatures(
        imageBlob,
        currentService
      );

      if (features && features.length > 0) {
        tagData.visualFeatures.push(features);
        tagData.images.push(newImage);
        tagData.count++;
        tagData.lastUpdated = Date.now();

        console.log(`✅ 标签 "${tag}" 视觉特征库已更新`);
      }
    } catch (error) {
      console.warn(`❌ 更新标签 "${tag}" 视觉特征库失败:`, error);
    }
  }

  /**
   * 设置视觉相似度阈值
   */
  setVisualSimilarityThreshold(threshold) {
    this.visualSimilarityThreshold = threshold;
    visualSimilarityCalculator.setSimilarityThreshold(threshold);
    console.log(`🎚️ 视觉相似度阈值已设置为: ${(threshold * 100).toFixed(1)}%`);
  }

  /**
   * 获取视觉相似度阈值
   */
  getVisualSimilarityThreshold() {
    return this.visualSimilarityThreshold;
  }

  /**
   * 获取视觉标签数据库信息
   */
  getVisualTagDatabaseInfo() {
    const info = {
      totalTags: this.tagVisualDatabase.size,
      tags: [],
      totalImages: 0,
      totalFeatures: 0,
    };

    for (const [tag, data] of this.tagVisualDatabase) {
      info.tags.push({
        tag,
        imageCount: data.count,
        featureCount: data.visualFeatures.length,
        lastUpdated: data.lastUpdated,
      });
      info.totalImages += data.count;
      info.totalFeatures += data.visualFeatures.length;
    }

    return info;
  }

  /**
   * 清空视觉标签数据库
   */
  clearVisualTagDatabase() {
    this.tagVisualDatabase.clear();
    this.visualFeatureCache.clear();
    console.log("🔄 视觉标签数据库已清空");
  }

  /**
   * 获取图片的Blob数据
   * @param {Object} image - 图片对象
   * @returns {Promise<Blob|null>} 图片Blob数据
   */
  async getImageBlob(image) {
    try {
      if (image.blob && image.blob instanceof Blob) {
        return image.blob;
      } else if (image.objectUrl) {
        const response = await fetch(image.objectUrl);
        return await response.blob();
      } else {
        console.warn(`❌ 无法获取图片数据: ${image.name || image.id}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ 获取图片Blob失败: ${image.name || image.id}`, error);
      return null;
    }
  }

  /**
   * 设置推荐方法
   * @param {string} method - 推荐方法
   */
  setRecommendationMethod(method) {
    if (this.supportedMethods.includes(method)) {
      this.recommendationMethod = method;
      console.log(`🎯 推荐方法已设置为: ${method}`);
    } else {
      console.warn(
        `❌ 不支持的推荐方法: ${method}，支持的方法: ${this.supportedMethods.join(
          ", "
        )}`
      );
    }
  }

  /**
   * 获取当前推荐方法
   * @returns {string} 当前推荐方法
   */
  getRecommendationMethod() {
    return this.recommendationMethod;
  }

  /**
   * 获取支持的推荐方法列表
   * @returns {Array} 支持的推荐方法列表
   */
  getSupportedMethods() {
    return [...this.supportedMethods];
  }

  /**
   * AI直接推荐标签（不依赖已有标签库）
   * @param {Blob} imageBlob - 图片数据
   * @param {string} imageName - 图片名称
   * @param {string} preferredService - 优先使用的服务（可选）
   * @param {number} imageId - 图片ID（可选）
   * @returns {Promise<Array>} 推荐的标签列表
   */
  async analyzeImageWithAIDirectRecommendation(
    imageBlob,
    imageName = "",
    preferredService = null,
    imageId = null
  ) {
    // 开始记录分析日志
    const currentService =
      preferredService || this.getCurrentConfiguredService();
    const currentModel = this.getCurrentModelName();
    const analysisId = await analysisLogger.startAnalysis({
      imageName,
      imageId: imageId,
      aiService: currentService,
      modelName: currentModel,
      analysisType: "ai-direct-recommendation",
    });

    try {
      console.log(
        `\n🎯 ========== 开始AI直接推荐标签: ${imageName} ==========`
      );

      analysisLogger.addStep(analysisId, "开始AI直接推荐", {
        imageName,
        method: "ai-direct-recommendation",
      });

      // 获取当前配置的AI服务
      const currentService =
        preferredService || this.getCurrentConfiguredService();
      if (!currentService) {
        throw new Error("没有配置AI服务，请先配置API密钥");
      }

      console.log(`🤖 使用AI服务: ${currentService}`);
      analysisLogger.addStep(analysisId, "选择AI服务", {
        service: currentService,
      });

      // 调用AI服务直接生成标签推荐
      console.log(`🔄 开始调用AI服务生成标签推荐...`);
      const recommendations = await this.generateTagsWithAI(
        imageBlob,
        currentService
      );

      if (!recommendations || recommendations.length === 0) {
        console.log(`❌ AI未能生成标签推荐`);
        await analysisLogger.completeAnalysis(analysisId, [], {
          reason: "AI未能生成标签推荐",
          analysisType: "ai-direct-recommendation",
        });
        return [];
      }

      console.log(`📊 AI生成了 ${recommendations.length} 个标签推荐`);
      analysisLogger.addStep(analysisId, "AI标签生成完成", {
        recommendationsCount: recommendations.length,
        recommendations: recommendations.slice(0, 10), // 只记录前10个避免日志过长
      });

      // 按置信度排序
      const finalRecommendations = recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 15); // 限制返回前15个推荐

      console.log(`\n🏆 ========== AI直接推荐结果 ==========`);
      finalRecommendations.forEach((rec, index) => {
        console.log(
          `${index + 1}. ${rec.tag} - 置信度: ${(rec.confidence * 100).toFixed(
            1
          )}%`
        );
      });

      // 记录最终推荐结果
      analysisLogger.addStep(analysisId, "最终推荐结果", {
        totalRecommendations: recommendations.length,
        finalRecommendationsCount: finalRecommendations.length,
        finalRecommendations: finalRecommendations.map((rec, index) => ({
          rank: index + 1,
          tag: rec.tag,
          confidence: rec.confidence,
          confidencePercent: (rec.confidence * 100).toFixed(1),
          reason: rec.reason,
          source: rec.source,
        })),
      });

      // 完成分析日志记录
      await analysisLogger.completeAnalysis(analysisId, finalRecommendations, {
        recommendationsGenerated: finalRecommendations.length,
        analysisType: "ai-direct-recommendation",
      });

      return finalRecommendations;
    } catch (error) {
      console.error("❌ AI直接推荐失败:", error);
      await analysisLogger.failAnalysis(analysisId, error);
      return [];
    }
  }

  /**
   * 使用AI服务生成标签推荐
   * @param {Blob} imageBlob - 图片数据
   * @param {string} service - AI服务名
   * @returns {Promise<Array>} 标签推荐列表
   */
  async generateTagsWithAI(imageBlob, service) {
    const base64 = await this.blobToBase64(imageBlob);

    console.log(`🤖 调用 ${service} 生成标签推荐`);

    const requestBody = {
      model: this.apiConfig[service].model || "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "请分析这张图片的内容，生成10-15个简洁的中文标签，用逗号分隔。标签应该描述图片中的主要元素、人物特征、颜色、风格等。例如：长发,微笑,白色,可爱,清新",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    };

    const response = await fetch(this.apiConfig[service].endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiConfig[service].apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ${service} API错误: ${response.status}`, errorText);
      throw new Error(`${service} API错误: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error(`${service}返回空内容`);
    }

    // 解析AI返回的标签
    const recommendations = this.parseSimpleTags(content);
    console.log(`🎯 解析到的标签推荐:`, recommendations);
    return recommendations;
  }

  /**
   * 解析简单的标签文本
   * @param {string} content - AI返回的内容
   * @returns {Array} 标签推荐列表
   */
  parseSimpleTags(content) {
    console.log(`📝 开始解析标签: "${content}"`);

    // 按逗号分割标签
    const tags = content
      .split(/[,，、]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length >= 2 && tag.length <= 8)
      .slice(0, 15); // 限制最多15个标签

    // 转换为推荐格式
    const recommendations = tags.map((tag, index) => ({
      tag: tag.toLowerCase(),
      confidence: Math.max(0.9 - index * 0.05, 0.5), // 递减的置信度
      reason: "AI直接分析推荐",
      source: "ai-direct-recommendation",
    }));

    console.log(`✅ 解析到 ${recommendations.length} 个标签:`, recommendations);
    return recommendations;
  }

  /**
   * 获取当前配置的AI服务
   * @returns {string|null} 当前选中的AI服务名称
   */
  getCurrentConfiguredService() {
    try {
      // 每次调用时都从localStorage加载最新配置
      this.loadConfigFromStorage();

      const config = localStorage.getItem("ai-service-config");
      if (config) {
        const parsedConfig = JSON.parse(config);
        const selectedProvider = parsedConfig.selectedProvider;

        // 确保选中的服务确实已配置
        if (selectedProvider && this.isServiceConfigured(selectedProvider)) {
          console.log(`🎯 当前选中的AI服务: ${selectedProvider}`);
          return selectedProvider;
        }
      }

      // 如果没有选中服务或选中的服务未配置，返回第一个可用的服务
      const availableServices = this.getAvailableServices();
      if (availableServices.length > 0) {
        console.log(`🔧 使用第一个可用的AI服务: ${availableServices[0]}`);
        return availableServices[0];
      }

      console.warn("❌ 没有可用的AI服务");
      return null;
    } catch (err) {
      console.warn("❌ 获取AI服务配置失败:", err);
      return null;
    }
  }

  /**
   * 获取AI分析日志列表
   * @returns {Array} 分析日志列表
   */
  getAnalysisLogs() {
    return analysisLogger.getAllLogs();
  }

  /**
   * 获取AI分析统计信息
   * @param {boolean} fromDatabase - 是否从数据库获取完整统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getAnalysisStatistics(fromDatabase = false) {
    return await analysisLogger.getStatistics(fromDatabase);
  }

  /**
   * 导出AI分析日志
   * @param {string|null} analysisId - 分析ID，如果为空则导出所有日志
   * @param {string} format - 导出格式：'json' 或 'text'
   * @returns {string} 导出的日志数据
   */
  exportAnalysisLogs(analysisId = null, format = "json") {
    if (format === "text") {
      return analysisLogger.exportLogsAsText(analysisId);
    } else {
      return analysisLogger.exportLogs(analysisId);
    }
  }

  /**
   * 清空AI分析日志
   * @returns {Promise<void>}
   */
  async clearAnalysisLogs() {
    await analysisLogger.clearLogs();
  }

  /**
   * 测试AI分析日志保存功能
   * @returns {Promise<void>}
   */
  async testAnalysisLogSave() {
    console.log("🧪 开始测试AI分析日志保存功能...");
    await analysisLogger.testSave();
  }
}

// 创建单例实例
export const aiImageAnalysisService = new AIImageAnalysisService();

// 导出类以便测试
export default AIImageAnalysisService;
