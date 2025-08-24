/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 检测结果展示处理器模块
 * 负责格式化和显示工具链检测结果
 * 
 * @fileoverview 检测结果展示处理器
 * @author 左岚
 * @since 0.2.4
 */

import * as vscode from 'vscode';
import { LocalizationManager } from '../localization/localizationManager';
import { DetectionStatus, ToolchainDetectionResults, UserAction } from './types';

/**
 * 检测结果展示处理器类
 * 负责格式化检测结果并显示给用户
 * 
 * @class ResultDisplayHandler
 * @since 0.2.4
 */
export class ResultDisplayHandler {
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
     * 格式化工具链检测结果为可读文本
     * 将检测结果转换为用户友好的显示格式
     * 
     * @param results - 工具链检测结果
     * @returns 格式化后的结果文本
     */
    public formatDetectionResults(results: ToolchainDetectionResults): string {
        const l10n = this.localizationManager;
        let message = `## ${l10n.getString('autoDetectionResults')}\n\n`;

        // OpenOCD结果
        message += `### ${l10n.getString('openocdDetectionStatus')}\n`;
        message += this.formatSingleToolchainResult(results.openocd);

        // ARM工具链结果
        message += `### ${l10n.getString('armToolchainDetectionStatus')}\n`;
        message += this.formatSingleToolchainResult(results.armToolchain);

        // 添加下载链接部分
        message += this.formatDownloadLinksSection(results);

        return message;
    }

    /**
     * 格式化单个工具链的检测结果
     * 
     * @private
     * @param result - 单个工具链的检测结果
     * @returns 格式化后的结果文本
     */
    private formatSingleToolchainResult(result: any): string {
        const l10n = this.localizationManager;
        let message = '';

        if (result.status === DetectionStatus.SUCCESS && result.path) {
            message += `✅ ${l10n.getString('detectionSuccess')}\n`;
            message += `📁 ${l10n.getString('foundAt')}: ${result.path}\n`;
            
            if (result.info) {
                const info = result.info;
                message += `🔖 ${l10n.getString('version')}: ${info.version}\n`;
                message += `🎯 ${l10n.getString('target')}: ${info.target}\n`;
            }
            message += '\n';
        } else {
            message += `❌ ${l10n.getString('detectionFailed')}\n`;
            message += `📝 ${result.error || l10n.getString('notFound')}\n\n`;
        }

        return message;
    }

    /**
     * 格式化下载链接部分
     * 
     * @private
     * @param results - 工具链检测结果
     * @returns 下载链接部分的文本
     */
    private formatDownloadLinksSection(results: ToolchainDetectionResults): string {
        const l10n = this.localizationManager;
        const hasFailures = results.openocd.status === DetectionStatus.FAILED || 
                           results.armToolchain.status === DetectionStatus.FAILED;

        if (!hasFailures) {
            return '';
        }

        let message = `### ${l10n.getString('recommendedDownloadLinks')}\n`;
        
        if (results.openocd.status === DetectionStatus.FAILED) {
            message += `🔽 [${l10n.getString('downloadOpenOCD')}](https://openocd.org/pages/getting-openocd.html)\n`;
        }
        
        if (results.armToolchain.status === DetectionStatus.FAILED) {
            message += `🔽 [${l10n.getString('downloadArmToolchain')}](https://developer.arm.com/downloads/-/gnu-rm)\n`;
        }
        
        message += '\n';
        return message;
    }

    /**
     * 生成对话框选项按钮
     * 根据检测结果生成相应的用户操作选项
     * 
     * @param results - 工具链检测结果
     * @returns VSCode消息框选项数组
     */
    public generateDialogOptions(results: ToolchainDetectionResults): (vscode.MessageItem & { action: UserAction })[] {
        const l10n = this.localizationManager;
        const options: (vscode.MessageItem & { action: UserAction })[] = [];

        const hasSuccess = results.openocd.status === DetectionStatus.SUCCESS || 
                          results.armToolchain.status === DetectionStatus.SUCCESS;
        const hasFailures = results.openocd.status === DetectionStatus.FAILED || 
                           results.armToolchain.status === DetectionStatus.FAILED;

        // 如果有检测成功的工具链，显示继续按钮
        if (hasSuccess) {
            options.push({
                title: l10n.getString('continue'),
                action: UserAction.CONTINUE
            });
        }

        // 如果有检测失败的工具链，显示手动配置和下载按钮
        if (hasFailures) {
            options.push({
                title: l10n.getString('configureManually'),
                action: UserAction.CONFIGURE_MANUALLY
            });
            
            options.push({
                title: l10n.getString('downloadOpenOCD'),
                action: UserAction.DOWNLOAD
            });
        }

        // 总是显示取消按钮
        options.push({
            title: l10n.getString('cancel'),
            action: UserAction.CANCEL,
            isCloseAffordance: true
        });

        return options;
    }

    /**
     * 显示检测结果对话框
     * 显示格式化的检测结果并获取用户选择
     * 
     * @param results - 工具链检测结果
     * @returns Promise<UserAction> 用户选择的操作
     */
    public async showResultsDialog(results: ToolchainDetectionResults): Promise<UserAction> {
        const l10n = this.localizationManager;
        const message = this.formatDetectionResults(results);
        const options = this.generateDialogOptions(results);

        const selection = await vscode.window.showInformationMessage(
            l10n.getString('toolchainDetectionWizard'),
            { 
                detail: message,
                modal: true 
            },
            ...options
        );

        return selection?.action || UserAction.CANCEL;
    }
}