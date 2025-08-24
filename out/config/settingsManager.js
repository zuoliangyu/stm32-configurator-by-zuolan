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
exports.validateToolchainSettings = exports.globalSettingsManager = exports.GlobalSettingsManager = void 0;
exports.writeGlobalToolchainSettings = writeGlobalToolchainSettings;
exports.readGlobalToolchainSettings = readGlobalToolchainSettings;
/**
 * VSCode全局设置管理器
 * 提供工具链配置的读写和验证功能，专门处理Cortex-Debug扩展的全局配置
 *
 * @fileoverview 全局Settings配置管理器
 * @author 左岚
 * @since 0.2.3
 */
const vscode = __importStar(require("vscode"));
const pathUtils_1 = require("../utils/pathUtils");
const types_1 = require("./types");
const validation_1 = require("./validation");
/**
 * VSCode全局设置管理器类
 * 提供工具链配置的统一管理接口
 */
class GlobalSettingsManager {
    /** Cortex-Debug扩展配置键 */
    static CORTEX_DEBUG_SECTION = 'cortex-debug';
    /** OpenOCD路径配置键 */
    static OPENOCD_PATH_KEY = 'openocdPath';
    /** ARM工具链路径配置键 */
    static ARM_TOOLCHAIN_PATH_KEY = 'armToolchainPath';
    /**
     * 写入工具链配置到VSCode全局设置
     *
     * @param config - 工具链配置对象
     * @throws {SettingsError} 当配置写入失败时抛出
     * @example
     * ```typescript
     * const manager = new GlobalSettingsManager();
     * await manager.writeGlobalToolchainSettings({
     *     openocdPath: 'C:/OpenOCD/bin/openocd.exe',
     *     armToolchainPath: 'C:/gcc-arm/bin'
     * });
     * ```
     */
    async writeGlobalToolchainSettings(config) {
        try {
            // 验证配置有效性
            const validation = (0, validation_1.validateToolchainSettings)(config);
            if (!validation.isValid) {
                throw new types_1.SettingsError(`Configuration validation failed: ${validation.errors.join(', ')}`, 'validate');
            }
            const cortexDebugConfig = vscode.workspace.getConfiguration(GlobalSettingsManager.CORTEX_DEBUG_SECTION);
            // 标准化路径格式
            const updates = [];
            if (config.openocdPath) {
                const normalizedOpenOCDPath = (0, pathUtils_1.normalizePath)(config.openocdPath);
                updates.push(cortexDebugConfig.update(GlobalSettingsManager.OPENOCD_PATH_KEY, normalizedOpenOCDPath, vscode.ConfigurationTarget.Global));
            }
            if (config.armToolchainPath) {
                const normalizedArmPath = (0, pathUtils_1.normalizePath)(config.armToolchainPath);
                updates.push(cortexDebugConfig.update(GlobalSettingsManager.ARM_TOOLCHAIN_PATH_KEY, normalizedArmPath, vscode.ConfigurationTarget.Global));
            }
            // 并发执行配置更新
            await Promise.all(updates);
            // 记录成功信息
            console.log('Global toolchain settings updated successfully:', {
                openocdPath: config.openocdPath ? (0, pathUtils_1.normalizePath)(config.openocdPath) : undefined,
                armToolchainPath: config.armToolchainPath ? (0, pathUtils_1.normalizePath)(config.armToolchainPath) : undefined
            });
        }
        catch (error) {
            if (error instanceof types_1.SettingsError) {
                throw error;
            }
            throw new types_1.SettingsError(`Failed to write global toolchain settings: ${error.message}`, 'write', error);
        }
    }
    /**
     * 读取VSCode全局工具链配置
     *
     * @returns 当前的工具链配置
     * @throws {SettingsError} 当配置读取失败时抛出
     * @example
     * ```typescript
     * const manager = new GlobalSettingsManager();
     * const settings = await manager.readGlobalToolchainSettings();
     * console.log('OpenOCD Path:', settings.openocdPath);
     * ```
     */
    async readGlobalToolchainSettings() {
        try {
            const cortexDebugConfig = vscode.workspace.getConfiguration(GlobalSettingsManager.CORTEX_DEBUG_SECTION);
            const openocdPath = cortexDebugConfig.get(GlobalSettingsManager.OPENOCD_PATH_KEY);
            const armToolchainPath = cortexDebugConfig.get(GlobalSettingsManager.ARM_TOOLCHAIN_PATH_KEY);
            const settings = {};
            if (openocdPath && openocdPath.trim() !== '') {
                settings.openocdPath = openocdPath;
            }
            if (armToolchainPath && armToolchainPath.trim() !== '') {
                settings.armToolchainPath = armToolchainPath;
            }
            return settings;
        }
        catch (error) {
            throw new types_1.SettingsError(`Failed to read global toolchain settings: ${error.message}`, 'read', error);
        }
    }
    /**
     * 验证工具链配置的有效性
     * 检查路径格式和文件存在性
     *
     * @param config - 要验证的工具链配置
     * @returns 验证结果，包含错误和警告信息
     */
    validateToolchainSettings(config) {
        return (0, validation_1.validateToolchainSettings)(config);
    }
    /**
     * 清除指定的全局工具链配置
     *
     * @param keys - 要清除的配置键数组
     * @throws {SettingsError} 当配置清除失败时抛出
     */
    async clearGlobalToolchainSettings(keys = ['openocdPath', 'armToolchainPath']) {
        try {
            const cortexDebugConfig = vscode.workspace.getConfiguration(GlobalSettingsManager.CORTEX_DEBUG_SECTION);
            const updates = [];
            if (keys.includes('openocdPath')) {
                updates.push(cortexDebugConfig.update(GlobalSettingsManager.OPENOCD_PATH_KEY, undefined, vscode.ConfigurationTarget.Global));
            }
            if (keys.includes('armToolchainPath')) {
                updates.push(cortexDebugConfig.update(GlobalSettingsManager.ARM_TOOLCHAIN_PATH_KEY, undefined, vscode.ConfigurationTarget.Global));
            }
            await Promise.all(updates);
            console.log('Global toolchain settings cleared:', keys);
        }
        catch (error) {
            throw new types_1.SettingsError(`Failed to clear global toolchain settings: ${error.message}`, 'write', error);
        }
    }
}
exports.GlobalSettingsManager = GlobalSettingsManager;
/**
 * 全局设置管理器单例实例
 * 提供便捷的静态访问方法
 */
exports.globalSettingsManager = new GlobalSettingsManager();
/**
 * 写入全局工具链设置的便捷函数
 *
 * @param config - 工具链配置对象
 * @throws {SettingsError} 当配置写入失败时抛出
 */
async function writeGlobalToolchainSettings(config) {
    return exports.globalSettingsManager.writeGlobalToolchainSettings(config);
}
/**
 * 读取全局工具链设置的便捷函数
 *
 * @returns 当前的工具链配置
 * @throws {SettingsError} 当配置读取失败时抛出
 */
async function readGlobalToolchainSettings() {
    return exports.globalSettingsManager.readGlobalToolchainSettings();
}
// 重新导出验证函数
var validation_2 = require("./validation");
Object.defineProperty(exports, "validateToolchainSettings", { enumerable: true, get: function () { return validation_2.validateToolchainSettings; } });
//# sourceMappingURL=settingsManager.js.map