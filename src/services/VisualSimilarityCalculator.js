/**
 * 视觉相似度计算器
 * 专门用于计算图片视觉特征的相似度，支持基于视觉相似性的标签推荐
 */

export class VisualSimilarityCalculator {
  constructor() {
    this.similarityThreshold = 0.5; // 视觉相似度阈值（宽松匹配）
    this.featureWeights = {
      facial_features: 0.4, // 面部特征权重最高
      appearance: 0.3, // 外观特征
      unique_identifiers: 0.2, // 独特标识
      visual_style: 0.1, // 视觉风格
    };

    // 构建视觉特征的语义分组
    this.visualSemanticGroups = this.buildVisualSemanticGroups();
  }

  /**
   * 构建视觉特征的语义分组
   */
  buildVisualSemanticGroups() {
    return {
      // 面部特征组
      facial: {
        eyes: [
          "眼睛",
          "大眼睛",
          "小眼睛",
          "单眼皮",
          "双眼皮",
          "蓝色眼睛",
          "棕色眼睛",
          "黑色眼睛",
          "眼镜",
        ],
        nose: ["鼻子", "高鼻梁", "小鼻子", "鼻型", "挺鼻"],
        mouth: ["嘴巴", "嘴唇", "微笑", "嘴角", "薄唇", "厚唇"],
        face: ["脸型", "圆脸", "方脸", "瓜子脸", "长脸", "鹅蛋脸", "娃娃脸"],
        expression: ["表情", "微笑", "严肃", "可爱", "温柔", "甜美", "清新"],
      },

      // 发型特征组
      hair: {
        length: ["长发", "短发", "中发", "超短发", "及肩发"],
        style: [
          "直发",
          "卷发",
          "波浪",
          "刘海",
          "中分",
          "偏分",
          "齐刘海",
          "斜刘海",
        ],
        color: ["黑发", "棕发", "金发", "白发", "染发", "红发", "蓝发"],
        texture: ["柔顺", "蓬松", "卷曲", "直顺"],
      },

      // 服装特征组
      clothing: {
        type: [
          "t恤",
          "衬衫",
          "外套",
          "连衣裙",
          "裤子",
          "裙子",
          "毛衣",
          "卫衣",
          "背心",
        ],
        color: [
          "白色",
          "黑色",
          "红色",
          "蓝色",
          "绿色",
          "黄色",
          "粉色",
          "紫色",
          "灰色",
        ],
        style: ["休闲", "正式", "运动", "时尚", "复古", "简约", "可爱", "甜美"],
      },

      // 背景环境组
      background: {
        indoor: ["室内", "房间", "客厅", "卧室", "办公室", "厨房", "书房"],
        outdoor: ["室外", "公园", "街道", "海滩", "山景", "花园", "广场"],
        objects: [
          "桌子",
          "椅子",
          "电脑",
          "手机",
          "书本",
          "杯子",
          "植物",
          "装饰品",
        ],
        lighting: ["明亮", "昏暗", "自然光", "灯光", "阳光"],
      },

      // 颜色特征组
      color: {
        primary: [
          "白色",
          "黑色",
          "红色",
          "蓝色",
          "绿色",
          "黄色",
          "粉色",
          "紫色",
          "橙色",
        ],
        tone: ["明亮", "暗淡", "鲜艳", "柔和", "对比强烈", "色调统一"],
      },

      // 构图特征组
      composition: {
        angle: ["正面", "侧面", "背面", "俯视", "仰视"],
        distance: ["特写", "近景", "中景", "远景", "全景"],
        framing: ["居中", "偏左", "偏右", "三分法", "对角线"],
      },
    };
  }

  /**
   * 计算两张图片的视觉相似度
   * @param {Array} features1 - 图片1的特征向量
   * @param {Array} features2 - 图片2的特征向量
   * @returns {number} 相似度分数 (0-1)
   */
  calculateVisualSimilarity(features1, features2) {
    console.log(`🔢 开始计算视觉相似度...`);
    console.log(`📊 图片1特征数量: ${features1.length}`);
    console.log(`📊 图片2特征数量: ${features2.length}`);

    if (
      !features1 ||
      !features2 ||
      features1.length === 0 ||
      features2.length === 0
    ) {
      console.log(`❌ 特征数据无效，返回相似度: 0`);
      return 0;
    }

    // 计算特征重叠度
    const overlapScore = this.calculateFeatureOverlap(features1, features2);
    console.log(`📈 特征重叠度: ${(overlapScore * 100).toFixed(1)}%`);

    // 计算语义相似度
    const semanticScore = this.calculateSemanticSimilarity(
      features1,
      features2
    );
    console.log(`🧠 语义相似度: ${(semanticScore * 100).toFixed(1)}%`);

    // 计算结构相似度
    const structuralScore = this.calculateStructuralSimilarity(
      features1,
      features2
    );
    console.log(`🏗️ 结构相似度: ${(structuralScore * 100).toFixed(1)}%`);

    // 综合评分
    const finalScore =
      overlapScore * 0.5 + semanticScore * 0.3 + structuralScore * 0.2;

    console.log(`🎯 最终视觉相似度: ${(finalScore * 100).toFixed(1)}%`);
    return Math.min(finalScore, 1.0);
  }

  /**
   * 计算特征重叠度
   */
  calculateFeatureOverlap(features1, features2) {
    const set1 = new Set(features1.map((f) => f.toLowerCase()));
    const set2 = new Set(features2.map((f) => f.toLowerCase()));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    const overlap = intersection.size / union.size;
    console.log(
      `🔍 特征重叠详情: ${intersection.size}/${union.size} = ${(
        overlap * 100
      ).toFixed(1)}%`
    );

    return overlap;
  }

  /**
   * 计算语义相似度
   */
  calculateSemanticSimilarity(features1, features2) {
    let totalSimilarity = 0;
    let matchCount = 0;
    const matchDetails = [];

    for (const feature1 of features1) {
      let maxSimilarity = 0;
      let bestMatch = null;

      for (const feature2 of features2) {
        const similarity = this.calculateFeatureSimilarity(feature1, feature2);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          bestMatch = feature2;
        }
      }

      if (maxSimilarity > 0.5) {
        totalSimilarity += maxSimilarity;
        matchCount++;
        matchDetails.push({
          feature1,
          bestMatch,
          similarity: maxSimilarity,
        });
      }
    }

    const semanticScore = matchCount > 0 ? totalSimilarity / matchCount : 0;

    if (matchDetails.length > 0) {
      console.log(`🧠 语义匹配详情:`);
      matchDetails.forEach((match, index) => {
        console.log(
          `  ${index + 1}. "${match.feature1}" ↔ "${match.bestMatch}" (${(
            match.similarity * 100
          ).toFixed(1)}%)`
        );
      });
    }

    return semanticScore;
  }

  /**
   * 计算单个特征的相似度
   */
  calculateFeatureSimilarity(feature1, feature2) {
    const f1 = feature1.toLowerCase().trim();
    const f2 = feature2.toLowerCase().trim();

    // 完全匹配
    if (f1 === f2) return 1.0;

    // 包含关系
    if (f1.includes(f2) || f2.includes(f1)) return 0.8;

    // 语义相似性检查
    const semanticScore = this.checkSemanticSimilarity(f1, f2);
    if (semanticScore > 0) return semanticScore;

    // 编辑距离
    const editDistance = this.levenshteinDistance(f1, f2);
    const maxLength = Math.max(f1.length, f2.length);
    return maxLength === 0 ? 0 : 1 - editDistance / maxLength;
  }

  /**
   * 检查语义相似性
   */
  checkSemanticSimilarity(feature1, feature2) {
    // 检查是否在同一语义组中
    for (const [category, groups] of Object.entries(
      this.visualSemanticGroups
    )) {
      for (const [groupName, words] of Object.entries(groups)) {
        if (words.includes(feature1) && words.includes(feature2)) {
          console.log(
            `🎯 语义匹配: "${feature1}" 和 "${feature2}" 属于 ${category}.${groupName} 组`
          );
          return 0.7; // 同组语义相似度
        }
      }
    }

    return 0;
  }

  /**
   * 计算结构相似度
   */
  calculateStructuralSimilarity(features1, features2) {
    // 比较特征向量的结构相似性
    const len1 = features1.length;
    const len2 = features2.length;

    if (len1 === 0 || len2 === 0) return 0;

    // 长度相似度
    const lengthSimilarity = 1 - Math.abs(len1 - len2) / Math.max(len1, len2);
    console.log(`📏 长度相似度: ${(lengthSimilarity * 100).toFixed(1)}%`);

    // 特征分布相似度
    const distributionSimilarity = this.calculateDistributionSimilarity(
      features1,
      features2
    );
    console.log(`📊 分布相似度: ${(distributionSimilarity * 100).toFixed(1)}%`);

    return (lengthSimilarity + distributionSimilarity) / 2;
  }

  /**
   * 计算特征分布相似度
   */
  calculateDistributionSimilarity(features1, features2) {
    // 统计特征类型分布
    const typeDistribution1 = this.getFeatureTypeDistribution(features1);
    const typeDistribution2 = this.getFeatureTypeDistribution(features2);

    console.log(`📊 特征类型分布1:`, typeDistribution1);
    console.log(`📊 特征类型分布2:`, typeDistribution2);

    let totalSimilarity = 0;
    let typeCount = 0;

    // 获取所有特征类型
    const allTypes = new Set([
      ...Object.keys(typeDistribution1),
      ...Object.keys(typeDistribution2),
    ]);

    for (const type of allTypes) {
      const count1 = typeDistribution1[type] || 0;
      const count2 = typeDistribution2[type] || 0;
      const maxCount = Math.max(count1, count2);
      const similarity =
        maxCount === 0 ? 0 : Math.min(count1, count2) / maxCount;
      totalSimilarity += similarity;
      typeCount++;

      console.log(
        `  ${type}: ${count1} vs ${count2} = ${(similarity * 100).toFixed(1)}%`
      );
    }

    return typeCount > 0 ? totalSimilarity / typeCount : 0;
  }

  /**
   * 获取特征类型分布
   */
  getFeatureTypeDistribution(features) {
    const distribution = {};

    features.forEach((feature) => {
      const type = this.getFeatureType(feature);
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return distribution;
  }

  /**
   * 获取特征类型
   */
  getFeatureType(feature) {
    const lowerFeature = feature.toLowerCase();

    for (const [category, groups] of Object.entries(
      this.visualSemanticGroups
    )) {
      for (const [groupName, words] of Object.entries(groups)) {
        if (words.some((word) => lowerFeature.includes(word))) {
          return `${category}_${groupName}`;
        }
      }
    }

    return "other";
  }

  /**
   * 计算编辑距离
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
   * 设置相似度阈值
   */
  setSimilarityThreshold(threshold) {
    this.similarityThreshold = threshold;
    console.log(`🎚️ 视觉相似度阈值已设置为: ${(threshold * 100).toFixed(1)}%`);
  }

  /**
   * 获取相似度阈值
   */
  getSimilarityThreshold() {
    return this.similarityThreshold;
  }
}

// 创建单例实例
export const visualSimilarityCalculator = new VisualSimilarityCalculator();

// 导出类以便测试
export default VisualSimilarityCalculator;
