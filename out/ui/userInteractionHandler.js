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
exports.UserInteractionHandler = void 0;
/**
 * 用户交互处理器模块
 * 负责处理手动配置、下载链接和配置保存等用户交互
 *
 * @fileoverview 用户交互处理器
 * @author 左岚
 * @since 0.2.4
 */
const vscode = __importStar(require("vscode"));
/**
 * 用户交互处理器类
 * 负责处理各种用户交互操作
 *
 * @class UserInteractionHandler
 * @since 0.2.4
 */
class UserInteractionHandler {
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
     * 处理手动配置路径
     * 允许用户手动输入或选择工具链路径
     *
     * @param toolchainName - 工具链名称
     * @returns Promise<string | null> 用户输入的路径，取消则返回null
     */
    async handleManualConfiguration(toolchainName) {
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
        }
        else {
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
    async handleManualPathInput(toolchainName) {
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
    async handlePathBrowsing(toolchainName) {
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
    getDownloadLinks() {
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
    async handleDownloadLinks() {
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
exports.UserInteractionHandler = UserInteractionHandler;
//# sourceMappingURL=userInteractionHandler.js.map