/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * STM32树形项目模块
 * 定义树形视图中的各种项目类型和属性
 * 
 * @fileoverview STM32树形视图项目定义
 * @author 左岚
 * @since 0.1.0
 */

import * as vscode from 'vscode';
import { DebugConfiguration, RecentConfig } from './types';

/**
 * STM32树形项目类
 * 继承VS Code的TreeItem，为STM32配置器提供专用的树形视图项目
 * 
 * @class STM32TreeItem
 * @extends vscode.TreeItem
 * @since 0.1.0
 */
export class STM32TreeItem extends vscode.TreeItem {
    /**
     * 构造STM32树形项目
     * 
     * @param label - 项目显示的标签文本
     * @param collapsibleState - 项目的折叠状态
     * @param contextValue - 项目上下文值，用于区分项目类型
     * @param config - 关联的配置对象（调试配置或最近配置）
     */
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue?: string,
        public readonly config?: DebugConfiguration | RecentConfig
    ) {
        super(label, collapsibleState);
        this.tooltip = this.getTooltip();
        this.iconPath = this.getIcon();
    }

    /**
     * 获取项目的工具提示
     * 根据项目类型和关联配置生成相应的提示信息
     * 
     * @private
     * @returns 工具提示字符串
     */
    private getTooltip(): string {
        if (this.contextValue === 'configuration' && this.config) {
            const debugConfig = this.config as DebugConfiguration;
            return `Device: ${debugConfig.device || 'Unknown'}\nType: ${debugConfig.servertype || debugConfig.type}`;
        }
        if (this.contextValue === 'recentConfig' && this.config) {
            const recentConfig = this.config as RecentConfig;
            const date = new Date(recentConfig.timestamp);
            return `Device: ${recentConfig.deviceName}\nUsed: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }
        return this.label;
    }

    /**
     * 获取项目的图标
     * 根据项目上下文值选择合适的主题图标
     * 
     * @private
     * @returns VS Code主题图标实例
     */
    private getIcon(): vscode.ThemeIcon {
        switch (this.contextValue) {
            case 'configuration':
                return new vscode.ThemeIcon('debug-alt');
            case 'recentConfig':
                return new vscode.ThemeIcon('history');
            case 'quickAction':
                return new vscode.ThemeIcon('add');
            case 'category':
                return new vscode.ThemeIcon('folder');
            default:
                return new vscode.ThemeIcon('file');
        }
    }
}