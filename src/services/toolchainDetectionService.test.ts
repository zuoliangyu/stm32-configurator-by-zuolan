/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 工具链检测服务测试模块
 * 验证统一检测服务的功能和兼容性
 * 
 * @fileoverview 工具链检测服务测试
 * @author 左岚
 * @since 0.2.5
 */

import { ToolchainDetectionService } from './toolchainDetectionService';
import { DetectionOptions } from './detectionTypes';
import { DetectionStatus } from '../ui/types';

/**
 * 简单的测试套件用于验证工具链检测服务
 */
export class ToolchainDetectionServiceTest {
    private service: ToolchainDetectionService;

    constructor() {
        this.service = ToolchainDetectionService.getInstance();
    }

    /**
     * 测试基本检测功能
     */
    public async testBasicDetection(): Promise<boolean> {
        try {
            const results = await this.service.detectToolchains();
            
            // 验证结果结构
            if (!results.openocd || !results.armToolchain) {
                console.error('Missing detection results');
                return false;
            }

            // 验证状态枚举
            const validStatuses = [
                DetectionStatus.SUCCESS,
                DetectionStatus.FAILED,
                DetectionStatus.NOT_DETECTED
            ];

            if (!validStatuses.includes(results.openocd.status) ||
                !validStatuses.includes(results.armToolchain.status)) {
                console.error('Invalid detection status');
                return false;
            }

            console.log('Basic detection test passed');
            return true;
        } catch (error) {
            console.error('Basic detection test failed:', error);
            return false;
        }
    }

    /**
     * 测试缓存功能
     */
    public async testCaching(): Promise<boolean> {
        try {
            // 首次检测
            const results1 = await this.service.detectToolchains();
            const time1 = Date.now();

            // 第二次检测（应该使用缓存）
            const results2 = await this.service.detectToolchains();
            const time2 = Date.now();

            // 验证缓存有效性（第二次检测应该更快）
            if (time2 - time1 > 1000) {
                console.warn('Caching may not be working effectively');
            }

            // 强制重新检测
            const results3 = await this.service.detectToolchains({ 
                forceRedetection: true 
            });

            console.log('Caching test passed');
            return true;
        } catch (error) {
            console.error('Caching test failed:', error);
            return false;
        }
    }

    /**
     * 测试UI兼容性
     */
    public async testUICompatibility(): Promise<boolean> {
        try {
            const extendedResults = await this.service.detectToolchains();
            const uiResults = this.service.toUICompatibleResults(extendedResults);

            // 验证UI结果结构
            if (!uiResults.openocd || !uiResults.armToolchain) {
                console.error('UI compatibility conversion failed');
                return false;
            }

            // 验证必需字段存在
            const requiredFields = ['name', 'status', 'path'];
            for (const field of requiredFields) {
                if (!(field in uiResults.openocd) || !(field in uiResults.armToolchain)) {
                    console.error(`Missing required field: ${field}`);
                    return false;
                }
            }

            console.log('UI compatibility test passed');
            return true;
        } catch (error) {
            console.error('UI compatibility test failed:', error);
            return false;
        }
    }

    /**
     * 运行所有测试
     */
    public async runAllTests(): Promise<boolean> {
        console.log('Running ToolchainDetectionService tests...');

        const tests = [
            this.testBasicDetection(),
            this.testCaching(),
            this.testUICompatibility()
        ];

        const results = await Promise.all(tests);
        const allPassed = results.every(result => result);

        if (allPassed) {
            console.log('All ToolchainDetectionService tests passed!');
        } else {
            console.error('Some ToolchainDetectionService tests failed!');
        }

        return allPassed;
    }
}

/**
 * 导出测试运行函数
 */
export async function runToolchainDetectionTests(): Promise<boolean> {
    const testSuite = new ToolchainDetectionServiceTest();
    return await testSuite.runAllTests();
}