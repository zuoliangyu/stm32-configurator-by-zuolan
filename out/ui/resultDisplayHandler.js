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
exports.ResultDisplayHandler = void 0;
/**
 * 检测结果展示处理器模块
 * 负责格式化和显示工具链检测结果
 *
 * @fileoverview 检测结果展示处理器
 * @author 左岚
 * @since 0.2.4
 */
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
/**
 * 检测结果展示处理器类
 * 负责格式化检测结果并显示给用户
 *
 * @class ResultDisplayHandler
 * @since 0.2.4
 */
class ResultDisplayHandler {
    /** 本地化管理器实例 */
    localizationManager;
    /**
     * 构造函数
     *
     * @param localizationManager - 本地化管理器实例
     */
    constructor(localizationManager) {
        this.localizationManager = localizationManager;
    }
    /**
     * 格式化工具链检测结果为可读文本
     * 将检测结果转换为用户友好的显示格式
     *
     * @param results - 工具链检测结果
     * @returns 格式化后的结果文本
     */
    formatDetectionResults(results) {
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
    formatSingleToolchainResult(result) {
        const l10n = this.localizationManager;
        let message = '';
        if (result.status === types_1.DetectionStatus.SUCCESS && result.path) {
            message += `✅ ${l10n.getString('detectionSuccess')}\n`;
            message += `📁 ${l10n.getString('foundAt')}: ${result.path}\n`;
            if (result.info) {
                const info = result.info;
                message += `🔖 ${l10n.getString('version')}: ${info.version}\n`;
                message += `🎯 ${l10n.getString('target')}: ${info.target}\n`;
            }
            message += '\n';
        }
        else {
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
    formatDownloadLinksSection(results) {
        const l10n = this.localizationManager;
        const hasFailures = results.openocd.status === types_1.DetectionStatus.FAILED ||
            results.armToolchain.status === types_1.DetectionStatus.FAILED;
        if (!hasFailures) {
            return '';
        }
        let message = `### ${l10n.getString('recommendedDownloadLinks')}\n`;
        if (results.openocd.status === types_1.DetectionStatus.FAILED) {
            message += `🔽 [${l10n.getString('downloadOpenOCD')}](https://openocd.org/pages/getting-openocd.html)\n`;
        }
        if (results.armToolchain.status === types_1.DetectionStatus.FAILED) {
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
    generateDialogOptions(results) {
        const l10n = this.localizationManager;
        const options = [];
        const hasSuccess = results.openocd.status === types_1.DetectionStatus.SUCCESS ||
            results.armToolchain.status === types_1.DetectionStatus.SUCCESS;
        const hasFailures = results.openocd.status === types_1.DetectionStatus.FAILED ||
            results.armToolchain.status === types_1.DetectionStatus.FAILED;
        // 如果有检测成功的工具链，显示继续按钮
        if (hasSuccess) {
            options.push({
                title: l10n.getString('continue'),
                action: types_1.UserAction.CONTINUE
            });
        }
        // 如果有检测失败的工具链，显示手动配置和下载按钮
        if (hasFailures) {
            options.push({
                title: l10n.getString('configureManually'),
                action: types_1.UserAction.CONFIGURE_MANUALLY
            });
            options.push({
                title: l10n.getString('downloadOpenOCD'),
                action: types_1.UserAction.DOWNLOAD
            });
        }
        // 总是显示取消按钮
        options.push({
            title: l10n.getString('cancel'),
            action: types_1.UserAction.CANCEL,
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
    async showResultsDialog(results) {
        const l10n = this.localizationManager;
        const message = this.formatDetectionResults(results);
        const options = this.generateDialogOptions(results);
        const selection = await vscode.window.showInformationMessage(l10n.getString('toolchainDetectionWizard'), {
            detail: message,
            modal: true
        }, ...options);
        return selection?.action || types_1.UserAction.CANCEL;
    }
}
exports.ResultDisplayHandler = ResultDisplayHandler;
//# sourceMappingURL=resultDisplayHandler.js.map