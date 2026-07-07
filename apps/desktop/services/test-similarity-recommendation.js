/**
 * 测试基于相似图集的标签推荐功能
 * 这个文件用于演示和测试新的推荐流程
 */

import { aiImageAnalysisService } from "./AIImageAnalysisService.js";

class SimilarityRecommendationTester {
  constructor() {
    this.service = aiImageAnalysisService;
  }

  /**
   * 测试新的推荐流程
   */
  async testSimilarityBasedRecommendation() {
    console.log("🧪 ========== 开始测试基于相似图集的标签推荐 ==========");

    try {
      // 1. 检查服务状态
      console.log("📊 服务状态检查:");
      console.log(
        `  - 当前推荐方法: ${this.service.getRecommendationMethod()}`
      );
      console.log(
        `  - 支持的推荐方法: ${this.service.getSupportedMethods().join(", ")}`
      );
      console.log(
        `  - 当前AI服务: ${this.service.getCurrentConfiguredService()}`
      );

      // 2. 模拟图片数据（这里需要实际的图片Blob）
      console.log("\n🖼️ 准备测试图片...");
      // 注意：在实际使用中，这里应该是真实的图片Blob数据
      const testImageBlob = await this.createTestImageBlob();

      if (!testImageBlob) {
        console.log("❌ 无法创建测试图片，跳过测试");
        return;
      }

      // 3. 测试基于相似图集的推荐
      console.log("\n🎯 测试基于相似图集的推荐...");
      const recommendations =
        await this.service.analyzeImageWithSimilarityBasedRecommendation(
          testImageBlob,
          "test-image.jpg"
        );

      console.log("\n📊 推荐结果:");
      if (recommendations.length > 0) {
        recommendations.forEach((rec, index) => {
          console.log(`  ${index + 1}. ${rec.tag}`);
          console.log(`     置信度: ${(rec.confidence * 100).toFixed(1)}%`);
          console.log(`     出现次数: ${rec.tagCount}`);
          console.log(`     推荐理由: ${rec.reason}`);
          console.log(`     来源: ${rec.source}`);
          if (rec.similarImages && rec.similarImages.length > 0) {
            console.log(
              `     相似图片: ${rec.similarImages
                .map((img) => img.name || img.id)
                .join(", ")}`
            );
          }
          console.log("");
        });
      } else {
        console.log("  ❌ 没有找到推荐标签");
      }

      // 4. 测试不同推荐方法的切换
      console.log("\n🔄 测试推荐方法切换...");
      const methods = this.service.getSupportedMethods();

      for (const method of methods) {
        console.log(`\n测试方法: ${method}`);
        this.service.setRecommendationMethod(method);

        const methodRecommendations = await this.service.analyzeImage(
          testImageBlob,
          "test-image.jpg",
          null,
          method
        );

        console.log(`  结果数量: ${methodRecommendations.length}`);
        if (methodRecommendations.length > 0) {
          console.log(
            `  前3个推荐: ${methodRecommendations
              .slice(0, 3)
              .map((r) => r.tag)
              .join(", ")}`
          );
        }
      }

      console.log("\n✅ 测试完成！");
    } catch (error) {
      console.error("❌ 测试失败:", error);
    }
  }

  /**
   * 创建测试图片Blob（模拟）
   * 在实际使用中，这里应该是真实的图片数据
   */
  async createTestImageBlob() {
    try {
      // 创建一个简单的测试图片（1x1像素的PNG）
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(0, 0, 1, 1);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      });
    } catch (error) {
      console.warn("⚠️ 无法创建测试图片:", error);
      return null;
    }
  }

  /**
   * 测试相似图片搜索功能
   */
  async testSimilarImageSearch() {
    console.log("\n🔍 ========== 测试相似图片搜索功能 ==========");

    try {
      // 创建测试特征向量
      const testFeatures = ["红色", "圆形", "简单", "测试"];

      console.log("📊 测试特征向量:", testFeatures);

      // 测试相似图片搜索
      const similarImages = await this.service.findSimilarImages(
        testFeatures,
        this.service.getCurrentConfiguredService()
      );

      console.log(`\n📈 搜索结果: 找到 ${similarImages.length} 张相似图片`);

      if (similarImages.length > 0) {
        similarImages.slice(0, 5).forEach((img, index) => {
          console.log(`  ${index + 1}. ${img.name || img.id}`);
          console.log(`     相似度: ${(img.similarity * 100).toFixed(1)}%`);
          console.log(`     标签: ${img.tags ? img.tags.join(", ") : "无"}`);
        });
      }
    } catch (error) {
      console.error("❌ 相似图片搜索测试失败:", error);
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log("🚀 ========== 开始运行所有测试 ==========");

    await this.testSimilarityBasedRecommendation();
    await this.testSimilarImageSearch();

    console.log("\n🎉 ========== 所有测试完成 ==========");
  }
}

// 导出测试类
export default SimilarityRecommendationTester;

// 如果直接运行此文件，执行测试
if (typeof window !== "undefined") {
  // 浏览器环境
  window.SimilarityRecommendationTester = SimilarityRecommendationTester;

  // 添加测试按钮到页面（仅用于演示）
  const testButton = document.createElement("button");
  testButton.textContent = "测试相似图集推荐";
  testButton.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;

  testButton.addEventListener("click", async () => {
    const tester = new SimilarityRecommendationTester();
    await tester.runAllTests();
  });

  document.body.appendChild(testButton);
}
