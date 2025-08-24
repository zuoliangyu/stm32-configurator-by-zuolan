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
import { findArmToolchainPath, getArmToolchainInfo, validateArmToolchainPath, ToolchainInfo } from './utils/armToolchain';
import { LocalizationManager, SupportedLanguage } from './localization/localizationManager';
import { normalizePath } from './utils/pathUtils';
import { ToolchainDetectionService } from './services';
import { ToolchainGuideDialog } from './ui';
import { AutoConfigurationDialog } from './ui/autoConfigurationDialog';

/** 检测到的OpenOCD路径 */
let detectedOpenOCDPath: string | null = null;

/** 检测到的ARM工具链路径 */
let detectedArmToolchainPath: string | null = null;

/** ARM工具链信息 */
let armToolchainInfo: ToolchainInfo | null = null;

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

    // Initialize ARM toolchain detection
    findArmToolchainPath().then(async path => {
        detectedArmToolchainPath = path;
        if (path) {
            try {
                armToolchainInfo = await getArmToolchainInfo(path);
                console.log(`ARM toolchain detected: ${armToolchainInfo.version} at ${path}`);
            } catch (error) {
                console.error('Error getting ARM toolchain info:', error);
                armToolchainInfo = null;
            }
        } else {
            console.warn('ARM toolchain not found in PATH or common installation directories. Users can set custom path in settings.');
            armToolchainInfo = null;
        }
    }).catch(error => {
        console.error('Error during ARM toolchain detection:', error);
        detectedArmToolchainPath = null;
        armToolchainInfo = null;
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('stm32-configurator-by-zuolan.detectToolchain', async () => {
            try {
                // Show toolchain guide dialog
                const dialog = new ToolchainGuideDialog(context);
                
                const configured = await dialog.showWizard();
                
                if (configured) {
                    vscode.window.showInformationMessage(
                        localizationManager.getString('toolchainSetupSuccess')
                    );
                } else {
                    vscode.window.showInformationMessage(
                        'Toolchain setup was cancelled by user.'
                    );
                }
                
            } catch (error) {
                vscode.window.showErrorMessage(
                    `${localizationManager.getString('toolchainDetectionTitle')} failed: ${error}`
                );
            }
        }),

        // Auto-Configuration Commands
        vscode.commands.registerCommand('stm32-configurator-by-zuolan.autoConfigureAll', async () => {
            try {
                const autoConfigDialog = new AutoConfigurationDialog(context);
                const result = await autoConfigDialog.showAutoConfigurationWizard();
                
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Auto-configuration completed! Generated ${result.generatedConfigs?.length || 0} configuration(s).`
                    );
                } else if (result.error) {
                    vscode.window.showErrorMessage(`Auto-configuration failed: ${result.error}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Auto-configuration error: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }),

        vscode.commands.registerCommand('stm32-configurator-by-zuolan.oneClickSetup', async () => {
            try {
                const autoConfigDialog = new AutoConfigurationDialog(context);
                const result = await autoConfigDialog.oneClickQuickSetup();
                
                if (result.success) {
                    vscode.window.showInformationMessage('One-click setup completed successfully!');
                } else if (result.error) {
                    vscode.window.showErrorMessage(`One-click setup failed: ${result.error}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `One-click setup error: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }),

        vscode.commands.registerCommand('stm32-configurator-by-zuolan.intelligentWizard', async () => {
            try {
                const autoConfigDialog = new AutoConfigurationDialog(context);
                const result = await autoConfigDialog.showIntelligentConfigurationWizard();
                
                if (result.success) {
                    vscode.window.showInformationMessage(
                        `Intelligent configuration completed! Generated ${result.generatedConfigs?.length || 0} configuration(s).`
                    );
                } else if (result.error) {
                    vscode.window.showErrorMessage(`Intelligent configuration failed: ${result.error}`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Intelligent configuration error: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }),

        vscode.commands.registerCommand('stm32-configurator-by-zuolan.autoTroubleshoot', async () => {
            try {
                const autoConfigDialog = new AutoConfigurationDialog(context);
                const result = await autoConfigDialog.autoTroubleshoot();
                
                const summary = [
                    `Auto-troubleshoot completed:`,
                    `- Issues found: ${result.issuesFound}`,
                    `- Issues fixed: ${result.issuesFixed}`,
                    `- Remaining issues: ${result.remainingIssues.length}`
                ].join('\n');

                if (result.issuesFixed > 0) {
                    vscode.window.showInformationMessage(summary);
                } else {
                    vscode.window.showWarningMessage(summary);
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Auto-troubleshoot error: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }),

        vscode.commands.registerCommand('stm32-configurator-by-zuolan.healthCheck', async () => {
            try {
                const { ConfigurationScanner } = await import('./services/configurationScanner.js');
                const scanner = new ConfigurationScanner();
                const healthCheck = await scanner.performHealthCheck();
                
                const avgScore = (healthCheck.scores.toolchain + healthCheck.scores.workspace + 
                                healthCheck.scores.configuration + healthCheck.scores.extensions) / 4;
                
                const status = avgScore >= 80 ? '✅ Healthy' : 
                             avgScore >= 50 ? '⚠️ Partial' : '❌ Critical';
                
                const summary = [
                    `STM32 Development Environment Health Check`,
                    `Overall Status: ${status} (${Math.round(avgScore)}%)`,
                    '',
                    `Toolchain: ${healthCheck.scores.toolchain}%`,
                    `Workspace: ${healthCheck.scores.workspace}%`,
                    `Configuration: ${healthCheck.scores.configuration}%`,
                    `Extensions: ${healthCheck.scores.extensions}%`,
                    '',
                    `Issues found: ${healthCheck.issues.length}`,
                    `Recommendations: ${healthCheck.recommendations.length}`
                ].join('\n');

                const action = await vscode.window.showInformationMessage(
                    summary,
                    { modal: true },
                    'View Details',
                    'Auto-Fix Issues',
                    'OK'
                );

                if (action === 'View Details') {
                    const details = [
                        'DETAILED HEALTH REPORT',
                        '=' .repeat(30),
                        '',
                        'ISSUES:',
                        ...healthCheck.issues.map((issue: any) => `- ${issue.message} (${issue.severity})`),
                        '',
                        'RECOMMENDATIONS:',
                        ...healthCheck.recommendations.map((rec: any) => `- ${rec.title}: ${rec.description}`)
                    ].join('\n');
                    
                    vscode.window.showInformationMessage(details, { modal: true });
                } else if (action === 'Auto-Fix Issues') {
                    vscode.commands.executeCommand('stm32-configurator-by-zuolan.autoTroubleshoot');
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Health check error: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        }),

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
            currentPanel.webview.postMessage({ 
                command: 'updateArmToolchainPath', 
                path: detectedArmToolchainPath,
                info: armToolchainInfo 
            });

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

                        case 'browseArmToolchainPath':
                            try {
                                const armPath = await browseForArmToolchainPath();
                                if (armPath) {
                                    detectedArmToolchainPath = armPath;
                                    armToolchainInfo = await getArmToolchainInfo(armPath);
                                    currentPanel?.webview.postMessage({ 
                                        command: 'updateArmToolchainPath', 
                                        path: armPath,
                                        info: armToolchainInfo 
                                    });
                                }
                            } catch (error: any) {
                                vscode.window.showErrorMessage(`Failed to browse for ARM toolchain path: ${error.message}`);
                            }
                            return;

                        case 'refreshArmToolchainPath':
                            try {
                                const newPath = await findArmToolchainPath();
                                detectedArmToolchainPath = newPath;
                                
                                if (newPath) {
                                    armToolchainInfo = await getArmToolchainInfo(newPath);
                                    currentPanel?.webview.postMessage({ 
                                        command: 'updateArmToolchainPath', 
                                        path: newPath,
                                        info: armToolchainInfo 
                                    });
                                    vscode.window.showInformationMessage(`ARM toolchain detected: ${armToolchainInfo.version} at ${newPath}`);
                                } else {
                                    armToolchainInfo = null;
                                    currentPanel?.webview.postMessage({ 
                                        command: 'updateArmToolchainPath', 
                                        path: null,
                                        info: null 
                                    });
                                    vscode.window.showWarningMessage(
                                        'ARM toolchain not found. Please install it or set custom path in extension settings.',
                                        'Open Settings'
                                    ).then(selection => {
                                        if (selection === 'Open Settings') {
                                            vscode.commands.executeCommand('workbench.action.openSettings', 'cortex-debug.armToolchainPath');
                                        }
                                    });
                                }
                            } catch (error) {
                                vscode.window.showErrorMessage(`Error detecting ARM toolchain path: ${error}`);
                                currentPanel?.webview.postMessage({ 
                                    command: 'updateArmToolchainPath', 
                                    path: null,
                                    info: null 
                                });
                            }
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
        }),

        vscode.commands.registerCommand('stm32-configurator-by-zuolan.setupToolchain', async () => {
            try {
                // Show quick pick for user to choose setup method
                const setupOption = await vscode.window.showQuickPick([
                    {
                        label: localizationManager.getString('toolchainDetectionWizard'),
                        description: localizationManager.getString('autoDetectionResults'),
                        detail: 'Automatically detect and configure ARM toolchain and OpenOCD',
                        value: 'wizard'
                    },
                    {
                        label: localizationManager.getString('configureManually'),
                        description: 'Manual configuration',
                        detail: 'Manually specify toolchain paths',
                        value: 'manual'
                    }
                ], {
                    placeHolder: localizationManager.getString('toolchainConfiguration')
                });
                
                if (setupOption?.value === 'wizard') {
                    // Use the detectToolchain command
                    vscode.commands.executeCommand('stm32-configurator-by-zuolan.detectToolchain');
                } else if (setupOption?.value === 'manual') {
                    // Open settings for manual configuration
                    vscode.commands.executeCommand('workbench.action.openSettings', 'stm32-configurator');
                }
                
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Toolchain setup failed: ${error}`
                );
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
export function deactivate() {
    // 清理资源，如果有需要的话
    // 这里暂时不需要特殊清理
}




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
            // 标准化OpenOCD路径，将反斜杠转换为正斜杠
            const normalizedOpenOCDPath = normalizePath(data.openocdPath);
            await cortexDebugConfig.update('openocdPath', normalizedOpenOCDPath, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Cortex-Debug 'openocdPath' has been set globally.`);
        } catch (e) { vscode.window.showErrorMessage(`Failed to set Cortex-Debug 'openocdPath'. Error: ${e}`); }
    }
    const newConfig: any = {
        "name": `Debug (${data.deviceName})`, "type": "cortex-debug", "request": "launch",
        "servertype": data.servertype, "cwd": "${workspaceFolder}", "executable": data.executablePath,
        "device": data.deviceName, "svdFile": data.svdFilePath, "runToEntryPoint": "main"
    };
    
    // Add ARM toolchain configuration if available
    if (data.armToolchainPath && data.armToolchainPath.trim() !== '') {
        try {
            const cortexDebugConfig = vscode.workspace.getConfiguration('cortex-debug');
            // 标准化ARM工具链路径，将反斜杠转换为正斜杠
            const normalizedArmToolchainPath = normalizePath(data.armToolchainPath);
            await cortexDebugConfig.update('armToolchainPath', normalizedArmToolchainPath, vscode.ConfigurationTarget.Global);
            newConfig.armToolchainPath = normalizedArmToolchainPath;
            console.log(`Cortex-Debug 'armToolchainPath' has been set to: ${normalizedArmToolchainPath}`);
        } catch (e) { 
            console.warn(`Failed to set Cortex-Debug 'armToolchainPath'. Error: ${e}`);
        }
    } else if (detectedArmToolchainPath) {
        // Use detected ARM toolchain path as fallback
        try {
            const validation = await validateArmToolchainPath(detectedArmToolchainPath);
            if (validation.isValid && validation.toolchainInfo) {
                newConfig.armToolchainPath = validation.toolchainInfo.rootPath;
            }
        } catch (error) {
            console.warn('Failed to validate detected ARM toolchain path:', error);
        }
    }
    
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
 * 浏览选择ARM工具链路径
 * 打开文件选择对话框让用户手动选择ARM GCC可执行文件
 * 
 * @returns Promise<string | undefined> 选择的ARM工具链路径，如果用户取消则返回undefined
 * @throws {Error} 当文件选择对话框操作失败时抛出异常
 * @since 0.2.3
 */
async function browseForArmToolchainPath(): Promise<string | undefined> {
    const result = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: false,
        canSelectFiles: true,
        filters: {
            'Executable': process.platform === 'win32' ? ['exe'] : ['*'],
            'All Files': ['*']
        },
        openLabel: 'Select ARM GCC Executable'
    });

    if (result && result.length > 0) {
        const selectedPath = result[0].fsPath;
        
        // Basic validation: check if the selected file looks like arm-none-eabi-gcc
        const fileName = path.basename(selectedPath).toLowerCase();
        if (fileName.includes('arm-none-eabi-gcc') || fileName === 'arm-none-eabi-gcc.exe' || fileName === 'arm-none-eabi-gcc') {
            // Validate the toolchain path
            try {
                const validation = await validateArmToolchainPath(selectedPath);
                if (validation.isValid) {
                    return selectedPath;
                } else {
                    vscode.window.showErrorMessage(
                        `Invalid ARM toolchain: ${validation.errors.join(', ')}`
                    );
                    return undefined;
                }
            } catch (error) {
                vscode.window.showErrorMessage(
                    `Error validating ARM toolchain: ${error}`
                );
                return undefined;
            }
        } else {
            // Ask user for confirmation if filename doesn't contain expected name
            const confirm = await vscode.window.showWarningMessage(
                `The selected file "${fileName}" doesn't appear to be ARM GCC. Use it anyway?`,
                'Yes', 'No'
            );
            if (confirm === 'Yes') {
                try {
                    const validation = await validateArmToolchainPath(selectedPath);
                    if (validation.isValid) {
                        return selectedPath;
                    } else {
                        vscode.window.showErrorMessage(
                            `Invalid ARM toolchain: ${validation.errors.join(', ')}`
                        );
                        return undefined;
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(
                        `Error validating ARM toolchain: ${error}`
                    );
                    return undefined;
                }
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