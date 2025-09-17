# AI 自动标签功能使用说明

## 功能概述

AI 自动标签功能利用在线 API 服务分析图片内容，并基于现有标签库智能推荐相关标签，帮助用户快速为图片添加合适的标签。

## 支持的 AI 服务

### 国际 AI 服务

#### 1. OpenAI GPT-4 Vision

- **功能**: 使用 GPT-4 Vision 模型分析图片内容
- **优势**: 理解能力强，能生成自然语言描述
- **配置**: 需要 OpenAI API 密钥
- **获取方式**: [OpenAI Platform](https://platform.openai.com/api-keys)

#### 2. Google Vision API

- **功能**: 专业的图像识别服务
- **优势**: 识别准确度高，支持多种检测类型
- **配置**: 需要 Google Cloud API 密钥
- **获取方式**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

#### 3. Azure Computer Vision

- **功能**: 微软的图像分析服务
- **优势**: 企业级服务，稳定性好
- **配置**: 需要 Azure 订阅密钥和终结点
- **获取方式**: [Azure Portal](https://portal.azure.com/#create/Microsoft.CognitiveServicesComputerVision)

### 国产大模型 AI 服务

#### 4. 百度文心一言

- **功能**: 百度自研的多模态大模型
- **优势**: 中文理解能力强，支持图像分析
- **配置**: 需要 API Key 和 Secret Key
- **获取方式**: [百度智能云千帆平台](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application)
- **模型**: ERNIE-ViLG

#### 5. 阿里通义千问

- **功能**: 阿里巴巴的多模态大模型
- **优势**: 中文处理能力强，图像理解准确
- **配置**: 需要 API Key
- **获取方式**: [阿里云 DashScope](https://dashscope.console.aliyun.com/)
- **模型**: Qwen-VL-Plus

#### 6. 智谱 AI

- **功能**: 清华系 AI 公司的多模态模型
- **优势**: 学术背景强，中文理解优秀
- **配置**: 需要 API Key
- **获取方式**: [智谱 AI 开放平台](https://open.bigmodel.cn/usercenter/apikeys)
- **模型**: GLM-4V-Plus

#### 7. 月之暗面 Kimi

- **功能**: 月之暗面公司的多模态大模型
- **优势**: 长文本处理能力强，图像分析准确
- **配置**: 需要 API Key
- **获取方式**: [Kimi 开放平台](https://platform.moonshot.cn/console/api-keys)
- **模型**: Moonshot-VL-8K

#### 8. 字节豆包

- **功能**: 字节跳动的多模态大模型
- **优势**: 商业化程度高，响应速度快
- **配置**: 需要 API Key
- **获取方式**: [火山引擎 ARK 平台](https://console.volcengine.com/ark/keymanage)
- **模型**: Doubao-Vision

#### 9. 硅基流动

- **功能**: 硅基流动的多模态大模型
- **优势**: 技术先进，中文理解能力强，支持多种开源模型
- **配置**: 需要 API Key
- **获取方式**: [硅基流动平台](https://siliconflow.cn/)
- **模型**: DeepSeek-VL-7B

## 使用方法

### 1. 配置 AI 服务

1. 在图片详情页点击"配置"按钮
2. 选择要使用的 AI 服务（可同时配置多个）
3. 输入相应的 API 密钥和配置信息
4. 点击"保存配置"

### 2. 使用 AI 分析

1. 打开任意图片的详情页
2. 在标签区域点击"AI 分析"按钮
3. 等待 AI 分析完成（通常需要几秒钟）
4. 查看推荐的标签列表
5. 选择需要的标签（点击标签进行选择）
6. 点击"添加选中标签"按钮

### 3. 标签推荐逻辑

- **智能过滤**: 自动过滤掉已存在的标签
- **相似度计算**: 基于现有标签库计算推荐标签的相似度
- **置信度评分**: 显示每个推荐标签的置信度
- **多源融合**: 结合多个 AI 服务的结果，提高准确性

## 技术实现

### 核心组件

1. **AIImageAnalysisService.js**: AI 图片分析服务

   - 支持多种 AI API
   - 图片预处理和格式转换
   - 标签相似度计算
   - 结果过滤和排序

2. **AIConfigDialog.vue**: AI 服务配置界面

   - 多服务配置管理
   - API 密钥安全存储
   - 服务状态监控

3. **ImageDetail.vue**: 图片详情页集成
   - AI 分析按钮和界面
   - 推荐标签展示
   - 标签选择和管理

### 数据流程

```
图片 → AI服务分析 → 标签推荐 → 相似度计算 → 用户选择 → 标签添加
```

### 安全考虑

- API 密钥存储在本地 localStorage 中
- 图片数据不会上传到第三方服务（除了 AI 分析 API）
- 支持 HTTPS 加密传输

## 配置示例

### 国际 AI 服务配置

#### OpenAI 配置

```javascript
{
  apiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  model: "gpt-4-vision-preview"
}
```

#### Google Vision 配置

```javascript
{
  apiKey: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
}
```

#### Azure Vision 配置

```javascript
{
  endpoint: "https://your-resource.cognitiveservices.azure.com/",
  subscriptionKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  region: "eastus"
}
```

### 国产大模型配置

#### 百度文心一言配置

```javascript
{
  apiKey: "your_baidu_api_key",
  secretKey: "your_baidu_secret_key"
}
```

#### 阿里通义千问配置

```javascript
{
  apiKey: "sk-your_alibaba_api_key";
}
```

#### 智谱 AI 配置

```javascript
{
  apiKey: "your_zhipu_api_key";
}
```

#### 月之暗面 Kimi 配置

```javascript
{
  apiKey: "sk-your_kimi_api_key";
}
```

#### 字节豆包配置

```javascript
{
  apiKey: "your_doubao_api_key";
}
```

#### 硅基流动配置

```javascript
{
  apiKey: "your_silicoflow_api_key";
}
```

## 注意事项

1. **API 费用**: 使用 AI 服务会产生 API 调用费用，请注意控制使用量

   - 国产大模型通常价格更优惠，适合国内用户使用
   - 建议优先使用国产大模型以获得更好的中文理解能力

2. **网络要求**: 需要稳定的网络连接访问 AI 服务

   - 国产大模型在国内访问速度更快，稳定性更好
   - 国际 AI 服务可能需要科学上网

3. **图片格式**: 支持常见图片格式（JPEG、PNG、WebP 等）
4. **图片大小**: 建议图片大小不超过 10MB，过大的图片可能影响分析速度
5. **隐私保护**: 图片会发送到 AI 服务进行分析，请注意隐私保护
6. **中文支持**: 国产大模型对中文标签的理解和处理能力更强
7. **服务可用性**: 不同 AI 服务的可用性和响应时间可能不同，建议配置多个服务作为备选

## 故障排除

### 常见问题

1. **"请先配置 AI 服务 API 密钥"**

   - 检查是否已正确配置 API 密钥
   - 确认 API 密钥是否有效

2. **"AI 分析失败，请检查 API 配置"**

   - 检查网络连接
   - 验证 API 密钥是否正确
   - 确认 API 服务是否正常

3. **"AI 分析未找到合适的标签"**
   - 图片内容可能不够清晰
   - 现有标签库可能过于有限
   - 尝试使用不同的 AI 服务

### 调试信息

在浏览器开发者工具的控制台中可以看到详细的调试信息，包括：

- API 调用状态
- 分析结果详情
- 错误信息

## 未来扩展

1. **更多 AI 服务**: 支持更多国产和国际 AI 服务
   - 腾讯混元、华为盘古、商汤日日新等国产大模型
   - Claude、Gemini 等国际大模型
2. **批量分析**: 支持批量图片的 AI 标签分析
3. **自定义模型**: 支持用户训练的自定义标签模型
4. **标签学习**: 基于用户选择行为优化推荐算法
5. **离线模式**: 支持本地 AI 模型进行离线分析
6. **智能路由**: 根据图片类型自动选择最适合的 AI 服务
7. **成本优化**: 根据 API 价格和效果自动选择性价比最高的服务
8. **多语言支持**: 支持英文、日文等多语言标签分析

## 技术支持

如有问题或建议，请通过以下方式联系：

- 提交 Issue 到项目仓库
- 发送邮件到技术支持邮箱
- 查看项目文档和 FAQ
