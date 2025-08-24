/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Cortex-Debug配置生成器模块
 * 提供智能的STM32调试配置生成功能，支持多种设备族和配置模板
 * 根据项目特征和工具链检测结果自动优化配置参数
 * 
 * @fileoverview Cortex-Debug配置生成器
 * @author 左岚
 * @since 0.2.6
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { ExtendedToolchainDetectionResults } from './detectionTypes';
import { ProjectStructureAnalysis, OpenOCDConfigInfo } from './configurationScanner';
import { DetectionStatus } from '../ui/types';

/**
 * 设备特定的配置参数
 */
export interface DeviceConfig {
    /** 设备名称 */
    name: string;
    /** 设备族 */
    family: string;
    /** 内核类型 */
    core: string;
    /** 默认接口配置 */
    interface: string;
    /** 默认目标配置 */
    target: string;
    /** 适配器速度 */
    adapterSpeed: number;
    /** SVD文件路径（相对于设备包） */
    svdFile?: string;
    /** 内存配置 */
    memory: {
        flash: { start: string; size: string };
        ram: { start: string; size: string };
    };
    /** 特殊配置标志 */
    flags: string[];
}

/**
 * 配置生成选项
 */
export interface ConfigGenerationOptions {
    /** 配置名称 */
    configName?: string;
    /** 可执行文件路径 */
    executablePath?: string;
    /** 启用Live Watch */
    enableLiveWatch?: boolean;
    /** Live Watch采样率 */
    samplesPerSecond?: number;
    /** 启用SWO跟踪 */
    enableSWO?: boolean;
    /** SWO端口号 */
    swoPort?: number;
    /** 启用RTT */
    enableRTT?: boolean;
    /** 自定义OpenOCD命令 */
    customOpenOCDCommands?: string[];
    /** 自定义GDB命令 */
    customGDBCommands?: string[];
    /** SVD文件路径 */
    svdPath?: string;
    /** 工作目录 */
    cwd?: string;
    /** 是否运行到main */
    runToEntryPoint?: string | boolean;
    /** 重置后延迟 */
    postRestartDelay?: number;
    /** 预启动任务 */
    preLaunchTask?: string;
}

/**
 * 生成的配置结果
 */
export interface GeneratedConfig {
    /** 主配置对象 */
    config: any;
    /** 配置元数据 */
    metadata: {
        generator: string;
        version: string;
        timestamp: string;
        deviceFamily: string;
        confidence: number;
    };
    /** 配置说明 */
    description: string;
    /** 建议和注意事项 */
    recommendations: string[];
}

/**
 * Cortex-Debug配置生成器类
 */
export class CortexDebugConfigGenerator {
    /** 设备配置数据库 */
    private readonly DEVICE_CONFIGS: Record<string, DeviceConfig> = {
        // STM32F4系列
        STM32F407: {
            name: 'STM32F407VG',
            family: 'STM32F4',
            core: 'Cortex-M4',
            interface: 'stlink-v2-1.cfg',
            target: 'stm32f4x.cfg',
            adapterSpeed: 2000,
            svdFile: 'STM32F407.svd',
            memory: {
                flash: { start: '0x08000000', size: '1024K' },
                ram: { start: '0x20000000', size: '192K' }
            },
            flags: ['fpu']
        },
        STM32F429: {
            name: 'STM32F429ZI',
            family: 'STM32F4',
            core: 'Cortex-M4',
            interface: 'stlink-v2-1.cfg',
            target: 'stm32f4x.cfg',
            adapterSpeed: 2000,
            svdFile: 'STM32F429.svd',
            memory: {
                flash: { start: '0x08000000', size: '2048K' },
                ram: { start: '0x20000000', size: '256K' }
            },
            flags: ['fpu', 'dsp']
        },
        
        // STM32F1系列
        STM32F103: {
            name: 'STM32F103C8',
            family: 'STM32F1',
            core: 'Cortex-M3',
            interface: 'stlink-v2.cfg',
            target: 'stm32f1x.cfg',
            adapterSpeed: 1000,
            svdFile: 'STM32F103.svd',
            memory: {
                flash: { start: '0x08000000', size: '64K' },
                ram: { start: '0x20000000', size: '20K' }
            },
            flags: []
        },
        
        // STM32L4系列
        STM32L476: {
            name: 'STM32L476RG',
            family: 'STM32L4',
            core: 'Cortex-M4',
            interface: 'stlink-v2-1.cfg',
            target: 'stm32l4x.cfg',
            adapterSpeed: 2000,
            svdFile: 'STM32L476.svd',
            memory: {
                flash: { start: '0x08000000', size: '1024K' },
                ram: { start: '0x20000000', size: '128K' }
            },
            flags: ['fpu', 'low-power']
        },
        
        // STM32H7系列
        STM32H743: {
            name: 'STM32H743ZI',
            family: 'STM32H7',
            core: 'Cortex-M7',
            interface: 'stlink-v3.cfg',
            target: 'stm32h7x.cfg',
            adapterSpeed: 4000,
            svdFile: 'STM32H743.svd',
            memory: {
                flash: { start: '0x08000000', size: '2048K' },
                ram: { start: '0x20000000', size: '512K' }
            },
            flags: ['fpu', 'dsp', 'cache']
        },
        
        // STM32G4系列
        STM32G474: {
            name: 'STM32G474RE',
            family: 'STM32G4',
            core: 'Cortex-M4',
            interface: 'stlink-v2-1.cfg',
            target: 'stm32g4x.cfg',
            adapterSpeed: 2000,
            svdFile: 'STM32G474.svd',
            memory: {
                flash: { start: '0x08000000', size: '512K' },
                ram: { start: '0x20000000', size: '128K' }
            },
            flags: ['fpu', 'dsp', 'math-accelerator']
        }
    };

    /**
     * 生成Cortex-Debug配置
     * 
     * @param deviceName 设备名称
     * @param toolchains 工具链检测结果
     * @param projectAnalysis 项目结构分析结果
     * @param openocdConfig OpenOCD配置信息
     * @param options 配置选项
     * @returns 生成的配置
     */
    public generateConfig(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis?: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo,
        options: ConfigGenerationOptions = {}
    ): GeneratedConfig {
        // 1. 查找设备配置
        const deviceConfig = this.findDeviceConfig(deviceName);
        
        // 2. 生成基础配置
        const baseConfig = this.generateBaseConfig(deviceConfig, options);
        
        // 3. 添加工具链配置
        this.addToolchainConfig(baseConfig, toolchains, deviceConfig);
        
        // 4. 添加项目特定配置
        if (projectAnalysis) {
            this.addProjectSpecificConfig(baseConfig, projectAnalysis, options);
        }
        
        // 5. 添加OpenOCD配置
        if (openocdConfig && toolchains.openocd.status === DetectionStatus.SUCCESS) {
            this.addOpenOCDConfig(baseConfig, openocdConfig, deviceConfig);
        }
        
        // 6. 添加高级功能配置
        this.addAdvancedFeatures(baseConfig, deviceConfig, options);
        
        // 7. 生成元数据和建议
        const metadata = this.generateMetadata(deviceConfig, toolchains, projectAnalysis);
        const recommendations = this.generateRecommendations(deviceConfig, baseConfig, toolchains);
        
        return {
            config: baseConfig,
            metadata,
            description: this.generateDescription(deviceConfig, baseConfig),
            recommendations
        };
    }

    /**
     * 生成多个配置模板
     * 为不同的调试场景生成多个配置选项
     * 
     * @param deviceName 设备名称
     * @param toolchains 工具链检测结果
     * @param projectAnalysis 项目结构分析结果
     * @param openocdConfig OpenOCD配置信息
     * @returns 配置模板列表
     */
    public generateMultipleTemplates(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis?: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): GeneratedConfig[] {
        const templates: GeneratedConfig[] = [];
        
        // 基础调试配置
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName}`,
            runToEntryPoint: 'main'
        }));
        
        // 高级调试配置（启用Live Watch）
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName} (Live Watch)`,
            enableLiveWatch: true,
            samplesPerSecond: 10,
            runToEntryPoint: 'main'
        }));
        
        // 生产调试配置（不重置到main）
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName} (No Reset)`,
            runToEntryPoint: false,
            postRestartDelay: 100
        }));
        
        // 如果设备支持，添加SWO跟踪配置
        const deviceConfig = this.findDeviceConfig(deviceName);
        if (deviceConfig.flags.includes('swo') || deviceConfig.core.includes('M4') || deviceConfig.core.includes('M7')) {
            templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
                configName: `Debug ${deviceName} (SWO Trace)`,
                enableSWO: true,
                swoPort: 61235,
                runToEntryPoint: 'main'
            }));
        }

        // 添加RTT配置（如果支持）
        if (this.supportsRTT(deviceConfig)) {
            templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
                configName: `Debug ${deviceName} (RTT Console)`,
                enableRTT: true,
                runToEntryPoint: 'main'
            }));
        }
        
        return templates;
    }

    /**
     * 验证生成的配置
     * 检查配置的完整性和正确性
     * 
     * @param config 要验证的配置
     * @param toolchains 工具链检测结果
     * @returns 验证结果
     */
    public validateConfig(config: any, toolchains: ExtendedToolchainDetectionResults): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        suggestions: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const suggestions: string[] = [];

        // 检查必需字段
        const requiredFields = ['name', 'type', 'request', 'executable', 'device'];
        for (const field of requiredFields) {
            if (!config[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // 检查类型
        if (config.type !== 'cortex-debug') {
            errors.push('Configuration type must be "cortex-debug"');
        }

        // 检查服务器类型
        if (config.servertype === 'openocd') {
            if (toolchains.openocd.status !== DetectionStatus.SUCCESS) {
                warnings.push('OpenOCD not found, but configuration uses openocd server');
                suggestions.push('Install OpenOCD or use different server type');
            }
            
            if (!config.configFiles || !Array.isArray(config.configFiles)) {
                errors.push('OpenOCD configuration requires configFiles array');
            }
        }

        // 检查可执行文件路径
        if (config.executable && config.executable.includes('${workspaceFolder}')) {
            suggestions.push('Verify that the executable path is correct for your build system');
        }

        // 检查设备名称
        if (config.device && !config.device.toUpperCase().startsWith('STM32')) {
            warnings.push('Device name doesn\'t appear to be an STM32 device');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            suggestions
        };
    }

    /**
     * 查找设备配置
     */
    private findDeviceConfig(deviceName: string): DeviceConfig {
        const normalizedDevice = deviceName.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // 尝试精确匹配
        for (const [key, config] of Object.entries(this.DEVICE_CONFIGS)) {
            if (normalizedDevice.startsWith(key)) {
                return { ...config, name: deviceName };
            }
        }
        
        // 按设备族匹配
        const deviceFamily = normalizedDevice.substring(0, 7); // STM32F4, STM32L4, etc.
        for (const [key, config] of Object.entries(this.DEVICE_CONFIGS)) {
            if (deviceFamily.startsWith(key.substring(0, 7))) {
                return { ...config, name: deviceName };
            }
        }
        
        // 默认返回STM32F4配置
        return { ...this.DEVICE_CONFIGS.STM32F407, name: deviceName };
    }

    /**
     * 生成基础配置
     */
    private generateBaseConfig(deviceConfig: DeviceConfig, options: ConfigGenerationOptions): any {
        const config = {
            name: options.configName || `Debug ${deviceConfig.name}`,
            type: 'cortex-debug',
            request: 'launch',
            servertype: 'openocd',
            cwd: options.cwd || '${workspaceFolder}',
            executable: options.executablePath || '${workspaceFolder}/build/${workspaceFolderBasename}.elf',
            device: deviceConfig.name,
            runToEntryPoint: options.runToEntryPoint !== undefined ? options.runToEntryPoint : 'main'
        };

        return config;
    }

    /**
     * 添加工具链配置
     */
    private addToolchainConfig(config: any, toolchains: ExtendedToolchainDetectionResults, deviceConfig: DeviceConfig): void {
        // GDB配置
        if (toolchains.armToolchain.status === DetectionStatus.SUCCESS && toolchains.armToolchain.info) {
            // Derive GDB path from toolchain info
            const toolchainInfo = toolchains.armToolchain.info as any;
            if (toolchainInfo.rootPath) {
                config.gdbPath = path.join(toolchainInfo.rootPath, 'bin', process.platform === 'win32' ? 'arm-none-eabi-gdb.exe' : 'arm-none-eabi-gdb');
            }
        }

        // 设备特定的GDB配置
        if (deviceConfig.core === 'Cortex-M7' || deviceConfig.flags.includes('cache')) {
            config.preLaunchCommands = config.preLaunchCommands || [];
            config.preLaunchCommands.push('monitor reset halt');
            config.preLaunchCommands.push('monitor flash write_image erase');
        }
    }

    /**
     * 添加项目特定配置
     */
    private addProjectSpecificConfig(
        config: any,
        projectAnalysis: ProjectStructureAnalysis,
        options: ConfigGenerationOptions
    ): void {
        // 根据项目类型调整可执行文件路径
        if (projectAnalysis.executablePrediction.defaultPath) {
            config.executable = projectAnalysis.executablePrediction.defaultPath;
        }

        // 根据构建系统添加预构建命令
        if (projectAnalysis.buildSystem.hasMakefile) {
            config.preLaunchTask = 'make';
        } else if (projectAnalysis.buildSystem.hasCMakeLists) {
            config.preLaunchTask = 'cmake build';
        }

        // 如果推断出设备信息，使用推断的设备
        if (projectAnalysis.deviceInference.likelyDevice && 
            projectAnalysis.deviceInference.confidence > 50) {
            config.device = projectAnalysis.deviceInference.likelyDevice;
        }
    }

    /**
     * 添加OpenOCD配置
     */
    private addOpenOCDConfig(config: any, openocdConfig: OpenOCDConfigInfo, deviceConfig: DeviceConfig): void {
        // 配置文件
        config.configFiles = [
            `interface/${openocdConfig.recommendedInterface || deviceConfig.interface}`,
            `target/${openocdConfig.recommendedTarget || deviceConfig.target}`
        ];

        // OpenOCD启动命令
        config.openOCDLaunchCommands = [
            `adapter speed ${deviceConfig.adapterSpeed}`,
            'transport select hla_swd'
        ];

        // 设备特定的OpenOCD命令
        if (deviceConfig.flags.includes('low-power')) {
            config.openOCDLaunchCommands.push('hla_swd_allow_ack_on_timeout true');
        }
    }

    /**
     * 添加高级功能配置
     */
    private addAdvancedFeatures(config: any, deviceConfig: DeviceConfig, options: ConfigGenerationOptions): void {
        // Live Watch配置
        if (options.enableLiveWatch) {
            config.liveWatch = {
                enabled: true,
                samplesPerSecond: options.samplesPerSecond || 10
            };
        }

        // SWO跟踪配置
        if (options.enableSWO && (deviceConfig.core.includes('M4') || deviceConfig.core.includes('M7'))) {
            config.swoConfig = {
                enabled: true,
                cpuFrequency: this.getCpuFrequency(deviceConfig),
                swoFrequency: 2000000,
                source: 'probe',
                decoders: [
                    {
                        type: 'console',
                        label: 'ITM',
                        port: 0
                    }
                ]
            };
        }

        // RTT配置
        if (options.enableRTT) {
            config.rttConfig = {
                enabled: true,
                address: 'auto',
                decoders: [
                    {
                        port: 0,
                        type: 'console',
                        label: 'RTT Terminal'
                    }
                ]
            };
        }

        // SVD文件配置
        if (options.svdPath) {
            config.svdFile = options.svdPath;
        } else if (deviceConfig.svdFile) {
            config.svdFile = `${deviceConfig.family}/${deviceConfig.svdFile}`;
        }

        // 后重启延迟
        if (options.postRestartDelay) {
            config.postRestartDelay = options.postRestartDelay;
        }
    }

    /**
     * 生成配置元数据
     */
    private generateMetadata(
        deviceConfig: DeviceConfig,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis?: ProjectStructureAnalysis
    ): GeneratedConfig['metadata'] {
        let confidence = 100;

        // 根据检测结果调整置信度
        if (toolchains.openocd.status !== DetectionStatus.SUCCESS) confidence -= 30;
        if (toolchains.armToolchain.status !== DetectionStatus.SUCCESS) confidence -= 20;
        if (!projectAnalysis?.deviceInference.likelyDevice) confidence -= 10;

        return {
            generator: 'STM32 Configurator Auto-Config',
            version: '0.2.6',
            timestamp: new Date().toISOString(),
            deviceFamily: deviceConfig.family,
            confidence: Math.max(0, confidence)
        };
    }

    /**
     * 生成配置描述
     */
    private generateDescription(deviceConfig: DeviceConfig, config: any): string {
        const features = [];
        
        if (config.liveWatch?.enabled) {
            features.push('Live Watch enabled');
        }
        if (config.swoConfig?.enabled) {
            features.push('SWO tracing enabled');
        }
        if (config.rttConfig?.enabled) {
            features.push('RTT console enabled');
        }
        if (config.svdFile) {
            features.push('SVD peripheral view');
        }

        const featuresText = features.length > 0 ? ` with ${features.join(', ')}` : '';
        
        return `Auto-generated debug configuration for ${deviceConfig.name} (${deviceConfig.core})${featuresText}`;
    }

    /**
     * 生成建议和注意事项
     */
    private generateRecommendations(
        deviceConfig: DeviceConfig,
        config: any,
        toolchains: ExtendedToolchainDetectionResults
    ): string[] {
        const recommendations: string[] = [];

        // 工具链相关建议
        if (toolchains.openocd.status !== DetectionStatus.SUCCESS) {
            recommendations.push('Install OpenOCD for debugging support');
        }
        if (toolchains.armToolchain.status !== DetectionStatus.SUCCESS) {
            recommendations.push('Install ARM GNU toolchain for complete development environment');
        }

        // 设备特定建议
        if (deviceConfig.flags.includes('fpu')) {
            recommendations.push('Enable FPU in your project settings for optimal performance');
        }
        if (deviceConfig.flags.includes('cache')) {
            recommendations.push('Consider cache configuration for high-performance applications');
        }
        if (deviceConfig.flags.includes('low-power')) {
            recommendations.push('Use appropriate sleep modes for low-power applications');
        }

        // 配置特定建议
        if (config.liveWatch?.enabled) {
            recommendations.push('Use Live Watch sparingly to avoid performance impact');
        }
        if (config.swoConfig?.enabled) {
            recommendations.push('Ensure SWO pin is not used by your application');
        }

        // 通用建议
        recommendations.push('Verify executable path matches your build system output');
        recommendations.push('Test configuration with a simple program first');

        return recommendations;
    }

    /**
     * 生成优化的配置模板集合
     * 根据项目类型和设备特性生成最适合的配置组合
     */
    public generateOptimizedTemplateSet(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): GeneratedConfig[] {
        const templates: GeneratedConfig[] = [];
        const deviceConfig = this.findDeviceConfig(deviceName);

        // 基于项目类型的配置策略
        const projectType = projectAnalysis.projectType;
        
        if (projectType === 'stm32cube') {
            // STM32CubeMX项目配置
            templates.push(...this.generateSTM32CubeTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));
        } else if (projectType === 'platformio') {
            // PlatformIO项目配置
            templates.push(...this.generatePlatformIOTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));
        } else if (projectType === 'cmake') {
            // CMake项目配置
            templates.push(...this.generateCMakeTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));
        } else {
            // 通用Makefile或未知类型项目
            templates.push(...this.generateGenericTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));
        }

        // 添加高级调试配置
        templates.push(...this.generateAdvancedDebuggingTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));

        return templates;
    }

    /**
     * 生成配置快照和恢复点
     * 支持配置版本管理和快速恢复
     */
    public async createConfigurationSnapshot(name: string): Promise<{
        snapshotId: string;
        timestamp: string;
        configCount: number;
        metadata: {
            vsCodeVersion: string;
            extensionVersion: string;
            toolchainVersions: Record<string, string>;
        };
    }> {
        const snapshot = {
            snapshotId: `snapshot-${Date.now()}`,
            timestamp: new Date().toISOString(),
            configCount: 0,
            metadata: {
                vsCodeVersion: vscode.version,
                extensionVersion: '0.2.6',
                toolchainVersions: {} as Record<string, string>
            }
        };

        // 这里应该实现实际的快照创建逻辑
        // 包括保存当前的launch.json和相关设置

        return snapshot;
    }

    /**
     * 批量配置生成和验证
     * 支持多设备项目的配置生成
     */
    public generateBatchConfigurations(
        devices: string[],
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): {
        successful: GeneratedConfig[];
        failed: Array<{ device: string; error: string }>;
        warnings: string[];
    } {
        const result = {
            successful: [] as GeneratedConfig[],
            failed: [] as Array<{ device: string; error: string }>,
            warnings: [] as string[]
        };

        for (const device of devices) {
            try {
                const config = this.generateConfig(device, toolchains, projectAnalysis, openocdConfig);
                const validation = this.validateConfig(config.config, toolchains);
                
                if (validation.isValid) {
                    result.successful.push(config);
                } else {
                    result.failed.push({
                        device,
                        error: `Validation failed: ${validation.errors.join(', ')}`
                    });
                }
                
                result.warnings.push(...validation.warnings);
            } catch (error) {
                result.failed.push({
                    device,
                    error: `Generation failed: ${error instanceof Error ? error.message : String(error)}`
                });
            }
        }

        return result;
    }

    /**
     * 检查设备是否支持RTT
     */
    private supportsRTT(deviceConfig: DeviceConfig): boolean {
        // RTT支持大多数ARM Cortex-M设备
        return deviceConfig.core.includes('Cortex-M');
    }

    /**
     * 生成STM32CubeMX项目模板
     */
    private generateSTM32CubeTemplates(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): GeneratedConfig[] {
        const templates: GeneratedConfig[] = [];
        
        // STM32CubeMX通常使用特定的构建结构
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName} (CubeMX)`,
            executablePath: '${workspaceFolder}/Debug/${workspaceFolderBasename}.elf',
            runToEntryPoint: 'main',
            preLaunchTask: 'Build Project'
        }));

        return templates;
    }

    /**
     * 生成PlatformIO项目模板
     */
    private generatePlatformIOTemplates(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): GeneratedConfig[] {
        const templates: GeneratedConfig[] = [];
        
        // PlatformIO有自己的构建系统
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName} (PlatformIO)`,
            executablePath: '${workspaceFolder}/.pio/build/debug/firmware.elf',
            runToEntryPoint: 'main',
            preLaunchTask: 'PlatformIO: Build'
        }));

        return templates;
    }

    /**
     * 生成CMake项目模板
     */
    private generateCMakeTemplates(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): GeneratedConfig[] {
        const templates: GeneratedConfig[] = [];
        
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName} (CMake)`,
            executablePath: '${workspaceFolder}/build/${workspaceFolderBasename}.elf',
            runToEntryPoint: 'main',
            preLaunchTask: 'cmake: build'
        }));

        return templates;
    }

    /**
     * 生成通用项目模板
     */
    private generateGenericTemplates(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): GeneratedConfig[] {
        const templates: GeneratedConfig[] = [];
        
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName}`,
            runToEntryPoint: 'main'
        }));

        return templates;
    }

    /**
     * 生成高级调试模板
     */
    private generateAdvancedDebuggingTemplates(
        deviceName: string,
        toolchains: ExtendedToolchainDetectionResults,
        projectAnalysis: ProjectStructureAnalysis,
        openocdConfig?: OpenOCDConfigInfo
    ): GeneratedConfig[] {
        const templates: GeneratedConfig[] = [];
        const deviceConfig = this.findDeviceConfig(deviceName);

        // 性能分析配置
        if (deviceConfig.core.includes('M4') || deviceConfig.core.includes('M7')) {
            templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
                configName: `Profile ${deviceName}`,
                enableSWO: true,
                enableLiveWatch: true,
                samplesPerSecond: 20,
                runToEntryPoint: 'main'
            }));
        }

        // 功耗调试配置
        if (deviceConfig.flags.includes('low-power')) {
            templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
                configName: `Low Power Debug ${deviceName}`,
                customOpenOCDCommands: [
                    'hla_swd_allow_ack_on_timeout true',
                    'transport select hla_swd'
                ],
                runToEntryPoint: 'main'
            }));
        }

        return templates;
    }

    /**
     * 获取CPU频率（用于SWO配置）
     */
    private getCpuFrequency(deviceConfig: DeviceConfig): number {
        const frequencyMap: Record<string, number> = {
            'STM32F1': 72000000,
            'STM32F4': 168000000,
            'STM32L4': 80000000,
            'STM32G4': 170000000,
            'STM32H7': 400000000
        };

        return frequencyMap[deviceConfig.family] || 8000000; // 默认8MHz
    }
}