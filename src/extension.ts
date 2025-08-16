/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {

    let disposable = vscode.commands.registerCommand('stm32-configurator-by-zuolan.start', () => {
        
        const panel = vscode.window.createWebviewPanel(
            'stm32Configurator',
            'STM32 Debug Configurator',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                // --- 修正点 ---
                // 这个安全设置也必须指向 out 目录，因为打包后只有 out 目录存在
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'out', 'webview')]
            }
        );

        panel.webview.html = getWebviewContent(context.extensionUri, panel.webview);

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'generate':
                        generateLaunchConfig(message.data);
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview): string {
    // 读取 out 目录下的 html 文件
    const htmlPathOnDisk = vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'main.html');
    
    let htmlContent = fs.readFileSync(htmlPathOnDisk.fsPath, 'utf8');

    // 将占位符替换为正确的、可访问的资源路径
    htmlContent = htmlContent.replace(/{{cspSource}}/g, webview.cspSource)
                             .replace(/{{cssUri}}/g, webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'styles.css')).toString())
                             .replace(/{{jsUri}}/g, webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'main.js')).toString());

    return htmlContent;
}

function generateLaunchConfig(data: any) {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('Please open a project folder first!');
        return;
    }

    const newConfig = {
        "name": `Debug (${data.deviceName})`,
        "type": "cortex-debug",
        "request": "launch",
        "servertype": "openocd",
        "cwd": "${workspaceFolder}",
        "executable": data.executablePath,
        "device": data.deviceName,
        "configFiles": [
            data.interfaceFile,
            data.targetFile
        ],
        "svdFile": data.svdFilePath,
        "openOCDLaunchCommands": [
            `adapter speed ${data.adapterSpeed}`
        ],
        "runToEntryPoint": "main"
    };

    const workspaceFolder = vscode.workspace.workspaceFolders[0].uri;
    const dotVscodeFolder = vscode.Uri.joinPath(workspaceFolder, '.vscode');
    const launchJsonPath = vscode.Uri.joinPath(dotVscodeFolder, 'launch.json');

    if (!fs.existsSync(dotVscodeFolder.fsPath)) {
        fs.mkdirSync(dotVscodeFolder.fsPath);
    }

    let launchConfig: any = { version: "0.2.0", configurations: [] };

    if (fs.existsSync(launchJsonPath.fsPath)) {
        try {
            const content = fs.readFileSync(launchJsonPath.fsPath, 'utf8');
            launchConfig = JSON.parse(content);
            if (!launchConfig.configurations) {
                launchConfig.configurations = [];
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error reading launch.json: ${error}`);
            launchConfig = { version: "0.2.0", configurations: [] };
        }
    }
    
    launchConfig.configurations.unshift(newConfig);

    try {
        fs.writeFileSync(launchJsonPath.fsPath, JSON.stringify(launchConfig, null, 4));
        vscode.window.showInformationMessage('launch.json has been updated successfully!');
    } catch (error) {
        vscode.window.showErrorMessage(`Error writing to launch.json: ${error}`);
    }
}