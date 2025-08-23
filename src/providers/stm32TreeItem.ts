/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { DebugConfiguration, RecentConfig } from './types';

export class STM32TreeItem extends vscode.TreeItem {
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