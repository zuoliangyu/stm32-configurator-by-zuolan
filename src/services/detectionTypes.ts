/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 工具链检测类型定义模块
 * 定义统一检测服务相关的接口和类型，为工具链检测提供标准化的数据结构
 * 
 * 本模块包含：
 * - 扩展的检测结果接口，在基础UI类型上增加更多检测信息
 * - 检测选项配置，支持缓存管理和部分检测
 * - 工具链检测器接口，定义检测器的标准实现
 * - 缓存管理器接口，提供统一的缓存操作标准
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
 * 在基础UI检测结果类型基础上，添加更多详细的检测信息和元数据
 * 
 * 扩展功能：
 * - 版本信息：记录检测到的工具链版本号
 * - 配置文件信息：OpenOCD的接口和目标配置文件列表  
 * - 时间戳：记录检测完成的时间，用于缓存管理
 * - 缓存标记：标识结果是否来自缓存
 * 
 * @interface ExtendedToolchainDetectionResult
 * @extends ToolchainDetectionResult
 * @since 0.2.5
 */
export interface ExtendedToolchainDetectionResult extends ToolchainDetectionResult {
    /** 
     * 工具链版本信息
     * 例如：OpenOCD版本号、ARM GCC版本号等
     */
    version?: string;
    
    /** 
     * 配置文件信息（仅适用于OpenOCD）
     * 包含可用的接口配置文件和目标设备配置文件列表
     */
    configs?: {
        /** 接口配置文件列表（如stlink.cfg, jlink.cfg等） */
        interfaces: string[];
        /** 目标配置文件列表（如stm32f4x.cfg, stm32f1x.cfg等） */
        targets: string[];
    };
    
    /** 
     * 检测完成时间戳
     * 记录此次检测完成的Unix时间戳，用于缓存有效性判断
     */
    detectedAt?: number;
    
    /** 
     * 是否来自缓存
     * 标识此结果是否来自缓存而非实时检测
     */
    fromCache?: boolean;
}

/**
 * 扩展的完整检测结果接口
 * 包含所有工具链的扩展检测结果，以及整体检测的元信息
 * 
 * 用途：
 * - 统一管理所有工具链的检测结果
 * - 提供整体检测完成时间，便于批量缓存管理
 * - 支持部分工具链的增量更新
 * 
 * @interface ExtendedToolchainDetectionResults
 * @since 0.2.5
 */
export interface ExtendedToolchainDetectionResults {
    /** OpenOCD工具检测结果 */
    openocd: ExtendedToolchainDetectionResult;
    
    /** ARM工具链检测结果 */
    armToolchain: ExtendedToolchainDetectionResult;
    
    /** 
     * 整体检测完成时间戳
     * 记录所有工具链检测完成的时间，用于缓存管理
     */
    completedAt: number;
}

/**
 * 检测选项配置接口
 * 定义工具链检测的各种配置选项，支持灵活的检测策略
 * 
 * 功能特性：
 * - 强制重检：忽略缓存，重新执行完整检测
 * - 部分检测：只检测指定的工具链，提高效率
 * - 缓存控制：自定义缓存有效期，平衡性能和数据新鲜度
 * 
 * @interface DetectionOptions
 * @since 0.2.5
 */
export interface DetectionOptions {
    /** 
     * 是否强制重新检测，忽略现有缓存
     * 设为true时，将重新执行完整的工具链检测，不使用缓存结果
     * @default false
     */
    forceRedetection?: boolean;
    
    /** 
     * 仅检测特定的工具链类型
     * 指定后只检测列表中的工具链，其他工具链使用缓存或默认状态
     * @example ['openocd'] - 只检测OpenOCD
     * @example ['armToolchain'] - 只检测ARM工具链
     */
    specificTools?: ('openocd' | 'armToolchain')[];
    
    /** 
     * 缓存有效期（毫秒）
     * 超过此时间的缓存将被视为过期，需要重新检测
     * @default 300000 (5分钟)
     */
    cacheValidityMs?: number;
}

/**
 * 工具链检测器接口
 * 定义单个工具链检测器的标准接口，确保所有检测器实现的一致性
 * 
 * 职责：
 * - 执行特定工具链的检测逻辑
 * - 返回标准化的检测结果
 * - 处理检测过程中的异常情况
 * 
 * 实现要求：
 * - 必须是异步方法，支持长时间检测操作
 * - 需要处理文件系统访问、网络请求等可能的失败情况
 * - 返回的结果必须符合ExtendedToolchainDetectionResult接口
 * 
 * @interface ToolchainDetector
 * @since 0.2.5
 */
export interface ToolchainDetector {
    /** 
     * 检测器名称
     * 用于标识检测器类型，便于调试和日志记录
     */
    readonly name: string;
    
    /** 
     * 执行工具链检测
     * 
     * @param detectionTime - 检测开始时间戳，用于结果的时间标记
     * @returns Promise<ExtendedToolchainDetectionResult> 检测结果的Promise
     * @throws 检测过程中的任何错误都应该被捕获并体现在结果的error字段中
     * @example
     * ```typescript
     * const detector = new OpenOCDDetector();
     * const result = await detector.detect(Date.now());
     * if (result.status === DetectionStatus.SUCCESS) {
     *   console.log('OpenOCD found at:', result.path);
     * }
     * ```
     */
    detect(detectionTime: number): Promise<ExtendedToolchainDetectionResult>;
}

/**
 * 缓存管理器接口
 * 定义工具链检测结果缓存操作的标准接口，提供统一的缓存管理功能
 * 
 * 设计目标：
 * - 提升检测性能，避免重复的耗时操作
 * - 支持缓存有效性验证，确保数据时效性
 * - 支持部分更新，提高缓存利用率
 * - 提供清理机制，避免内存泄漏
 * 
 * 使用场景：
 * - 短时间内多次访问工具链信息
 * - 部分工具链发生变更时的增量更新
 * - 定期刷新缓存以保持数据新鲜度
 * 
 * @interface CacheManager
 * @since 0.2.5
 */
export interface CacheManager {
    /** 
     * 获取缓存的检测结果
     * 
     * @returns 缓存的完整检测结果，如果无缓存则返回null
     */
    getCached(): ExtendedToolchainDetectionResults | null;
    
    /** 
     * 设置缓存结果
     * 将完整的检测结果存储到缓存中
     * 
     * @param results - 要缓存的完整检测结果
     */
    setCached(results: ExtendedToolchainDetectionResults): void;
    
    /** 
     * 检查缓存是否仍然有效
     * 根据指定的有效期判断缓存是否过期
     * 
     * @param validityMs - 缓存有效期（毫秒）
     * @returns true表示缓存有效，false表示已过期或无缓存
     */
    isValid(validityMs: number): boolean;
    
    /** 
     * 清除所有缓存数据
     * 删除当前存储的所有检测结果
     */
    clear(): void;
    
    /** 
     * 更新特定工具链的缓存
     * 只更新指定工具链的检测结果，保持其他工具链缓存不变
     * 
     * @param results - 包含更新信息的检测结果
     * @param specificTools - 要更新的工具链类型列表
     */
    updateSpecific(
        results: ExtendedToolchainDetectionResults, 
        specificTools: ('openocd' | 'armToolchain')[]
    ): void;
}