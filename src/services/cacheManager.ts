/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 缓存管理器模块
 * 提供工具链检测结果的缓存功能，避免频繁重复检测，提高性能
 * 
 * 功能特点：
 * - 内存缓存工具链检测结果
 * - 支持缓存有效性检查，避免使用过期数据
 * - 支持部分更新特定工具链缓存
 * - 提供缓存清理功能
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
 * 默认缓存管理器实现类
 * 实现了CacheManager接口，提供内存级别的工具链检测结果缓存功能
 * 
 * 主要职责：
 * - 缓存工具链检测结果，避免重复检测的开销
 * - 管理缓存的生命周期，确保数据的时效性
 * - 支持增量更新，仅更新变化的工具链信息
 * - 提供缓存状态查询和清理功能
 * 
 * 使用场景：
 * - 工具链检测是耗时操作，缓存可显著提高响应速度
 * - 短时间内多次访问工具链信息时，避免重复检测
 * - 部分工具链发生变化时，支持增量更新
 * 
 * @class DefaultCacheManager
 * @implements {CacheManager}
 * @since 0.2.5
 */
export class DefaultCacheManager implements CacheManager {
    /** 
     * 缓存的工具链检测结果
     * 存储最近一次完整的检测结果，包含OpenOCD和ARM工具链信息
     */
    private cachedResults: ExtendedToolchainDetectionResults | null = null;

    /**
     * 获取缓存的检测结果
     * 返回当前缓存中存储的工具链检测结果
     * 
     * @returns 缓存的检测结果，如果无缓存则返回null
     * @example
     * ```typescript
     * const cached = cacheManager.getCached();
     * if (cached) {
     *   console.log('OpenOCD status:', cached.openocd.status);
     * }
     * ```
     */
    public getCached(): ExtendedToolchainDetectionResults | null {
        return this.cachedResults;
    }

    /**
     * 设置缓存结果
     * 将工具链检测结果存储到缓存中，替换之前的缓存内容
     * 
     * @param results - 要缓存的工具链检测结果
     * @example
     * ```typescript
     * const results = await toolchainService.detectToolchains();
     * cacheManager.setCached(results);
     * ```
     */
    public setCached(results: ExtendedToolchainDetectionResults): void {
        this.cachedResults = results;
    }

    /**
     * 检查缓存是否仍然有效
     * 根据指定的有效期时间判断缓存数据是否过期
     * 
     * @param validityMs - 缓存有效期（毫秒）
     * @returns 如果缓存存在且未过期返回true，否则返回false
     * @example
     * ```typescript
     * const fiveMinutes = 5 * 60 * 1000;
     * if (cacheManager.isValid(fiveMinutes)) {
     *   // 使用缓存数据
     * } else {
     *   // 重新检测
     * }
     * ```
     */
    public isValid(validityMs: number): boolean {
        if (!this.cachedResults) {
            return false;
        }
        
        const now = Date.now();
        return (now - this.cachedResults.completedAt) < validityMs;
    }

    /**
     * 清除所有缓存数据
     * 删除当前存储的工具链检测结果，下次访问时将重新检测
     * 
     * @example
     * ```typescript
     * // 强制下次检测时重新扫描所有工具链
     * cacheManager.clear();
     * ```
     */
    public clear(): void {
        this.cachedResults = null;
    }

    /**
     * 更新特定工具链的缓存
     * 只更新指定的工具链信息，其他工具链信息保持不变
     * 
     * @param results - 包含更新信息的检测结果
     * @param specificTools - 要更新的工具链列表
     * @example
     * ```typescript
     * // 只更新OpenOCD的检测结果，保留ARM工具链的缓存
     * const newResults = await detectOnlyOpenOCD();
     * cacheManager.updateSpecific(newResults, ['openocd']);
     * ```
     */
    public updateSpecific(
        results: ExtendedToolchainDetectionResults,
        specificTools: ('openocd' | 'armToolchain')[]
    ): void {
        // 如果没有缓存，先创建一个空的结果对象
        if (!this.cachedResults) {
            this.cachedResults = this.createEmptyResults();
        }

        // 根据指定的工具链类型，选择性更新缓存
        if (specificTools.includes('openocd')) {
            this.cachedResults.openocd = results.openocd;
        }
        if (specificTools.includes('armToolchain')) {
            this.cachedResults.armToolchain = results.armToolchain;
        }
        
        // 更新完成时间戳
        this.cachedResults.completedAt = results.completedAt;
    }

    /**
     * 从缓存中获取特定工具链的结果
     * 只返回指定工具链的缓存信息，未指定的工具链返回默认状态
     * 
     * @param specificTools - 要获取的工具链列表
     * @returns 包含指定工具链信息的检测结果
     * @example
     * ```typescript
     * // 只获取OpenOCD的缓存信息
     * const openocdResult = cacheManager.getSpecificFromCache(['openocd']);
     * console.log('OpenOCD path:', openocdResult.openocd.path);
     * ```
     */
    public getSpecificFromCache(
        specificTools: ('openocd' | 'armToolchain')[]
    ): ExtendedToolchainDetectionResults {
        // 创建基础结果对象，默认状态为未检测
        const baseResult = this.createEmptyResults();
        
        // 如果没有缓存，直接返回空结果
        if (!this.cachedResults) {
            return baseResult;
        }

        // 根据指定的工具链类型，从缓存中复制相应的信息
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
     * 生成一个初始状态的工具链检测结果，所有工具链状态为未检测
     * 
     * @returns 初始化的空检测结果对象，包含默认的OpenOCD和ARM工具链信息
     * @example
     * ```typescript
     * const emptyResult = cacheManager.createEmptyResults();
     * // emptyResult.openocd.status === DetectionStatus.NOT_DETECTED
     * // emptyResult.armToolchain.status === DetectionStatus.NOT_DETECTED
     * ```
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