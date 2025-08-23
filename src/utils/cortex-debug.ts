/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';

const CORTEX_DEBUG_EXTENSION_ID = 'marus25.cortex-debug';

/**
 * Check if Cortex Debug extension is installed and enabled
 */
export function isCortexDebugInstalled(): boolean {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension !== undefined;
}

/**
 * Check if Cortex Debug extension is active
 */
export function isCortexDebugActive(): boolean {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension?.isActive === true;
}

/**
 * Get Cortex Debug extension version if installed
 */
export function getCortexDebugVersion(): string | null {
    const extension = vscode.extensions.getExtension(CORTEX_DEBUG_EXTENSION_ID);
    return extension?.packageJSON?.version || null;
}

/**
 * Prompt user to install Cortex Debug extension if not present
 */
export async function ensureCortexDebugInstalled(): Promise<boolean> {
    if (isCortexDebugInstalled()) {
        return true;
    }

    const installOption = 'Install Cortex Debug';
    const openMarketplaceOption = 'Open in Marketplace';
    const skipOption = 'Skip';

    const result = await vscode.window.showWarningMessage(
        'Cortex Debug extension is required for STM32 debugging but is not installed. Would you like to install it now?',
        { modal: false },
        installOption,
        openMarketplaceOption,
        skipOption
    );

    switch (result) {
        case installOption:
            try {
                await vscode.commands.executeCommand('workbench.extensions.installExtension', CORTEX_DEBUG_EXTENSION_ID);
                vscode.window.showInformationMessage('Cortex Debug extension installed successfully. Please reload VSCode to activate it.');
                
                // Offer to reload VSCode
                const reloadOption = 'Reload Now';
                const laterOption = 'Later';
                const reloadChoice = await vscode.window.showInformationMessage(
                    'VSCode needs to be reloaded to activate the Cortex Debug extension.',
                    reloadOption,
                    laterOption
                );
                
                if (reloadChoice === reloadOption) {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
                
                return true;
            } catch (error) {
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
export function showCortexDebugStatus(): void {
    if (!isCortexDebugInstalled()) {
        vscode.window.showWarningMessage('Cortex Debug extension is not installed.');
        return;
    }

    const version = getCortexDebugVersion();
    const status = isCortexDebugActive() ? 'active' : 'inactive';
    
    vscode.window.showInformationMessage(
        `Cortex Debug extension is installed (v${version}) and ${status}.`
    );
}