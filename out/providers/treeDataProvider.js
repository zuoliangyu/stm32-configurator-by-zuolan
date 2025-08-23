"use strict";
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
exports.STM32TreeDataProvider = void 0;
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const stm32TreeItem_1 = require("./stm32TreeItem");
const recentConfigManager_1 = require("./recentConfigManager");
class STM32TreeDataProvider {
    context;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    recentConfigManager;
    constructor(context) {
        this.context = context;
        this.recentConfigManager = new recentConfigManager_1.RecentConfigManager(context);
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
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
    getRootItems() {
        const items = [];
        // Debug Configurations category
        items.push(new stm32TreeItem_1.STM32TreeItem('Debug Configurations', vscode.TreeItemCollapsibleState.Expanded, 'debugCategory'));
        // Recent Configurations category (only if we have recent configs)
        if (this.recentConfigManager.hasRecentConfigs()) {
            items.push(new stm32TreeItem_1.STM32TreeItem('Recent Configurations', vscode.TreeItemCollapsibleState.Collapsed, 'recentCategory'));
        }
        // Quick Actions category
        items.push(new stm32TreeItem_1.STM32TreeItem('Quick Actions', vscode.TreeItemCollapsibleState.Collapsed, 'quickCategory'));
        return items;
    }
    async getDebugConfigurations() {
        const configurations = await this.loadDebugConfigurations();
        if (configurations.length === 0) {
            return [new stm32TreeItem_1.STM32TreeItem('No debug configurations found', vscode.TreeItemCollapsibleState.None, 'empty')];
        }
        return configurations.map(config => {
            const item = new stm32TreeItem_1.STM32TreeItem(config.name, vscode.TreeItemCollapsibleState.None, 'configuration', config);
            item.command = {
                command: 'stm32-configurator-by-zuolan.openConfig',
                title: 'Open Configuration',
                arguments: [config]
            };
            return item;
        });
    }
    getRecentConfigurations() {
        return this.recentConfigManager.getRecentConfigs().map(config => {
            const item = new stm32TreeItem_1.STM32TreeItem(config.name, vscode.TreeItemCollapsibleState.None, 'recentConfig', config);
            return item;
        });
    }
    getQuickActions() {
        const actions = [];
        actions.push(new stm32TreeItem_1.STM32TreeItem('Generate New Configuration', vscode.TreeItemCollapsibleState.None, 'quickAction'));
        // Add command to open configuration
        actions[0].command = {
            command: 'stm32-configurator-by-zuolan.start',
            title: 'Generate New Configuration'
        };
        return actions;
    }
    async loadDebugConfigurations() {
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
            return launchConfig.configurations.filter((config) => config.type === 'cortex-debug');
        }
        catch (error) {
            console.error('Error loading debug configurations:', error);
            return [];
        }
    }
    addRecentConfig(name, deviceName) {
        this.recentConfigManager.addRecentConfig(name, deviceName);
        this.refresh();
    }
}
exports.STM32TreeDataProvider = STM32TreeDataProvider;
//# sourceMappingURL=treeDataProvider.js.map