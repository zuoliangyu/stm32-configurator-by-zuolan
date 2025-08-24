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
exports.saveDetectedToolchainPaths = saveDetectedToolchainPaths;
exports.registerToolchainSettingsCommands = registerToolchainSettingsCommands;
exports.enhancedGenerateConfiguration = enhancedGenerateConfiguration;
/**
 * 配置管理器与现有扩展的集成示例
 * 展示如何在extension.ts中使用配置管理器功能
 *
 * @fileoverview 配置管理器集成示例
 * @author 左岚
 * @since 0.2.3
 */
const vscode = __importStar(require("vscode"));
const index_1 = require("./index");
/**
 * 扩展检测到工具链路径后保存到全局配置的示例
 * 这个函数可以在extension.ts中的工具链检测逻辑后调用
 */
async function saveDetectedToolchainPaths(openocdPath, armToolchainPath) {
    try {
        const config = {};
        if (openocdPath) {
            config.openocdPath = openocdPath;
        }
        if (armToolchainPath) {
            config.armToolchainPath = armToolchainPath;
        }
        // 只有在有配置项时才保存
        if (Object.keys(config).length > 0) {
            await (0, index_1.writeGlobalToolchainSettings)(config);
            const pathInfo = [];
            if (config.openocdPath) {
                pathInfo.push(`OpenOCD: ${config.openocdPath}`);
            }
            if (config.armToolchainPath) {
                pathInfo.push(`ARM Toolchain: ${config.armToolchainPath}`);
            }
            vscode.window.showInformationMessage(`Toolchain paths saved to global settings:\n${pathInfo.join('\n')}`);
        }
    }
    catch (error) {
        if (error instanceof index_1.SettingsError) {
            console.error('Failed to save toolchain settings:', error.message);
        }
        else {
            console.error('Unexpected error saving toolchain settings:', error);
        }
    }
}
/**
 * 在extension.ts的activate函数中可以添加的命令示例
 */
function registerToolchainSettingsCommands(context) {
    // 注册保存工具链设置命令
    const saveSettingsCommand = vscode.commands.registerCommand('stm32-configurator-by-zuolan.saveToolchainSettings', async () => {
        // 这里可以调用工具链检测服务，然后保存结果
        // 示例中使用固定路径
        await saveDetectedToolchainPaths('C:/OpenOCD/bin/openocd.exe', 'C:/gcc-arm-none-eabi/bin');
    });
    context.subscriptions.push(saveSettingsCommand);
}
/**
 * 修改现有generateConfiguration函数的示例
 * 展示如何在生成配置时使用统一的路径标准化
 */
function enhancedGenerateConfiguration(data) {
    // 如果数据中包含OpenOCD路径，确保它被保存到全局配置
    if (data.servertype === 'openocd' && data.openocdPath && data.openocdPath.trim() !== '') {
        // 使用新的配置管理器而不是直接调用VSCode API
        saveDetectedToolchainPaths(data.openocdPath).catch(error => {
            console.error('Failed to save OpenOCD path to global settings:', error);
        });
    }
    // 其他配置生成逻辑...
    console.log('Enhanced configuration generation with global settings support');
}
//# sourceMappingURL=integration-example.js.map