/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * STM32树形数据提供器模块
 * 实现VS Code的TreeDataProvider接口，为STM32配置器提供树形视图数据
 * 
 * @fileoverview STM32树形视图数据提供器
 * @author 左岚
 * @since 0.1.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DebugConfiguration } from './types';
import { STM32TreeItem } from './stm32TreeItem';
import { RecentConfigManager } from './recentConfigManager';

/**
 * STM32树形数据提供器类
 * 实现VS Code的TreeDataProvider接口，管理STM32配置器的树形视图数据
 * 
 * @class STM32TreeDataProvider
 * @implements vscode.TreeDataProvider<STM32TreeItem>
 * @since 0.1.0
 */
export class STM32TreeDataProvider implements vscode.TreeDataProvider<STM32TreeItem> {
    /** 树形数据变化事件发射器 */
    private _onDidChangeTreeData: vscode.EventEmitter<STM32TreeItem | undefined | null | void> = new vscode.EventEmitter<STM32TreeItem | undefined | null | void>();
    
    /** 树形数据变化事件，对外暴露的只读事件 */
    readonly onDidChangeTreeData: vscode.Event<STM32TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    /** 最近配置管理器实例 */
    private recentConfigManager: RecentConfigManager;

    /**
     * 构造STM32树形数据提供器
     * 
     * @param context - VS Code扩展上下文
     */
    constructor(private context: vscode.ExtensionContext) {
        this.recentConfigManager = new RecentConfigManager(context);
    }

    /**
     * 刷新树形视图
     * 触发树形数据变化事件，通知VS Code重新渲染树形视图
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * 获取树形项目
     * TreeDataProvider接口的必需方法，返回指定元素的树形项目表示
     * 
     * @param element - STM32树形项目
     * @returns VS Code树形项目
     */
    getTreeItem(element: STM32TreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * 获取子项目
     * TreeDataProvider接口的必需方法，返回指定元素的子项目
     * 
     * @param element - 父级STM32树形项目，如果为undefined则返回根项目
     * @returns 子项目数组的Promise
     */
    async getChildren(element?: STM32TreeItem): Promise<STM32TreeItem[]> {
        if (!element) {
            return this.getRootItems();
        }

        switch (element.contextValue) {
            case 'debugCategory':
                return this.getDebugConfigurations();
            case 'recentCategory':
                return this.getRecentConfigurations();
            case 'quickCategory':
                return this.getQuickActions();
            default:
                return [];
        }
    }

    /**
     * 获取根级项目
     * 返回树形视图的顶级分类项目
     * 
     * @private
     * @returns 根级STM32树形项目数组
     */
    private getRootItems(): STM32TreeItem[] {
        const items: STM32TreeItem[] = [];

        // Debug Configurations category
        items.push(new STM32TreeItem(
            'Debug Configurations',
            vscode.TreeItemCollapsibleState.Expanded,
            'debugCategory'
        ));

        // Recent Configurations category (only if we have recent configs)
        if (this.recentConfigManager.hasRecentConfigs()) {
            items.push(new STM32TreeItem(
                'Recent Configurations',
                vscode.TreeItemCollapsibleState.Collapsed,
                'recentCategory'
            ));
        }

        // Quick Actions category
        items.push(new STM32TreeItem(
            'Quick Actions',
            vscode.TreeItemCollapsibleState.Collapsed,
            'quickCategory'
        ));

        return items;
    }

    /**
     * 获取调试配置项目
     * 从当前工作区的launch.json中加载所有cortex-debug类型的配置
     * 
     * @private
     * @returns 调试配置树形项目数组的Promise
     */
    private async getDebugConfigurations(): Promise<STM32TreeItem[]> {
        const configurations = await this.loadDebugConfigurations();
        
        if (configurations.length === 0) {
            return [new STM32TreeItem(
                'No debug configurations found',
                vscode.TreeItemCollapsibleState.None,
                'empty'
            )];
        }

        return configurations.map(config => {
            const item = new STM32TreeItem(
                config.name,
                vscode.TreeItemCollapsibleState.None,
                'configuration',
                config
            );
            item.command = {
                command: 'stm32-configurator-by-zuolan.openConfig',
                title: 'Open Configuration',
                arguments: [config]
            };
            return item;
        });
    }

    /**
     * 获取最近配置项目
     * 返回用户最近使用的调试配置列表
     * 
     * @private
     * @returns 最近配置树形项目数组
     */
    private getRecentConfigurations(): STM32TreeItem[] {
        return this.recentConfigManager.getRecentConfigs().map(config => {
            const item = new STM32TreeItem(
                config.name,
                vscode.TreeItemCollapsibleState.None,
                'recentConfig',
                config
            );
            return item;
        });
    }

    /**
     * 获取快捷操作项目
     * 返回常用的快捷操作项目列表
     * 
     * @private
     * @returns 快捷操作树形项目数组
     */
    private getQuickActions(): STM32TreeItem[] {
        const actions: STM32TreeItem[] = [];

        actions.push(new STM32TreeItem(
            'Generate New Configuration',
            vscode.TreeItemCollapsibleState.None,
            'quickAction'
        ));

        // Add command to open configuration
        actions[0].command = {
            command: 'stm32-configurator-by-zuolan.start',
            title: 'Generate New Configuration'
        };

        return actions;
    }

    /**
     * 加载调试配置
     * 从当前工作区的.vscode/launch.json文件中加载所有调试配置
     * 
     * @private
     * @returns 调试配置数组的Promise，只包含'cortex-debug'类型的配置
     * @throws {Error} 当JSON解析失败时记录错误并返回空数组
     */
    private async loadDebugConfigurations(): Promise<DebugConfiguration[]> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return [];
        }

        const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
        
        try {
            if (!fs.existsSync(launchJsonPath)) {
                return [];
            }

            const content = fs.readFileSync(launchJsonPath, 'utf8');
            const launchConfig = JSON.parse(content);
            
            if (!launchConfig.configurations || !Array.isArray(launchConfig.configurations)) {
                return [];
            }

            // Filter for cortex-debug configurations
            return launchConfig.configurations.filter((config: any) => 
                config.type === 'cortex-debug'
            );

        } catch (error) {
            console.error('Error loading debug configurations:', error);
            return [];
        }
    }

    /**
     * 添加最近配置
     * 将新的调试配置添加到最近列表中并刷新视图
     * 
     * @param name - 配置名称
     * @param deviceName - STM32设备名称
     * @example
     * ```typescript
     * treeDataProvider.addRecentConfig('My Debug Config', 'STM32F407VG');
     * ```
     */
    public addRecentConfig(name: string, deviceName: string): void {
        this.recentConfigManager.addRecentConfig(name, deviceName);
        this.refresh();
    }
}