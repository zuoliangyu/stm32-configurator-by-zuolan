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
exports.isCortexDebugInstalled = isCortexDebugInstalled;
exports.isCortexDebugActive = isCortexDebugActive;
exports.getCortexDebugVersion = getCortexDebugVersion;
exports.ensureCortexDebugInstalled = ensureCortexDebugInstalled;
exports.showCortexDebugStatus = showCortexDebugStatus;
/**
 * Cortex Debug扩展管理模块
 * 提供Cortex Debug扩展的检测、安装和管理功能
 * 用于确俜STM32调试所需的依赖扩展正常工作
 *
 * @fileoverview Cortex Debug扩展管理器
 * @author 左岚
 * @since 0.1.0
 */
const vscode = __importStar(require("vscode"));
/** Cortex Debug扩展的唯一标识符 */
const CORTEX_DEBUG_EXTENSION_ID = 'marus25.cortex-debug';
/**
 * 检查Cortex Debug扩展是否已安装
 * 通过VS Code的扩展API检查Cortex Debug扩展是否存在
 *
 * @returns 如果Cortex Debug扩展已安装返回true，否则返回false
 * @example
 * ```typescript
 * if (isCortexDebugInstalled()) {
 *   console.log('Cortex Debug is available');
 * }
 * ```
 * @since 0.1.0
 */
function isCortexDebugInstalled() {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension !== undefined;
}
/**
 * 检查Cortex Debug扩展是否已激活
 * 检查扩展是否不仅安装了而且已经被激活
 *
 * @returns 如果Cortex Debug扩展已激活返回true，否则返回false
 * @since 0.1.0
 */
function isCortexDebugActive() {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension?.isActive === true;
}
/**
 * 获取Cortex Debug扩展版本
 * 如果扩展已安装，返回其版本号
 *
 * @returns Cortex Debug扩展的版本号，如果未安装则返回null
 * @since 0.1.0
 */
function getCortexDebugVersion() {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension?.packageJSON?.version || null;
}
/**
 * 确俜Cortex Debug扩展已安装
 * 如果扩展未安装，会提示用户进行安装或打开应用商店
 *
 * @returns 如果扩展已安装或用户选择安装返回true，否则返回false
 * @throws {Error} 当安装扩展失败时显示错误消息并返回false
 * @example
 * ```typescript
 * const isReady = await ensureCortexDebugInstalled();
 * if (isReady) {
 *   // 继续调试配置
 * } else {
 *   // 用户取消或安装失败
 * }
 * ```
 * @since 0.1.0
 */
async function ensureCortexDebugInstalled() {
    if (isCortexDebugInstalled()) {
        return true;
    }
    const installOption = 'Install Cortex Debug';
    const openMarketplaceOption = 'Open in Marketplace';
    const skipOption = 'Skip';
    const result = await vscode.window.showWarningMessage('Cortex Debug extension is required for STM32 debugging but is not installed. Would you like to install it now?', { modal: false }, installOption, openMarketplaceOption, skipOption);
    switch (result) {
        case installOption:
            try {
                await vscode.commands.executeCommand('workbench.extensions.installExtension', CORTEX_DEBUG_EXTENSION_ID);
                vscode.window.showInformationMessage('Cortex Debug extension installed successfully. Please reload VSCode to activate it.');
                // Offer to reload VSCode
                const reloadOption = 'Reload Now';
                const laterOption = 'Later';
                const reloadChoice = await vscode.window.showInformationMessage('VSCode needs to be reloaded to activate the Cortex Debug extension.', reloadOption, laterOption);
                if (reloadChoice === reloadOption) {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
                return true;
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to install Cortex Debug extension: ${error}`);
                return false;
            }
        case openMarketplaceOption:
            await vscode.commands.executeCommand('extension.open', CORTEX_DEBUG_EXTENSION_ID);
            return false;
        default:
            return false;
    }
}
/**
 * 显示Cortex Debug扩展状态信息
 * 在VS Code中显示关于Cortex Debug扩展安装和激活状态的信息
 *
 * @example
 * ```typescript
 * showCortexDebugStatus();
 * // 会显示类似于 "Cortex Debug extension is installed (v1.5.0) and active." 的消息
 * ```
 * @since 0.1.0
 */
function showCortexDebugStatus() {
    if (!isCortexDebugInstalled()) {
        vscode.window.showWarningMessage('Cortex Debug extension is not installed.');
        return;
    }
    const version = getCortexDebugVersion();
    const status = isCortexDebugActive() ? 'active' : 'inactive';
    vscode.window.showInformationMessage(`Cortex Debug extension is installed (v${version}) and ${status}.`);
}
//# sourceMappingURL=cortex-debug.js.map