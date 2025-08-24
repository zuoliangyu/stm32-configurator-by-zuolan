"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
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
exports.CortexDebugConfigGenerator = void 0;
/**
 * Cortex-Debug配置生成器模块
 * 提供智能的STM32调试配置生成功能，支持多种设备族和配置模板
 * 根据项目特征和工具链检测结果自动优化配置参数
 *
 * @fileoverview Cortex-Debug配置生成器
 * @author 左岚
 * @since 0.2.6
 */
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const types_1 = require("../ui/types");
/**
 * Cortex-Debug配置生成器类
 */
class CortexDebugConfigGenerator {
    /** 设备配置数据库 */
    DEVICE_CONFIGS = {
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
    generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, options = {}) {
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
        if (openocdConfig && toolchains.openocd.status === types_1.DetectionStatus.SUCCESS) {
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
    generateMultipleTemplates(deviceName, toolchains, projectAnalysis, openocdConfig) {
        const templates = [];
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
    validateConfig(config, toolchains) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
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
            if (toolchains.openocd.status !== types_1.DetectionStatus.SUCCESS) {
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
    findDeviceConfig(deviceName) {
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
    generateBaseConfig(deviceConfig, options) {
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
    addToolchainConfig(config, toolchains, deviceConfig) {
        // GDB配置
        if (toolchains.armToolchain.status === types_1.DetectionStatus.SUCCESS && toolchains.armToolchain.info) {
            // Derive GDB path from toolchain info
            const toolchainInfo = toolchains.armToolchain.info;
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
    addProjectSpecificConfig(config, projectAnalysis, options) {
        // 根据项目类型调整可执行文件路径
        if (projectAnalysis.executablePrediction.defaultPath) {
            config.executable = projectAnalysis.executablePrediction.defaultPath;
        }
        // 根据构建系统添加预构建命令
        if (projectAnalysis.buildSystem.hasMakefile) {
            config.preLaunchTask = 'make';
        }
        else if (projectAnalysis.buildSystem.hasCMakeLists) {
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
    addOpenOCDConfig(config, openocdConfig, deviceConfig) {
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
    addAdvancedFeatures(config, deviceConfig, options) {
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
        }
        else if (deviceConfig.svdFile) {
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
    generateMetadata(deviceConfig, toolchains, projectAnalysis) {
        let confidence = 100;
        // 根据检测结果调整置信度
        if (toolchains.openocd.status !== types_1.DetectionStatus.SUCCESS)
            confidence -= 30;
        if (toolchains.armToolchain.status !== types_1.DetectionStatus.SUCCESS)
            confidence -= 20;
        if (!projectAnalysis?.deviceInference.likelyDevice)
            confidence -= 10;
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
    generateDescription(deviceConfig, config) {
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
    generateRecommendations(deviceConfig, config, toolchains) {
        const recommendations = [];
        // 工具链相关建议
        if (toolchains.openocd.status !== types_1.DetectionStatus.SUCCESS) {
            recommendations.push('Install OpenOCD for debugging support');
        }
        if (toolchains.armToolchain.status !== types_1.DetectionStatus.SUCCESS) {
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
    generateOptimizedTemplateSet(deviceName, toolchains, projectAnalysis, openocdConfig) {
        const templates = [];
        const deviceConfig = this.findDeviceConfig(deviceName);
        // 基于项目类型的配置策略
        const projectType = projectAnalysis.projectType;
        if (projectType === 'stm32cube') {
            // STM32CubeMX项目配置
            templates.push(...this.generateSTM32CubeTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));
        }
        else if (projectType === 'platformio') {
            // PlatformIO项目配置
            templates.push(...this.generatePlatformIOTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));
        }
        else if (projectType === 'cmake') {
            // CMake项目配置
            templates.push(...this.generateCMakeTemplates(deviceName, toolchains, projectAnalysis, openocdConfig));
        }
        else {
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
    async createConfigurationSnapshot(name) {
        const snapshot = {
            snapshotId: `snapshot-${Date.now()}`,
            timestamp: new Date().toISOString(),
            configCount: 0,
            metadata: {
                vsCodeVersion: vscode.version,
                extensionVersion: '0.2.6',
                toolchainVersions: {}
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
    generateBatchConfigurations(devices, toolchains, projectAnalysis, openocdConfig) {
        const result = {
            successful: [],
            failed: [],
            warnings: []
        };
        for (const device of devices) {
            try {
                const config = this.generateConfig(device, toolchains, projectAnalysis, openocdConfig);
                const validation = this.validateConfig(config.config, toolchains);
                if (validation.isValid) {
                    result.successful.push(config);
                }
                else {
                    result.failed.push({
                        device,
                        error: `Validation failed: ${validation.errors.join(', ')}`
                    });
                }
                result.warnings.push(...validation.warnings);
            }
            catch (error) {
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
    supportsRTT(deviceConfig) {
        // RTT支持大多数ARM Cortex-M设备
        return deviceConfig.core.includes('Cortex-M');
    }
    /**
     * 生成STM32CubeMX项目模板
     */
    generateSTM32CubeTemplates(deviceName, toolchains, projectAnalysis, openocdConfig) {
        const templates = [];
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
    generatePlatformIOTemplates(deviceName, toolchains, projectAnalysis, openocdConfig) {
        const templates = [];
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
    generateCMakeTemplates(deviceName, toolchains, projectAnalysis, openocdConfig) {
        const templates = [];
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
    generateGenericTemplates(deviceName, toolchains, projectAnalysis, openocdConfig) {
        const templates = [];
        templates.push(this.generateConfig(deviceName, toolchains, projectAnalysis, openocdConfig, {
            configName: `Debug ${deviceName}`,
            runToEntryPoint: 'main'
        }));
        return templates;
    }
    /**
     * 生成高级调试模板
     */
    generateAdvancedDebuggingTemplates(deviceName, toolchains, projectAnalysis, openocdConfig) {
        const templates = [];
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
    getCpuFrequency(deviceConfig) {
        const frequencyMap = {
            'STM32F1': 72000000,
            'STM32F4': 168000000,
            'STM32L4': 80000000,
            'STM32G4': 170000000,
            'STM32H7': 400000000
        };
        return frequencyMap[deviceConfig.family] || 8000000; // 默认8MHz
    }
}
exports.CortexDebugConfigGenerator = CortexDebugConfigGenerator;
//# sourceMappingURL=cortexDebugConfigGenerator.js.map