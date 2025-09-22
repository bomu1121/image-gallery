<template>
  <div class="ai-settings">
    <div class="section-header">
      <h4>AI 服务配置</h4>
      <p>选择一个 AI 服务提供商并配置相关参数</p>
    </div>

    <el-alert
      title="使用说明"
      type="info"
      :closable="false"
      show-icon
      class="usage-alert"
    >
      <p>1. 选择一个 AI 服务提供商</p>
      <p>2. 配置相应的 API 密钥和参数</p>
      <p>3. 测试连接确保服务正常</p>
      <p>4. 保存配置后即可在图片详情页使用 AI 分析功能</p>
    </el-alert>

    <!-- 模型提供方选择 -->
    <div class="provider-selection">
      <h4>模型提供方</h4>
      <el-select
        v-model="selectedProvider"
        placeholder="请选择AI服务提供商"
        class="provider-selector"
        @change="onProviderChange"
      >
        <el-option
          v-for="provider in providers"
          :key="provider.key"
          :label="provider.name"
          :value="provider.key"
        >
          <div class="provider-option">
            <span class="provider-name">{{ provider.name }}</span>
            <span class="provider-desc">{{ provider.description }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- 动态配置区域 -->
    <div v-if="selectedProvider" class="config-section">
      <h4>{{ getCurrentProvider().name }} 配置</h4>

      <!-- OpenAI配置 -->
      <div v-if="selectedProvider === 'openai'" class="provider-config">
        <el-form :model="openaiConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="openaiConfig.apiKey"
              type="password"
              placeholder="请输入OpenAI API密钥"
              show-password
            />
          </el-form-item>
          <el-form-item label="模型">
            <el-select v-model="openaiConfig.model" placeholder="选择模型">
              <el-option label="GPT-4 Vision" value="gpt-4-vision-preview" />
              <el-option label="GPT-4 Turbo" value="gpt-4-turbo" />
            </el-select>
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://platform.openai.com/api-keys"
              target="_blank"
              type="primary"
            >
              获取OpenAI API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- Google Vision配置 -->
      <div v-if="selectedProvider === 'google'" class="provider-config">
        <el-form :model="googleConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="googleConfig.apiKey"
              type="password"
              placeholder="请输入Google Vision API密钥"
              show-password
            />
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              type="primary"
            >
              获取Google Vision API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- Azure Vision配置 -->
      <div v-if="selectedProvider === 'azure'" class="provider-config">
        <el-form :model="azureConfig" label-width="120px">
          <el-form-item label="终结点">
            <el-input
              v-model="azureConfig.endpoint"
              placeholder="https://your-resource.cognitiveservices.azure.com/"
            />
          </el-form-item>
          <el-form-item label="订阅密钥">
            <el-input
              v-model="azureConfig.subscriptionKey"
              type="password"
              placeholder="请输入Azure订阅密钥"
              show-password
            />
          </el-form-item>
          <el-form-item label="区域">
            <el-input v-model="azureConfig.region" placeholder="eastus" />
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://portal.azure.com/#create/Microsoft.CognitiveServicesComputerVision"
              target="_blank"
              type="primary"
            >
              创建Azure资源
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- 百度文心一言配置 -->
      <div v-if="selectedProvider === 'baidu'" class="provider-config">
        <el-form :model="baiduConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="baiduConfig.apiKey"
              type="password"
              placeholder="请输入百度API Key"
              show-password
            />
          </el-form-item>
          <el-form-item label="Secret Key">
            <el-input
              v-model="baiduConfig.secretKey"
              type="password"
              placeholder="请输入百度Secret Key"
              show-password
            />
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application"
              target="_blank"
              type="primary"
            >
              获取百度API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- 阿里通义千问配置 -->
      <div v-if="selectedProvider === 'alibaba'" class="provider-config">
        <el-form :model="alibabaConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="alibabaConfig.apiKey"
              type="password"
              placeholder="请输入通义千问API Key"
              show-password
            />
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://dashscope.console.aliyun.com/"
              target="_blank"
              type="primary"
            >
              获取通义千问API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- 智谱AI配置 -->
      <div v-if="selectedProvider === 'zhipu'" class="provider-config">
        <el-form :model="zhipuConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="zhipuConfig.apiKey"
              type="password"
              placeholder="请输入智谱AI API Key"
              show-password
            />
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://open.bigmodel.cn/usercenter/apikeys"
              target="_blank"
              type="primary"
            >
              获取智谱AI API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- 月之暗面Kimi配置 -->
      <div v-if="selectedProvider === 'kimi'" class="provider-config">
        <el-form :model="kimiConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="kimiConfig.apiKey"
              type="password"
              placeholder="请输入Kimi API Key"
              show-password
            />
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://platform.moonshot.cn/console/api-keys"
              target="_blank"
              type="primary"
            >
              获取Kimi API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- 字节豆包配置 -->
      <div v-if="selectedProvider === 'doubao'" class="provider-config">
        <el-form :model="doubaoConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="doubaoConfig.apiKey"
              type="password"
              placeholder="请输入豆包 API Key"
              show-password
            />
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://console.volcengine.com/ark/keymanage"
              target="_blank"
              type="primary"
            >
              获取豆包API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- 硅基流动配置 -->
      <div v-if="selectedProvider === 'silicoflow'" class="provider-config">
        <el-form :model="silicoflowConfig" label-width="120px">
          <el-form-item label="API Key">
            <el-input
              v-model="silicoflowConfig.apiKey"
              type="password"
              placeholder="请输入硅基流动 API Key"
              show-password
            />
          </el-form-item>
          <el-form-item label="模型">
            <el-select
              v-model="silicoflowConfig.model"
              :placeholder="
                silicoflowConfig.apiKey ? '选择模型' : '请先输入API Key'
              "
              :loading="loadingModels"
              :disabled="!silicoflowConfig.apiKey"
              @focus="() => loadSilicoflowModels()"
            >
              <el-option
                v-for="model in silicoflowModels"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              >
                <div class="model-option">
                  <span class="model-name">{{ model.name }}</span>
                  <span class="model-desc">{{ model.description }}</span>
                </div>
              </el-option>
            </el-select>
            <div v-if="loadingModels" class="loading-tip">
              <el-icon class="is-loading"><Loading /></el-icon>
              正在加载模型列表...
            </div>
          </el-form-item>
          <div class="config-tip">
            <el-link
              href="https://siliconflow.cn/"
              target="_blank"
              type="primary"
            >
              获取硅基流动API密钥
            </el-link>
          </div>
        </el-form>
      </div>

      <!-- 测试连接按钮 -->
      <div class="test-section">
        <el-button
          :loading="testingCurrent"
          :disabled="!isCurrentProviderConfigured"
          @click="testCurrentProvider"
          class="btn-outline test-button"
        >
          <el-icon v-if="!testingCurrent"><Setting /></el-icon>
          测试连接
        </el-button>

        <!-- 测试结果 -->
        <div v-if="currentTestResult" class="test-result">
          <div
            :class="[
              'result-item',
              currentTestResult.success ? 'success' : 'error',
            ]"
          >
            <div class="result-header">
              <el-icon>
                <component
                  :is="currentTestResult.success ? 'Check' : 'Close'"
                />
              </el-icon>
              <span class="result-message">{{
                currentTestResult.message
              }}</span>
              <span class="response-time"
                >{{ currentTestResult.responseTime }}ms</span
              >
            </div>
            <div v-if="currentTestResult.error" class="result-error">
              {{ currentTestResult.error }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button
        class="btn-outline"
        @click="saveConfig"
        :disabled="!selectedProvider"
      >
        保存配置
      </el-button>
      <el-button class="btn-outline-gray" @click="resetConfig"
        >重置配置</el-button
      >
      <el-button @click="showProcessingStats" type="info">
        查看处理统计
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from "vue";
import {
  ElAlert,
  ElSelect,
  ElOption,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElIcon,
  ElLink,
} from "element-plus";
import { Check, Close, Setting, Loading } from "@element-plus/icons-vue";
import { aiImageAnalysisService } from "@/services/AIImageAnalysisService.js";
import { useDrawerNotification } from "@/composables/useDrawerNotification.js";

const { success, error, warning } = useDrawerNotification();

// 选中的提供方
const selectedProvider = ref("");

// 提供方列表
const providers = [
  {
    key: "openai",
    name: "OpenAI",
    description: "GPT-4 Vision, 图像分析能力强",
  },
  {
    key: "google",
    name: "Google Vision",
    description: "Google Cloud Vision API",
  },
  {
    key: "azure",
    name: "Azure Computer Vision",
    description: "Microsoft Azure 视觉服务",
  },
  { key: "baidu", name: "百度文心一言", description: "国产大模型，中文理解强" },
  { key: "alibaba", name: "阿里通义千问", description: "阿里云多模态大模型" },
  { key: "zhipu", name: "智谱AI", description: "清华系大模型" },
  { key: "kimi", name: "月之暗面Kimi", description: "长文本处理能力强" },
  { key: "doubao", name: "字节豆包", description: "字节跳动大模型" },
  { key: "silicoflow", name: "硅基流动", description: "开源模型聚合平台" },
];

// 配置数据
const openaiConfig = reactive({
  apiKey: "",
  model: "gpt-4-vision-preview",
});

const googleConfig = reactive({
  apiKey: "",
});

const azureConfig = reactive({
  endpoint: "",
  subscriptionKey: "",
  region: "eastus",
});

const baiduConfig = reactive({
  apiKey: "",
  secretKey: "",
});

const alibabaConfig = reactive({
  apiKey: "",
});

const zhipuConfig = reactive({
  apiKey: "",
});

const kimiConfig = reactive({
  apiKey: "",
});

const doubaoConfig = reactive({
  apiKey: "",
});

const silicoflowConfig = reactive({
  apiKey: "",
  model: "", // 初始为空，等API Key输入后再设置默认值
});

// 硅基流动模型列表
const silicoflowModels = ref([]);
const loadingModels = ref(false);
const modelsLoaded = ref(false); // 标记是否已加载过模型列表

// 测试相关状态
const testingCurrent = ref(false);
const currentTestResult = ref(null);

// 计算当前提供方是否已配置
const isCurrentProviderConfigured = computed(() => {
  if (!selectedProvider.value) return false;

  switch (selectedProvider.value) {
    case "openai":
      return !!openaiConfig.apiKey;
    case "google":
      return !!googleConfig.apiKey;
    case "azure":
      return !!(azureConfig.subscriptionKey && azureConfig.endpoint);
    case "baidu":
      return !!(baiduConfig.apiKey && baiduConfig.secretKey);
    case "alibaba":
      return !!alibabaConfig.apiKey;
    case "zhipu":
      return !!zhipuConfig.apiKey;
    case "kimi":
      return !!kimiConfig.apiKey;
    case "doubao":
      return !!doubaoConfig.apiKey;
    case "silicoflow":
      return !!silicoflowConfig.apiKey;
    default:
      return false;
  }
});

// 获取当前提供方信息
function getCurrentProvider() {
  return providers.find((p) => p.key === selectedProvider.value) || {};
}

// 提供方变更处理
function onProviderChange() {
  currentTestResult.value = null;

  // 如果切换到硅基流动，加载模型列表
  if (selectedProvider.value === "silicoflow" && silicoflowConfig.apiKey) {
    loadSilicoflowModels();
  }
}

// 加载硅基流动模型列表
async function loadSilicoflowModels(forceReload = false) {
  if (!silicoflowConfig.apiKey) {
    silicoflowModels.value = [];
    modelsLoaded.value = false;
    return;
  }

  // 如果已经加载过且不是强制重新加载，直接返回
  if (modelsLoaded.value && !forceReload) {
    return;
  }

  loadingModels.value = true;
  try {
    // 先更新AI分析服务的配置
    aiImageAnalysisService.updateApiConfig("silicoflow", silicoflowConfig);

    const models = await aiImageAnalysisService.getSilicoflowModels();
    silicoflowModels.value = models;
    modelsLoaded.value = true;

    // 如果当前没有选择模型，选择第一个模型作为默认值
    if (models.length > 0 && !silicoflowConfig.model) {
      silicoflowConfig.model = models[0].id;
    }
    // 如果当前选择的模型不在列表中，也选择第一个模型
    else if (
      models.length > 0 &&
      !models.find((m) => m.id === silicoflowConfig.model)
    ) {
      silicoflowConfig.model = models[0].id;
    }
  } catch (error) {
    console.error("加载硅基流动模型列表失败:", error);
    warning("加载模型列表失败: " + error.message);
    // 使用默认模型列表
    silicoflowModels.value = [
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

    // 在错误情况下也设置默认模型
    if (!silicoflowConfig.model && silicoflowModels.value.length > 0) {
      silicoflowConfig.model = silicoflowModels.value[0].id;
    }
  } finally {
    loadingModels.value = false;
  }
}

// 测试当前提供方
async function testCurrentProvider() {
  if (!selectedProvider.value || !isCurrentProviderConfigured.value) {
    warning("请先配置API密钥");
    return;
  }

  testingCurrent.value = true;
  currentTestResult.value = null;

  try {
    // 先更新AI分析服务的配置
    updateAIServiceConfig();

    const result = await aiImageAnalysisService.testApiConnection(
      selectedProvider.value
    );
    currentTestResult.value = result;

    if (result.success) {
      success(`${getCurrentProvider().name} 连接测试成功`);
    } else {
      error(`${getCurrentProvider().name} 连接测试失败: ${result.message}`);
    }
  } catch (err) {
    error(`测试 ${getCurrentProvider().name} 时发生错误: ${err.message}`);
  } finally {
    testingCurrent.value = false;
  }
}

// 更新AI分析服务的配置
function updateAIServiceConfig() {
  const config = {
    openai: openaiConfig,
    googleVision: googleConfig,
    azureVision: azureConfig,
    baiduErnie: baiduConfig,
    alibabaQwen: alibabaConfig,
    zhipuAI: zhipuConfig,
    kimi: kimiConfig,
    doubao: doubaoConfig,
    silicoflow: silicoflowConfig,
  };

  aiImageAnalysisService.updateApiConfig(
    selectedProvider.value,
    config[selectedProvider.value]
  );
}

// 加载保存的配置
function loadConfig() {
  try {
    const savedConfig = localStorage.getItem("ai-service-config");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);

      // 加载各服务配置
      if (config.openai) {
        Object.assign(openaiConfig, config.openai);
      }
      if (config.googleVision) {
        Object.assign(googleConfig, config.googleVision);
      }
      if (config.azureVision) {
        Object.assign(azureConfig, config.azureVision);
      }
      if (config.baiduErnie) {
        Object.assign(baiduConfig, config.baiduErnie);
      }
      if (config.alibabaQwen) {
        Object.assign(alibabaConfig, config.alibabaQwen);
      }
      if (config.zhipuAI) {
        Object.assign(zhipuConfig, config.zhipuAI);
      }
      if (config.kimi) {
        Object.assign(kimiConfig, config.kimi);
      }
      if (config.doubao) {
        Object.assign(doubaoConfig, config.doubao);
      }
      if (config.silicoflow) {
        Object.assign(silicoflowConfig, config.silicoflow);
      }

      // 加载选中的提供方
      if (config.selectedProvider) {
        selectedProvider.value = config.selectedProvider;

        // 如果选中的是硅基流动且有API密钥，加载模型列表
        if (
          config.selectedProvider === "silicoflow" &&
          silicoflowConfig.apiKey
        ) {
          loadSilicoflowModels();
        }
      }
    }
  } catch (err) {
    console.warn("加载AI配置失败:", err);
  }
}

// 保存配置
function saveConfig() {
  if (!selectedProvider.value) {
    warning("请先选择一个AI服务提供商");
    return;
  }

  try {
    const config = {
      selectedProvider: selectedProvider.value,
      openai: { ...openaiConfig },
      googleVision: { ...googleConfig },
      azureVision: { ...azureConfig },
      baiduErnie: { ...baiduConfig },
      alibabaQwen: { ...alibabaConfig },
      zhipuAI: { ...zhipuConfig },
      kimi: { ...kimiConfig },
      doubao: { ...doubaoConfig },
      silicoflow: { ...silicoflowConfig },
    };

    localStorage.setItem("ai-service-config", JSON.stringify(config));

    // 更新服务配置
    aiImageAnalysisService.updateApiConfig("openai", openaiConfig);
    aiImageAnalysisService.updateApiConfig("googleVision", googleConfig);
    aiImageAnalysisService.updateApiConfig("azureVision", azureConfig);
    aiImageAnalysisService.updateApiConfig("baiduErnie", baiduConfig);
    aiImageAnalysisService.updateApiConfig("alibabaQwen", alibabaConfig);
    aiImageAnalysisService.updateApiConfig("zhipuAI", zhipuConfig);
    aiImageAnalysisService.updateApiConfig("kimi", kimiConfig);
    aiImageAnalysisService.updateApiConfig("doubao", doubaoConfig);
    aiImageAnalysisService.updateApiConfig("silicoflow", silicoflowConfig);

    success("AI服务配置已保存");
  } catch (err) {
    error("保存配置失败: " + err.message);
  }
}

// 重置配置
function resetConfig() {
  selectedProvider.value = "";
  currentTestResult.value = null;
  modelsLoaded.value = false;

  Object.assign(openaiConfig, { apiKey: "", model: "gpt-4-vision-preview" });
  Object.assign(googleConfig, { apiKey: "" });
  Object.assign(azureConfig, {
    endpoint: "",
    subscriptionKey: "",
    region: "eastus",
  });
  Object.assign(baiduConfig, { apiKey: "", secretKey: "" });
  Object.assign(alibabaConfig, { apiKey: "" });
  Object.assign(zhipuConfig, { apiKey: "" });
  Object.assign(kimiConfig, { apiKey: "" });
  Object.assign(doubaoConfig, { apiKey: "" });
  Object.assign(silicoflowConfig, {
    apiKey: "",
    model: "", // 重置时也清空模型选择
  });

  // 清除本地存储
  localStorage.removeItem("ai-service-config");

  success("配置已重置");
}

// 显示处理统计
function showProcessingStats() {
  const stats = aiImageAnalysisService.getProcessingStats();
  const dbInfo = aiImageAnalysisService.getTagFeatureDatabaseInfo();

  const message = `
📊 AI图片处理统计报告

🚀 处理概览:
• 总图片数: ${stats.totalImages}
• 已处理图片: ${stats.processedImages}
• 失败图片: ${stats.failedImages}
• 处理时长: ${
    stats.duration ? (stats.duration / 1000).toFixed(2) + "秒" : "未开始"
  }

🏷️ 标签特征库:
• 标签组数: ${dbInfo.totalTags}
• 总图片数: ${dbInfo.totalImages}
• 总特征数: ${dbInfo.totalFeatures}

📈 成功率:
• 图片处理成功率: ${
    stats.totalImages > 0
      ? ((stats.processedImages / stats.totalImages) * 100).toFixed(1)
      : 0
  }%
• 标签构建成功率: ${
    stats.tagGroups > 0
      ? ((stats.successfulTags / stats.tagGroups) * 100).toFixed(1)
      : 0
  }%

${
  stats.details && stats.details.length > 0
    ? `
❌ 失败详情:
${stats.details
  .map((d) => `• ${d.tag}: ${d.error} (${d.imageCount}张图片)`)
  .join("\n")}
`
    : ""
}

💡 提示: 打开浏览器控制台可查看详细的处理日志
  `;

  ElMessageBox.alert(message, "处理统计报告", {
    confirmButtonText: "确定",
    type: "info",
    dangerouslyUseHTMLString: false,
  });
}

// 监听硅基流动API Key变化
watch(
  () => silicoflowConfig.apiKey,
  (newApiKey, oldApiKey) => {
    // 如果API Key从空变为有值，且当前选中的是硅基流动，则加载模型列表
    if (newApiKey && !oldApiKey && selectedProvider.value === "silicoflow") {
      loadSilicoflowModels();
    }
    // 如果API Key被清空，清空模型列表
    else if (!newApiKey && oldApiKey) {
      silicoflowModels.value = [];
      modelsLoaded.value = false;
    }
    // 如果API Key发生变化，重新加载模型列表
    else if (newApiKey && oldApiKey && newApiKey !== oldApiKey) {
      modelsLoaded.value = false;
      loadSilicoflowModels(true);
    }
  }
);

// 初始化
onMounted(() => {
  loadConfig();
});
</script>

<style scoped>
.ai-settings {
  max-width: 100%;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.section-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.usage-alert {
  margin-bottom: 24px;
}

.usage-alert p {
  margin: 4px 0;
  font-size: 13px;
}

/* 提供方选择区域 */
.provider-selection {
  margin-bottom: 24px;
}

.provider-selection h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.provider-selector {
  width: 100%;
}

.provider-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.provider-name {
  font-weight: 500;
  color: #333;
}

.provider-desc {
  font-size: 12px;
  color: #666;
}

/* 配置区域 */
.config-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.config-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.provider-config {
  margin-bottom: 20px;
}

.config-tip {
  margin-top: 12px;
  font-size: 13px;
}

/* 测试区域 */
.test-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.test-button {
  margin-bottom: 16px;
}

.test-result {
  margin-top: 12px;
}

.result-item {
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background: white;
}

.result-item.success {
  border-color: #67c23a;
  background: #f0f9ff;
}

.result-item.error {
  border-color: #f56c6c;
  background: #fef0f0;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.result-message {
  font-weight: 500;
  color: #333;
}

.response-time {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.result-error {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
  font-family: monospace;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  margin-top: 24px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-button) {
  border-radius: 4px;
}

/* 模型选项样式 */
.model-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-name {
  font-weight: 500;
  color: #333;
}

.model-desc {
  font-size: 12px;
  color: #666;
}

.loading-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
