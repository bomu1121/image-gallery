/**
 * AI分析日志管理器
 * 记录每次AI分析的完整过程，支持导出和持久化
 */

import {
  putAnalysisLog,
  putAnalysisLogs,
  getAllAnalysisLogs,
  getAnalysisLogById,
  clearAllAnalysisLogs as clearAllAnalysisLogsFromDB,
  getAnalysisLogsStatistics as getAnalysisLogsStatisticsFromDB,
} from "./idb.js";

class AnalysisLogger {
  constructor() {
    this.analysisLogs = [];
    this.maxLogs = 100; // 最多保存100条分析记录
    this.isInitialized = false;
    this.autoSaveEnabled = true; // 自动保存开关
  }

  /**
   * 初始化日志管理器，从IndexedDB加载数据
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log("🔄 正在初始化AI分析日志管理器...");
      const savedLogs = await getAllAnalysisLogs();

      // 限制内存中的日志数量
      this.analysisLogs = savedLogs.slice(0, this.maxLogs);

      console.log(
        `✅ AI分析日志管理器初始化完成，加载了 ${this.analysisLogs.length} 条记录`
      );
      this.isInitialized = true;
    } catch (error) {
      console.warn("❌ 初始化AI分析日志管理器失败:", error);
      this.analysisLogs = [];
      this.isInitialized = true;
    }
  }

  /**
   * 自动保存到IndexedDB
   */
  async autoSave() {
    if (!this.autoSaveEnabled || !this.isInitialized) {
      console.warn(
        "❌ 自动保存跳过: autoSaveEnabled=",
        this.autoSaveEnabled,
        "isInitialized=",
        this.isInitialized
      );
      return;
    }

    try {
      // 只保存最新的日志（避免保存过多数据）
      const logsToSave = this.analysisLogs.slice(
        0,
        Math.min(this.analysisLogs.length, 50)
      );

      console.log(
        `💾 开始自动保存 ${logsToSave.length} 条AI分析日志到IndexedDB`
      );
      await putAnalysisLogs(logsToSave);
      console.log(`✅ 自动保存AI分析日志成功`);
    } catch (error) {
      console.warn("❌ 自动保存AI分析日志失败:", error);
    }
  }

  /**
   * 开始记录一次分析
   * @param {Object} params - 分析参数
   * @returns {string} 分析ID
   */
  async startAnalysis(params) {
    const analysisId = `analysis_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log("📝 开始记录分析日志:", {
      analysisId,
      params,
      imageId: params.imageId,
      imageName: params.imageName,
    });

    const log = {
      id: analysisId,
      timestamp: new Date(),
      imageName: params.imageName || "未知图片",
      imageId: params.imageId || null,
      aiService: params.aiService || "未知服务",
      modelName: params.modelName || null,
      analysisType: params.analysisType || null,
      status: "processing", // processing, completed, failed
      steps: [],
      results: null,
      error: null,
      duration: 0,
      statistics: {
        totalImages: 0,
        processedImages: 0,
        tagGroups: 0,
        successfulTags: 0,
        failedTags: 0,
        featuresExtracted: 0,
        similarityComparisons: 0,
        recommendationsGenerated: 0,
      },
    };

    console.log("📝 创建的日志对象:", log);
    this.analysisLogs.unshift(log);

    // 限制日志数量
    if (this.analysisLogs.length > this.maxLogs) {
      this.analysisLogs = this.analysisLogs.slice(0, this.maxLogs);
    }

    // 自动保存到IndexedDB
    await this.autoSave();

    return analysisId;
  }

  /**
   * 添加分析步骤
   * @param {string} analysisId - 分析ID
   * @param {string} step - 步骤名称
   * @param {Object} data - 步骤数据
   */
  addStep(analysisId, step, data = {}) {
    const log = this.analysisLogs.find((l) => l.id === analysisId);
    if (!log) return;

    const stepData = {
      timestamp: new Date(),
      step,
      data,
      duration: 0,
    };

    log.steps.push(stepData);
  }

  /**
   * 完成分析
   * @param {string} analysisId - 分析ID
   * @param {Object} results - 分析结果
   * @param {Object} statistics - 统计信息
   */
  async completeAnalysis(analysisId, results, statistics = {}) {
    const log = this.analysisLogs.find((l) => l.id === analysisId);
    if (!log) return;

    log.status = "completed";
    log.results = results;
    log.statistics = { ...log.statistics, ...statistics };
    log.duration = Date.now() - log.timestamp.getTime();

    // 自动保存到IndexedDB
    await this.autoSave();
  }

  /**
   * 记录分析失败
   * @param {string} analysisId - 分析ID
   * @param {Error} error - 错误信息
   */
  async failAnalysis(analysisId, error) {
    const log = this.analysisLogs.find((l) => l.id === analysisId);
    if (!log) return;

    log.status = "failed";
    log.error = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
    };
    log.duration = Date.now() - log.timestamp.getTime();

    // 自动保存到IndexedDB
    await this.autoSave();
  }

  /**
   * 获取所有分析日志
   * @returns {Array} 分析日志列表
   */
  getAllLogs() {
    return [...this.analysisLogs];
  }

  /**
   * 获取指定分析日志
   * @param {string} analysisId - 分析ID
   * @returns {Object|null} 分析日志
   */
  getLog(analysisId) {
    return this.analysisLogs.find((l) => l.id === analysisId) || null;
  }

  /**
   * 清空所有日志
   */
  async clearLogs() {
    this.analysisLogs = [];

    // 同时清空IndexedDB中的数据
    try {
      await clearAllAnalysisLogsFromDB();
      console.log("✅ 已清空所有AI分析日志（内存和数据库）");
    } catch (error) {
      console.warn("❌ 清空数据库中的AI分析日志失败:", error);
    }
  }

  /**
   * 导出分析日志
   * @param {string} analysisId - 分析ID，如果为空则导出所有日志
   * @returns {string} JSON格式的日志数据
   */
  exportLogs(analysisId = null) {
    const logs = analysisId
      ? [this.getLog(analysisId)].filter(Boolean)
      : this.getAllLogs();

    return JSON.stringify(logs, null, 2);
  }

  /**
   * 导出分析日志为可读格式
   * @param {string} analysisId - 分析ID，如果为空则导出所有日志
   * @returns {string} 可读格式的日志数据
   */
  exportLogsAsText(analysisId = null) {
    const logs = analysisId
      ? [this.getLog(analysisId)].filter(Boolean)
      : this.getAllLogs();

    let text = "";

    logs.forEach((log, index) => {
      text += `\n${"=".repeat(80)}\n`;
      text += `分析记录 #${index + 1}\n`;
      text += `${"=".repeat(80)}\n`;
      text += `分析ID: ${log.id}\n`;
      text += `图片名称: ${log.imageName}\n`;
      text += `AI服务: ${log.aiService}\n`;
      text += `开始时间: ${log.timestamp.toLocaleString("zh-CN")}\n`;
      text += `状态: ${
        log.status === "completed"
          ? "完成"
          : log.status === "failed"
          ? "失败"
          : "处理中"
      }\n`;
      text += `耗时: ${(log.duration / 1000).toFixed(2)}秒\n`;

      if (log.statistics) {
        text += `\n统计信息:\n`;
        text += `- 总图片数: ${log.statistics.totalImages}\n`;
        text += `- 已处理图片: ${log.statistics.processedImages}\n`;
        text += `- 标签组数: ${log.statistics.tagGroups}\n`;
        text += `- 成功标签: ${log.statistics.successfulTags}\n`;
        text += `- 失败标签: ${log.statistics.failedTags}\n`;
        text += `- 提取特征数: ${log.statistics.featuresExtracted}\n`;
        text += `- 相似度比较: ${log.statistics.similarityComparisons}\n`;
        text += `- 生成推荐: ${log.statistics.recommendationsGenerated}\n`;
      }

      if (log.steps && log.steps.length > 0) {
        text += `\n分析步骤:\n`;
        log.steps.forEach((step, stepIndex) => {
          text += `${stepIndex + 1}. ${
            step.step
          } (${step.timestamp.toLocaleTimeString("zh-CN")})\n`;
          if (step.data && Object.keys(step.data).length > 0) {
            text += `   数据: ${JSON.stringify(step.data, null, 2)}\n`;
          }
        });
      }

      if (log.results) {
        text += `\n分析结果:\n`;
        if (Array.isArray(log.results)) {
          log.results.forEach((result, resultIndex) => {
            text += `${resultIndex + 1}. ${result.tag} - 置信度: ${(
              result.confidence * 100
            ).toFixed(1)}%\n`;
            text += `   原因: ${result.reason}\n`;
          });
        } else {
          text += JSON.stringify(log.results, null, 2) + "\n";
        }
      }

      if (log.error) {
        text += `\n错误信息:\n`;
        text += `消息: ${log.error.message}\n`;
        text += `时间: ${log.error.timestamp.toLocaleString("zh-CN")}\n`;
        if (log.error.stack) {
          text += `堆栈: ${log.error.stack}\n`;
        }
      }

      text += `\n`;
    });

    return text;
  }

  /**
   * 获取分析统计信息
   * @param {boolean} fromDatabase - 是否从数据库获取完整统计信息
   * @returns {Object} 统计信息
   */
  async getStatistics(fromDatabase = false) {
    if (fromDatabase && this.isInitialized) {
      try {
        return await getAnalysisLogsStatisticsFromDB();
      } catch (error) {
        console.warn("❌ 从数据库获取统计信息失败，使用内存数据:", error);
      }
    }

    // 使用内存数据
    const total = this.analysisLogs.length;
    const completed = this.analysisLogs.filter(
      (l) => l.status === "completed"
    ).length;
    const failed = this.analysisLogs.filter(
      (l) => l.status === "failed"
    ).length;
    const processing = this.analysisLogs.filter(
      (l) => l.status === "processing"
    ).length;

    const avgDuration =
      total > 0
        ? this.analysisLogs.reduce((sum, log) => sum + (log.duration || 0), 0) /
          total
        : 0;

    return {
      total,
      completed,
      failed,
      processing,
      avgDuration: avgDuration / 1000, // 转换为秒
      successRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
    };
  }

  /**
   * 手动保存所有日志到数据库
   */
  async saveAllLogs() {
    if (!this.isInitialized) {
      console.warn("❌ 分析日志记录器未初始化，无法保存");
      return;
    }

    try {
      console.log(
        `💾 开始手动保存 ${this.analysisLogs.length} 条AI分析日志到数据库`
      );
      await putAnalysisLogs(this.analysisLogs);
      console.log(
        `✅ 已手动保存 ${this.analysisLogs.length} 条AI分析日志到数据库`
      );
    } catch (error) {
      console.warn("❌ 手动保存AI分析日志失败:", error);
    }
  }

  /**
   * 测试保存功能 - 保存一条测试日志
   */
  async testSave() {
    console.log("🧪 开始测试保存功能...");

    const testLog = {
      id: `test_${Date.now()}`,
      timestamp: new Date(),
      imageName: "测试图片",
      imageId: null,
      aiService: "test-service",
      status: "completed",
      steps: [
        {
          timestamp: new Date(),
          step: "测试步骤",
          data: { test: true },
          duration: 0,
        },
      ],
      results: [
        {
          tag: "测试标签",
          confidence: 0.95,
          reason: "测试原因",
          source: "test",
        },
      ],
      error: null,
      duration: 1000,
      statistics: {
        totalImages: 1,
        processedImages: 1,
        tagGroups: 1,
        successfulTags: 1,
        failedTags: 0,
        featuresExtracted: 1,
        similarityComparisons: 0,
        recommendationsGenerated: 1,
      },
    };

    try {
      console.log("🧪 保存测试日志:", testLog);
      await putAnalysisLogs([testLog]);
      console.log("✅ 测试日志保存成功");

      // 立即读取验证
      const savedLogs = await getAllAnalysisLogs();
      const foundTestLog = savedLogs.find((log) => log.id === testLog.id);
      if (foundTestLog) {
        console.log("✅ 测试日志读取成功:", foundTestLog);
      } else {
        console.error("❌ 测试日志读取失败，未找到保存的日志");
      }
    } catch (error) {
      console.error("❌ 测试保存失败:", error);
    }
  }

  /**
   * 从数据库重新加载所有日志
   */
  async reloadFromDatabase() {
    try {
      const savedLogs = await getAllAnalysisLogs();
      this.analysisLogs = savedLogs.slice(0, this.maxLogs);
      console.log(
        `✅ 已从数据库重新加载 ${this.analysisLogs.length} 条AI分析日志`
      );
    } catch (error) {
      console.warn("❌ 从数据库重新加载AI分析日志失败:", error);
    }
  }

  /**
   * 设置自动保存开关
   * @param {boolean} enabled - 是否启用自动保存
   */
  setAutoSave(enabled) {
    this.autoSaveEnabled = enabled;
    console.log(`📝 AI分析日志自动保存已${enabled ? "启用" : "禁用"}`);
  }
}

// 创建全局实例
const analysisLogger = new AnalysisLogger();

// 自动初始化
analysisLogger.initialize().catch((error) => {
  console.warn("❌ AI分析日志管理器自动初始化失败:", error);
});

export default analysisLogger;
