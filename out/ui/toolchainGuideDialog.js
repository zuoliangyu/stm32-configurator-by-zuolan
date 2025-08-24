"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolchainGuideDialog = void 0;
/**
 * 工具链引导对话框主类
 * 协调工具链检测和配置向导的各个组件
 *
 * @fileoverview 工具链引导对话框
 * @author 左岚
 * @since 0.2.4
 */
const vscode = __importStar(require("vscode"));
const localizationManager_1 = require("../localization/localizationManager");
const detectionProgressHandler_1 = require("./detectionProgressHandler");
const resultDisplayHandler_1 = require("./resultDisplayHandler");
const userInteractionHandler_1 = require("./userInteractionHandler");
const configurationHandler_1 = require("./configurationHandler");
const autoConfigurationDialog_1 = require("./autoConfigurationDialog");
const types_1 = require("./types");
/**
 * 工具链引导对话框类
 * 提供工具链检测和配置向导功能的主控制器
 *
 * @class ToolchainGuideDialog
 * @since 0.2.4
 */
class ToolchainGuideDialog {
    /** 本地化管理器实例 */
    localizationManager;
    /** 检测进度处理器 */
    progressHandler;
    /** 结果展示处理器 */
    displayHandler;
    /** 用户交互处理器 */
    interactionHandler;
    /** 配置保存处理器 */
    configurationHandler;
    /** 自动配置对话框 */
    autoConfigDialog;
    /**
     * 构造函数
     * 初始化工具链引导对话框和各个处理器组件
     *
     * @param context - VS Code扩展上下文
     */
    constructor(context) {
        this.localizationManager = localizationManager_1.LocalizationManager.getInstance(context);
        this.progressHandler = new detectionProgressHandler_1.DetectionProgressHandler(this.localizationManager);
        this.displayHandler = new resultDisplayHandler_1.ResultDisplayHandler(this.localizationManager);
        this.interactionHandler = new userInteractionHandler_1.UserInteractionHandler(this.localizationManager);
        this.configurationHandler = new configurationHandler_1.ConfigurationHandler(this.localizationManager);
        this.autoConfigDialog = new autoConfigurationDialog_1.AutoConfigurationDialog(context);
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
    async showWizard() {
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
    async showConfigurationOptions() {
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
    async showAutoConfigurationWizard() {
        try {
            const result = await this.autoConfigDialog.showAutoConfigurationWizard();
            return result.success;
        }
        catch (error) {
            console.error('Auto-configuration wizard failed:', error);
            await vscode.window.showErrorMessage(`Auto-configuration failed: ${error instanceof Error ? error.message : String(error)}`);
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
    async showQuickSetup() {
        try {
            const result = await this.autoConfigDialog.oneClickQuickSetup();
            return result.success;
        }
        catch (error) {
            console.error('Quick setup failed:', error);
            await vscode.window.showErrorMessage(`Quick setup failed: ${error instanceof Error ? error.message : String(error)}`);
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
    async showManualWizard() {
        try {
            // 步骤1: 执行检测并显示进度
            const results = await this.progressHandler.executeDetection();
            // 步骤2: 显示结果并获取用户操作选择
            let userAction = await this.displayHandler.showResultsDialog(results);
            // 步骤3: 处理用户操作循环
            while (userAction !== types_1.UserAction.CANCEL && userAction !== types_1.UserAction.CONTINUE) {
                if (userAction === types_1.UserAction.CONFIGURE_MANUALLY) {
                    // 处理手动配置
                    await this.handleManualConfiguration(results);
                    userAction = await this.displayHandler.showResultsDialog(results);
                }
                else if (userAction === types_1.UserAction.DOWNLOAD) {
                    // 处理下载链接
                    await this.interactionHandler.handleDownloadLinks();
                    userAction = await this.displayHandler.showResultsDialog(results);
                }
            }
            // 步骤4: 保存配置并返回结果
            if (userAction === types_1.UserAction.CONTINUE) {
                await this.configurationHandler.saveToolchainConfiguration(results);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error in manual toolchain wizard:', error);
            await vscode.window.showErrorMessage(`Manual toolchain detection failed: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }
    /**
     * 处理手动配置流程
     *
     * @private
     * @param results - 工具链检测结果，将被修改
     */
    async handleManualConfiguration(results) {
        const failedToolchains = this.configurationHandler.getFailedToolchains(results);
        for (const toolchain of failedToolchains) {
            const path = await this.interactionHandler.handleManualConfiguration(toolchain);
            if (path) {
                this.configurationHandler.updateToolchainPath(results, toolchain, path);
            }
        }
    }
}
exports.ToolchainGuideDialog = ToolchainGuideDialog;
//# sourceMappingURL=toolchainGuideDialog.js.map