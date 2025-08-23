/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Cortex Debug扩展管理模块
 * 提供Cortex Debug扩展的检测、安装和管理功能
 * 用于确俜STM32调试所需的依赖扩展正常工作
 * 
 * @fileoverview Cortex Debug扩展管理器
 * @author 左岚
 * @since 0.1.0
 */

import * as vscode from 'vscode';

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
export function isCortexDebugInstalled(): boolean {
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
export function isCortexDebugActive(): boolean {
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
export function getCortexDebugVersion(): string | null {
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
export async function ensureCortexDebugInstalled(): Promise<boolean> {
    if (isCortexDebugInstalled()) {
        return true;
    }

    const installOption = 'Install Cortex Debug';
    const openMarketplaceOption = 'Open in Marketplace';
    const skipOption = 'Skip';

    const result = await vscode.window.showWarningMessage(
        'Cortex Debug extension is required for STM32 debugging but is not installed. Would you like to install it now?',
        { modal: false },
        installOption,
        openMarketplaceOption,
        skipOption
    );

    switch (result) {
        case installOption:
            try {
                await vscode.commands.executeCommand('workbench.extensions.installExtension', CORTEX_DEBUG_EXTENSION_ID);
                vscode.window.showInformationMessage('Cortex Debug extension installed successfully. Please reload VSCode to activate it.');
                
                // Offer to reload VSCode
                const reloadOption = 'Reload Now';
                const laterOption = 'Later';
                const reloadChoice = await vscode.window.showInformationMessage(
                    'VSCode needs to be reloaded to activate the Cortex Debug extension.',
                    reloadOption,
                    laterOption
                );
                
                if (reloadChoice === reloadOption) {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
                
                return true;
            } catch (error) {
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
export function showCortexDebugStatus(): void {
    if (!isCortexDebugInstalled()) {
        vscode.window.showWarningMessage('Cortex Debug extension is not installed.');
        return;
    }

    const version = getCortexDebugVersion();
    const status = isCortexDebugActive() ? 'active' : 'inactive';
    
    vscode.window.showInformationMessage(
        `Cortex Debug extension is installed (v${version}) and ${status}.`
    );
}