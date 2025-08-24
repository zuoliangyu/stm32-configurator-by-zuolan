/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 配置保存处理器模块
 * 负责保存工具链配置到VSCode设置中
 * 
 * @fileoverview 配置保存处理器
 * @author 左岚
 * @since 0.2.4
 */

import * as vscode from 'vscode';
import { LocalizationManager } from '../localization/localizationManager';
import { DetectionStatus, ToolchainDetectionResults } from './types';

/**
 * 配置保存处理器类
 * 负责将工具链配置保存到VSCode设置中
 * 
 * @class ConfigurationHandler
 * @since 0.2.4
 */
export class ConfigurationHandler {
    /** 本地化管理器实例 */
    private localizationManager: LocalizationManager;

    /**
     * 构造函数
     * 
     * @param localizationManager - 本地化管理器实例
     */
    constructor(localizationManager: LocalizationManager) {
        this.localizationManager = localizationManager;
    }

    /**
     * 保存OpenOCD配置
     * 
     * @private
     * @param path - OpenOCD可执行文件路径
     */
    private async saveOpenOCDConfiguration(path: string): Promise<void> {
        const config = vscode.workspace.getConfiguration();
        await config.update('stm32-configurator.openocdPath', path, 
                          vscode.ConfigurationTarget.Global);
    }

    /**
     * 保存ARM工具链配置
     * 
     * @private
     * @param path - ARM工具链可执行文件路径
     */
    private async saveArmToolchainConfiguration(path: string): Promise<void> {
        const config = vscode.workspace.getConfiguration();
        await config.update('cortex-debug.armToolchainPath', path,
                          vscode.ConfigurationTarget.Global);
    }

    /**
     * 保存工具链配置
     * 将检测到或用户配置的路径保存到VSCode配置中
     * 
     * @param results - 工具链检测结果
     */
    public async saveToolchainConfiguration(results: ToolchainDetectionResults): Promise<void> {
        const l10n = this.localizationManager;

        try {
            // 保存OpenOCD路径
            if (results.openocd.status === DetectionStatus.SUCCESS && results.openocd.path) {
                await this.saveOpenOCDConfiguration(results.openocd.path);
            }

            // 保存ARM工具链路径
            if (results.armToolchain.status === DetectionStatus.SUCCESS && results.armToolchain.path) {
                await this.saveArmToolchainConfiguration(results.armToolchain.path);
            }

            await vscode.window.showInformationMessage(l10n.getString('configurationSaved'));
        } catch (error) {
            console.error('Error saving toolchain configuration:', error);
            await vscode.window.showErrorMessage(
                `Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * 获取检测失败的工具链列表
     * 
     * @param results - 工具链检测结果
     * @returns string[] 失败的工具链名称数组
     */
    public getFailedToolchains(results: ToolchainDetectionResults): string[] {
        const failedToolchains: string[] = [];
        
        if (results.openocd.status === DetectionStatus.FAILED) {
            failedToolchains.push('OpenOCD');
        }
        if (results.armToolchain.status === DetectionStatus.FAILED) {
            failedToolchains.push('ARM Toolchain');
        }
        
        return failedToolchains;
    }

    /**
     * 更新检测结果中的工具链路径
     * 
     * @param results - 工具链检测结果
     * @param toolchainName - 工具链名称
     * @param path - 新的路径
     */
    public updateToolchainPath(
        results: ToolchainDetectionResults, 
        toolchainName: string, 
        path: string
    ): void {
        if (toolchainName === 'OpenOCD') {
            results.openocd.status = DetectionStatus.SUCCESS;
            results.openocd.path = path;
        } else if (toolchainName === 'ARM Toolchain') {
            results.armToolchain.status = DetectionStatus.SUCCESS;
            results.armToolchain.path = path;
        }
    }
}