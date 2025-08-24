/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 统一工具链检测服务使用示例
 * 展示如何在实际项目中使用工具链检测服务
 * 
 * @fileoverview 使用示例
 * @author 左岚
 * @since 0.2.5
 */

import * as vscode from 'vscode';
import { ToolchainDetectionService } from './toolchainDetectionService';
import { DetectionOptions } from './detectionTypes';

/**
 * 使用统一检测服务的示例类
 * 展示各种使用场景和最佳实践
 */
export class ToolchainDetectionUsageExample {
    private detectionService: ToolchainDetectionService;
    
    constructor() {
        this.detectionService = ToolchainDetectionService.getInstance();
    }

    /** 基础检测示例 */
    public async basicDetectionExample(): Promise<void> {
        console.log('=== 基础检测示例 ===');
        
        try {
            // 检测所有工具链
            const results = await this.detectionService.detectToolchains();
            
            console.log('OpenOCD状态:', results.openocd.status);
            console.log('ARM工具链状态:', results.armToolchain.status);
            
            // 转换为UI兼容格式
            const uiResults = this.detectionService.toUICompatibleResults(results);
            console.log('UI兼容结果已准备就绪');
            
        } catch (error) {
            console.error('检测失败:', error);
        }
    }

    /** 强制重新检测示例 */
    public async forceRedetectionExample(): Promise<void> {
        console.log('=== 强制重新检测示例 ===');
        
        const options: DetectionOptions = {
            forceRedetection: true
        };
        
        const results = await this.detectionService.detectToolchains(options);
        console.log('强制检测完成，结果:', results);
    }

    /** 特定工具检测示例 */
    public async specificToolDetectionExample(): Promise<void> {
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
    public async customCacheTimeExample(): Promise<void> {
        console.log('=== 自定义缓存时间示例 ===');
        
        // 设置缓存有效期为10分钟
        const options: DetectionOptions = {
            cacheValidityMs: 10 * 60 * 1000
        };
        
        const results = await this.detectionService.detectToolchains(options);
        console.log('使用10分钟缓存的检测结果:', results);
    }

    /** 缓存管理示例 */
    public async cacheManagementExample(): Promise<void> {
        console.log('=== 缓存管理示例 ===');
        
        // 获取缓存的结果
        const cachedResults = this.detectionService.getCachedResults();
        if (cachedResults) {
            console.log('找到缓存结果:', cachedResults.completedAt);
        } else {
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
    public async runBasicExamples(): Promise<void> {
        await this.basicDetectionExample();
        await this.forceRedetectionExample();
        await this.specificToolDetectionExample();
        await this.customCacheTimeExample();
        await this.cacheManagementExample();
    }
    
    /** 运行高级示例 */
    public async runAdvancedExamples(context?: vscode.ExtensionContext): Promise<void> {
        if (context) {
            // UI集成示例
            console.log('=== UI集成示例 ===');
            try {
                const extendedResults = await this.detectionService.detectToolchains({
                    forceRedetection: true
                });
                const uiResults = this.detectionService.toUICompatibleResults(extendedResults);
                console.log('UI兼容结果已准备就绪');
            } catch (error) {
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
        } catch (error) {
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
    public async runAllExamples(context?: vscode.ExtensionContext): Promise<void> {
        console.log('开始运行工具链检测服务示例...\n');
        await this.runBasicExamples();
        await this.runAdvancedExamples(context);
        console.log('\n所有示例运行完成!');
    }
}

/** 导出简化的运行函数 */
export async function runToolchainDetectionExamples(context?: vscode.ExtensionContext): Promise<void> {
    const examples = new ToolchainDetectionUsageExample();
    await examples.runAllExamples(context);
}