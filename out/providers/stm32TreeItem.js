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
exports.STM32TreeItem = void 0;
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __importStar(require("vscode"));
class STM32TreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    contextValue;
    config;
    constructor(label, collapsibleState, contextValue, config) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.config = config;
        this.tooltip = this.getTooltip();
        this.iconPath = this.getIcon();
    }
    getTooltip() {
        if (this.contextValue === 'configuration' && this.config) {
            const debugConfig = this.config;
            return `Device: ${debugConfig.device || 'Unknown'}\nType: ${debugConfig.servertype || debugConfig.type}`;
        }
        if (this.contextValue === 'recentConfig' && this.config) {
            const recentConfig = this.config;
            const date = new Date(recentConfig.timestamp);
            return `Device: ${recentConfig.deviceName}\nUsed: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        }
        return this.label;
    }
    getIcon() {
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
exports.STM32TreeItem = STM32TreeItem;
//# sourceMappingURL=stm32TreeItem.js.map