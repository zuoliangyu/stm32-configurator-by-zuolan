/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 配置管理器类型定义
 * 定义工具链配置相关的接口和类型
 * 
 * @fileoverview 配置管理器类型定义
 * @author 左岚
 * @since 0.2.3
 */

/**
 * 工具链配置接口
 * 定义需要写入VSCode全局配置的工具链路径设置
 */
export interface ToolchainSettings {
    /** OpenOCD可执行文件路径 */
    openocdPath?: string;
    /** ARM工具链路径（GCC bin目录） */
    armToolchainPath?: string;
}

/**
 * 配置验证结果接口
 */
export interface ValidationResult {
    /** 验证是否通过 */
    isValid: boolean;
    /** 验证错误信息 */
    errors: string[];
    /** 验证警告信息 */
    warnings: string[];
}

/**
 * 配置操作错误类
 * 封装配置读写操作中可能出现的各种错误
 */
export class SettingsError extends Error {
    constructor(
        message: string,
        public readonly operation: 'read' | 'write' | 'validate',
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'SettingsError';
    }
}