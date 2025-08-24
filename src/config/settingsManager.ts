/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * VSCode全局设置管理器
 * 提供工具链配置的读写和验证功能，专门处理Cortex-Debug扩展的全局配置
 * 
 * @fileoverview 全局Settings配置管理器
 * @author 左岚
 * @since 0.2.3
 */

import * as vscode from 'vscode';
import { normalizePath } from '../utils/pathUtils';
import { ToolchainSettings, ValidationResult, SettingsError } from './types';
import { validateToolchainSettings } from './validation';

/**
 * VSCode全局设置管理器类
 * 提供工具链配置的统一管理接口
 */
export class GlobalSettingsManager {
    /** Cortex-Debug扩展配置键 */
    private static readonly CORTEX_DEBUG_SECTION = 'cortex-debug';
    /** OpenOCD路径配置键 */
    private static readonly OPENOCD_PATH_KEY = 'openocdPath';
    /** ARM工具链路径配置键 */
    private static readonly ARM_TOOLCHAIN_PATH_KEY = 'armToolchainPath';

    /**
     * 写入工具链配置到VSCode全局设置
     * 
     * @param config - 工具链配置对象
     * @throws {SettingsError} 当配置写入失败时抛出
     * @example
     * ```typescript
     * const manager = new GlobalSettingsManager();
     * await manager.writeGlobalToolchainSettings({
     *     openocdPath: 'C:/OpenOCD/bin/openocd.exe',
     *     armToolchainPath: 'C:/gcc-arm/bin'
     * });
     * ```
     */
    async writeGlobalToolchainSettings(config: ToolchainSettings): Promise<void> {
        try {
            // 验证配置有效性
            const validation = validateToolchainSettings(config);
            if (!validation.isValid) {
                throw new SettingsError(
                    `Configuration validation failed: ${validation.errors.join(', ')}`,
                    'validate'
                );
            }

            const cortexDebugConfig = vscode.workspace.getConfiguration(
                GlobalSettingsManager.CORTEX_DEBUG_SECTION
            );

            // 标准化路径格式
            const updates: Thenable<void>[] = [];

            if (config.openocdPath) {
                const normalizedOpenOCDPath = normalizePath(config.openocdPath);
                updates.push(
                    cortexDebugConfig.update(
                        GlobalSettingsManager.OPENOCD_PATH_KEY,
                        normalizedOpenOCDPath,
                        vscode.ConfigurationTarget.Global
                    )
                );
            }

            if (config.armToolchainPath) {
                const normalizedArmPath = normalizePath(config.armToolchainPath);
                updates.push(
                    cortexDebugConfig.update(
                        GlobalSettingsManager.ARM_TOOLCHAIN_PATH_KEY,
                        normalizedArmPath,
                        vscode.ConfigurationTarget.Global
                    )
                );
            }

            // 并发执行配置更新
            await Promise.all(updates);

            // 记录成功信息
            console.log('Global toolchain settings updated successfully:', {
                openocdPath: config.openocdPath ? normalizePath(config.openocdPath) : undefined,
                armToolchainPath: config.armToolchainPath ? normalizePath(config.armToolchainPath) : undefined
            });

        } catch (error: any) {
            if (error instanceof SettingsError) {
                throw error;
            }
            throw new SettingsError(
                `Failed to write global toolchain settings: ${error.message}`,
                'write',
                error
            );
        }
    }

    /**
     * 读取VSCode全局工具链配置
     * 
     * @returns 当前的工具链配置
     * @throws {SettingsError} 当配置读取失败时抛出
     * @example
     * ```typescript
     * const manager = new GlobalSettingsManager();
     * const settings = await manager.readGlobalToolchainSettings();
     * console.log('OpenOCD Path:', settings.openocdPath);
     * ```
     */
    async readGlobalToolchainSettings(): Promise<ToolchainSettings> {
        try {
            const cortexDebugConfig = vscode.workspace.getConfiguration(
                GlobalSettingsManager.CORTEX_DEBUG_SECTION
            );

            const openocdPath = cortexDebugConfig.get<string>(
                GlobalSettingsManager.OPENOCD_PATH_KEY
            );
            
            const armToolchainPath = cortexDebugConfig.get<string>(
                GlobalSettingsManager.ARM_TOOLCHAIN_PATH_KEY
            );

            const settings: ToolchainSettings = {};
            
            if (openocdPath && openocdPath.trim() !== '') {
                settings.openocdPath = openocdPath;
            }
            
            if (armToolchainPath && armToolchainPath.trim() !== '') {
                settings.armToolchainPath = armToolchainPath;
            }

            return settings;

        } catch (error: any) {
            throw new SettingsError(
                `Failed to read global toolchain settings: ${error.message}`,
                'read',
                error
            );
        }
    }

    /**
     * 验证工具链配置的有效性
     * 检查路径格式和文件存在性
     * 
     * @param config - 要验证的工具链配置
     * @returns 验证结果，包含错误和警告信息
     */
    validateToolchainSettings(config: ToolchainSettings): ValidationResult {
        return validateToolchainSettings(config);
    }

    /**
     * 清除指定的全局工具链配置
     * 
     * @param keys - 要清除的配置键数组
     * @throws {SettingsError} 当配置清除失败时抛出
     */
    async clearGlobalToolchainSettings(
        keys: ('openocdPath' | 'armToolchainPath')[] = ['openocdPath', 'armToolchainPath']
    ): Promise<void> {
        try {
            const cortexDebugConfig = vscode.workspace.getConfiguration(
                GlobalSettingsManager.CORTEX_DEBUG_SECTION
            );

            const updates: Thenable<void>[] = [];

            if (keys.includes('openocdPath')) {
                updates.push(
                    cortexDebugConfig.update(
                        GlobalSettingsManager.OPENOCD_PATH_KEY,
                        undefined,
                        vscode.ConfigurationTarget.Global
                    )
                );
            }

            if (keys.includes('armToolchainPath')) {
                updates.push(
                    cortexDebugConfig.update(
                        GlobalSettingsManager.ARM_TOOLCHAIN_PATH_KEY,
                        undefined,
                        vscode.ConfigurationTarget.Global
                    )
                );
            }

            await Promise.all(updates);
            console.log('Global toolchain settings cleared:', keys);

        } catch (error: any) {
            throw new SettingsError(
                `Failed to clear global toolchain settings: ${error.message}`,
                'write',
                error
            );
        }
    }
}

/**
 * 全局设置管理器单例实例
 * 提供便捷的静态访问方法
 */
export const globalSettingsManager = new GlobalSettingsManager();

/**
 * 写入全局工具链设置的便捷函数
 * 
 * @param config - 工具链配置对象
 * @throws {SettingsError} 当配置写入失败时抛出
 */
export async function writeGlobalToolchainSettings(config: ToolchainSettings): Promise<void> {
    return globalSettingsManager.writeGlobalToolchainSettings(config);
}

/**
 * 读取全局工具链设置的便捷函数
 * 
 * @returns 当前的工具链配置
 * @throws {SettingsError} 当配置读取失败时抛出
 */
export async function readGlobalToolchainSettings(): Promise<ToolchainSettings> {
    return globalSettingsManager.readGlobalToolchainSettings();
}

// 重新导出验证函数
export { validateToolchainSettings } from './validation';