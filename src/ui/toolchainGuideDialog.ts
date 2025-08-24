/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 工具链引导对话框主类
 * 协调工具链检测和配置向导的各个组件
 * 
 * @fileoverview 工具链引导对话框
 * @author 左岚
 * @since 0.2.4
 */

import * as vscode from 'vscode';
import { LocalizationManager } from '../localization/localizationManager';
import { DetectionProgressHandler } from './detectionProgressHandler';
import { ResultDisplayHandler } from './resultDisplayHandler';
import { UserInteractionHandler } from './userInteractionHandler';
import { ConfigurationHandler } from './configurationHandler';
import { AutoConfigurationDialog } from './autoConfigurationDialog';
import { UserAction } from './types';

/**
 * 工具链引导对话框类
 * 提供工具链检测和配置向导功能的主控制器
 * 
 * @class ToolchainGuideDialog
 * @since 0.2.4
 */
export class ToolchainGuideDialog {
    /** 本地化管理器实例 */
    private localizationManager: LocalizationManager;
    /** 检测进度处理器 */
    private progressHandler: DetectionProgressHandler;
    /** 结果展示处理器 */
    private displayHandler: ResultDisplayHandler;
    /** 用户交互处理器 */
    private interactionHandler: UserInteractionHandler;
    /** 配置保存处理器 */
    private configurationHandler: ConfigurationHandler;
    /** 自动配置对话框 */
    private autoConfigDialog: AutoConfigurationDialog;

    /**
     * 构造函数
     * 初始化工具链引导对话框和各个处理器组件
     * 
     * @param context - VS Code扩展上下文
     */
    constructor(context: vscode.ExtensionContext) {
        this.localizationManager = LocalizationManager.getInstance(context);
        this.progressHandler = new DetectionProgressHandler(this.localizationManager);
        this.displayHandler = new ResultDisplayHandler(this.localizationManager);
        this.interactionHandler = new UserInteractionHandler(this.localizationManager);
        this.configurationHandler = new ConfigurationHandler(this.localizationManager);
        this.autoConfigDialog = new AutoConfigurationDialog(context);
    }

    /**
     * 显示工具链检测向导
     * 主要的公共方法，启动完整的工具链检测和配置流程
     * 
     * @returns Promise<boolean> 如果用户完成配置返回true，取消返回false
     * @example
     * ```typescript
     * const dialog = new ToolchainGuideDialog(context);
     * const configured = await dialog.showWizard();
     * if (configured) {
     *   console.log('Toolchains configured successfully');
     * }
     * ```
     * @since 0.2.4
     */
    public async showWizard(): Promise<boolean> {
        // 首先显示配置选项选择
        const configOption = await this.showConfigurationOptions();
        
        switch (configOption) {
            case 'auto_full':
                return await this.showAutoConfigurationWizard();
            case 'auto_quick':
                return await this.showQuickSetup();
            case 'manual':
                return await this.showManualWizard();
            default:
                return false; // 用户取消
        }
    }

    /**
     * 显示配置选项选择
     * 让用户选择自动配置、快速设置或手动配置
     * 
     * @returns Promise<string | undefined> 用户选择的配置模式
     * @since 0.2.6
     */
    private async showConfigurationOptions(): Promise<string | undefined> {
        const selection = await vscode.window.showQuickPick([
            {
                label: '$(zap) Auto-Configure All',
                description: 'Intelligent automatic setup',
                detail: 'Scan environment, detect project settings, and generate optimal configuration',
                value: 'auto_full'
            },
            {
                label: '$(rocket) Quick Setup',
                description: 'One-click basic setup',
                detail: 'Fast setup with default settings for common scenarios',
                value: 'auto_quick'
            },
            {
                label: '$(tools) Manual Configuration',
                description: 'Step-by-step guided setup',
                detail: 'Full control over toolchain detection and configuration',
                value: 'manual'
            }
        ], {
            placeHolder: 'Choose your STM32 configuration method',
            ignoreFocusOut: true
        });

        return selection?.value;
    }

    /**
     * 显示自动配置向导
     * 使用自动配置对话框进行完整的环境设置
     * 
     * @returns Promise<boolean> 配置是否成功
     * @since 0.2.6
     */
    public async showAutoConfigurationWizard(): Promise<boolean> {
        try {
            const result = await this.autoConfigDialog.showAutoConfigurationWizard();
            return result.success;
        } catch (error) {
            console.error('Auto-configuration wizard failed:', error);
            await vscode.window.showErrorMessage(
                `Auto-configuration failed: ${error instanceof Error ? error.message : String(error)}`
            );
            return false;
        }
    }

    /**
     * 显示快速设置
     * 使用一键快速配置功能
     * 
     * @returns Promise<boolean> 设置是否成功
     * @since 0.2.6
     */
    public async showQuickSetup(): Promise<boolean> {
        try {
            const result = await this.autoConfigDialog.oneClickQuickSetup();
            return result.success;
        } catch (error) {
            console.error('Quick setup failed:', error);
            await vscode.window.showErrorMessage(
                `Quick setup failed: ${error instanceof Error ? error.message : String(error)}`
            );
            return false;
        }
    }

    /**
     * 显示手动向导
     * 使用原有的手动检测和配置流程
     * 
     * @returns Promise<boolean> 配置是否成功
     * @since 0.2.6
     */
    public async showManualWizard(): Promise<boolean> {
        try {
            // 步骤1: 执行检测并显示进度
            const results = await this.progressHandler.executeDetection();

            // 步骤2: 显示结果并获取用户操作选择
            let userAction = await this.displayHandler.showResultsDialog(results);

            // 步骤3: 处理用户操作循环
            while (userAction !== UserAction.CANCEL && userAction !== UserAction.CONTINUE) {
                if (userAction === UserAction.CONFIGURE_MANUALLY) {
                    // 处理手动配置
                    await this.handleManualConfiguration(results);
                    userAction = await this.displayHandler.showResultsDialog(results);
                    
                } else if (userAction === UserAction.DOWNLOAD) {
                    // 处理下载链接
                    await this.interactionHandler.handleDownloadLinks();
                    userAction = await this.displayHandler.showResultsDialog(results);
                }
            }

            // 步骤4: 保存配置并返回结果
            if (userAction === UserAction.CONTINUE) {
                await this.configurationHandler.saveToolchainConfiguration(results);
                return true;
            }

            return false;

        } catch (error) {
            console.error('Error in manual toolchain wizard:', error);
            await vscode.window.showErrorMessage(
                `Manual toolchain detection failed: ${error instanceof Error ? error.message : String(error)}`
            );
            return false;
        }
    }

    /**
     * 处理手动配置流程
     * 
     * @private
     * @param results - 工具链检测结果，将被修改
     */
    private async handleManualConfiguration(results: any): Promise<void> {
        const failedToolchains = this.configurationHandler.getFailedToolchains(results);

        for (const toolchain of failedToolchains) {
            const path = await this.interactionHandler.handleManualConfiguration(toolchain);
            if (path) {
                this.configurationHandler.updateToolchainPath(results, toolchain, path);
            }
        }
    }
}