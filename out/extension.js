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
exports.activate = activate;
exports.deactivate = deactivate;
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const providers_1 = require("./providers");
const openocd_1 = require("./utils/openocd");
const cortex_debug_1 = require("./utils/cortex-debug");
const localizationManager_1 = require("./localization/localizationManager");
let detectedOpenOCDPath = null;
let currentPanel = undefined;
let treeDataProvider;
let localizationManager;
let currentLiveWatchVariables = [];
function activate(context) {
    // Initialize localization
    localizationManager = localizationManager_1.LocalizationManager.getInstance(context);
    // Initialize tree data provider
    treeDataProvider = new providers_1.STM32TreeDataProvider(context);
    vscode.window.createTreeView('stm32-configurator-tree', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });
    // Initialize OpenOCD path detection with better error handling
    (0, openocd_1.findOpenOCDPath)().then(path => {
        detectedOpenOCDPath = path;
        if (!path) {
            console.warn('OpenOCD not found in PATH or common installation directories. Users can set custom path in settings.');
        }
    }).catch(error => {
        console.error('Error during OpenOCD path detection:', error);
        detectedOpenOCDPath = null;
    });
    context.subscriptions.push(vscode.commands.registerCommand('stm32-configurator-by-zuolan.start', async () => {
        // Check for Cortex Debug extension
        if (!(0, cortex_debug_1.isCortexDebugInstalled)()) {
            const shouldProceed = await (0, cortex_debug_1.ensureCortexDebugInstalled)();
            if (!shouldProceed) {
                vscode.window.showWarningMessage('STM32 Debug Configurator requires Cortex Debug extension to function properly. Please install it and try again.');
                return;
            }
        }
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.One);
            return;
        }
        currentPanel = vscode.window.createWebviewPanel('stm32Configurator', 'STM32 Debug Configurator', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'out', 'webview')]
        });
        currentPanel.webview.html = getWebviewContent(context.extensionUri, currentPanel.webview);
        currentPanel.onDidDispose(() => { currentPanel = undefined; }, null, context.subscriptions);
        currentPanel.webview.postMessage({ command: 'updatePath', path: detectedOpenOCDPath });
        currentPanel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'generate':
                    await generateConfiguration(message.data);
                    return;
                case 'refreshPath':
                    try {
                        const newPath = await (0, openocd_1.findOpenOCDPath)();
                        detectedOpenOCDPath = newPath;
                        currentPanel?.webview.postMessage({ command: 'updatePath', path: detectedOpenOCDPath });
                        if (!newPath) {
                            vscode.window.showWarningMessage(localizationManager.getString('noOpenocdFound') + ' Please install OpenOCD or set custom path in extension settings.', 'Open Settings').then(selection => {
                                if (selection === 'Open Settings') {
                                    vscode.commands.executeCommand('workbench.action.openSettings', 'stm32-configurator.openocdPath');
                                }
                            });
                        }
                        else {
                            vscode.window.showInformationMessage(`${localizationManager.getString('openocdDetected')} ${newPath}`);
                        }
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Error detecting OpenOCD path: ${error}`);
                        currentPanel?.webview.postMessage({ command: 'updatePath', path: null });
                    }
                    return;
                case 'getCFGFiles':
                    const cfgFiles = await (0, openocd_1.getOpenOCDConfigFiles)(message.path);
                    currentPanel?.webview.postMessage({ command: 'updateCFGLists', data: cfgFiles });
                    return;
                case 'getLanguage':
                    currentPanel?.webview.postMessage({
                        command: 'updateLanguage',
                        language: localizationManager.getCurrentLanguage(),
                        strings: localizationManager.getAllStrings()
                    });
                    return;
                case 'switchLanguage':
                    localizationManager.switchLanguage(message.language);
                    currentPanel?.webview.postMessage({
                        command: 'updateLanguage',
                        language: localizationManager.getCurrentLanguage(),
                        strings: localizationManager.getAllStrings()
                    });
                    return;
                case 'addLiveWatchVariable':
                    await handleAddLiveWatchVariable(message.variable);
                    return;
                case 'removeLiveWatchVariable':
                    await handleRemoveLiveWatchVariable(message.variable);
                    return;
            }
        }, undefined, context.subscriptions);
    }));
    // Register tree view commands
    context.subscriptions.push(vscode.commands.registerCommand('stm32-configurator-by-zuolan.refresh', () => {
        treeDataProvider.refresh();
    }), vscode.commands.registerCommand('stm32-configurator-by-zuolan.openConfig', async (config) => {
        await openDebugConfiguration(config);
    }), 
    // Runtime livewatch management commands
    vscode.commands.registerCommand('stm32-configurator-by-zuolan.addLiveWatchVariable', async () => {
        const variable = await vscode.window.showInputBox({
            prompt: localizationManager.getString('variableName'),
            placeHolder: 'e.g., myVariable, myStruct.field'
        });
        if (variable) {
            await handleAddLiveWatchVariable(variable);
        }
    }), vscode.commands.registerCommand('stm32-configurator-by-zuolan.removeLiveWatchVariable', async () => {
        if (currentLiveWatchVariables.length === 0) {
            vscode.window.showInformationMessage('No livewatch variables to remove.');
            return;
        }
        const variable = await vscode.window.showQuickPick(currentLiveWatchVariables, {
            placeHolder: 'Select variable to remove'
        });
        if (variable) {
            await handleRemoveLiveWatchVariable(variable);
        }
    }), vscode.commands.registerCommand('stm32-configurator-by-zuolan.toggleLanguage', () => {
        const currentLang = localizationManager.getCurrentLanguage();
        const newLang = currentLang === 'en' ? 'zh' : 'en';
        localizationManager.switchLanguage(newLang);
        // Update webview if open
        if (currentPanel) {
            currentPanel.webview.postMessage({
                command: 'updateLanguage',
                language: newLang,
                strings: localizationManager.getAllStrings()
            });
        }
    }));
}
function deactivate() { }
async function generateConfiguration(data) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('Please open a project folder first!');
        return;
    }
    if (data.servertype === 'openocd' && data.openocdPath && data.openocdPath.trim() !== '') {
        try {
            const cortexDebugConfig = vscode.workspace.getConfiguration('cortex-debug');
            await cortexDebugConfig.update('openocdPath', data.openocdPath, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Cortex-Debug 'openocdPath' has been set globally.`);
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to set Cortex-Debug 'openocdPath'. Error: ${e}`);
        }
    }
    const newConfig = {
        "name": `Debug (${data.deviceName})`, "type": "cortex-debug", "request": "launch",
        "servertype": data.servertype, "cwd": "${workspaceFolder}", "executable": data.executablePath,
        "device": data.deviceName, "svdFile": data.svdFilePath, "runToEntryPoint": "main"
    };
    // Add livewatch configuration if enabled
    if (data.liveWatch && data.liveWatch.enabled) {
        newConfig.liveWatch = {
            enabled: true,
            samplesPerSecond: data.liveWatch.samplesPerSecond
        };
        // Add graphConfig for variable watching
        if (data.liveWatch.variables && data.liveWatch.variables.length > 0) {
            newConfig.graphConfig = data.liveWatch.variables.map((variable, index) => ({
                label: variable,
                expression: variable,
                encoding: "unsigned"
            }));
        }
    }
    if (data.servertype === 'openocd') {
        newConfig.configFiles = [`interface/${data.interfaceFile}`, `target/${data.targetFile}`]; // <-- 修正：加上目录前缀
        newConfig.openOCDLaunchCommands = [`adapter speed ${data.adapterSpeed}`];
    }
    else if (data.servertype === 'pyocd') {
        newConfig.targetId = data.targetFile;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri;
    const dotVscodeFolder = vscode.Uri.joinPath(workspaceFolder, '.vscode');
    const launchJsonPath = vscode.Uri.joinPath(dotVscodeFolder, 'launch.json');
    try {
        if (!fs.existsSync(dotVscodeFolder.fsPath)) {
            fs.mkdirSync(dotVscodeFolder.fsPath);
        }
        let launchConfig = { version: "0.2.0", configurations: [] };
        if (fs.existsSync(launchJsonPath.fsPath)) {
            const content = fs.readFileSync(launchJsonPath.fsPath, 'utf8');
            if (content.trim()) {
                launchConfig = JSON.parse(content);
                if (!launchConfig.configurations) {
                    launchConfig.configurations = [];
                }
            }
        }
        launchConfig.configurations.unshift(newConfig);
        fs.writeFileSync(launchJsonPath.fsPath, JSON.stringify(launchConfig, null, 4));
        // Generate success message with livewatch status
        let successMessage = localizationManager.getString('configGenerated');
        if (data.liveWatch && data.liveWatch.enabled) {
            const variableCount = data.liveWatch.variables ? data.liveWatch.variables.length : 0;
            currentLiveWatchVariables = data.liveWatch.variables || [];
            successMessage += ' ' + localizationManager.formatString('liveWatchStatus', variableCount.toString(), data.liveWatch.samplesPerSecond.toString());
        }
        vscode.window.showInformationMessage(successMessage);
        // Add to recent configurations and refresh tree
        treeDataProvider.addRecentConfig(newConfig.name, data.deviceName);
        treeDataProvider.refresh();
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to update launch.json: ${error.message}`);
        // Notify webview of error
        currentPanel?.webview.postMessage({ command: 'showError', error: error.message });
    }
}
async function openDebugConfiguration(config) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open.');
        return;
    }
    const workspaceFolder = vscode.workspace.workspaceFolders[0];
    const launchJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'launch.json');
    try {
        // Check if launch.json exists
        if (fs.existsSync(launchJsonPath.fsPath)) {
            // Open launch.json file
            const document = await vscode.workspace.openTextDocument(launchJsonPath);
            await vscode.window.showTextDocument(document);
            // Find and highlight the configuration
            const text = document.getText();
            const configMatch = text.indexOf(`"name": "${config.name}"`);
            if (configMatch > -1) {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    const position = document.positionAt(configMatch);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                }
            }
        }
        else {
            vscode.window.showWarningMessage('launch.json not found. Create a debug configuration first.');
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to open configuration: ${error}`);
    }
}
async function handleAddLiveWatchVariable(variable) {
    if (!variable || variable.trim() === '') {
        return;
    }
    const trimmedVariable = variable.trim();
    if (currentLiveWatchVariables.includes(trimmedVariable)) {
        vscode.window.showWarningMessage(`Variable '${trimmedVariable}' is already being watched.`);
        return;
    }
    currentLiveWatchVariables.push(trimmedVariable);
    // If debugging is active, try to update the running debug configuration
    const activeSession = vscode.debug.activeDebugSession;
    if (activeSession && activeSession.type === 'cortex-debug') {
        try {
            // Note: This is a simplified approach. Real implementation would need
            // to interact with cortex-debug extension's API if available
            vscode.window.showInformationMessage(localizationManager.formatString('variableAdded', trimmedVariable));
        }
        catch (error) {
            console.error('Failed to add variable to active debug session:', error);
        }
    }
    // Notify webview
    currentPanel?.webview.postMessage({
        command: 'liveWatchVariableAdded',
        variable: trimmedVariable
    });
}
async function handleRemoveLiveWatchVariable(variable) {
    const index = currentLiveWatchVariables.indexOf(variable);
    if (index === -1) {
        return;
    }
    currentLiveWatchVariables.splice(index, 1);
    // If debugging is active, try to update the running debug configuration
    const activeSession = vscode.debug.activeDebugSession;
    if (activeSession && activeSession.type === 'cortex-debug') {
        try {
            // Note: This is a simplified approach. Real implementation would need
            // to interact with cortex-debug extension's API if available
            vscode.window.showInformationMessage(localizationManager.formatString('variableRemoved', variable));
        }
        catch (error) {
            console.error('Failed to remove variable from active debug session:', error);
        }
    }
    // Notify webview
    currentPanel?.webview.postMessage({
        command: 'liveWatchVariableRemoved',
        variable: variable
    });
}
function getWebviewContent(extensionUri, webview) {
    const htmlPathOnDisk = vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'main.html');
    let htmlContent = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');
    htmlContent = htmlContent.replace(/{{cspSource}}/g, webview.cspSource)
        .replace(/{{cssUri}}/g, webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'styles.css')).toString())
        .replace(/{{jsUri}}/g, webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'main.js')).toString());
    return htmlContent;
}
//# sourceMappingURL=extension.js.map