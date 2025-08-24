/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 自动配置扫描服务模块
 * 提供全自动的工具链检测、配置生成和环境设置功能
 * 支持一键式STM32开发环境配置
 * 
 * @fileoverview 自动配置扫描服务
 * @author 左岚
 * @since 0.2.6
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ToolchainDetectionService } from './toolchainDetectionService';
import { ExtendedToolchainDetectionResults } from './detectionTypes';
import { DetectionStatus } from '../ui/types';

/**
 * 配置扫描结果接口
 */
export interface ConfigurationScanResult {
    /** 扫描状态 */
    status: 'success' | 'partial' | 'failed';
    /** 检测到的工具链信息 */
    toolchains: ExtendedToolchainDetectionResults;
    /** 现有配置信息 */
    existingConfig: ExistingConfigurationInfo;
    /** 建议的配置选项 */
    recommendations: ConfigurationRecommendation[];
    /** 扫描过程中的错误信息 */
    errors: string[];
}

/**
 * 现有配置信息接口
 */
export interface ExistingConfigurationInfo {
    /** VS Code workspace设置 */
    workspaceSettings: {
        hasCortexDebugSettings: boolean;
        cortexDebugPath?: string;
        openocdPath?: string;
    };
    /** launch.json配置 */
    launchConfig: {
        exists: boolean;
        hasStm32Configs: boolean;
        configCount: number;
        configs: DebugConfigSummary[];
    };
    /** 工作区信息 */
    workspace: {
        hasWorkspace: boolean;
        workspacePath?: string;
        hasVscodeFolder: boolean;
    };
}

/**
 * 调试配置摘要接口
 */
export interface DebugConfigSummary {
    name: string;
    type: string;
    device?: string;
    executable?: string;
    servertype?: string;
    isStm32Config: boolean;
}

/**
 * 配置建议接口
 */
export interface ConfigurationRecommendation {
    /** 建议类型 */
    type: 'create_config' | 'update_config' | 'install_extension' | 'setup_paths' | 'create_workspace';
    /** 建议标题 */
    title: string;
    /** 详细描述 */
    description: string;
    /** 建议的优先级 */
    priority: 'high' | 'medium' | 'low';
    /** 是否可以自动执行 */
    autoExecutable: boolean;
    /** 执行参数 */
    params?: Record<string, any>;
}

/**
 * 自动生成的cortex-debug配置接口
 */
export interface GeneratedCortexDebugConfig {
    name: string;
    type: string;
    request: string;
    servertype: string;
    cwd: string;
    executable: string;
    device: string;
    svdFile?: string;
    configFiles?: string[];
    openOCDLaunchCommands?: string[];
    runToEntryPoint: string;
    liveWatch?: {
        enabled: boolean;
        samplesPerSecond: number;
    };
    graphConfig?: Array<{
        label: string;
        expression: string;
        encoding: string;
    }>;
}

/**
 * STM32设备族配置模板
 */
export interface STM32FamilyTemplate {
    family: string;
    devices: string[];
    defaultInterface: string;
    defaultTarget: string;
    commonSvdFile?: string;
    adapterSpeed: number;
    description: string;
}

/**
 * 自动配置扫描服务类
 * 提供完整的STM32开发环境自动配置功能
 */
export class AutoConfigurationService {
    private static instance: AutoConfigurationService;
    private toolchainService: ToolchainDetectionService;

    /** STM32设备族配置模板 */
    private readonly STM32_FAMILY_TEMPLATES: STM32FamilyTemplate[] = [
        {
            family: 'STM32F4',
            devices: ['STM32F407VG', 'STM32F407ZG', 'STM32F429ZI', 'STM32F446RE'],
            defaultInterface: 'stlink-v2-1.cfg',
            defaultTarget: 'stm32f4x.cfg',
            adapterSpeed: 2000,
            description: 'STM32F4 series with ARM Cortex-M4 core'
        },
        {
            family: 'STM32F1',
            devices: ['STM32F103C8', 'STM32F103RB', 'STM32F103VE'],
            defaultInterface: 'stlink-v2.cfg',
            defaultTarget: 'stm32f1x.cfg',
            adapterSpeed: 1000,
            description: 'STM32F1 series with ARM Cortex-M3 core'
        },
        {
            family: 'STM32L4',
            devices: ['STM32L476RG', 'STM32L496ZG', 'STM32L4A6ZG'],
            defaultInterface: 'stlink-v2-1.cfg',
            defaultTarget: 'stm32l4x.cfg',
            adapterSpeed: 2000,
            description: 'STM32L4 series ultra-low-power with ARM Cortex-M4 core'
        },
        {
            family: 'STM32G4',
            devices: ['STM32G474RE', 'STM32G431RB', 'STM32G473CE'],
            defaultInterface: 'stlink-v2-1.cfg',
            defaultTarget: 'stm32g4x.cfg',
            adapterSpeed: 2000,
            description: 'STM32G4 series with ARM Cortex-M4 core and advanced analog'
        },
        {
            family: 'STM32H7',
            devices: ['STM32H743ZI', 'STM32H750VB', 'STM32H7A3ZI'],
            defaultInterface: 'stlink-v3.cfg',
            defaultTarget: 'stm32h7x.cfg',
            adapterSpeed: 4000,
            description: 'STM32H7 series high-performance with ARM Cortex-M7 core'
        }
    ];

    private constructor() {
        this.toolchainService = ToolchainDetectionService.getInstance();
    }

    /**
     * 获取服务实例（单例模式）
     */
    public static getInstance(): AutoConfigurationService {
        if (!AutoConfigurationService.instance) {
            AutoConfigurationService.instance = new AutoConfigurationService();
        }
        return AutoConfigurationService.instance;
    }

    /**
     * 执行完整的配置扫描
     * 检测工具链、现有配置并生成建议
     * 
     * @returns Promise<ConfigurationScanResult> 扫描结果
     */
    public async scanConfiguration(): Promise<ConfigurationScanResult> {
        const errors: string[] = [];
        let status: 'success' | 'partial' | 'failed' = 'success';

        try {
            // 1. 检测工具链
            const toolchains = await this.toolchainService.detectToolchains({ forceRedetection: true });

            // 2. 扫描现有配置
            const existingConfig = await this.scanExistingConfiguration();

            // 3. 生成建议
            const recommendations = this.generateRecommendations(toolchains, existingConfig);

            // 4. 确定整体状态
            if (toolchains.openocd.status === DetectionStatus.FAILED && toolchains.armToolchain.status === DetectionStatus.FAILED) {
                status = 'failed';
                errors.push('Neither OpenOCD nor ARM toolchain was found');
            } else if (toolchains.openocd.status === DetectionStatus.FAILED || toolchains.armToolchain.status === DetectionStatus.FAILED) {
                status = 'partial';
                if (toolchains.openocd.status === DetectionStatus.FAILED) {
                    errors.push('OpenOCD not found');
                }
                if (toolchains.armToolchain.status === DetectionStatus.FAILED) {
                    errors.push('ARM toolchain not found');
                }
            }

            return {
                status,
                toolchains,
                existingConfig,
                recommendations,
                errors
            };

        } catch (error) {
            errors.push(`Configuration scan failed: ${error instanceof Error ? error.message : String(error)}`);
            return {
                status: 'failed',
                toolchains: this.createEmptyToolchainResults(),
                existingConfig: this.createEmptyExistingConfig(),
                recommendations: [],
                errors
            };
        }
    }

    /**
     * 自动生成cortex-debug配置
     * 基于检测结果和用户选择生成完整配置
     * 
     * @param scanResult 扫描结果
     * @param deviceName 目标设备名称
     * @param executablePath 可执行文件路径
     * @param options 额外配置选项
     */
    public async generateCortexDebugConfig(
        scanResult: ConfigurationScanResult,
        deviceName: string,
        executablePath: string = '${workspaceFolder}/build/${workspaceFolderBasename}.elf',
        options: {
            enableLiveWatch?: boolean;
            samplesPerSecond?: number;
            svdPath?: string;
            interfaceFile?: string;
            targetFile?: string;
            adapterSpeed?: number;
        } = {}
    ): Promise<GeneratedCortexDebugConfig> {
        const template = this.findDeviceTemplate(deviceName);
        const toolchains = scanResult.toolchains;

        // 基础配置
        const config: GeneratedCortexDebugConfig = {
            name: `Debug ${deviceName}`,
            type: 'cortex-debug',
            request: 'launch',
            servertype: 'openocd',
            cwd: '${workspaceFolder}',
            executable: executablePath,
            device: deviceName,
            runToEntryPoint: 'main'
        };

        // OpenOCD配置
        if (toolchains.openocd.status === DetectionStatus.SUCCESS) {
            config.configFiles = [
                `interface/${options.interfaceFile || template.defaultInterface}`,
                `target/${options.targetFile || template.defaultTarget}`
            ];
            config.openOCDLaunchCommands = [
                `adapter speed ${options.adapterSpeed || template.adapterSpeed}`
            ];
        }

        // SVD文件配置
        if (options.svdPath) {
            config.svdFile = options.svdPath;
        } else if (template.commonSvdFile) {
            config.svdFile = template.commonSvdFile;
        }

        // Live Watch配置
        if (options.enableLiveWatch) {
            config.liveWatch = {
                enabled: true,
                samplesPerSecond: options.samplesPerSecond || 10
            };
        }

        return config;
    }

    /**
     * 一键自动配置
     * 执行完整的自动配置流程，包括扫描、生成配置和保存
     * 
     * @param deviceName 目标设备名称
     * @param executablePath 可执行文件路径
     * @param options 配置选项
     */
    public async oneClickConfiguration(
        deviceName: string,
        executablePath?: string,
        options: {
            enableLiveWatch?: boolean;
            samplesPerSecond?: number;
            createBackup?: boolean;
            forceOverwrite?: boolean;
        } = {}
    ): Promise<{ success: boolean; config?: GeneratedCortexDebugConfig; error?: string }> {
        try {
            // 1. 执行配置扫描
            const scanResult = await this.scanConfiguration();

            if (scanResult.status === 'failed') {
                return {
                    success: false,
                    error: `Configuration scan failed: ${scanResult.errors.join(', ')}`
                };
            }

            // 2. 生成配置
            const config = await this.generateCortexDebugConfig(
                scanResult,
                deviceName,
                executablePath,
                {
                    enableLiveWatch: options.enableLiveWatch,
                    samplesPerSecond: options.samplesPerSecond
                }
            );

            // 3. 创建备份（如果需要）
            if (options.createBackup) {
                await this.createConfigurationBackup();
            }

            // 4. 保存配置到launch.json
            await this.saveConfigurationToLaunchJson(config, options.forceOverwrite);

            return { success: true, config };

        } catch (error) {
            return {
                success: false,
                error: `One-click configuration failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * 验证配置健康状态
     * 检查当前配置是否完整和有效
     */
    public async validateConfiguration(): Promise<{
        isValid: boolean;
        issues: string[];
        suggestions: string[];
    }> {
        const issues: string[] = [];
        const suggestions: string[] = [];

        try {
            // 1. 检查工作区
            if (!vscode.workspace.workspaceFolders) {
                issues.push('No workspace folder is open');
                suggestions.push('Open a project folder first');
                return { isValid: false, issues, suggestions };
            }

            // 2. 检查launch.json
            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');
            
            if (!fs.existsSync(launchJsonPath)) {
                issues.push('launch.json not found');
                suggestions.push('Create debug configuration using the auto-configurator');
            } else {
                const launchContent = fs.readFileSync(launchJsonPath, 'utf8');
                const launchConfig = JSON.parse(launchContent);
                
                if (!launchConfig.configurations || launchConfig.configurations.length === 0) {
                    issues.push('No debug configurations found in launch.json');
                    suggestions.push('Add debug configuration for your STM32 project');
                }
            }

            // 3. 检查工具链
            const toolchains = await this.toolchainService.detectToolchains();
            
            if (toolchains.openocd.status === DetectionStatus.FAILED) {
                issues.push('OpenOCD not found');
                suggestions.push('Install OpenOCD or set custom path in settings');
            }

            if (toolchains.armToolchain.status === DetectionStatus.FAILED) {
                issues.push('ARM toolchain not found');
                suggestions.push('Install ARM GNU toolchain');
            }

            // 4. 检查Cortex-Debug扩展
            const cortexDebugExtension = vscode.extensions.getExtension('marus25.cortex-debug');
            if (!cortexDebugExtension) {
                issues.push('Cortex-Debug extension not installed');
                suggestions.push('Install Cortex-Debug extension from VS Code marketplace');
            }

            return {
                isValid: issues.length === 0,
                issues,
                suggestions
            };

        } catch (error) {
            issues.push(`Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`);
            return { isValid: false, issues, suggestions };
        }
    }

    /**
     * 扫描现有配置信息
     */
    private async scanExistingConfiguration(): Promise<ExistingConfigurationInfo> {
        const result: ExistingConfigurationInfo = {
            workspaceSettings: {
                hasCortexDebugSettings: false
            },
            launchConfig: {
                exists: false,
                hasStm32Configs: false,
                configCount: 0,
                configs: []
            },
            workspace: {
                hasWorkspace: false,
                hasVscodeFolder: false
            }
        };

        // 检查工作区
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            result.workspace.hasWorkspace = true;
            result.workspace.workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            
            const vscodeFolder = path.join(result.workspace.workspacePath, '.vscode');
            result.workspace.hasVscodeFolder = fs.existsSync(vscodeFolder);

            // 检查launch.json
            const launchJsonPath = path.join(vscodeFolder, 'launch.json');
            if (fs.existsSync(launchJsonPath)) {
                result.launchConfig.exists = true;
                
                try {
                    const content = fs.readFileSync(launchJsonPath, 'utf8');
                    const launchConfig = JSON.parse(content);
                    
                    if (launchConfig.configurations && Array.isArray(launchConfig.configurations)) {
                        result.launchConfig.configCount = launchConfig.configurations.length;
                        
                        for (const config of launchConfig.configurations) {
                            const isStm32 = config.type === 'cortex-debug' && 
                                           (config.device?.toLowerCase().includes('stm32') || 
                                            config.name?.toLowerCase().includes('stm32'));
                            
                            result.launchConfig.configs.push({
                                name: config.name || 'Unnamed',
                                type: config.type || 'unknown',
                                device: config.device,
                                executable: config.executable,
                                servertype: config.servertype,
                                isStm32Config: isStm32
                            });
                            
                            if (isStm32) {
                                result.launchConfig.hasStm32Configs = true;
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error parsing launch.json:', error);
                }
            }
        }

        // 检查VS Code设置
        const cortexDebugConfig = vscode.workspace.getConfiguration('cortex-debug');
        const openocdPath = cortexDebugConfig.get<string>('openocdPath');
        
        if (openocdPath) {
            result.workspaceSettings.hasCortexDebugSettings = true;
            result.workspaceSettings.openocdPath = openocdPath;
        }

        return result;
    }

    /**
     * 生成配置建议
     */
    private generateRecommendations(
        toolchains: ExtendedToolchainDetectionResults,
        existingConfig: ExistingConfigurationInfo
    ): ConfigurationRecommendation[] {
        const recommendations: ConfigurationRecommendation[] = [];

        // 工作区建议
        if (!existingConfig.workspace.hasWorkspace) {
            recommendations.push({
                type: 'create_workspace',
                title: 'Open Project Workspace',
                description: 'Open your STM32 project folder as a VS Code workspace',
                priority: 'high',
                autoExecutable: false
            });
        }

        // 工具链建议
        if (toolchains.openocd.status === DetectionStatus.FAILED) {
            recommendations.push({
                type: 'setup_paths',
                title: 'Install or Configure OpenOCD',
                description: 'OpenOCD is required for debugging STM32 devices',
                priority: 'high',
                autoExecutable: false,
                params: { tool: 'openocd' }
            });
        }

        if (toolchains.armToolchain.status === DetectionStatus.FAILED) {
            recommendations.push({
                type: 'setup_paths',
                title: 'Install ARM GNU Toolchain',
                description: 'ARM toolchain is required for building STM32 projects',
                priority: 'high',
                autoExecutable: false,
                params: { tool: 'arm-toolchain' }
            });
        }

        // Cortex-Debug扩展建议
        const cortexDebugExtension = vscode.extensions.getExtension('marus25.cortex-debug');
        if (!cortexDebugExtension) {
            recommendations.push({
                type: 'install_extension',
                title: 'Install Cortex-Debug Extension',
                description: 'Required for STM32 debugging functionality',
                priority: 'high',
                autoExecutable: true,
                params: { extensionId: 'marus25.cortex-debug' }
            });
        }

        // 配置建议
        if (!existingConfig.launchConfig.exists || !existingConfig.launchConfig.hasStm32Configs) {
            recommendations.push({
                type: 'create_config',
                title: 'Create STM32 Debug Configuration',
                description: 'Generate optimized debug configuration for your STM32 project',
                priority: 'medium',
                autoExecutable: true,
                params: { configType: 'stm32-debug' }
            });
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * 查找设备对应的模板
     */
    private findDeviceTemplate(deviceName: string): STM32FamilyTemplate {
        for (const template of this.STM32_FAMILY_TEMPLATES) {
            if (template.devices.some(device => deviceName.toUpperCase().startsWith(device.substring(0, 8)))) {
                return template;
            }
        }
        
        // 默认返回STM32F4模板
        return this.STM32_FAMILY_TEMPLATES[0];
    }

    /**
     * 保存配置到launch.json
     */
    private async saveConfigurationToLaunchJson(
        config: GeneratedCortexDebugConfig,
        forceOverwrite: boolean = false
    ): Promise<void> {
        if (!vscode.workspace.workspaceFolders) {
            throw new Error('No workspace folder is open');
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const dotVscodeFolder = path.join(workspaceFolder.uri.fsPath, '.vscode');
        const launchJsonPath = path.join(dotVscodeFolder, 'launch.json');

        // 确保.vscode文件夹存在
        if (!fs.existsSync(dotVscodeFolder)) {
            fs.mkdirSync(dotVscodeFolder, { recursive: true });
        }

        let launchConfig: any = { version: '0.2.0', configurations: [] };

        // 读取现有配置
        if (fs.existsSync(launchJsonPath)) {
            const content = fs.readFileSync(launchJsonPath, 'utf8');
            if (content.trim()) {
                launchConfig = JSON.parse(content);
                if (!launchConfig.configurations) {
                    launchConfig.configurations = [];
                }
            }
        }

        // 检查是否有同名配置
        const existingIndex = launchConfig.configurations.findIndex(
            (c: any) => c.name === config.name
        );

        if (existingIndex >= 0) {
            if (forceOverwrite) {
                launchConfig.configurations[existingIndex] = config;
            } else {
                // 生成新的名称
                let counter = 2;
                let newName = `${config.name} (${counter})`;
                while (launchConfig.configurations.some((c: any) => c.name === newName)) {
                    counter++;
                    newName = `${config.name} (${counter})`;
                }
                config.name = newName;
                launchConfig.configurations.unshift(config);
            }
        } else {
            launchConfig.configurations.unshift(config);
        }

        // 保存配置
        fs.writeFileSync(launchJsonPath, JSON.stringify(launchConfig, null, 4));
    }

    /**
     * 创建配置备份
     */
    private async createConfigurationBackup(): Promise<void> {
        if (!vscode.workspace.workspaceFolders) {
            return;
        }

        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const launchJsonPath = path.join(workspaceFolder.uri.fsPath, '.vscode', 'launch.json');

        if (fs.existsSync(launchJsonPath)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(
                workspaceFolder.uri.fsPath,
                '.vscode',
                `launch.json.backup.${timestamp}`
            );
            fs.copyFileSync(launchJsonPath, backupPath);
        }
    }

    /**
     * 创建空的工具链检测结果
     */
    private createEmptyToolchainResults(): ExtendedToolchainDetectionResults {
        const now = Date.now();
        return {
            openocd: {
                name: 'OpenOCD',
                status: DetectionStatus.FAILED,
                path: null as string | null,
                info: undefined,
                error: 'Not detected',
                detectedAt: now,
                version: undefined
            },
            armToolchain: {
                name: 'ARM GNU Toolchain',
                status: DetectionStatus.FAILED,
                path: null as string | null,
                info: undefined,
                error: 'Not detected',
                detectedAt: now,
                version: undefined
            },
            completedAt: now
        };
    }

    /**
     * 创建空的现有配置信息
     */
    private createEmptyExistingConfig(): ExistingConfigurationInfo {
        return {
            workspaceSettings: {
                hasCortexDebugSettings: false
            },
            launchConfig: {
                exists: false,
                hasStm32Configs: false,
                configCount: 0,
                configs: []
            },
            workspace: {
                hasWorkspace: false,
                hasVscodeFolder: false
            }
        };
    }
}