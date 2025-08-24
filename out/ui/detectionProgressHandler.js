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
exports.DetectionProgressHandler = void 0;
/**
 * 工具链检测进度处理器模块
 * 负责执行工具链检测并显示进度
 *
 * @fileoverview 工具链检测进度处理器
 * @author 左岚
 * @since 0.2.4
 */
const vscode = __importStar(require("vscode"));
const toolchainDetectionService_1 = require("../services/toolchainDetectionService");
const openocd_1 = require("../utils/openocd");
const armToolchain_1 = require("../utils/armToolchain");
const types_1 = require("./types");
/**
 * 工具链检测进度处理器类
 * 负责执行工具链检测过程并显示进度信息
 *
 * @class DetectionProgressHandler
 * @since 0.2.4
 */
class DetectionProgressHandler {
    /** 本地化管理器实例 */
    localizationManager;
    /** 工具链检测服务实例 */
    detectionService;
    /**
     * 构造函数
     *
     * @param localizationManager - 本地化管理器实例
     */
    constructor(localizationManager) {
        this.localizationManager = localizationManager;
        this.detectionService = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
    }
    /**
     * 检测OpenOCD工具链
     *
     * @private
     * @param progress - VSCode进度报告器
     * @returns Promise<ToolchainDetectionResult> OpenOCD检测结果
     */
    async detectOpenOCD(progress) {
        const l10n = this.localizationManager;
        progress.report({
            increment: 25,
            message: l10n.getString('openocdDetectionStatus')
        });
        try {
            const openocdPath = await (0, openocd_1.findOpenOCDPath)();
            if (openocdPath) {
                return {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: openocdPath
                };
            }
            else {
                return {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.FAILED,
                    path: null,
                    error: l10n.getString('notFound')
                };
            }
        }
        catch (error) {
            return {
                name: 'OpenOCD',
                status: types_1.DetectionStatus.FAILED,
                path: null,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 检测ARM工具链
     *
     * @private
     * @param progress - VSCode进度报告器
     * @returns Promise<ToolchainDetectionResult> ARM工具链检测结果
     */
    async detectArmToolchain(progress) {
        const l10n = this.localizationManager;
        progress.report({
            increment: 25,
            message: l10n.getString('armToolchainDetectionStatus')
        });
        try {
            const armToolchainPath = await (0, armToolchain_1.findArmToolchainPath)();
            if (armToolchainPath) {
                const result = {
                    name: 'ARM Toolchain',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: armToolchainPath
                };
                // 获取工具链详细信息
                try {
                    result.info = await (0, armToolchain_1.getArmToolchainInfo)(armToolchainPath);
                }
                catch (infoError) {
                    console.warn('Failed to get ARM toolchain info:', infoError);
                }
                return result;
            }
            else {
                return {
                    name: 'ARM Toolchain',
                    status: types_1.DetectionStatus.FAILED,
                    path: null,
                    error: l10n.getString('notFound')
                };
            }
        }
        catch (error) {
            return {
                name: 'ARM Toolchain',
                status: types_1.DetectionStatus.FAILED,
                path: null,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 执行工具链检测并显示进度
     * 使用VSCode Progress API显示检测进度，集成统一检测服务
     *
     * @returns Promise<ToolchainDetectionResults> 完整的检测结果
     */
    async executeDetection() {
        const l10n = this.localizationManager;
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: l10n.getString('toolchainDetectionTitle'),
            cancellable: false
        }, async (progress) => {
            // 显示检测开始
            progress.report({
                increment: 0,
                message: l10n.getString('detectingToolchains')
            });
            try {
                // 使用统一检测服务
                const extendedResults = await this.detectionService.detectToolchains({
                    forceRedetection: true // UI检测时总是强制重新检测
                });
                // 更新进度
                progress.report({
                    increment: 50,
                    message: l10n.getString('openocdDetectionStatus')
                });
                // 再次更新进度
                progress.report({
                    increment: 25,
                    message: l10n.getString('armToolchainDetectionStatus')
                });
                // 完成检测
                progress.report({
                    increment: 25,
                    message: l10n.getString('toolchainDetectionComplete')
                });
                // 转换为UI兼容格式
                return this.detectionService.toUICompatibleResults(extendedResults);
            }
            catch (error) {
                console.error('Detection service error:', error);
                // 如果统一服务失败，回退到原有逻辑
                const [openocdResult, armToolchainResult] = await Promise.all([
                    this.detectOpenOCD(progress),
                    this.detectArmToolchain(progress)
                ]);
                progress.report({
                    increment: 50,
                    message: l10n.getString('toolchainDetectionComplete')
                });
                return {
                    openocd: openocdResult,
                    armToolchain: armToolchainResult
                };
            }
        });
    }
}
exports.DetectionProgressHandler = DetectionProgressHandler;
//# sourceMappingURL=detectionProgressHandler.js.map