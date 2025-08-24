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
exports.ConfigurationHandler = void 0;
/**
 * 配置保存处理器模块
 * 负责保存工具链配置到VSCode设置中
 *
 * @fileoverview 配置保存处理器
 * @author 左岚
 * @since 0.2.4
 */
const vscode = __importStar(require("vscode"));
const types_1 = require("./types");
/**
 * 配置保存处理器类
 * 负责将工具链配置保存到VSCode设置中
 *
 * @class ConfigurationHandler
 * @since 0.2.4
 */
class ConfigurationHandler {
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
     * 保存OpenOCD配置
     *
     * @private
     * @param path - OpenOCD可执行文件路径
     */
    async saveOpenOCDConfiguration(path) {
        const config = vscode.workspace.getConfiguration();
        await config.update('stm32-configurator.openocdPath', path, vscode.ConfigurationTarget.Global);
    }
    /**
     * 保存ARM工具链配置
     *
     * @private
     * @param path - ARM工具链可执行文件路径
     */
    async saveArmToolchainConfiguration(path) {
        const config = vscode.workspace.getConfiguration();
        await config.update('cortex-debug.armToolchainPath', path, vscode.ConfigurationTarget.Global);
    }
    /**
     * 保存工具链配置
     * 将检测到或用户配置的路径保存到VSCode配置中
     *
     * @param results - 工具链检测结果
     */
    async saveToolchainConfiguration(results) {
        const l10n = this.localizationManager;
        try {
            // 保存OpenOCD路径
            if (results.openocd.status === types_1.DetectionStatus.SUCCESS && results.openocd.path) {
                await this.saveOpenOCDConfiguration(results.openocd.path);
            }
            // 保存ARM工具链路径
            if (results.armToolchain.status === types_1.DetectionStatus.SUCCESS && results.armToolchain.path) {
                await this.saveArmToolchainConfiguration(results.armToolchain.path);
            }
            await vscode.window.showInformationMessage(l10n.getString('configurationSaved'));
        }
        catch (error) {
            console.error('Error saving toolchain configuration:', error);
            await vscode.window.showErrorMessage(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 获取检测失败的工具链列表
     *
     * @param results - 工具链检测结果
     * @returns string[] 失败的工具链名称数组
     */
    getFailedToolchains(results) {
        const failedToolchains = [];
        if (results.openocd.status === types_1.DetectionStatus.FAILED) {
            failedToolchains.push('OpenOCD');
        }
        if (results.armToolchain.status === types_1.DetectionStatus.FAILED) {
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
    updateToolchainPath(results, toolchainName, path) {
        if (toolchainName === 'OpenOCD') {
            results.openocd.status = types_1.DetectionStatus.SUCCESS;
            results.openocd.path = path;
        }
        else if (toolchainName === 'ARM Toolchain') {
            results.armToolchain.status = types_1.DetectionStatus.SUCCESS;
            results.armToolchain.path = path;
        }
    }
}
exports.ConfigurationHandler = ConfigurationHandler;
//# sourceMappingURL=configurationHandler.js.map