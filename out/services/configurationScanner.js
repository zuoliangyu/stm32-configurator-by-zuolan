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
exports.ConfigurationScanner = void 0;
/**
 * 配置扫描器模块
 * 专门负责扫描和分析现有的VS Code配置、OpenOCD配置文件等
 * 为自动配置服务提供详细的环境分析
 *
 * @fileoverview 配置扫描器
 * @author 左岚
 * @since 0.2.6
 */
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const openocd_1 = require("../utils/openocd");
const types_1 = require("../ui/types");
/**
 * 配置扫描器类
 * 提供深度的配置环境分析功能
 */
class ConfigurationScanner {
    /**
     * 扫描OpenOCD配置文件信息
     *
     * @param openocdPath OpenOCD安装路径
     * @returns Promise<OpenOCDConfigInfo | null> 配置文件信息
     */
    async scanOpenOCDConfigs(openocdPath) {
        try {
            const configFiles = await (0, openocd_1.getOpenOCDConfigFiles)(openocdPath);
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
        }
        catch (error) {
            console.error('Failed to scan OpenOCD configs:', error);
            return null;
        }
    }
    /**
     * 执行完整的环境健康检查
     * 扫描和验证整个STM32开发环境的配置状态
     */
    async performHealthCheck() {
        const healthCheck = {
            overall: 'healthy',
            scores: {
                toolchain: 100,
                workspace: 100,
                configuration: 100,
                extensions: 100
            },
            issues: [],
            recommendations: []
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
            }
            else if (avgScore >= 50) {
                healthCheck.overall = 'partial';
            }
            else {
                healthCheck.overall = 'critical';
            }
        }
        catch (error) {
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
    async generateConfigurationRepairPlan(issues) {
        const repairPlan = {
            steps: [],
            estimatedTime: '5-10 minutes',
            complexity: 'simple'
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
        }
        else if (repairPlan.steps.length <= 5) {
            repairPlan.complexity = 'moderate';
            repairPlan.estimatedTime = '5-15 minutes';
        }
        else {
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
    async analyzeVSCodeSettings() {
        const result = {
            global: {},
            workspace: {},
            user: {},
            conflicts: []
        };
        try {
            // 获取不同级别的配置
            const globalConfig = vscode.workspace.getConfiguration('cortex-debug', null);
            const workspaceConfig = vscode.workspace.getConfiguration('cortex-debug', vscode.workspace.workspaceFolders?.[0]?.uri);
            // 分析全局设置
            const globalOpenocd = globalConfig.inspect('openocdPath');
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
            const armPath = armConfig.get('armToolchainPath');
            if (armPath) {
                result.workspace.armToolchainPath = armPath;
            }
        }
        catch (error) {
            console.error('Failed to analyze VS Code settings:', error);
        }
        return result;
    }
    /**
     * 分析项目结构
     *
     * @returns Promise<ProjectStructureAnalysis> 项目结构分析结果
     */
    async analyzeProjectStructure() {
        const result = {
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
        }
        catch (error) {
            console.error('Failed to analyze project structure:', error);
        }
        return result;
    }
    /**
     * 分析调试配置
     *
     * @returns Promise<DebugConfigAnalysis> 调试配置分析结果
     */
    async analyzeDebugConfig() {
        const result = {
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
        }
        catch (error) {
            console.error('Failed to analyze debug config:', error);
            result.quality.issues.push('Failed to parse launch.json');
        }
        return result;
    }
    /**
     * 选择推荐的接口文件
     */
    selectRecommendedInterface(interfaces) {
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
    selectRecommendedTarget(targets) {
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
    async detectBuildSystem(workspaceRoot, buildSystem) {
        const checkFile = (filename) => {
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
    inferProjectType(buildSystem) {
        if (buildSystem.hasPlatformIO)
            return 'platformio';
        if (buildSystem.hasSTM32CubeMX)
            return 'stm32cube';
        if (buildSystem.hasCMakeLists)
            return 'cmake';
        if (buildSystem.hasMakefile)
            return 'makefile';
        return 'unknown';
    }
    /**
     * 分析源文件
     */
    async analyzeSourceFiles(workspaceRoot, sourceFiles) {
        const walkDir = (dir, depth = 0) => {
            if (depth > 3)
                return; // 限制搜索深度
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && !file.startsWith('.')) {
                    walkDir(fullPath, depth + 1);
                }
                else if (stat.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    if (['.c', '.cpp', '.cc', '.cxx'].includes(ext)) {
                        sourceFiles.sourceCount++;
                        if (file.toLowerCase().includes('main')) {
                            sourceFiles.hasMain = true;
                            sourceFiles.mainFiles.push(fullPath);
                        }
                    }
                    else if (['.h', '.hpp', '.hh', '.hxx'].includes(ext)) {
                        sourceFiles.headerCount++;
                    }
                }
            }
        };
        try {
            walkDir(workspaceRoot);
        }
        catch (error) {
            console.error('Failed to analyze source files:', error);
        }
    }
    /**
     * 预测可执行文件路径
     */
    predictExecutablePaths(workspaceRoot, result) {
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
            result.executablePrediction.likelyPaths.push('${workspaceFolder}/build/${workspaceFolderBasename}', '${workspaceFolder}/build/${workspaceFolderBasename}.elf');
        }
        if (result.buildSystem.hasMakefile) {
            result.executablePrediction.likelyPaths.push('${workspaceFolder}/build/${workspaceFolderBasename}.elf', '${workspaceFolder}/${workspaceFolderBasename}.elf');
        }
        if (result.buildSystem.hasSTM32CubeMX) {
            result.executablePrediction.likelyPaths.push('${workspaceFolder}/Debug/${workspaceFolderBasename}.elf', '${workspaceFolder}/build/Debug/${workspaceFolderBasename}.elf');
        }
        // 设置默认路径
        if (result.executablePrediction.likelyPaths.length > 0) {
            result.executablePrediction.defaultPath = result.executablePrediction.likelyPaths[0];
        }
    }
    /**
     * 推断设备信息
     */
    async inferDeviceInfo(workspaceRoot, deviceInference) {
        const searchPatterns = [
            /STM32([A-Z]\d+[A-Z]*\d*)/gi,
            /stm32([a-z]\d+[a-z]*\d*)/gi,
            /#define\s+STM32([A-Z]\d+)/gi
        ];
        const searchFiles = async (dir, depth = 0) => {
            if (depth > 2)
                return;
            try {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory() && !file.startsWith('.')) {
                        await searchFiles(fullPath, depth + 1);
                    }
                    else if (stat.isFile()) {
                        const ext = path.extname(file).toLowerCase();
                        if (['.h', '.c', '.hpp', '.cpp', '.ioc', '.txt'].includes(ext)) {
                            await this.searchFileForDevice(fullPath, searchPatterns, deviceInference);
                        }
                    }
                }
            }
            catch (error) {
                // 忽略访问错误
            }
        };
        await searchFiles(workspaceRoot);
    }
    /**
     * 在文件中搜索设备信息
     */
    async searchFileForDevice(filePath, patterns, deviceInference) {
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
        }
        catch (error) {
            // 忽略文件读取错误
        }
    }
    /**
     * 分析单个调试配置
     */
    analyzeIndividualConfig(config) {
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
    assessConfigQuality(configs) {
        const issues = [];
        const suggestions = [];
        let score = 100;
        if (configs.length === 0) {
            score = 0;
            issues.push('No debug configurations found');
            suggestions.push('Create at least one STM32 debug configuration');
        }
        else {
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
    detectDuplicateConfigs(configs) {
        const duplicates = [];
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
    calculateConfigSimilarity(config1, config2) {
        let matches = 0;
        let total = 0;
        const compareFields = ['type', 'device', 'executable'];
        for (const field of compareFields) {
            total++;
            if (config1[field] === config2[field]) {
                matches++;
            }
        }
        return total > 0 ? matches / total : 0;
    }
    /**
     * 检查工具链健康状态
     */
    async checkToolchainHealth(healthCheck) {
        const ToolchainDetectionService = (await import('./toolchainDetectionService.js')).ToolchainDetectionService;
        const toolchainService = ToolchainDetectionService.getInstance();
        const toolchains = await toolchainService.detectToolchains();
        if (toolchains.openocd.status !== types_1.DetectionStatus.SUCCESS) {
            healthCheck.scores.toolchain -= 40;
            healthCheck.issues.push({
                category: 'toolchain',
                severity: 'error',
                message: 'OpenOCD not found or not working properly',
                solution: 'Install OpenOCD and ensure it\'s in your system PATH'
            });
        }
        if (toolchains.armToolchain.status !== types_1.DetectionStatus.SUCCESS) {
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
    async checkWorkspaceHealth(healthCheck) {
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
    async checkConfigurationHealth(healthCheck) {
        const debugAnalysis = await this.analyzeDebugConfig();
        if (debugAnalysis.existingConfigs.length === 0) {
            healthCheck.scores.configuration = 0;
            healthCheck.issues.push({
                category: 'configuration',
                severity: 'error',
                message: 'No debug configurations found',
                solution: 'Create STM32 debug configuration using the configurator'
            });
        }
        else {
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
    async checkExtensionHealth(healthCheck) {
        const cortexDebugExtension = vscode.extensions.getExtension('marus25.cortex-debug');
        if (!cortexDebugExtension) {
            healthCheck.scores.extensions -= 80;
            healthCheck.issues.push({
                category: 'extension',
                severity: 'error',
                message: 'Cortex-Debug extension not installed',
                solution: 'Install Cortex-Debug extension from VS Code marketplace'
            });
        }
        else if (!cortexDebugExtension.isActive) {
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
exports.ConfigurationScanner = ConfigurationScanner;
//# sourceMappingURL=configurationScanner.js.map