"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultCacheManager = void 0;
/**
 * 缓存管理器模块
 * 提供工具链检测结果的缓存功能
 *
 * @fileoverview 缓存管理器
 * @author 左岚
 * @since 0.2.5
 */
const types_1 = require("../ui/types");
/**
 * 默认缓存管理器实现
 * 提供内存缓存功能
 */
class DefaultCacheManager {
    /** 缓存的检测结果 */
    cachedResults = null;
    /**
     * 获取缓存结果
     */
    getCached() {
        return this.cachedResults;
    }
    /**
     * 设置缓存结果
     */
    setCached(results) {
        this.cachedResults = results;
    }
    /**
     * 检查缓存是否有效
     */
    isValid(validityMs) {
        if (!this.cachedResults) {
            return false;
        }
        const now = Date.now();
        return (now - this.cachedResults.completedAt) < validityMs;
    }
    /**
     * 清除缓存
     */
    clear() {
        this.cachedResults = null;
    }
    /**
     * 更新特定工具链的缓存
     */
    updateSpecific(results, specificTools) {
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
    getSpecificFromCache(specificTools) {
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
    createEmptyResults() {
        return {
            openocd: {
                name: 'OpenOCD',
                status: types_1.DetectionStatus.NOT_DETECTED,
                path: null
            },
            armToolchain: {
                name: 'ARM Toolchain',
                status: types_1.DetectionStatus.NOT_DETECTED,
                path: null
            },
            completedAt: Date.now()
        };
    }
}
exports.DefaultCacheManager = DefaultCacheManager;
//# sourceMappingURL=cacheManager.js.map