/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 用户交互处理器模块
 * 负责处理手动配置、下载链接和配置保存等用户交互
 * 
 * @fileoverview 用户交互处理器
 * @author 左岚
 * @since 0.2.4
 */

import * as vscode from 'vscode';
import { LocalizationManager } from '../localization/localizationManager';
import { DownloadLinkInfo } from './types';

/**
 * 用户交互处理器类
 * 负责处理各种用户交互操作
 * 
 * @class UserInteractionHandler
 * @since 0.2.4
 */
export class UserInteractionHandler {
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
     * 处理手动配置路径
     * 允许用户手动输入或选择工具链路径
     * 
     * @param toolchainName - 工具链名称
     * @returns Promise<string | null> 用户输入的路径，取消则返回null
     */
    public async handleManualConfiguration(toolchainName: string): Promise<string | null> {
        const l10n = this.localizationManager;
        
        const action = await vscode.window.showQuickPick([
            {
                label: `📝 ${l10n.getString('enterPathManually')}`,
                description: l10n.getString('enterPathManually'),
                action: 'input'
            },
            {
                label: `📂 ${l10n.getString('selectPath')}`,
                description: l10n.getString('selectPath'),
                action: 'browse'
            }
        ], {
            placeHolder: l10n.formatString('toolchainConfiguration', toolchainName),
            ignoreFocusOut: true
        });

        if (!action) {
            return null;
        }

        if (action.action === 'input') {
            return await this.handleManualPathInput(toolchainName);
        } else {
            return await this.handlePathBrowsing(toolchainName);
        }
    }

    /**
     * 处理手动路径输入
     * 
     * @private
     * @param toolchainName - 工具链名称
     * @returns Promise<string | null> 用户输入的路径
     */
    private async handleManualPathInput(toolchainName: string): Promise<string | null> {
        const l10n = this.localizationManager;
        
        const path = await vscode.window.showInputBox({
            prompt: l10n.formatString('enterPathManually', toolchainName),
            placeHolder: 'C:\\path\\to\\toolchain\\bin\\executable.exe',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return l10n.getString('invalidPath');
                }
                return null;
            }
        });
        
        return path || null;
    }

    /**
     * 处理路径浏览
     * 
     * @private
     * @param toolchainName - 工具链名称
     * @returns Promise<string | null> 用户选择的路径
     */
    private async handlePathBrowsing(toolchainName: string): Promise<string | null> {
        const l10n = this.localizationManager;
        
        const result = await vscode.window.showOpenDialog({
            canSelectMany: false,
            canSelectFiles: true,
            canSelectFolders: false,
            openLabel: l10n.getString('selectPath'),
            title: l10n.formatString('selectPath', toolchainName),
            filters: {
                'Executable files': process.platform === 'win32' ? ['exe'] : ['*']
            }
        });
        
        return result?.[0]?.fsPath || null;
    }

    /**
     * 获取下载链接信息
     * 
     * @private
     * @returns DownloadLinkInfo[] 下载链接信息数组
     */
    private getDownloadLinks(): DownloadLinkInfo[] {
        const l10n = this.localizationManager;
        
        return [
            {
                label: l10n.getString('downloadOpenOCD'),
                description: 'OpenOCD - Open On-Chip Debugger',
                url: 'https://openocd.org/pages/getting-openocd.html'
            },
            {
                label: l10n.getString('downloadArmToolchain'),
                description: 'ARM GNU Toolchain (arm-none-eabi-gcc)',
                url: 'https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads'
            }
        ];
    }

    /**
     * 处理下载链接打开
     * 在用户默认浏览器中打开下载页面
     */
    public async handleDownloadLinks(): Promise<void> {
        const l10n = this.localizationManager;
        const downloadLinks = this.getDownloadLinks();
        
        const selection = await vscode.window.showQuickPick(downloadLinks, {
            placeHolder: l10n.getString('recommendedDownloadLinks'),
            ignoreFocusOut: true
        });

        if (selection?.url) {
            await vscode.env.openExternal(vscode.Uri.parse(selection.url));
        }
    }

}