/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 工具链检测类型定义模块
 * 定义统一检测服务相关的接口和类型
 * 
 * @fileoverview 检测服务类型定义
 * @author 左岚
 * @since 0.2.5
 */

import { ToolchainInfo } from '../utils/armToolchain';
import { 
    DetectionStatus, 
    ToolchainDetectionResult, 
    ToolchainDetectionResults 
} from '../ui/types';

/**
 * 扩展的工具链检测结果接口
 * 在UI类型基础上添加额外的检测信息
 */
export interface ExtendedToolchainDetectionResult extends ToolchainDetectionResult {
    /** 版本信息 */
    version?: string;
    /** 配置文件信息（仅OpenOCD） */
    configs?: {
        interfaces: string[];
        targets: string[];
    };
    /** 检测完成时间戳 */
    detectedAt?: number;
    /** 是否来自缓存 */
    fromCache?: boolean;
}

/**
 * 扩展的完整检测结果接口
 */
export interface ExtendedToolchainDetectionResults {
    /** OpenOCD检测结果 */
    openocd: ExtendedToolchainDetectionResult;
    /** ARM工具链检测结果 */
    armToolchain: ExtendedToolchainDetectionResult;
    /** 整体检测完成时间 */
    completedAt: number;
}

/**
 * 检测选项接口
 */
export interface DetectionOptions {
    /** 是否强制重新检测，忽略缓存 */
    forceRedetection?: boolean;
    /** 是否仅检测特定工具链 */
    specificTools?: ('openocd' | 'armToolchain')[];
    /** 缓存有效期（毫秒），默认5分钟 */
    cacheValidityMs?: number;
}

/**
 * 工具链检测器接口
 * 定义单个工具链检测器的标准接口
 */
export interface ToolchainDetector {
    /** 检测器名称 */
    readonly name: string;
    
    /** 执行检测 */
    detect(detectionTime: number): Promise<ExtendedToolchainDetectionResult>;
}

/**
 * 缓存管理器接口
 * 定义缓存操作的标准接口
 */
export interface CacheManager {
    /** 获取缓存结果 */
    getCached(): ExtendedToolchainDetectionResults | null;
    
    /** 设置缓存结果 */
    setCached(results: ExtendedToolchainDetectionResults): void;
    
    /** 检查缓存是否有效 */
    isValid(validityMs: number): boolean;
    
    /** 清除缓存 */
    clear(): void;
    
    /** 更新特定工具链的缓存 */
    updateSpecific(
        results: ExtendedToolchainDetectionResults, 
        specificTools: ('openocd' | 'armToolchain')[]
    ): void;
}