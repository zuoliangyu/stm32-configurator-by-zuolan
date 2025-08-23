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
exports.findOpenOCDPath = findOpenOCDPath;
exports.getOpenOCDConfigFiles = getOpenOCDConfigFiles;
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
/**
 * Common OpenOCD installation paths on Windows
 */
const COMMON_OPENOCD_PATHS = [
    // STM32CubeIDE installations
    'C:\\ST\\STM32CubeIDE_*\\STM32CubeIDE\\plugins\\com.st.stm32cube.ide.mcu.externaltools.openocd.win32_*\\tools\\bin\\openocd.exe',
    // Standalone OpenOCD installations
    'C:\\OpenOCD\\bin\\openocd.exe',
    'C:\\Program Files\\OpenOCD\\bin\\openocd.exe',
    'C:\\Program Files (x86)\\OpenOCD\\bin\\openocd.exe',
    // xPack OpenOCD installations
    '%USERPROFILE%\\AppData\\Roaming\\xPacks\\@xpack-dev-tools\\openocd\\*\\bin\\openocd.exe',
    '%LOCALAPPDATA%\\xPacks\\@xpack-dev-tools\\openocd\\*\\bin\\openocd.exe',
    // User local installations
    '%USERPROFILE%\\OpenOCD\\bin\\openocd.exe',
    '%USERPROFILE%\\Tools\\OpenOCD\\bin\\openocd.exe'
];
/**
 * Expands environment variables and glob patterns in a path
 */
function expandPath(pathStr) {
    // Expand environment variables
    let expanded = pathStr.replace(/%([^%]+)%/g, (_, varName) => {
        return process.env[varName] || '';
    });
    // Handle USERPROFILE specifically
    expanded = expanded.replace(/\$\{USERPROFILE\}/g, os.homedir());
    expanded = expanded.replace(/\$\{LOCALAPPDATA\}/g, process.env.LOCALAPPDATA || '');
    // If path contains wildcards, try to resolve them
    if (expanded.includes('*')) {
        try {
            const basePath = expanded.substring(0, expanded.indexOf('*'));
            const pattern = expanded.substring(expanded.indexOf('*'));
            const baseDir = path.dirname(basePath);
            if (fs.existsSync(baseDir)) {
                const entries = fs.readdirSync(baseDir);
                const matches = [];
                for (const entry of entries) {
                    const testPath = path.join(baseDir, entry, pattern.substring(1));
                    if (fs.existsSync(testPath)) {
                        matches.push(testPath);
                    }
                }
                return matches;
            }
        }
        catch (error) {
            // Ignore glob expansion errors
        }
        return [];
    }
    return [expanded];
}
/**
 * Check if OpenOCD executable exists at the given path
 */
function checkOpenOCDPath(execPath) {
    try {
        return fs.existsSync(execPath) && fs.statSync(execPath).isFile();
    }
    catch {
        return false;
    }
}
/**
 * Find OpenOCD path using multiple detection methods
 */
function findOpenOCDPath() {
    return new Promise(async (resolve) => {
        // Method 1: Check user configuration first
        const config = vscode.workspace.getConfiguration('stm32-configurator');
        const userOpenOCDPath = config.get('openocdPath');
        if (userOpenOCDPath && checkOpenOCDPath(userOpenOCDPath)) {
            resolve(userOpenOCDPath);
            return;
        }
        // Method 2: Try PATH environment variable
        const command = process.platform === 'win32' ? 'where openocd.exe' : 'which openocd';
        (0, child_process_1.exec)(command, (error, stdout) => {
            if (!error) {
                const firstPath = stdout.split(/\r?\n/)[0].trim();
                if (firstPath && checkOpenOCDPath(firstPath)) {
                    resolve(firstPath);
                    return;
                }
            }
            // Method 3: Check common installation paths (Windows only)
            if (process.platform === 'win32') {
                for (const pathTemplate of COMMON_OPENOCD_PATHS) {
                    const expandedPaths = expandPath(pathTemplate);
                    for (const testPath of expandedPaths) {
                        if (checkOpenOCDPath(testPath)) {
                            resolve(testPath);
                            return;
                        }
                    }
                }
            }
            // Method 4: Not found
            resolve(null);
        });
    });
}
/**
 * 根据 OpenOCD 可执行文件路径，读取其配置文件夹
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
//# sourceMappingURL=openocd.js.map