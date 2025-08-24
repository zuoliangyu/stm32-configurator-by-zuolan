/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 缓存管理器模块
 * 提供工具链检测结果的缓存功能
 * 
 * @fileoverview 缓存管理器
 * @author 左岚
 * @since 0.2.5
 */

import { DetectionStatus } from '../ui/types';
import { 
    CacheManager, 
    ExtendedToolchainDetectionResults 
} from './detectionTypes';

/**
 * 默认缓存管理器实现
 * 提供内存缓存功能
 */
export class DefaultCacheManager implements CacheManager {
    /** 缓存的检测结果 */
    private cachedResults: ExtendedToolchainDetectionResults | null = null;

    /**
     * 获取缓存结果
     */
    public getCached(): ExtendedToolchainDetectionResults | null {
        return this.cachedResults;
    }

    /**
     * 设置缓存结果
     */
    public setCached(results: ExtendedToolchainDetectionResults): void {
        this.cachedResults = results;
    }

    /**
     * 检查缓存是否有效
     */
    public isValid(validityMs: number): boolean {
        if (!this.cachedResults) {
            return false;
        }
        
        const now = Date.now();
        return (now - this.cachedResults.completedAt) < validityMs;
    }

    /**
     * 清除缓存
     */
    public clear(): void {
        this.cachedResults = null;
    }

    /**
     * 更新特定工具链的缓存
     */
    public updateSpecific(
        results: ExtendedToolchainDetectionResults,
        specificTools: ('openocd' | 'armToolchain')[]
    ): void {
        if (!this.cachedResults) {
            this.cachedResults = this.createEmptyResults();
        }

        if (specificTools.includes('openocd')) {
            this.cachedResults.openocd = results.openocd;
        }
        if (specificTools.includes('armToolchain')) {
            this.cachedResults.armToolchain = results.armToolchain;
        }
        
        this.cachedResults.completedAt = results.completedAt;
    }

    /**
     * 从缓存中获取特定工具链结果
     */
    public getSpecificFromCache(
        specificTools: ('openocd' | 'armToolchain')[]
    ): ExtendedToolchainDetectionResults {
        const baseResult = this.createEmptyResults();
        
        if (!this.cachedResults) {
            return baseResult;
        }

        if (specificTools.includes('openocd')) {
            baseResult.openocd = { ...this.cachedResults.openocd };
        }
        if (specificTools.includes('armToolchain')) {
            baseResult.armToolchain = { ...this.cachedResults.armToolchain };
        }
        
        return baseResult;
    }

    /**
     * 创建空的检测结果对象
     * 
     * @returns 初始化的空检测结果
     */
    public createEmptyResults(): ExtendedToolchainDetectionResults {
        return {
            openocd: {
                name: 'OpenOCD',
                status: DetectionStatus.NOT_DETECTED,
                path: null
            },
            armToolchain: {
                name: 'ARM Toolchain',
                status: DetectionStatus.NOT_DETECTED,
                path: null
            },
            completedAt: Date.now()
        };
    }
}