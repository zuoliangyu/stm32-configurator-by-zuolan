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
exports.isCortexDebugInstalled = isCortexDebugInstalled;
exports.isCortexDebugActive = isCortexDebugActive;
exports.getCortexDebugVersion = getCortexDebugVersion;
exports.ensureCortexDebugInstalled = ensureCortexDebugInstalled;
exports.showCortexDebugStatus = showCortexDebugStatus;
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __importStar(require("vscode"));
const CORTEX_DEBUG_EXTENSION_ID = 'marus25.cortex-debug';
/**
 * Check if Cortex Debug extension is installed and enabled
 */
function isCortexDebugInstalled() {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension !== undefined;
}
/**
 * Check if Cortex Debug extension is active
 */
function isCortexDebugActive() {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension?.isActive === true;
}
/**
 * Get Cortex Debug extension version if installed
 */
function getCortexDebugVersion() {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension?.packageJSON?.version || null;
}
/**
 * Prompt user to install Cortex Debug extension if not present
 */
async function ensureCortexDebugInstalled() {
    if (isCortexDebugInstalled()) {
        return true;
    }
    const installOption = 'Install Cortex Debug';
    const openMarketplaceOption = 'Open in Marketplace';
    const skipOption = 'Skip';
    const result = await vscode.window.showWarningMessage('Cortex Debug extension is required for STM32 debugging but is not installed. Would you like to install it now?', { modal: false }, installOption, openMarketplaceOption, skipOption);
    switch (result) {
        case installOption:
            try {
                await vscode.commands.executeCommand('workbench.extensions.installExtension', CORTEX_DEBUG_EXTENSION_ID);
                vscode.window.showInformationMessage('Cortex Debug extension installed successfully. Please reload VSCode to activate it.');
                // Offer to reload VSCode
                const reloadOption = 'Reload Now';
                const laterOption = 'Later';
                const reloadChoice = await vscode.window.showInformationMessage('VSCode needs to be reloaded to activate the Cortex Debug extension.', reloadOption, laterOption);
                if (reloadChoice === reloadOption) {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
                return true;
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to install Cortex Debug extension: ${error}`);
                return false;
            }
        case openMarketplaceOption:
            await vscode.commands.executeCommand('extension.open', CORTEX_DEBUG_EXTENSION_ID);
            return false;
        default:
            return false;
    }
}
/**
 * Show information about Cortex Debug extension status
 */
function showCortexDebugStatus() {
    if (!isCortexDebugInstalled()) {
        vscode.window.showWarningMessage('Cortex Debug extension is not installed.');
        return;
    }
    const version = getCortexDebugVersion();
    const status = isCortexDebugActive() ? 'active' : 'inactive';
    vscode.window.showInformationMessage(`Cortex Debug extension is installed (v${version}) and ${status}.`);
}
//# sourceMappingURL=cortex-debug.js.map