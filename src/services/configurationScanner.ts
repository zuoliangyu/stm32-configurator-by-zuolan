/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 配置扫描器模块
 * 专门负责扫描和分析现有的VS Code配置、OpenOCD配置文件等
 * 为自动配置服务提供详细的环境分析
 * 
 * @fileoverview 配置扫描器
 * @author 左岚
 * @since 0.2.6
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getOpenOCDConfigFiles } from '../utils/openocd';
import { DetectionStatus } from '../ui/types';

/**
 * OpenOCD配置文件信息
 */
export interface OpenOCDConfigInfo {
    /** 接口文件列表 */
    interfaceFiles: string[];
    /** 目标文件列表 */
    targetFiles: string[];
    /** 配置文件根路径 */
    configRoot: string;
    /** 推荐的接口文件 */
    recommendedInterface: string;
    /** 推荐的目标文件 */
    recommendedTarget: string;
}

/**
 * VS Code设置分析结果
 */
export interface VSCodeSettingsAnalysis {
    /** 全局设置 */
    global: {
        cortexDebugPath?: string;
        openocdPath?: string;
        armToolchainPath?: string;
    };
    /** 工作区设置 */
    workspace: {
        cortexDebugPath?: string;
        openocdPath?: string;
        armToolchainPath?: string;
    };
    /** 用户设置 */
    user: {
        cortexDebugPath?: string;
        openocdPath?: string;
        armToolchainPath?: string;
    };
    /** 设置冲突检测 */
    conflicts: string[];
}

/**
 * 项目结构分析结果
 */
export interface ProjectStructureAnalysis {
    /** 项目类型检测 */
    projectType: 'stm32cube' | 'platformio' | 'makefile' | 'cmake' | 'unknown';
    /** 源文件分析 */
    sourceFiles: {
        hasMain: boolean;
        mainFiles: string[];
        sourceCount: number;
        headerCount: number;
    };
    /** 构建系统分析 */
    buildSystem: {
        hasMakefile: boolean;
        hasCMakeLists: boolean;
        hasPlatformIO: boolean;
        hasSTM32CubeMX: boolean;
    };
    /** 可执行文件预测 */
    executablePrediction: {
        likelyPaths: string[];
        buildOutputDirs: string[];
        defaultPath: string;
    };
    /** 设备信息推断 */
    deviceInference: {
        likelyDevice?: string;
        deviceFamily?: string;
        confidence: number;
        evidenceFiles: string[];
    };
}

/**
 * 调试配置分析结果
 */
export interface DebugConfigAnalysis {
    /** 现有配置列表 */
    existingConfigs: Array<{
        name: string;
        type: string;
        isStm32: boolean;
        isComplete: boolean;
        missingFields: string[];
        hasLiveWatch: boolean;
        device?: string;
        executable?: string;
    }>;
    /** 配置质量评估 */
    quality: {
        score: number; // 0-100
        issues: string[];
        suggestions: string[];
    };
    /** 重复配置检测 */
    duplicates: Array<{
        configs: string[];
        similarity: number;
    }>;
}

/**
 * 配置扫描器类
 * 提供深度的配置环境分析功能
 */
export class ConfigurationScanner {
    /**
     * 扫描OpenOCD配置文件信息
     * 
     * @param openocdPath OpenOCD安装路径
     * @returns Promise<OpenOCDConfigInfo | null> 配置文件信息
     */
    public async scanOpenOCDConfigs(openocdPath: string): Promise<OpenOCDConfigInfo | null> {
        try {
            const configFiles = await getOpenOCDConfigFiles(openocdPath);
            
            if (!configFiles || (!configFiles.interfaces.length && !configFiles.targets.length)) {
                return null;
            }

            // 分析推荐配置
            const recommendedInterface = this.selectRecommendedInterface(configFiles.interfaces);
            const recommendedTarget = this.selectRecommendedTarget(configFiles.targets);

            return {
                interfaceFiles: configFiles.interfaces,
                targetFiles: configFiles.targets,
                configRoot: path.dirname(openocdPath),
                recommendedInterface,
                recommendedTarget
            };
        } catch (error) {
            console.error('Failed to scan OpenOCD configs:', error);
            return null;
        }
    }

    /**
     * 执行完整的环境健康检查
     * 扫描和验证整个STM32开发环境的配置状态
     */
    public async performHealthCheck(): Promise<{
        overall: 'healthy' | 'partial' | 'critical';
        scores: {
            toolchain: number;
            workspace: number;
            configuration: number;
            extensions: number;
        };
        issues: Array<{
            category: string;
            severity: 'error' | 'warning' | 'info';
            message: string;
            solution: string;
        }>;
        recommendations: Array<{
            title: string;
            description: string;
            priority: 'high' | 'medium' | 'low';
            actionable: boolean;
        }>;
    }> {
        const healthCheck = {
            overall: 'healthy' as 'healthy' | 'partial' | 'critical',
            scores: {
                toolchain: 100,
                workspace: 100,
                configuration: 100,
                extensions: 100
            },
            issues: [] as Array<{
                category: string;
                severity: 'error' | 'warning' | 'info';
                message: string;
                solution: string;
            }>,
            recommendations: [] as Array<{
                title: string;
                description: string;
                priority: 'high' | 'medium' | 'low';
                actionable: boolean;
            }>
        };

        try {
            // 1. 检查工具链环境
            await this.checkToolchainHealth(healthCheck);
            
            // 2. 检查工作区状态
            await this.checkWorkspaceHealth(healthCheck);
            
            // 3. 检查配置质量
            await this.checkConfigurationHealth(healthCheck);
            
            // 4. 检查扩展状态
            await this.checkExtensionHealth(healthCheck);

            // 5. 计算总体健康状态
            const avgScore = (healthCheck.scores.toolchain + healthCheck.scores.workspace + 
                            healthCheck.scores.configuration + healthCheck.scores.extensions) / 4;
            
            if (avgScore >= 80) {
                healthCheck.overall = 'healthy';
            } else if (avgScore >= 50) {
                healthCheck.overall = 'partial';
            } else {
                healthCheck.overall = 'critical';
            }

        } catch (error) {
            console.error('Health check failed:', error);
            healthCheck.overall = 'critical';
            healthCheck.issues.push({
                category: 'System',
                severity: 'error',
                message: 'Health check process failed',
                solution: 'Check VS Code logs and restart the extension'
            });
        }

        return healthCheck;
    }

    /**
     * 智能配置修复建议生成
     * 基于检测到的问题自动生成修复方案
     */
    public async generateConfigurationRepairPlan(issues: any[]): Promise<{
        steps: Array<{
            order: number;
            title: string;
            description: string;
            automated: boolean;
            command?: string;
            params?: any;
        }>;
        estimatedTime: string;
        complexity: 'simple' | 'moderate' | 'complex';
    }> {
        const repairPlan = {
            steps: [] as Array<{
                order: number;
                title: string;
                description: string;
                automated: boolean;
                command?: string;
                params?: any;
            }>,
            estimatedTime: '5-10 minutes',
            complexity: 'simple' as 'simple' | 'moderate' | 'complex'
        };

        let order = 1;
        let automatedSteps = 0;

        // 分析问题并生成修复步骤
        for (const issue of issues) {
            switch (issue.category) {
                case 'toolchain':
                    if (issue.message.includes('OpenOCD')) {
                        repairPlan.steps.push({
                            order: order++,
                            title: 'Install OpenOCD',
                            description: 'Download and install OpenOCD for STM32 debugging',
                            automated: false
                        });
                    }
                    if (issue.message.includes('ARM toolchain')) {
                        repairPlan.steps.push({
                            order: order++,
                            title: 'Install ARM GNU Toolchain',
                            description: 'Download and install ARM GNU toolchain for STM32 development',
                            automated: false
                        });
                    }
                    break;

                case 'extension':
                    repairPlan.steps.push({
                        order: order++,
                        title: 'Install Required Extension',
                        description: 'Install Cortex-Debug extension from VS Code marketplace',
                        automated: true,
                        command: 'workbench.extensions.installExtension',
                        params: { extensionId: 'marus25.cortex-debug' }
                    });
                    automatedSteps++;
                    break;

                case 'configuration':
                    repairPlan.steps.push({
                        order: order++,
                        title: 'Generate Debug Configuration',
                        description: 'Create optimized STM32 debug configuration',
                        automated: true,
                        command: 'stm32-configurator.autoConfigureAll'
                    });
                    automatedSteps++;
                    break;
            }
        }

        // 评估复杂度
        if (repairPlan.steps.length <= 2 && automatedSteps >= repairPlan.steps.length / 2) {
            repairPlan.complexity = 'simple';
            repairPlan.estimatedTime = '2-5 minutes';
        } else if (repairPlan.steps.length <= 5) {
            repairPlan.complexity = 'moderate';
            repairPlan.estimatedTime = '5-15 minutes';
        } else {
            repairPlan.complexity = 'complex';
            repairPlan.estimatedTime = '15-30 minutes';
        }

        return repairPlan;
    }

    /**
     * 分析VS Code设置
     * 
     * @returns Promise<VSCodeSettingsAnalysis> 设置分析结果
     */
    public async analyzeVSCodeSettings(): Promise<VSCodeSettingsAnalysis> {
        const result: VSCodeSettingsAnalysis = {
            global: {},
            workspace: {},
            user: {},
            conflicts: []
        };

        try {
            // 获取不同级别的配置
            const globalConfig = vscode.workspace.getConfiguration('cortex-debug', null);
            const workspaceConfig = vscode.workspace.getConfiguration('cortex-debug', 
                vscode.workspace.workspaceFolders?.[0]?.uri);

            // 分析全局设置
            const globalOpenocd = globalConfig.inspect<string>('openocdPath');
            if (globalOpenocd?.globalValue) {
                result.global.openocdPath = globalOpenocd.globalValue;
            }
            if (globalOpenocd?.workspaceValue) {
                result.workspace.openocdPath = globalOpenocd.workspaceValue;
            }
            if (globalOpenocd?.defaultValue) {
                result.user.openocdPath = globalOpenocd.defaultValue;
            }

            // 检测设置冲突
            if (result.global.openocdPath && result.workspace.openocdPath && 
                result.global.openocdPath !== result.workspace.openocdPath) {
                result.conflicts.push('OpenOCD path conflict between global and workspace settings');
            }

            // 检查ARM工具链路径
            const armConfig = vscode.workspace.getConfiguration('stm32-configurator');
            const armPath = armConfig.get<string>('armToolchainPath');
            if (armPath) {
                result.workspace.armToolchainPath = armPath;
            }

        } catch (error) {
            console.error('Failed to analyze VS Code settings:', error);
        }

        return result;
    }

    /**
     * 分析项目结构
     * 
     * @returns Promise<ProjectStructureAnalysis> 项目结构分析结果
     */
    public async analyzeProjectStructure(): Promise<ProjectStructureAnalysis> {
        const result: ProjectStructureAnalysis = {
            projectType: 'unknown',
            sourceFiles: {
                hasMain: false,
                mainFiles: [],
                sourceCount: 0,
                headerCount: 0
            },
            buildSystem: {
                hasMakefile: false,
                hasCMakeLists: false,
                hasPlatformIO: false,
                hasSTM32CubeMX: false
            },
            executablePrediction: {
                likelyPaths: [],
                buildOutputDirs: [],
                defaultPath: '${workspaceFolder}/build/${workspaceFolderBasename}.elf'
            },
            deviceInference: {
                confidence: 0,
                evidenceFiles: []
            }
        };

        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return result;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

        try {
            // 检测构建系统
            await this.detectBuildSystem(workspaceRoot, result.buildSystem);
            
            // 确定项目类型
            result.projectType = this.inferProjectType(result.buildSystem);
            
            // 分析源文件
            await this.analyzeSourceFiles(workspaceRoot, result.sourceFiles);
            
            // 预测可执行文件路径
            this.predictExecutablePaths(workspaceRoot, result);
            
            // 推断设备信息
            await this.inferDeviceInfo(workspaceRoot, result.deviceInference);

        } catch (error) {
            console.error('Failed to analyze project structure:', error);
        }

        return result;
    }

    /**
     * 分析调试配置
     * 
     * @returns Promise<DebugConfigAnalysis> 调试配置分析结果
     */
    public async analyzeDebugConfig(): Promise<DebugConfigAnalysis> {
        const result: DebugConfigAnalysis = {
            existingConfigs: [],
            quality: {
                score: 0,
                issues: [],
                suggestions: []
            },
            duplicates: []
        };

        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            return result;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const launchJsonPath = path.join(workspaceRoot, '.vscode', 'launch.json');

        try {
            if (fs.existsSync(launchJsonPath)) {
                const content = fs.readFileSync(launchJsonPath, 'utf8');
                const launchConfig = JSON.parse(content);
                
                if (launchConfig.configurations && Array.isArray(launchConfig.configurations)) {
                    // 分析每个配置
                    for (const config of launchConfig.configurations) {
                        const analysis = this.analyzeIndividualConfig(config);
                        result.existingConfigs.push(analysis);
                    }
                    
                    // 评估整体质量
                    result.quality = this.assessConfigQuality(result.existingConfigs);
                    
                    // 检测重复配置
                    result.duplicates = this.detectDuplicateConfigs(result.existingConfigs);
                }
            }
        } catch (error) {
            console.error('Failed to analyze debug config:', error);
            result.quality.issues.push('Failed to parse launch.json');
        }

        return result;
    }

    /**
     * 选择推荐的接口文件
     */
    private selectRecommendedInterface(interfaces: string[]): string {
        // 优先级排序
        const priorities = [
            'stlink-v3.cfg',
            'stlink-v2-1.cfg',
            'stlink-v2.cfg',
            'stlink.cfg'
        ];

        for (const priority of priorities) {
            if (interfaces.includes(priority)) {
                return priority;
            }
        }

        // 如果没有找到优先的，返回第一个stlink相关的
        const stlinkInterface = interfaces.find(iface => iface.toLowerCase().includes('stlink'));
        return stlinkInterface || interfaces[0] || 'stlink-v2-1.cfg';
    }

    /**
     * 选择推荐的目标文件
     */
    private selectRecommendedTarget(targets: string[]): string {
        // 优先级排序（基于常用程度）
        const priorities = [
            'stm32f4x.cfg',
            'stm32f1x.cfg',
            'stm32l4x.cfg',
            'stm32g4x.cfg',
            'stm32h7x.cfg'
        ];

        for (const priority of priorities) {
            if (targets.includes(priority)) {
                return priority;
            }
        }

        // 如果没有找到优先的，返回第一个stm32相关的
        const stm32Target = targets.find(target => target.toLowerCase().includes('stm32'));
        return stm32Target || targets[0] || 'stm32f4x.cfg';
    }

    /**
     * 检测构建系统
     */
    private async detectBuildSystem(workspaceRoot: string, buildSystem: ProjectStructureAnalysis['buildSystem']): Promise<void> {
        const checkFile = (filename: string): boolean => {
            return fs.existsSync(path.join(workspaceRoot, filename));
        };

        buildSystem.hasMakefile = checkFile('Makefile') || checkFile('makefile');
        buildSystem.hasCMakeLists = checkFile('CMakeLists.txt');
        buildSystem.hasPlatformIO = checkFile('platformio.ini');
        buildSystem.hasSTM32CubeMX = checkFile('*.ioc') || 
            fs.readdirSync(workspaceRoot).some(file => file.endsWith('.ioc'));
    }

    /**
     * 推断项目类型
     */
    private inferProjectType(buildSystem: ProjectStructureAnalysis['buildSystem']): ProjectStructureAnalysis['projectType'] {
        if (buildSystem.hasPlatformIO) return 'platformio';
        if (buildSystem.hasSTM32CubeMX) return 'stm32cube';
        if (buildSystem.hasCMakeLists) return 'cmake';
        if (buildSystem.hasMakefile) return 'makefile';
        return 'unknown';
    }

    /**
     * 分析源文件
     */
    private async analyzeSourceFiles(workspaceRoot: string, sourceFiles: ProjectStructureAnalysis['sourceFiles']): Promise<void> {
        const walkDir = (dir: string, depth: number = 0) => {
            if (depth > 3) return; // 限制搜索深度
            
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !file.startsWith('.')) {
                    walkDir(fullPath, depth + 1);
                } else if (stat.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    if (['.c', '.cpp', '.cc', '.cxx'].includes(ext)) {
                        sourceFiles.sourceCount++;
                        if (file.toLowerCase().includes('main')) {
                            sourceFiles.hasMain = true;
                            sourceFiles.mainFiles.push(fullPath);
                        }
                    } else if (['.h', '.hpp', '.hh', '.hxx'].includes(ext)) {
                        sourceFiles.headerCount++;
                    }
                }
            }
        };

        try {
            walkDir(workspaceRoot);
        } catch (error) {
            console.error('Failed to analyze source files:', error);
        }
    }

    /**
     * 预测可执行文件路径
     */
    private predictExecutablePaths(workspaceRoot: string, result: ProjectStructureAnalysis): void {
        const commonBuildDirs = ['build', 'Debug', 'Release', 'out', 'bin'];
        const workspaceName = path.basename(workspaceRoot);

        // 检查常见构建目录
        for (const buildDir of commonBuildDirs) {
            const fullPath = path.join(workspaceRoot, buildDir);
            if (fs.existsSync(fullPath)) {
                result.executablePrediction.buildOutputDirs.push(buildDir);
            }
        }

        // 生成可能的可执行文件路径
        if (result.buildSystem.hasCMakeLists) {
            result.executablePrediction.likelyPaths.push(
                '${workspaceFolder}/build/${workspaceFolderBasename}',
                '${workspaceFolder}/build/${workspaceFolderBasename}.elf'
            );
        }

        if (result.buildSystem.hasMakefile) {
            result.executablePrediction.likelyPaths.push(
                '${workspaceFolder}/build/${workspaceFolderBasename}.elf',
                '${workspaceFolder}/${workspaceFolderBasename}.elf'
            );
        }

        if (result.buildSystem.hasSTM32CubeMX) {
            result.executablePrediction.likelyPaths.push(
                '${workspaceFolder}/Debug/${workspaceFolderBasename}.elf',
                '${workspaceFolder}/build/Debug/${workspaceFolderBasename}.elf'
            );
        }

        // 设置默认路径
        if (result.executablePrediction.likelyPaths.length > 0) {
            result.executablePrediction.defaultPath = result.executablePrediction.likelyPaths[0];
        }
    }

    /**
     * 推断设备信息
     */
    private async inferDeviceInfo(workspaceRoot: string, deviceInference: ProjectStructureAnalysis['deviceInference']): Promise<void> {
        const searchPatterns = [
            /STM32([A-Z]\d+[A-Z]*\d*)/gi,
            /stm32([a-z]\d+[a-z]*\d*)/gi,
            /#define\s+STM32([A-Z]\d+)/gi
        ];

        const searchFiles = async (dir: string, depth: number = 0): Promise<void> => {
            if (depth > 2) return;
            
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && !file.startsWith('.')) {
                        await searchFiles(fullPath, depth + 1);
                    } else if (stat.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        if (['.h', '.c', '.hpp', '.cpp', '.ioc', '.txt'].includes(ext)) {
                            await this.searchFileForDevice(fullPath, searchPatterns, deviceInference);
                        }
                    }
                }
            } catch (error) {
                // 忽略访问错误
            }
        };

        await searchFiles(workspaceRoot);
    }

    /**
     * 在文件中搜索设备信息
     */
    private async searchFileForDevice(
        filePath: string, 
        patterns: RegExp[], 
        deviceInference: ProjectStructureAnalysis['deviceInference']
    ): Promise<void> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            for (const pattern of patterns) {
                const matches = content.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const device = match.replace(/STM32|stm32|#define\s+/, '').trim();
                        if (device && device.length >= 6) {
                            if (!deviceInference.likelyDevice) {
                                deviceInference.likelyDevice = 'STM32' + device.toUpperCase();
                                deviceInference.deviceFamily = device.substring(0, 2).toUpperCase();
                            }
                            deviceInference.confidence += 10;
                            if (!deviceInference.evidenceFiles.includes(filePath)) {
                                deviceInference.evidenceFiles.push(filePath);
                            }
                            break;
                        }
                    }
                }
            }
        } catch (error) {
            // 忽略文件读取错误
        }
    }

    /**
     * 分析单个调试配置
     */
    private analyzeIndividualConfig(config: any): DebugConfigAnalysis['existingConfigs'][0] {
        const isStm32 = config.type === 'cortex-debug' && 
                       (config.device?.toLowerCase().includes('stm32') || 
                        config.name?.toLowerCase().includes('stm32'));

        const requiredFields = ['name', 'type', 'request', 'executable'];
        if (isStm32) {
            requiredFields.push('device', 'servertype');
        }

        const missingFields = requiredFields.filter(field => !config[field]);
        const isComplete = missingFields.length === 0;
        const hasLiveWatch = !!config.liveWatch?.enabled;

        return {
            name: config.name || 'Unnamed',
            type: config.type || 'unknown',
            isStm32,
            isComplete,
            missingFields,
            hasLiveWatch,
            device: config.device,
            executable: config.executable
        };
    }

    /**
     * 评估配置质量
     */
    private assessConfigQuality(configs: DebugConfigAnalysis['existingConfigs']): DebugConfigAnalysis['quality'] {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        if (configs.length === 0) {
            score = 0;
            issues.push('No debug configurations found');
            suggestions.push('Create at least one STM32 debug configuration');
        } else {
            const stm32Configs = configs.filter(c => c.isStm32);
            const incompleteConfigs = configs.filter(c => !c.isComplete);

            if (stm32Configs.length === 0) {
                score -= 50;
                issues.push('No STM32-specific debug configurations found');
                suggestions.push('Add STM32 debug configuration with cortex-debug');
            }

            if (incompleteConfigs.length > 0) {
                score -= incompleteConfigs.length * 20;
                issues.push(`${incompleteConfigs.length} incomplete configuration(s)`);
                suggestions.push('Complete missing fields in debug configurations');
            }

            const liveWatchConfigs = configs.filter(c => c.hasLiveWatch);
            if (liveWatchConfigs.length === 0 && stm32Configs.length > 0) {
                score -= 10;
                suggestions.push('Consider enabling Live Watch for real-time variable monitoring');
            }
        }

        return {
            score: Math.max(0, score),
            issues,
            suggestions
        };
    }

    /**
     * 检测重复配置
     */
    private detectDuplicateConfigs(configs: DebugConfigAnalysis['existingConfigs']): DebugConfigAnalysis['duplicates'] {
        const duplicates: DebugConfigAnalysis['duplicates'] = [];
        
        for (let i = 0; i < configs.length; i++) {
            for (let j = i + 1; j < configs.length; j++) {
                const similarity = this.calculateConfigSimilarity(configs[i], configs[j]);
                if (similarity > 0.8) {
                    duplicates.push({
                        configs: [configs[i].name, configs[j].name],
                        similarity
                    });
                }
            }
        }

        return duplicates;
    }

    /**
     * 计算配置相似度
     */
    private calculateConfigSimilarity(config1: DebugConfigAnalysis['existingConfigs'][0], config2: DebugConfigAnalysis['existingConfigs'][0]): number {
        let matches = 0;
        let total = 0;

        const compareFields = ['type', 'device', 'executable'];
        
        for (const field of compareFields) {
            total++;
            if (config1[field as keyof typeof config1] === config2[field as keyof typeof config2]) {
                matches++;
            }
        }

        return total > 0 ? matches / total : 0;
    }

    /**
     * 检查工具链健康状态
     */
    private async checkToolchainHealth(healthCheck: any): Promise<void> {
        const ToolchainDetectionService = (await import('./toolchainDetectionService.js')).ToolchainDetectionService;
        const toolchainService = ToolchainDetectionService.getInstance();
        const toolchains = await toolchainService.detectToolchains();

        if (toolchains.openocd.status !== DetectionStatus.SUCCESS) {
            healthCheck.scores.toolchain -= 40;
            healthCheck.issues.push({
                category: 'toolchain',
                severity: 'error',
                message: 'OpenOCD not found or not working properly',
                solution: 'Install OpenOCD and ensure it\'s in your system PATH'
            });
        }

        if (toolchains.armToolchain.status !== DetectionStatus.SUCCESS) {
            healthCheck.scores.toolchain -= 40;
            healthCheck.issues.push({
                category: 'toolchain',
                severity: 'error',
                message: 'ARM GNU toolchain not found or not working properly',
                solution: 'Install ARM GNU toolchain and ensure it\'s in your system PATH'
            });
        }

        if (healthCheck.scores.toolchain < 100) {
            healthCheck.recommendations.push({
                title: 'Complete Toolchain Setup',
                description: 'Install missing development tools for full STM32 support',
                priority: 'high',
                actionable: true
            });
        }
    }

    /**
     * 检查工作区健康状态
     */
    private async checkWorkspaceHealth(healthCheck: any): Promise<void> {
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            healthCheck.scores.workspace = 0;
            healthCheck.issues.push({
                category: 'workspace',
                severity: 'error',
                message: 'No workspace folder is open',
                solution: 'Open a project folder in VS Code'
            });
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const vscodeFolder = path.join(workspaceRoot, '.vscode');
        
        if (!fs.existsSync(vscodeFolder)) {
            healthCheck.scores.workspace -= 30;
            healthCheck.issues.push({
                category: 'workspace',
                severity: 'warning',
                message: '.vscode folder not found',
                solution: 'Create .vscode folder for workspace-specific settings'
            });
        }

        // Check for common STM32 project files
        const hasProjectFiles = fs.existsSync(path.join(workspaceRoot, 'Makefile')) ||
                              fs.existsSync(path.join(workspaceRoot, 'CMakeLists.txt')) ||
                              fs.existsSync(path.join(workspaceRoot, 'platformio.ini')) ||
                              fs.readdirSync(workspaceRoot).some(file => file.endsWith('.ioc'));

        if (!hasProjectFiles) {
            healthCheck.scores.workspace -= 20;
            healthCheck.recommendations.push({
                title: 'Initialize STM32 Project',
                description: 'Set up proper build system (Makefile, CMake, or STM32CubeMX)',
                priority: 'medium',
                actionable: false
            });
        }
    }

    /**
     * 检查配置健康状态
     */
    private async checkConfigurationHealth(healthCheck: any): Promise<void> {
        const debugAnalysis = await this.analyzeDebugConfig();
        
        if (debugAnalysis.existingConfigs.length === 0) {
            healthCheck.scores.configuration = 0;
            healthCheck.issues.push({
                category: 'configuration',
                severity: 'error',
                message: 'No debug configurations found',
                solution: 'Create STM32 debug configuration using the configurator'
            });
        } else {
            const stm32Configs = debugAnalysis.existingConfigs.filter(c => c.isStm32);
            if (stm32Configs.length === 0) {
                healthCheck.scores.configuration -= 50;
                healthCheck.issues.push({
                    category: 'configuration',
                    severity: 'warning',
                    message: 'No STM32-specific debug configurations found',
                    solution: 'Create STM32 debug configuration with Cortex-Debug'
                });
            }

            // Score based on configuration quality
            healthCheck.scores.configuration = Math.max(0, debugAnalysis.quality.score);
            
            for (const issue of debugAnalysis.quality.issues) {
                healthCheck.issues.push({
                    category: 'configuration',
                    severity: 'warning',
                    message: issue,
                    solution: 'Review and fix debug configuration issues'
                });
            }
        }
    }

    /**
     * 检查扩展健康状态
     */
    private async checkExtensionHealth(healthCheck: any): Promise<void> {
        const cortexDebugExtension = vscode.extensions.getExtension('marus25.cortex-debug');
        
        if (!cortexDebugExtension) {
            healthCheck.scores.extensions -= 80;
            healthCheck.issues.push({
                category: 'extension',
                severity: 'error',
                message: 'Cortex-Debug extension not installed',
                solution: 'Install Cortex-Debug extension from VS Code marketplace'
            });
        } else if (!cortexDebugExtension.isActive) {
            healthCheck.scores.extensions -= 20;
            healthCheck.issues.push({
                category: 'extension',
                severity: 'warning',
                message: 'Cortex-Debug extension not active',
                solution: 'Activate the Cortex-Debug extension'
            });
        }

        // Check for other useful extensions
        const usefulExtensions = [
            'ms-vscode.cpptools',
            'twxs.cmake',
            'ms-vscode.cmake-tools'
        ];

        let recommendedCount = 0;
        for (const extId of usefulExtensions) {
            const ext = vscode.extensions.getExtension(extId);
            if (!ext) {
                recommendedCount++;
            }
        }

        if (recommendedCount > 0) {
            healthCheck.recommendations.push({
                title: 'Install Recommended Extensions',
                description: `Consider installing ${recommendedCount} additional helpful extensions for STM32 development`,
                priority: 'low',
                actionable: true
            });
        }
    }
}