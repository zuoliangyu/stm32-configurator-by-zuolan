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
exports.saveDetectionResultsToGlobalSettings = saveDetectionResultsToGlobalSettings;
exports.displayCurrentGlobalSettings = displayCurrentGlobalSettings;
exports.smartConfigUpdate = smartConfigUpdate;
exports.batchConfigOperations = batchConfigOperations;
exports.registerSettingsCommands = registerSettingsCommands;
/**
 * 配置管理器使用示例
 * 演示如何将工具链检测结果保存到VSCode全局配置
 *
 * @fileoverview 配置管理器使用示例
 * @author 左岚
 * @since 0.2.3
 */
const vscode = __importStar(require("vscode"));
const settingsManager_1 = require("./settingsManager");
const types_1 = require("./types");
/**
 * 示例：将工具链检测结果保存到全局配置
 * 模拟从工具链检测服务获取结果并保存到VSCode配置
 */
async function saveDetectionResultsToGlobalSettings() {
    try {
        // 模拟工具链检测结果
        const detectionResults = {
            openocd: {
                path: 'C:/OpenOCD/bin/openocd.exe',
                status: 'found'
            },
            armToolchain: {
                path: 'C:/gcc-arm-none-eabi/bin',
                status: 'found'
            }
        };
        // 构建配置对象
        const toolchainConfig = {};
        if (detectionResults.openocd.status === 'found') {
            toolchainConfig.openocdPath = detectionResults.openocd.path;
        }
        if (detectionResults.armToolchain.status === 'found') {
            toolchainConfig.armToolchainPath = detectionResults.armToolchain.path;
        }
        // 验证配置
        const validationResult = (0, settingsManager_1.validateToolchainSettings)(toolchainConfig);
        if (!validationResult.isValid) {
            console.warn('Configuration validation failed:', validationResult.errors);
            return;
        }
        if (validationResult.warnings.length > 0) {
            console.warn('Configuration warnings:', validationResult.warnings);
        }
        // 写入全局配置
        await (0, settingsManager_1.writeGlobalToolchainSettings)(toolchainConfig);
        // 显示成功消息
        const configuredPaths = [];
        if (toolchainConfig.openocdPath) {
            configuredPaths.push(`OpenOCD: ${toolchainConfig.openocdPath}`);
        }
        if (toolchainConfig.armToolchainPath) {
            configuredPaths.push(`ARM Toolchain: ${toolchainConfig.armToolchainPath}`);
        }
        vscode.window.showInformationMessage(`Toolchain paths saved to global settings:\n${configuredPaths.join('\n')}`);
    }
    catch (error) {
        if (error instanceof types_1.SettingsError) {
            vscode.window.showErrorMessage(`Failed to save toolchain settings: ${error.message}`);
        }
        else {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Unexpected error: ${errorMessage}`);
        }
    }
}
/**
 * 示例：读取和显示当前全局配置
 */
async function displayCurrentGlobalSettings() {
    try {
        const currentSettings = await (0, settingsManager_1.readGlobalToolchainSettings)();
        const configInfo = [];
        if (currentSettings.openocdPath) {
            configInfo.push(`OpenOCD Path: ${currentSettings.openocdPath}`);
        }
        if (currentSettings.armToolchainPath) {
            configInfo.push(`ARM Toolchain Path: ${currentSettings.armToolchainPath}`);
        }
        if (configInfo.length > 0) {
            vscode.window.showInformationMessage(`Current Global Settings:\n${configInfo.join('\n')}`);
        }
        else {
            vscode.window.showInformationMessage('No toolchain paths configured in global settings.');
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to read global settings: ${error.message}`);
    }
}
/**
 * 示例：智能配置更新
 * 仅在检测到更新的工具链路径时才写入配置
 */
async function smartConfigUpdate(newOpenOCDPath, newArmToolchainPath) {
    try {
        // 读取当前配置
        const currentSettings = await (0, settingsManager_1.readGlobalToolchainSettings)();
        // 构建新配置
        const newSettings = {};
        let hasChanges = false;
        // 检查OpenOCD路径变化
        if (newOpenOCDPath && newOpenOCDPath !== currentSettings.openocdPath) {
            newSettings.openocdPath = newOpenOCDPath;
            hasChanges = true;
        }
        // 检查ARM工具链路径变化
        if (newArmToolchainPath && newArmToolchainPath !== currentSettings.armToolchainPath) {
            newSettings.armToolchainPath = newArmToolchainPath;
            hasChanges = true;
        }
        if (!hasChanges) {
            console.log('No configuration changes detected, skipping update.');
            return;
        }
        // 验证新配置
        const validation = (0, settingsManager_1.validateToolchainSettings)(newSettings);
        if (!validation.isValid) {
            throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
        // 写入配置
        await (0, settingsManager_1.writeGlobalToolchainSettings)(newSettings);
        console.log('Global toolchain settings updated with changes:', newSettings);
        vscode.window.showInformationMessage(`Updated global toolchain settings.`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to update toolchain settings: ${error.message}`);
    }
}
/**
 * 示例：批量配置操作
 * 演示如何处理多个配置操作
 */
async function batchConfigOperations() {
    const manager = settingsManager_1.globalSettingsManager;
    try {
        // 1. 读取当前配置
        console.log('Step 1: Reading current configuration...');
        const current = await manager.readGlobalToolchainSettings();
        console.log('Current settings:', current);
        // 2. 验证示例配置
        console.log('Step 2: Validating new configuration...');
        const testConfig = {
            openocdPath: 'C:/Tools/OpenOCD/bin/openocd.exe',
            armToolchainPath: 'C:/Tools/gcc-arm-none-eabi/bin'
        };
        const validation = manager.validateToolchainSettings(testConfig);
        console.log('Validation result:', validation);
        if (validation.isValid) {
            // 3. 写入新配置
            console.log('Step 3: Writing new configuration...');
            await manager.writeGlobalToolchainSettings(testConfig);
            // 4. 验证写入结果
            console.log('Step 4: Verifying written configuration...');
            const updated = await manager.readGlobalToolchainSettings();
            console.log('Updated settings:', updated);
        }
        else {
            console.warn('Configuration validation failed, skipping write operation.');
        }
    }
    catch (error) {
        console.error('Batch configuration operation failed:', error);
    }
}
/**
 * VSCode命令注册示例
 * 演示如何将配置管理功能注册为VSCode命令
 */
function registerSettingsCommands(context) {
    // 保存检测结果命令
    const saveCommand = vscode.commands.registerCommand('stm32-configurator.saveDetectionResults', saveDetectionResultsToGlobalSettings);
    // 显示当前配置命令
    const showCommand = vscode.commands.registerCommand('stm32-configurator.showGlobalSettings', displayCurrentGlobalSettings);
    // 批量操作命令
    const batchCommand = vscode.commands.registerCommand('stm32-configurator.batchConfigOperations', batchConfigOperations);
    context.subscriptions.push(saveCommand, showCommand, batchCommand);
}
//# sourceMappingURL=usage-example.js.map