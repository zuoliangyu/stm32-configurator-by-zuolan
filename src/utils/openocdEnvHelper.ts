/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * OpenOCD环境配置助手模块
 * 提供环境变量检测、配置验证和用户引导功能
 * 
 * @fileoverview OpenOCD Environment Helper
 * @author 左岚
 * @since 0.2.6
 */

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { detectOpenOCDPath, OpenOCDDetectionResult } from './openocdDetector';

const execAsync = promisify(exec);

/**
 * OpenOCD环境配置状态
 */
export interface OpenOCDEnvironmentStatus {
    /** 是否在PATH中找到 */
    foundInPath: boolean;
    /** 是否在扩展设置中配置 */
    foundInSettings: boolean;
    /** 是否在OpenOCD环境变量中找到 */
    foundInEnvVars: boolean;
    /** 检测到的路径 */
    detectedPath: string | null;
    /** OpenOCD版本 */
    version: string | null;
    /** 环境变量PATH内容 */
    pathContent: string[];
    /** 检测到的OpenOCD环境变量 */
    detectedEnvVars: {[key: string]: string};
    /** 建议的操作 */
    suggestions: string[];
}

/**
 * 简化的OpenOCD路径查找函数
 * 使用增强的检测逻辑，供其他模块调用
 * 
 * @returns OpenOCD可执行文件的完整路径，如果未找到则返回null
 * @since 0.2.6
 */
export async function findOpenOCDPathEnhanced(): Promise<string | null> {
    const result = await detectOpenOCDPath();
    return result.path;
}

/**
 * 检查OpenOCD环境配置状态
 * 使用新的检测器模块提供详细信息
 */
export async function checkOpenOCDEnvironment(): Promise<OpenOCDEnvironmentStatus> {
    const result = await detectOpenOCDPath();
    
    const status: OpenOCDEnvironmentStatus = {
        foundInPath: result.method === 'path_scan' || result.method === 'where_which',
        foundInSettings: result.method === 'settings',
        foundInEnvVars: result.method === 'env_vars',
        detectedPath: result.path,
        version: result.version || null,
        pathContent: process.env.PATH?.split(os.platform() === 'win32' ? ';' : ':') || [],
        detectedEnvVars: result.foundEnvVars || {},
        suggestions: []
    };
    
    // 生成建议
    if (!result.path) {
        status.suggestions.push('OpenOCD未检测到。建议按以下优先级配置：');
        status.suggestions.push('1. 设置OPENOCD_PATH环境变量指向OpenOCD安装目录');
        status.suggestions.push('2. 将OpenOCD的bin目录添加到系统PATH环境变量');
        status.suggestions.push('3. 在扩展设置中手动指定OpenOCD路径');
    } else if (result.method === 'settings') {
        status.suggestions.push('OpenOCD已在扩展设置中配置，建议也设置环境变量以供其他工具使用。');
    } else if (result.method === 'env_vars') {
        status.suggestions.push('OpenOCD环境变量已配置，建议也添加到PATH以便命令行使用。');
    }
    
    return status;
}

/**
 * 显示OpenOCD配置向导
 * 提供交互式的配置引导
 */
export async function showOpenOCDConfigurationWizard(): Promise<void> {
    const result = await detectOpenOCDPath();
    
    if (result.path) {
        vscode.window.showInformationMessage(
            `OpenOCD已找到！\n路径：${result.path}\n版本：${result.version || '未知'}`,
            'OK'
        );
        return;
    }

    const action = await vscode.window.showQuickPick([
        {
            label: '$(folder-opened) 手动选择OpenOCD路径',
            description: '浏览并选择OpenOCD可执行文件',
            value: 'browse'
        },
        {
            label: '$(cloud-download) 下载OpenOCD',
            description: '打开OpenOCD下载页面',
            value: 'download'
        },
        {
            label: '$(settings-gear) 打开扩展设置',
            description: '手动配置OpenOCD路径',
            value: 'settings'
        }
    ], {
        placeHolder: 'OpenOCD未检测到，请选择配置方式',
        title: 'OpenOCD配置向导'
    });

    if (!action) {
        return;
    }

    switch (action.value) {
        case 'browse':
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Executable': process.platform === 'win32' ? ['exe'] : ['*']
                },
                title: '选择OpenOCD可执行文件'
            });
            
            if (fileUri && fileUri[0]) {
                const config = vscode.workspace.getConfiguration('stm32-configurator');
                await config.update('openocdPath', fileUri[0].fsPath, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage('OpenOCD路径已配置！');
            }
            break;

        case 'download':
            await vscode.env.openExternal(
                vscode.Uri.parse('https://github.com/xpack-dev-tools/openocd-xpack/releases')
            );
            break;

        case 'settings':
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'stm32-configurator.openocdPath'
            );
            break;
    }
}

/**
 * 验证OpenOCD配置
 */
export async function validateOpenOCDConfiguration(openocdPath: string): Promise<{
    valid: boolean;
    error?: string;
    version?: string;
}> {
    try {
        const { stdout, stderr } = await execAsync(`"${openocdPath}" --version`);
        
        if (stderr && !stderr.includes('Open On-Chip Debugger')) {
            return {
                valid: false,
                error: `OpenOCD执行出错：${stderr}`
            };
        }

        const versionMatch = (stdout + stderr).match(/Open On-Chip Debugger\s+([\d.]+)/);
        return {
            valid: true,
            version: versionMatch ? versionMatch[1] : 'unknown'
        };
    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * 显示环境变量配置帮助
 */
export async function showEnvironmentSetupHelp(openocdPath?: string): Promise<void> {
    if (!openocdPath) {
        const result = await detectOpenOCDPath();
        if (result.path) {
            openocdPath = result.path;
        } else {
            vscode.window.showWarningMessage('请先安装OpenOCD。');
            return;
        }
    }
    
    const binPath = path.dirname(openocdPath);
    const setupPath = path.dirname(binPath);
    
    const message = `设置OpenOCD环境变量\n\nOPENOCD_PATH=${setupPath}\n\n或将 ${binPath} 添加到PATH环境变量中`;
    
    const action = await vscode.window.showInformationMessage(
        message,
        '复制路径',
        '查看详细说明'
    );

    if (action === '复制路径') {
        await vscode.env.clipboard.writeText(setupPath);
        vscode.window.showInformationMessage('路径已复制到剪贴板！');
    } else if (action === '查看详细说明') {
        const platform = os.platform();
        let instructions = '';
        
        if (platform === 'win32') {
            instructions = 'Windows环境变量设置：\n1. 右键"此电脑" -> 属性 -> 高级系统设置\n2. 点击"环境变量"\n3. 新建系统变量 OPENOCD_PATH\n4. 或编辑PATH变量添加bin目录';
        } else {
            instructions = 'Linux/Mac环境变量设置：\n1. 编辑 ~/.bashrc 或 ~/.zshrc\n2. 添加: export OPENOCD_PATH="' + setupPath + '"\n3. 添加: export PATH="$PATH:' + binPath + '"\n4. 执行: source ~/.bashrc';
        }
        
        vscode.window.showInformationMessage(instructions, { modal: true });
    }
}