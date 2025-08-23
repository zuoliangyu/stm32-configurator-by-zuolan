/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * OpenOCD工具类模块
 * 提供OpenOCD路径检测和配置文件读取功能
 * 支持Windows、macOS和Linux平台的OpenOCD安装检测
 * 
 * @fileoverview OpenOCD工具类
 * @author 左岚
 * @since 0.1.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import * as vscode from 'vscode';

/**
 * Windows平台上常见的OpenOCD安装路径
 * 包括STM32CubeIDE、独立安装、xPack等各种安装方式
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
 * 展开路径中的环境变量和通配符
 * 解析路径中的%VAR%格式环境变量和*通配符
 * 
 * @param pathStr - 包含环境变量或通配符的路径字符串
 * @returns 展开后的路径数组，如果包含通配符则可能返回多个路径
 * @example
 * ```typescript
 * expandPath('%USERPROFILE%\\OpenOCD\\bin\\openocd.exe');
 * expandPath('C:\\ST\\STM32CubeIDE_*\\tools\\bin\\openocd.exe');
 * ```
 * @private
 */
function expandPath(pathStr: string): string[] {
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
                const matches: string[] = [];
                
                for (const entry of entries) {
                    const testPath = path.join(baseDir, entry, pattern.substring(1));
                    if (fs.existsSync(testPath)) {
                        matches.push(testPath);
                    }
                }
                return matches;
            }
        } catch (error) {
            // Ignore glob expansion errors
        }
        return [];
    }
    
    return [expanded];
}

/**
 * 检查指定路径是否存在OpenOCD可执行文件
 * 验证路径是否存在并且是一个文件
 * 
 * @param execPath - 要检查的OpenOCD可执行文件路径
 * @returns 如果路径存在且为文件则返回true，否则返回false
 * @private
 */
function checkOpenOCDPath(execPath: string): boolean {
    try {
        return fs.existsSync(execPath) && fs.statSync(execPath).isFile();
    } catch {
        return false;
    }
}

/**
 * 使用多种检测方法查找OpenOCD路径
 * 按以下顺序检测：
 * 1. 用户配置的路径
 * 2. PATH环境变量中的openocd
 * 3. 常见安装路径（仅Windows）
 * 
 * @returns OpenOCD可执行文件的完整路径，如果未找到则返回null
 * @example
 * ```typescript
 * const openocdPath = await findOpenOCDPath();
 * if (openocdPath) {
 *   console.log('Found OpenOCD at:', openocdPath);
 * } else {
 *   console.log('OpenOCD not found');
 * }
 * ```
 * @since 0.1.0
 */
export function findOpenOCDPath(): Promise<string | null> {
    return new Promise(async (resolve) => {
        // Method 1: Check user configuration first
        const config = vscode.workspace.getConfiguration('stm32-configurator');
        const userOpenOCDPath = config.get<string>('openocdPath');
        
        if (userOpenOCDPath && checkOpenOCDPath(userOpenOCDPath)) {
            resolve(userOpenOCDPath);
            return;
        }
        
        // Method 2: Try PATH environment variable
        const command = process.platform === 'win32' ? 'where openocd.exe' : 'which openocd';
        exec(command, (error, stdout) => {
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
 * 获取OpenOCD配置文件
 * 根据OpenOCD可执行文件路径，读取其scripts目录下的接口和目标配置文件
 * 
 * @param openocdExePath - OpenOCD可执行文件的完整路径
 * @returns 包含接口和目标配置文件名列表的对象
 * @returns interfaces - 可用的接口配置文件名数组
 * @returns targets - 可用的目标配置文件名数组
 * @throws {Error} 当读取配置文件失败时记录错误并返回空数组
 * @example
 * ```typescript
 * const configs = await getOpenOCDConfigFiles('/path/to/openocd.exe');
 * console.log('Interfaces:', configs.interfaces);
 * console.log('Targets:', configs.targets);
 * ```
 * @since 0.1.0
 */
export async function getOpenOCDConfigFiles(openocdExePath: string): Promise<{ interfaces: string[], targets: string[] }> {
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

        /**
         * 安全读取目录中的.cfg文件
         * 在读取目录失败时返回空数组而不抛出异常
         * 
         * @param dir - 要读取的目录路径
         * @returns 目录中所有.cfg文件名的数组
         */
        const readDirSafe = async (dir: string): Promise<string[]> => {
            try {
                const files = await fs.promises.readdir(dir);
                return files.filter(f => f.endsWith('.cfg'));
            } catch {
                return [];
            }
        };

        const interfaces = await readDirSafe(interfaceDir);
        const targets = await readDirSafe(targetDir);

        return { interfaces, targets };

    } catch (e) {
        console.error("Error reading OpenOCD scripts directory:", e);
        return { interfaces: [], targets: [] };
    }
}