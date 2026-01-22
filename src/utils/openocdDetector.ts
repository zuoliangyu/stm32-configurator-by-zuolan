/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * OpenOCD路径检测器模块
 * 专门负责OpenOCD可执行文件的路径检测功能
 * 
 * @fileoverview OpenOCD Path Detector
 * @author 左岚  
 * @since 0.2.6
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/**
 * 常见的OpenOCD环境变量名
 * 用户可能在这些环境变量中设置OpenOCD的安装路径
 */
const OPENOCD_ENV_VARS = [
    'OPENOCD_PATH',
    'OPENOCD_HOME', 
    'OPENOCD_DIR',
    'OPENOCD_ROOT'
];

/**
 * OpenOCD检测结果
 */
export interface OpenOCDDetectionResult {
    /** 检测到的路径 */
    path: string | null;
    /** 检测方法 */
    method: 'settings' | 'env_vars' | 'path_scan' | 'where_which' | 'common_paths' | 'none';
    /** 找到的环境变量（如果通过环境变量找到） */
    foundEnvVars?: {[key: string]: string};
    /** OpenOCD版本（如果能获取到） */
    version?: string | null;
}

/**
 * 检查指定路径是否存在OpenOCD可执行文件
 * @param execPath - 要检查的OpenOCD可执行文件路径
 * @returns 如果路径存在且为文件则返回true，否则返回false
 * @private
 */
function checkOpenOCDPath(execPath: string): boolean {
    try {
        if (!execPath || !execPath.trim()) {
            return false;
        }
        return fs.existsSync(execPath) && fs.statSync(execPath).isFile();
    } catch {
        return false;
    }
}

/**
 * 检查VS Code扩展设置中的OpenOCD路径
 * @returns 如果在设置中找到有效路径则返回该路径，否则返回null
 */
export async function checkSettingsPath(): Promise<string | null> {
    const config = vscode.workspace.getConfiguration('stm32-configurator');
    const settingsPath = config.get<string>('openocdPath');
    
    if (settingsPath && settingsPath.trim() && checkOpenOCDPath(settingsPath)) {
        return settingsPath;
    }
    return null;
}

/**
 * 检查OpenOCD专用环境变量
 * @returns 检测结果对象，包含路径和找到的环境变量
 */
export function checkOpenOCDEnvVars(): {path: string | null, foundVars: {[key: string]: string}} {
    const executableName = process.platform === 'win32' ? 'openocd.exe' : 'openocd';
    const foundVars: {[key: string]: string} = {};
    
    for (const envVar of OPENOCD_ENV_VARS) {
        const envPath = process.env[envVar];
        if (!envPath) {
            continue;
        }
        
        foundVars[envVar] = envPath;
        
        // 检查多种可能的路径
        const possiblePaths = [
            envPath,  // 环境变量路径本身
            path.join(envPath, executableName),  // 直接子路径
            path.join(envPath, 'bin', executableName)  // bin子目录
        ];
        
        for (const testPath of possiblePaths) {
            if (checkOpenOCDPath(testPath)) {
                return {path: testPath, foundVars};
            }
        }
    }
    
    return {path: null, foundVars};
}

/**
 * 直接扫描PATH环境变量
 * @returns OpenOCD可执行文件的完整路径，如果未找到则返回null
 */
export function scanPATHVariable(): string | null {
    const pathVar = process.env.PATH;
    if (!pathVar) {
        return null;
    }
    
    const pathSeparator = process.platform === 'win32' ? ';' : ':';
    const executableName = process.platform === 'win32' ? 'openocd.exe' : 'openocd';
    const paths = pathVar.split(pathSeparator).filter(p => p.trim());
    
    for (const pathDir of paths) {
        try {
            const trimmedPath = pathDir.trim();
            if (!trimmedPath) {
                continue;
            }
            
            const cleanPath = trimmedPath.replace(/^["']|["']$/g, '');
            const execPath = path.join(cleanPath, executableName);
            
            if (checkOpenOCDPath(execPath)) {
                return execPath;
            }
        } catch (error) {
            // 忽略无效路径
        }
    }
    
    return null;
}

/**
 * 使用where/which命令查找OpenOCD
 * @returns OpenOCD可执行文件的完整路径，如果未找到则返回null
 */
export async function useWhereWhichCommand(): Promise<string | null> {
    try {
        const command = process.platform === 'win32' ? 'where openocd.exe' : 'which openocd';
        const { stdout } = await execAsync(command);
        if (stdout.trim()) {
            const firstPath = stdout.trim().split('\n')[0];
            if (checkOpenOCDPath(firstPath)) {
                return firstPath;
            }
        }
    } catch (error) {
        // 命令失败，返回null
    }
    return null;
}

/**
 * 获取OpenOCD版本信息
 * @param openocdPath - OpenOCD可执行文件路径
 * @returns OpenOCD版本字符串，获取失败则返回null
 */
export async function getOpenOCDVersion(openocdPath: string): Promise<string | null> {
    try {
        const { stdout } = await execAsync(`"${openocdPath}" --version`);
        const versionMatch = stdout.match(/Open On-Chip Debugger\s+([\d.]+)/);
        return versionMatch ? versionMatch[1] : null;
    } catch {
        return null;
    }
}

/**
 * 执行全面的OpenOCD路径检测
 * 按优先级顺序使用多种检测方法
 * 
 * @returns 检测结果对象
 */
export async function detectOpenOCDPath(): Promise<OpenOCDDetectionResult> {
    console.log('[OpenOCD检测器] 开始全面检测OpenOCD路径...');
    
    // 方法1: 检查扩展设置
    const settingsPath = await checkSettingsPath();
    if (settingsPath) {
        const version = await getOpenOCDVersion(settingsPath);
        return {
            path: settingsPath,
            method: 'settings',
            version
        };
    }
    
    // 方法2: 检查OpenOCD专用环境变量
    const envResult = checkOpenOCDEnvVars();
    if (envResult.path) {
        const version = await getOpenOCDVersion(envResult.path);
        return {
            path: envResult.path,
            method: 'env_vars',
            foundEnvVars: envResult.foundVars,
            version
        };
    }
    
    // 方法3: 直接扫描PATH环境变量
    const pathResult = scanPATHVariable();
    if (pathResult) {
        const version = await getOpenOCDVersion(pathResult);
        return {
            path: pathResult,
            method: 'path_scan',
            version
        };
    }
    
    // 方法4: 使用where/which命令作为后备
    const whereResult = await useWhereWhichCommand();
    if (whereResult) {
        const version = await getOpenOCDVersion(whereResult);
        return {
            path: whereResult,
            method: 'where_which',
            version
        };
    }
    
    console.log('[OpenOCD检测器] ✗ 所有检测方法都未能找到OpenOCD');
    return {
        path: null,
        method: 'none'
    };
}