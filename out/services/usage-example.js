"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolchainDetectionUsageExample = void 0;
exports.runToolchainDetectionExamples = runToolchainDetectionExamples;
const toolchainDetectionService_1 = require("./toolchainDetectionService");
/**
 * 使用统一检测服务的示例类
 * 展示各种使用场景和最佳实践
 */
class ToolchainDetectionUsageExample {
    detectionService;
    constructor() {
        this.detectionService = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
    }
    /** 基础检测示例 */
    async basicDetectionExample() {
        console.log('=== 基础检测示例 ===');
        try {
            // 检测所有工具链
            const results = await this.detectionService.detectToolchains();
            console.log('OpenOCD状态:', results.openocd.status);
            console.log('ARM工具链状态:', results.armToolchain.status);
            // 转换为UI兼容格式
            const uiResults = this.detectionService.toUICompatibleResults(results);
            console.log('UI兼容结果已准备就绪');
        }
        catch (error) {
            console.error('检测失败:', error);
        }
    }
    /** 强制重新检测示例 */
    async forceRedetectionExample() {
        console.log('=== 强制重新检测示例 ===');
        const options = {
            forceRedetection: true
        };
        const results = await this.detectionService.detectToolchains(options);
        console.log('强制检测完成，结果:', results);
    }
    /** 特定工具检测示例 */
    async specificToolDetectionExample() {
        console.log('=== 特定工具检测示例 ===');
        // 只检测OpenOCD
        const openocdOnly = await this.detectionService.detectToolchains({
            specificTools: ['openocd']
        });
        console.log('OpenOCD检测结果:', openocdOnly.openocd);
        // 只检测ARM工具链
        const armOnly = await this.detectionService.detectToolchains({
            specificTools: ['armToolchain']
        });
        console.log('ARM工具链检测结果:', armOnly.armToolchain);
    }
    /** 自定义缓存时间示例 */
    async customCacheTimeExample() {
        console.log('=== 自定义缓存时间示例 ===');
        // 设置缓存有效期为10分钟
        const options = {
            cacheValidityMs: 10 * 60 * 1000
        };
        const results = await this.detectionService.detectToolchains(options);
        console.log('使用10分钟缓存的检测结果:', results);
    }
    /** 缓存管理示例 */
    async cacheManagementExample() {
        console.log('=== 缓存管理示例 ===');
        // 获取缓存的结果
        const cachedResults = this.detectionService.getCachedResults();
        if (cachedResults) {
            console.log('找到缓存结果:', cachedResults.completedAt);
        }
        else {
            console.log('没有缓存结果');
        }
        // 清除缓存
        this.detectionService.clearCache();
        console.log('缓存已清除');
        // 重新检测
        await this.detectionService.detectToolchains();
        console.log('重新检测完成');
    }
    /** 运行基础示例 */
    async runBasicExamples() {
        await this.basicDetectionExample();
        await this.forceRedetectionExample();
        await this.specificToolDetectionExample();
        await this.customCacheTimeExample();
        await this.cacheManagementExample();
    }
    /** 运行高级示例 */
    async runAdvancedExamples(context) {
        if (context) {
            // UI集成示例
            console.log('=== UI集成示例 ===');
            try {
                const extendedResults = await this.detectionService.detectToolchains({
                    forceRedetection: true
                });
                const uiResults = this.detectionService.toUICompatibleResults(extendedResults);
                console.log('UI兼容结果已准备就绪');
            }
            catch (error) {
                console.error('UI集成失败:', error);
            }
        }
        // 错误处理示例
        console.log('=== 错误处理示例 ===');
        try {
            const results = await this.detectionService.detectToolchains();
            if (results.openocd.status === 'failed') {
                console.error('OpenOCD检测失败:', results.openocd.error);
            }
            if (results.armToolchain.status === 'failed') {
                console.error('ARM工具链检测失败:', results.armToolchain.error);
            }
        }
        catch (error) {
            console.error('检测服务异常:', error);
        }
        // 性能监控示例
        console.log('=== 性能监控示例 ===');
        const startTime = Date.now();
        await this.detectionService.detectToolchains({ forceRedetection: true });
        const firstDetectionTime = Date.now() - startTime;
        const cacheStartTime = Date.now();
        await this.detectionService.detectToolchains();
        const cachedDetectionTime = Date.now() - cacheStartTime;
        console.log(`首次检测耗时: ${firstDetectionTime}ms`);
        console.log(`缓存检测耗时: ${cachedDetectionTime}ms`);
        console.log(`性能提升: ${((firstDetectionTime - cachedDetectionTime) / firstDetectionTime * 100).toFixed(1)}%`);
    }
    /** 运行所有示例 */
    async runAllExamples(context) {
        console.log('开始运行工具链检测服务示例...\n');
        await this.runBasicExamples();
        await this.runAdvancedExamples(context);
        console.log('\n所有示例运行完成!');
    }
}
exports.ToolchainDetectionUsageExample = ToolchainDetectionUsageExample;
/** 导出简化的运行函数 */
async function runToolchainDetectionExamples(context) {
    const examples = new ToolchainDetectionUsageExample();
    await examples.runAllExamples(context);
}
//# sourceMappingURL=usage-example.js.map