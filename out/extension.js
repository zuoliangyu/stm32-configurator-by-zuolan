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
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
let detectedOpenOCDPath = null;
let currentPanel = undefined;
function activate(context) {
    findOpenOCDPath().then(path => {
        detectedOpenOCDPath = path;
    });
    context.subscriptions.push(vscode.commands.registerCommand('stm32-configurator-by-zuolan.start', () => {
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
                    const newPath = await findOpenOCDPath();
                    detectedOpenOCDPath = newPath;
                    currentPanel?.webview.postMessage({ command: 'updatePath', path: detectedOpenOCDPath });
                    return;
                // --- 新增功能：处理获取 CFG 文件的请求 ---
                case 'getCFGFiles':
                    const cfgFiles = await getOpenOCDConfigFiles(message.path);
                    currentPanel?.webview.postMessage({ command: 'updateCFGLists', data: cfgFiles });
                    return;
            }
        }, undefined, context.subscriptions);
    }));
}
function deactivate() { }
/**
 * --- 新增功能：根据 OpenOCD 可执行文件路径，读取其配置文件夹 ---
 * @param openocdExePath openocd.exe 的完整路径
 * @returns 包含接口和目标文件列表的对象
 */
async function getOpenOCDConfigFiles(openocdExePath) {
    if (!openocdExePath) {
        return { interfaces: [], targets: [] };
    }
    try {
        const binDir = path.dirname(openocdExePath);
        // OpenOCD 的 scripts 文件夹通常在 bin 目录的上一级的 share/openocd/scripts 或 scripts 目录中
        const possibleScriptsPaths = [
            path.join(binDir, '..', 'share', 'openocd', 'scripts'),
            path.join(binDir, '..', 'scripts')
        ];
        const scriptsPath = possibleScriptsPaths.find(p => fs.existsSync(p));
        if (!scriptsPath) {
            return { interfaces: [], targets: [] };
        }
        const interfaceDir = path.join(scriptsPath, 'interface');
        const targetDir = path.join(scriptsPath, 'target');
        const readDirSafe = async (dir) => {
            try {
                const files = await fs.promises.readdir(dir);
                return files.filter(f => f.endsWith('.cfg'));
            }
            catch {
                return [];
            }
        };
        const interfaces = await readDirSafe(interfaceDir);
        const targets = await readDirSafe(targetDir);
        return { interfaces, targets };
    }
    catch (e) {
        console.error("Error reading OpenOCD scripts directory:", e);
        return { interfaces: [], targets: [] };
    }
}
// (findOpenOCDPath, handleGenerateCommand, generateLaunchConfig, getWebviewContent 函数保持不变)
function findOpenOCDPath() {
    return new Promise((resolve) => {
        const command = process.platform === 'win32' ? 'where openocd.exe' : 'which openocd';
        (0, child_process_1.exec)(command, (error, stdout) => {
            if (error) {
                resolve(null);
                return;
            }
            const firstPath = stdout.split(/\r?\n/)[0].trim();
            resolve(firstPath || null);
        });
    });
}
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
        vscode.window.showInformationMessage('launch.json has been updated successfully!');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to update launch.json: ${error.message}`);
    }
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