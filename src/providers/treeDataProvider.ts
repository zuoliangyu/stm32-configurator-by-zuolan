/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { DebugConfiguration } from './types';
import { STM32TreeItem } from './stm32TreeItem';
import { RecentConfigManager } from './recentConfigManager';

export class STM32TreeDataProvider implements vscode.TreeDataProvider<STM32TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<STM32TreeItem | undefined | null | void> = new vscode.EventEmitter<STM32TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<STM32TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private recentConfigManager: RecentConfigManager;

    constructor(private context: vscode.ExtensionContext) {
        this.recentConfigManager = new RecentConfigManager(context);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: STM32TreeItem): vscode.TreeItem {
        return element;
    }

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

    public addRecentConfig(name: string, deviceName: string): void {
        this.recentConfigManager.addRecentConfig(name, deviceName);
        this.refresh();
    }
}