/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * STM32调试配置器扩展的主入口模块
 * 提供STM32微控制器调试配置的图形化界面和自动化生成功能
 * 
 * @fileoverview STM32 Debug Configurator - VS Code扩展主模块
 * @author 左岚
 * @since 0.1.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { STM32TreeDataProvider, DebugConfiguration } from './providers';
import { findOpenOCDPath, getOpenOCDConfigFiles } from './utils/openocd';
import { ensureCortexDebugInstalled, isCortexDebugInstalled } from './utils/cortex-debug';
import { LocalizationManager, SupportedLanguage } from './localization/localizationManager';

/** 检测到的OpenOCD路径 */
let detectedOpenOCDPath: string | null = null;

/** 当前活动的Webview面板 */
let currentPanel: vscode.WebviewPanel | undefined = undefined;

/** STM32树形数据提供器实例 */
let treeDataProvider: STM32TreeDataProvider;

/** 本地化管理器实例 */
let localizationManager: LocalizationManager;

/** 当前实时监视变量列表 */
let currentLiveWatchVariables: string[] = [];

/**
 * 激活扩展
 * 初始化扩展的所有功能，包括本地化、树形视图、命令注册等
 * 
 * @param context - VS Code扩展上下文，提供扩展生命周期管理
 * @example
 * ```typescript
 * // VS Code会自动调用此函数
 * activate(context);
 * ```
 * @since 0.1.0
 */
export function activate(context: vscode.ExtensionContext) {
    // Initialize localization
    localizationManager = LocalizationManager.getInstance(context);
    
    // Initialize tree data provider
    treeDataProvider = new STM32TreeDataProvider(context);
    vscode.window.createTreeView('stm32-configurator-tree', {
        treeDataProvider: treeDataProvider,
        showCollapseAll: true
    });

    // Initialize OpenOCD path detection with better error handling
    findOpenOCDPath().then(path => {
        detectedOpenOCDPath = path;
        if (!path) {
            console.warn('OpenOCD not found in PATH or common installation directories. Users can set custom path in settings.');
        }
    }).catch(error => {
        console.error('Error during OpenOCD path detection:', error);
        detectedOpenOCDPath = null;
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('stm32-configurator-by-zuolan.start', async () => {
            // Check for Cortex Debug extension
            if (!isCortexDebugInstalled()) {
                const shouldProceed = await ensureCortexDebugInstalled();
                if (!shouldProceed) {
                    vscode.window.showWarningMessage(
                        'STM32 Debug Configurator requires Cortex Debug extension to function properly. Please install it and try again.'
                    );
                    return;
                }
            }

            if (currentPanel) {
                currentPanel.reveal(vscode.ViewColumn.One);
                return;
            }

            currentPanel = vscode.window.createWebviewPanel(
                'stm32Configurator', 'STM32 Debug Configurator', vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'out', 'webview')]
                }
            );

            currentPanel.webview.html = getWebviewContent(context.extensionUri, currentPanel.webview);
            currentPanel.onDidDispose(() => { currentPanel = undefined; }, null, context.subscriptions);

            currentPanel.webview.postMessage({ command: 'updatePath', path: detectedOpenOCDPath });

            currentPanel.webview.onDidReceiveMessage(
                async message => {
                    switch (message.command) {
                        case 'generate':
                            await generateConfiguration(message.data);
                            return;

                        case 'refreshPath':
                            try {
                                const newPath = await findOpenOCDPath();
                                detectedOpenOCDPath = newPath;
                                currentPanel?.webview.postMessage({ command: 'updatePath', path: detectedOpenOCDPath });
                                
                                if (!newPath) {
                                    vscode.window.showWarningMessage(
                                        localizationManager.getString('noOpenocdFound') + ' Please install OpenOCD or set custom path in extension settings.',
                                        'Open Settings'
                                    ).then(selection => {
                                        if (selection === 'Open Settings') {
                                            vscode.commands.executeCommand('workbench.action.openSettings', 'stm32-configurator.openocdPath');
                                        }
                                    });
                                } else {
                                    vscode.window.showInformationMessage(`${localizationManager.getString('openocdDetected')} ${newPath}`);
                                }
                            } catch (error) {
                                vscode.window.showErrorMessage(`Error detecting OpenOCD path: ${error}`);
                                currentPanel?.webview.postMessage({ command: 'updatePath', path: null });
                            }
                            return;

                        case 'getCFGFiles':
                            const cfgFiles = await getOpenOCDConfigFiles(message.path);
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
                            localizationManager.switchLanguage(message.language as SupportedLanguage);
                            currentPanel?.webview.postMessage({
                                command: 'updateLanguage',
                                language: localizationManager.getCurrentLanguage(),
                                strings: localizationManager.getAllStrings()
                            });
                            return;

                        case 'browseOpenOCDPath':
                            try {
                                const openOCDPath = await browseForOpenOCDPath();
                                if (openOCDPath) {
                                    detectedOpenOCDPath = openOCDPath;
                                    currentPanel?.webview.postMessage({ command: 'updateOpenOCDPath', path: openOCDPath });
                                }
                            } catch (error: any) {
                                vscode.window.showErrorMessage(`Failed to browse for OpenOCD path: ${error.message}`);
                            }
                            return;

                        case 'addLiveWatchVariable':
                            await handleAddLiveWatchVariable(message.variable);
                            return;

                        case 'removeLiveWatchVariable':
                            await handleRemoveLiveWatchVariable(message.variable);
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );
        })
    );

    // Register tree view commands
    context.subscriptions.push(
        vscode.commands.registerCommand('stm32-configurator-by-zuolan.refresh', () => {
            treeDataProvider.refresh();
        }),
        
        vscode.commands.registerCommand('stm32-configurator-by-zuolan.openConfig', async (config: DebugConfiguration) => {
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
        }),

        vscode.commands.registerCommand('stm32-configurator-by-zuolan.removeLiveWatchVariable', async () => {
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
        }),

        vscode.commands.registerCommand('stm32-configurator-by-zuolan.toggleLanguage', () => {
            const currentLang = localizationManager.getCurrentLanguage();
            const newLang: SupportedLanguage = currentLang === 'en' ? 'zh' : 'en';
            localizationManager.switchLanguage(newLang);
            
            // Update webview if open
            if (currentPanel) {
                currentPanel.webview.postMessage({
                    command: 'updateLanguage',
                    language: newLang,
                    strings: localizationManager.getAllStrings()
                });
            }
        })
    );
}

/**
 * 停用扩展
 * 清理扩展占用的资源，执行必要的清理工作
 * 
 * @since 0.1.0
 */
export function deactivate() { }




/**
 * 生成调试配置
 * 根据用户输入的数据生成launch.json中的调试配置
 * 
 * @param data - 包含调试配置参数的对象
 * @param data.deviceName - STM32设备名称
 * @param data.executablePath - 可执行文件路径
 * @param data.servertype - 调试服务器类型 ('openocd' 或 'pyocd')
 * @param data.openocdPath - OpenOCD路径（servertype为'openocd'时使用）
 * @param data.interfaceFile - 接口配置文件名
 * @param data.targetFile - 目标配置文件名
 * @param data.adapterSpeed - 适配器速度
 * @param data.svdFilePath - SVD文件路径
 * @param data.liveWatch - 实时监视配置
 * @throws {Error} 当工作区未打开或配置写入失败时抛出异常
 * @since 0.1.0
 */
async function generateConfiguration(data: any) {
    if (!vscode.workspace.workspaceFolders) { vscode.window.showErrorMessage('Please open a project folder first!'); return; }
    if (data.servertype === 'openocd' && data.openocdPath && data.openocdPath.trim() !== '') {
        try {
            const cortexDebugConfig = vscode.workspace.getConfiguration('cortex-debug');
            await cortexDebugConfig.update('openocdPath', data.openocdPath, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Cortex-Debug 'openocdPath' has been set globally.`);
        } catch (e) { vscode.window.showErrorMessage(`Failed to set Cortex-Debug 'openocdPath'. Error: ${e}`); }
    }
    const newConfig: any = {
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
            newConfig.graphConfig = data.liveWatch.variables.map((variable: string, index: number) => ({
                label: variable,
                expression: variable,
                encoding: "unsigned"
            }));
        }
    }
    if (data.servertype === 'openocd') {
        newConfig.configFiles = [`interface/${data.interfaceFile}`, `target/${data.targetFile}`]; // <-- 修正：加上目录前缀
        newConfig.openOCDLaunchCommands = [`adapter speed ${data.adapterSpeed}`];
    } else if (data.servertype === 'pyocd') { newConfig.targetId = data.targetFile; }
    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri;
    const dotVscodeFolder = vscode.Uri.joinPath(workspaceFolder, '.vscode');
    const launchJsonPath = vscode.Uri.joinPath(dotVscodeFolder, 'launch.json');
    try {
        if (!fs.existsSync(dotVscodeFolder.fsPath)) { fs.mkdirSync(dotVscodeFolder.fsPath); }
        let launchConfig: any = { version: "0.2.0", configurations: [] };
        if (fs.existsSync(launchJsonPath.fsPath)) {
            const content = fs.readFileSync(launchJsonPath.fsPath, 'utf8');
            if (content.trim()) {
                launchConfig = JSON.parse(content);
                if (!launchConfig.configurations) { launchConfig.configurations = []; }
            }
        }
        launchConfig.configurations.unshift(newConfig);
        fs.writeFileSync(launchJsonPath.fsPath, JSON.stringify(launchConfig, null, 4));
        
        // Generate success message with livewatch status
        let successMessage = localizationManager.getString('configGenerated');
        if (data.liveWatch && data.liveWatch.enabled) {
            const variableCount = data.liveWatch.variables ? data.liveWatch.variables.length : 0;
            currentLiveWatchVariables = data.liveWatch.variables || [];
            successMessage += ' ' + localizationManager.formatString('liveWatchStatus', 
                variableCount.toString(), data.liveWatch.samplesPerSecond.toString());
        }
        vscode.window.showInformationMessage(successMessage);
        
        // Add to recent configurations and refresh tree
        treeDataProvider.addRecentConfig(newConfig.name, data.deviceName);
        treeDataProvider.refresh();
    } catch (error: any) { 
        vscode.window.showErrorMessage(`Failed to update launch.json: ${error.message}`);
        // Notify webview of error
        currentPanel?.webview.postMessage({ command: 'showError', error: error.message });
    }
}

/**
 * 打开调试配置
 * 在编辑器中打开launch.json并定位到指定的调试配置
 * 
 * @param config - 要打开的调试配置对象
 * @param config.name - 配置名称，用于在文件中定位
 * @returns Promise<void> 异步操作完成的Promise
 * @throws {Error} 当工作区未打开或文件操作失败时抛出异常
 * @since 0.2.0
 */
async function openDebugConfiguration(config: DebugConfiguration): Promise<void> {
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
        } else {
            vscode.window.showWarningMessage('launch.json not found. Create a debug configuration first.');
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open configuration: ${error}`);
    }
}

/**
 * 处理添加实时监视变量
 * 将变量添加到当前的实时监视列表中
 * 
 * @param variable - 要添加的变量名或表达式
 * @returns Promise<void> 异步操作完成的Promise
 * @example
 * ```typescript
 * await handleAddLiveWatchVariable('myVariable');
 * await handleAddLiveWatchVariable('myStruct.field');
 * ```
 * @since 0.2.0
 */
async function handleAddLiveWatchVariable(variable: string): Promise<void> {
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
            vscode.window.showInformationMessage(
                localizationManager.formatString('variableAdded', trimmedVariable)
            );
        } catch (error) {
            console.error('Failed to add variable to active debug session:', error);
        }
    }

    // Notify webview
    currentPanel?.webview.postMessage({
        command: 'liveWatchVariableAdded',
        variable: trimmedVariable
    });
}

/**
 * 处理移除实时监视变量
 * 从当前的实时监视列表中移除指定变量
 * 
 * @param variable - 要移除的变量名
 * @returns Promise<void> 异步操作完成的Promise
 * @since 0.2.0
 */
async function handleRemoveLiveWatchVariable(variable: string): Promise<void> {
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
            vscode.window.showInformationMessage(
                localizationManager.formatString('variableRemoved', variable)
            );
        } catch (error) {
            console.error('Failed to remove variable from active debug session:', error);
        }
    }

    // Notify webview
    currentPanel?.webview.postMessage({
        command: 'liveWatchVariableRemoved',
        variable: variable
    });
}

/**
 * 浏览选择OpenOCD路径
 * 打开文件选择对话框让用户手动选择OpenOCD可执行文件
 * 
 * @returns Promise<string | undefined> 选择的OpenOCD路径，如果用户取消则返回undefined
 * @throws {Error} 当文件选择对话框操作失败时抛出异常
 * @since 0.2.0
 */
async function browseForOpenOCDPath(): Promise<string | undefined> {
    const result = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: false,
        canSelectFiles: true,
        filters: {
            'Executable': process.platform === 'win32' ? ['exe'] : ['*'],
            'All Files': ['*']
        },
        openLabel: 'Select OpenOCD Executable'
    });

    if (result && result.length > 0) {
        const selectedPath = result[0].fsPath;
        
        // Basic validation: check if the selected file looks like openocd
        const fileName = path.basename(selectedPath).toLowerCase();
        if (fileName.includes('openocd') || fileName === 'openocd.exe' || fileName === 'openocd') {
            return selectedPath;
        } else {
            // Ask user for confirmation if filename doesn't contain 'openocd'
            const confirm = await vscode.window.showWarningMessage(
                `The selected file "${fileName}" doesn't appear to be OpenOCD. Use it anyway?`,
                'Yes', 'No'
            );
            if (confirm === 'Yes') {
                return selectedPath;
            }
        }
    }
    
    return undefined;
}

/**
 * 获取Webview内容
 * 读取HTML模板文件并替换其中的占位符，生成完整的Webview内容
 * 
 * @param extensionUri - 扩展的URI路径
 * @param webview - Webview实例，用于生成CSP源和资源URI
 * @returns 处理后的HTML内容字符串
 * @throws {Error} 当HTML文件读取失败时抛出异常
 * @since 0.1.0
 */
function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview): string {
    const htmlPathOnDisk = vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'main.html');
    let htmlContent = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');
    htmlContent = htmlContent.replace(/{{cspSource}}/g, webview.cspSource)
        .replace(/{{cssUri}}/g, webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'styles.css')).toString())
        .replace(/{{jsUri}}/g, webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'main.js')).toString());
    return htmlContent;
}