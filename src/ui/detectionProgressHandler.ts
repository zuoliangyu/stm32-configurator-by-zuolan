/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 工具链检测进度处理器模块
 * 负责执行工具链检测并显示进度
 * 
 * @fileoverview 工具链检测进度处理器
 * @author 左岚
 * @since 0.2.4
 */

import * as vscode from 'vscode';
import { LocalizationManager } from '../localization/localizationManager';
import { ToolchainDetectionService } from '../services/toolchainDetectionService';
import { findOpenOCDPath } from '../utils/openocd';
import { findArmToolchainPath, getArmToolchainInfo } from '../utils/armToolchain';
import { DetectionStatus, ToolchainDetectionResults } from './types';

/**
 * 工具链检测进度处理器类
 * 负责执行工具链检测过程并显示进度信息
 * 
 * @class DetectionProgressHandler
 * @since 0.2.4
 */
export class DetectionProgressHandler {
    /** 本地化管理器实例 */
    private localizationManager: LocalizationManager;
    /** 工具链检测服务实例 */
    private detectionService: ToolchainDetectionService;

    /**
     * 构造函数
     * 
     * @param localizationManager - 本地化管理器实例
     */
    constructor(localizationManager: LocalizationManager) {
        this.localizationManager = localizationManager;
        this.detectionService = ToolchainDetectionService.getInstance();
    }

    /**
     * 检测OpenOCD工具链
     * 
     * @private
     * @param progress - VSCode进度报告器
     * @returns Promise<ToolchainDetectionResult> OpenOCD检测结果
     */
    private async detectOpenOCD(
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ) {
        const l10n = this.localizationManager;
        
        progress.report({ 
            increment: 25, 
            message: l10n.getString('openocdDetectionStatus')
        });

        try {
            const openocdPath = await findOpenOCDPath();
            if (openocdPath) {
                return {
                    name: 'OpenOCD',
                    status: DetectionStatus.SUCCESS,
                    path: openocdPath
                };
            } else {
                return {
                    name: 'OpenOCD',
                    status: DetectionStatus.FAILED,
                    path: null,
                    error: l10n.getString('notFound')
                };
            }
        } catch (error) {
            return {
                name: 'OpenOCD',
                status: DetectionStatus.FAILED,
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
    private async detectArmToolchain(
        progress: vscode.Progress<{ increment?: number; message?: string }>
    ) {
        const l10n = this.localizationManager;
        
        progress.report({ 
            increment: 25, 
            message: l10n.getString('armToolchainDetectionStatus')
        });

        try {
            const armToolchainPath = await findArmToolchainPath();
            if (armToolchainPath) {
                const result: any = {
                    name: 'ARM Toolchain',
                    status: DetectionStatus.SUCCESS,
                    path: armToolchainPath
                };
                
                // 获取工具链详细信息
                try {
                    result.info = await getArmToolchainInfo(armToolchainPath);
                } catch (infoError) {
                    console.warn('Failed to get ARM toolchain info:', infoError);
                }
                
                return result;
            } else {
                return {
                    name: 'ARM Toolchain',
                    status: DetectionStatus.FAILED,
                    path: null,
                    error: l10n.getString('notFound')
                };
            }
        } catch (error) {
            return {
                name: 'ARM Toolchain',
                status: DetectionStatus.FAILED,
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
    public async executeDetection(): Promise<ToolchainDetectionResults> {
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
                    forceRedetection: true  // UI检测时总是强制重新检测
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

            } catch (error) {
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