/**
 * 全局日志管理器
 * 用于捕获和存储所有AI分析相关的日志
 */

class LogManager {
  constructor() {
    this.logs = [];
    this.listeners = new Set();
    this.isCapturing = false;
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };
  }

  // 开始捕获日志
  startCapturing() {
    if (this.isCapturing) return;

    this.isCapturing = true;

    // 重写console方法
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.addLog("log", args.join(" "));
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.addLog("warn", args.join(" "));
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.addLog("error", args.join(" "));
    };

    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.addLog("info", args.join(" "));
    };
  }

  // 停止捕获日志
  stopCapturing() {
    if (!this.isCapturing) return;

    this.isCapturing = false;

    // 恢复原始console方法
    Object.assign(console, this.originalConsole);
  }

  // 添加日志
  addLog(level, message, data = null) {
    const log = {
      timestamp: new Date(),
      level: this.mapLogLevel(level),
      message: String(message),
      data: data,
    };

    this.logs.unshift(log); // 新日志添加到顶部

    // 限制日志数量，避免内存溢出
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }

    // 通知所有监听器
    this.notifyListeners(log);
  }

  // 映射日志级别
  mapLogLevel(level) {
    const levelMap = {
      log: "info",
      warn: "warn",
      error: "error",
      info: "info",
    };
    return levelMap[level] || level;
  }

  // 获取所有日志
  getLogs() {
    return [...this.logs];
  }

  // 获取过滤后的日志
  getFilteredLogs(filters = {}) {
    let filtered = [...this.logs];

    // 按级别过滤
    if (filters.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    // 按关键词过滤
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter((log) =>
        log.message.toLowerCase().includes(keyword)
      );
    }

    // 按时间范围过滤
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [startTime, endTime] = filters.dateRange;
      filtered = filtered.filter((log) => {
        const logTime = new Date(log.timestamp);
        return logTime >= new Date(startTime) && logTime <= new Date(endTime);
      });
    }

    return filtered;
  }

  // 清空日志
  clearLogs() {
    this.logs = [];
    this.notifyListeners(null, "clear");
  }

  // 获取日志统计
  getLogStats() {
    return {
      totalLogs: this.logs.length,
      errorLogs: this.logs.filter((log) => log.level === "error").length,
      warningLogs: this.logs.filter((log) => log.level === "warn").length,
      infoLogs: this.logs.filter((log) => log.level === "info").length,
    };
  }

  // 添加监听器
  addListener(callback) {
    this.listeners.add(callback);
  }

  // 移除监听器
  removeListener(callback) {
    this.listeners.delete(callback);
  }

  // 通知所有监听器
  notifyListeners(log, action = "add") {
    this.listeners.forEach((callback) => {
      try {
        callback(log, action);
      } catch (error) {
        console.error("日志监听器错误:", error);
      }
    });
  }

  // 导出日志
  exportLogs(filters = {}) {
    const filteredLogs = this.getFilteredLogs(filters);

    const logText = filteredLogs
      .map((log) => {
        const time = this.formatTime(log.timestamp);
        const data = log.data
          ? `\n数据: ${JSON.stringify(log.data, null, 2)}`
          : "";
        return `[${time}] ${log.level.toUpperCase()}: ${log.message}${data}`;
      })
      .join("\n\n");

    return logText;
  }

  // 格式化时间
  formatTime(timestamp) {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

// 创建全局实例
const logManager = new LogManager();

// 自动开始捕获日志
logManager.startCapturing();

// 添加一些测试日志（开发环境）
if (import.meta.env.DEV) {
  console.log("🚀 AI日志管理器已启动");
  console.log("📊 开始捕获AI分析日志");
}

export default logManager;
