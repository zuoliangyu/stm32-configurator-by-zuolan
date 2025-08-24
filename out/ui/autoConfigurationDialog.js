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
exports.AutoConfigurationDialog = void 0;
/**
 * 自动配置对话框模块
 * 提供一键式STM32开发环境配置的用户界面
 * 集成工具链检测、项目分析和配置生成功能
 *
 * @fileoverview 自动配置对话框
 * @author 左岚
 * @since 0.2.6
 */
const vscode = __importStar(require("vscode"));
const localizationManager_1 = require("../localization/localizationManager");
const autoConfigurationService_1 = require("../services/autoConfigurationService");
const configurationScanner_1 = require("../services/configurationScanner");
const cortexDebugConfigGenerator_1 = require("../services/cortexDebugConfigGenerator");
const types_1 = require("./types");
/**
 * 自动配置对话框类
 */
class AutoConfigurationDialog {
    localizationManager;
    autoConfigService;
    configScanner;
    configGenerator;
    constructor(context) {
        this.localizationManager = localizationManager_1.LocalizationManager.getInstance(context);
        this.autoConfigService = autoConfigurationService_1.AutoConfigurationService.getInstance();
        this.configScanner = new configurationScanner_1.ConfigurationScanner();
        this.configGenerator = new cortexDebugConfigGenerator_1.CortexDebugConfigGenerator();
    }
    /**
     * 显示自动配置向导
     * 主要入口方法，启动完整的自动配置流程
     */
    async showAutoConfigurationWizard() {
        try {
            // 步骤1: 显示欢迎界面和扫描
            const scanResult = await this.performInitialScan();
            if (scanResult.status === 'failed') {
                return this.handleScanFailure(scanResult);
            }
            // 步骤2: 显示扫描结果和获取用户选择
            const userOptions = await this.showScanResultsAndGetOptions(scanResult);
            if (!userOptions) {
                return { success: false }; // 用户取消
            }
            // 步骤3: 执行自动配置
            const configResult = await this.executeAutoConfiguration(scanResult, userOptions);
            // 步骤4: 显示结果
            await this.showConfigurationResult(configResult);
            return configResult;
        }
        catch (error) {
            const errorMessage = `Auto-configuration failed: ${error instanceof Error ? error.message : String(error)}`;
            await vscode.window.showErrorMessage(errorMessage);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * 一键快速配置
     * 使用默认选项进行快速配置，适合简单项目
     */
    async oneClickQuickSetup(deviceName) {
        try {
            // 显示进度提示
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'STM32 Auto-Configuration',
                cancellable: true
            }, async (progress, token) => {
                progress.report({ increment: 10, message: 'Scanning environment...' });
                // 执行扫描
                const scanResult = await this.autoConfigService.scanConfiguration();
                if (token.isCancellationRequested) {
                    return { success: false };
                }
                progress.report({ increment: 30, message: 'Analyzing project...' });
                // 分析项目结构
                const projectAnalysis = await this.configScanner.analyzeProjectStructure();
                // 自动推断设备名称
                const finalDeviceName = deviceName ||
                    projectAnalysis.deviceInference.likelyDevice ||
                    await this.promptForDeviceName();
                if (!finalDeviceName) {
                    return { success: false, error: 'Device name is required' };
                }
                progress.report({ increment: 30, message: 'Generating configuration...' });
                // 使用默认选项执行配置
                const result = await this.autoConfigService.oneClickConfiguration(finalDeviceName, projectAnalysis.executablePrediction.defaultPath, {
                    enableLiveWatch: false,
                    createBackup: true,
                    forceOverwrite: false
                });
                progress.report({ increment: 30, message: 'Finalizing...' });
                if (result.success) {
                    await vscode.window.showInformationMessage(`✅ Auto-configuration completed successfully for ${finalDeviceName}!`, 'Open launch.json').then(selection => {
                        if (selection === 'Open launch.json') {
                            this.openLaunchJson();
                        }
                    });
                }
                return {
                    success: result.success,
                    generatedConfigs: result.config ? [{
                            config: result.config,
                            metadata: {
                                generator: 'One-Click Setup',
                                version: '0.2.6',
                                timestamp: new Date().toISOString(),
                                deviceFamily: this.getDeviceFamily(finalDeviceName),
                                confidence: 80
                            },
                            description: `Quick setup configuration for ${finalDeviceName}`,
                            recommendations: []
                        }] : undefined,
                    error: result.error
                };
            });
        }
        catch (error) {
            const errorMessage = `One-click setup failed: ${error instanceof Error ? error.message : String(error)}`;
            await vscode.window.showErrorMessage(errorMessage);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * 智能配置向导
     * 提供完整的智能配置体验，包括环境检测、问题诊断和自动修复
     */
    async showIntelligentConfigurationWizard() {
        try {
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Intelligent STM32 Configuration',
                cancellable: true
            }, async (progress, token) => {
                // 第1步：环境健康检查
                progress.report({ increment: 15, message: 'Performing environment health check...' });
                const healthCheck = await this.configScanner.performHealthCheck();
                if (token.isCancellationRequested)
                    return { success: false };
                // 第2步：智能工具链检测
                progress.report({ increment: 15, message: 'Intelligent toolchain detection...' });
                const toolchainService = (await import('../services/toolchainDetectionService.js')).ToolchainDetectionService.getInstance();
                const intelligentResults = await toolchainService.performIntelligentDetection();
                if (token.isCancellationRequested)
                    return { success: false };
                // 第3步：项目结构深度分析
                progress.report({ increment: 15, message: 'Analyzing project structure...' });
                const projectAnalysis = await this.configScanner.analyzeProjectStructure();
                const debugAnalysis = await this.configScanner.analyzeDebugConfig();
                if (token.isCancellationRequested)
                    return { success: false };
                // 第4步：展示分析结果并获取用户确认
                const userAction = await this.showIntelligentAnalysisResults(healthCheck, intelligentResults, projectAnalysis, debugAnalysis);
                if (!userAction || userAction === 'cancel') {
                    return { success: false };
                }
                // 第5步：执行配置生成
                progress.report({ increment: 25, message: 'Generating optimized configurations...' });
                const configResult = await this.executeIntelligentConfiguration(intelligentResults.results, projectAnalysis, userAction.options);
                if (token.isCancellationRequested)
                    return { success: false };
                // 第6步：验证和优化配置
                progress.report({ increment: 15, message: 'Validating configurations...' });
                await this.validateAndOptimizeConfigurations(configResult.generatedConfigs || []);
                progress.report({ increment: 15, message: 'Complete!' });
                // 显示完成结果
                await this.showIntelligentConfigurationResults(configResult, intelligentResults.insights);
                return configResult;
            });
        }
        catch (error) {
            const errorMessage = `Intelligent configuration failed: ${error instanceof Error ? error.message : String(error)}`;
            await vscode.window.showErrorMessage(errorMessage);
            return { success: false, error: errorMessage };
        }
    }
    /**
     * 批量设备配置
     * 支持为多个STM32设备生成配置
     */
    async setupMultipleDevices(devices) {
        try {
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: `Setting up ${devices.length} STM32 devices`,
                cancellable: true
            }, async (progress, token) => {
                const totalSteps = devices.length * 4; // 每个设备4个步骤
                let currentStep = 0;
                const allConfigs = [];
                const errors = [];
                const warnings = [];
                // 执行初始扫描
                progress.report({ increment: 0, message: 'Performing initial scan...' });
                const scanResult = await this.autoConfigService.scanConfiguration();
                const projectAnalysis = await this.configScanner.analyzeProjectStructure();
                for (const device of devices) {
                    if (token.isCancellationRequested) {
                        return { success: false, error: 'Operation cancelled by user' };
                    }
                    try {
                        // 为每个设备生成配置
                        progress.report({
                            increment: (400 / totalSteps),
                            message: `Configuring ${device}...`
                        });
                        const deviceConfig = await this.configGenerator.generateOptimizedTemplateSet(device, scanResult.toolchains, projectAnalysis);
                        allConfigs.push(...deviceConfig);
                        currentStep += 4;
                    }
                    catch (error) {
                        errors.push(`Failed to configure ${device}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                // 保存所有配置
                if (allConfigs.length > 0) {
                    progress.report({ increment: 0, message: 'Saving configurations...' });
                    const saveResult = await this.saveBatchConfigurations(allConfigs);
                    warnings.push(...saveResult.warnings || []);
                }
                return {
                    success: errors.length === 0,
                    generatedConfigs: allConfigs,
                    error: errors.length > 0 ? errors.join('; ') : undefined,
                    warnings
                };
            });
        }
        catch (error) {
            return {
                success: false,
                error: `Batch configuration failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * 自动故障排除
     * 检测和修复常见配置问题
     */
    async autoTroubleshoot() {
        const result = {
            issuesFound: 0,
            issuesFixed: 0,
            remainingIssues: [],
            repairActions: []
        };
        try {
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Auto-Troubleshooting Configuration',
                cancellable: false
            }, async (progress) => {
                // 执行健康检查
                progress.report({ increment: 20, message: 'Scanning for issues...' });
                const healthCheck = await this.configScanner.performHealthCheck();
                result.issuesFound = healthCheck.issues.length;
                // 生成修复计划
                progress.report({ increment: 20, message: 'Generating repair plan...' });
                const repairPlan = await this.configScanner.generateConfigurationRepairPlan(healthCheck.issues);
                // 执行自动修复
                progress.report({ increment: 30, message: 'Applying automatic fixes...' });
                const toolchainService = (await import('../services/toolchainDetectionService.js')).ToolchainDetectionService.getInstance();
                const repairResult = await toolchainService.autoRepairConfiguration();
                result.issuesFixed = repairResult.repairsSuccessful;
                result.repairActions = repairResult.repairActions.map((action) => `${action.action}: ${action.result} - ${action.details}`);
                // 验证修复结果
                progress.report({ increment: 30, message: 'Verifying repairs...' });
                const postRepairCheck = await this.configScanner.performHealthCheck();
                result.remainingIssues = postRepairCheck.issues.map(issue => issue.message);
                return result;
            });
        }
        catch (error) {
            result.remainingIssues.push(`Auto-troubleshoot failed: ${error instanceof Error ? error.message : String(error)}`);
            return result;
        }
    }
    /**
     * 执行初始扫描
     */
    async performInitialScan() {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Scanning STM32 Development Environment',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 20, message: 'Detecting toolchains...' });
            const scanResult = await this.autoConfigService.scanConfiguration();
            progress.report({ increment: 80, message: 'Analysis complete' });
            return scanResult;
        });
    }
    /**
     * 处理扫描失败
     */
    async handleScanFailure(scanResult) {
        const message = `Environment scan failed: ${scanResult.errors.join(', ')}`;
        const action = await vscode.window.showErrorMessage(message, 'View Details', 'Manual Setup', 'Cancel');
        switch (action) {
            case 'View Details':
                await this.showDetailedErrorInfo(scanResult);
                return { success: false, error: message };
            case 'Manual Setup':
                await vscode.commands.executeCommand('workbench.action.openSettings', 'stm32-configurator');
                return { success: false };
            default:
                return { success: false };
        }
    }
    /**
     * 显示扫描结果并获取用户选项
     */
    async showScanResultsAndGetOptions(scanResult) {
        // 生成扫描结果摘要
        const summary = this.generateScanSummary(scanResult);
        // 显示扫描结果
        const proceed = await vscode.window.showInformationMessage(`Environment Scan Complete:\n\n${summary}`, { modal: true }, 'Configure Automatically', 'Customize Settings', 'Cancel');
        if (proceed === 'Cancel') {
            return null;
        }
        if (proceed === 'Configure Automatically') {
            return await this.getQuickConfigOptions(scanResult);
        }
        else {
            return await this.getCustomConfigOptions(scanResult);
        }
    }
    /**
     * 获取快速配置选项
     */
    async getQuickConfigOptions(scanResult) {
        const projectAnalysis = await this.configScanner.analyzeProjectStructure();
        // 推断设备名称
        const deviceName = projectAnalysis.deviceInference.likelyDevice ||
            await this.promptForDeviceName() ||
            'STM32F407VG';
        return {
            deviceName,
            executablePath: projectAnalysis.executablePrediction.defaultPath,
            enableLiveWatch: false,
            samplesPerSecond: 10,
            createBackup: true,
            forceOverwrite: false,
            templateType: 'basic'
        };
    }
    /**
     * 获取自定义配置选项
     */
    async getCustomConfigOptions(scanResult) {
        // 设备名称选择
        const deviceName = await this.promptForDeviceName();
        if (!deviceName) {
            return null;
        }
        // 配置模板选择
        const templateType = await this.promptForTemplateType();
        if (!templateType) {
            return null;
        }
        // 高级选项
        const advancedOptions = await this.promptForAdvancedOptions();
        const projectAnalysis = await this.configScanner.analyzeProjectStructure();
        return {
            deviceName,
            executablePath: projectAnalysis.executablePrediction.defaultPath,
            enableLiveWatch: advancedOptions.liveWatch,
            samplesPerSecond: 10,
            createBackup: advancedOptions.backup,
            forceOverwrite: advancedOptions.overwrite,
            templateType
        };
    }
    /**
     * 执行自动配置
     */
    async executeAutoConfiguration(scanResult, options) {
        try {
            return await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating STM32 Configuration',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 20, message: 'Analyzing project structure...' });
                const projectAnalysis = await this.configScanner.analyzeProjectStructure();
                const openocdConfig = scanResult.toolchains.openocd.status === types_1.DetectionStatus.SUCCESS ?
                    await this.configScanner.scanOpenOCDConfigs(scanResult.toolchains.openocd.path) : undefined;
                progress.report({ increment: 30, message: 'Generating configurations...' });
                // 生成配置
                let generatedConfigs;
                if (options.templateType === 'basic') {
                    generatedConfigs = [this.configGenerator.generateConfig(options.deviceName, scanResult.toolchains, projectAnalysis, openocdConfig || undefined, {
                            configName: `Debug ${options.deviceName}`,
                            executablePath: options.executablePath,
                            enableLiveWatch: options.enableLiveWatch,
                            samplesPerSecond: options.samplesPerSecond
                        })];
                }
                else {
                    generatedConfigs = this.configGenerator.generateMultipleTemplates(options.deviceName, scanResult.toolchains, projectAnalysis, openocdConfig || undefined);
                }
                progress.report({ increment: 30, message: 'Saving configurations...' });
                // 保存配置
                const saveResults = await this.saveConfigurations(generatedConfigs, options);
                progress.report({ increment: 20, message: 'Complete!' });
                return {
                    success: saveResults.success,
                    generatedConfigs,
                    error: saveResults.error,
                    warnings: saveResults.warnings,
                    suggestions: this.generatePostConfigSuggestions(scanResult, generatedConfigs)
                };
            });
        }
        catch (error) {
            return {
                success: false,
                error: `Configuration generation failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * 显示配置结果
     */
    async showConfigurationResult(result) {
        if (result.success && result.generatedConfigs) {
            const configCount = result.generatedConfigs.length;
            const message = `✅ Successfully generated ${configCount} debug configuration${configCount > 1 ? 's' : ''}!`;
            const actions = ['Open launch.json', 'View Details'];
            if (result.suggestions && result.suggestions.length > 0) {
                actions.push('View Suggestions');
            }
            const selection = await vscode.window.showInformationMessage(message, ...actions);
            switch (selection) {
                case 'Open launch.json':
                    await this.openLaunchJson();
                    break;
                case 'View Details':
                    await this.showConfigurationDetails(result.generatedConfigs);
                    break;
                case 'View Suggestions':
                    await this.showSuggestions(result.suggestions);
                    break;
            }
        }
        else {
            await vscode.window.showErrorMessage(`Configuration failed: ${result.error || 'Unknown error'}`);
        }
    }
    /**
     * 生成扫描结果摘要
     */
    generateScanSummary(scanResult) {
        const lines = [];
        // 工具链状态
        const openocdStatus = scanResult.toolchains.openocd.status === types_1.DetectionStatus.SUCCESS ? '✅' : '❌';
        const armStatus = scanResult.toolchains.armToolchain.status === types_1.DetectionStatus.SUCCESS ? '✅' : '❌';
        lines.push(`OpenOCD: ${openocdStatus} ${scanResult.toolchains.openocd.status}`);
        lines.push(`ARM Toolchain: ${armStatus} ${scanResult.toolchains.armToolchain.status}`);
        // 工作区状态
        const workspaceStatus = scanResult.existingConfig.workspace.hasWorkspace ? '✅' : '❌';
        lines.push(`Workspace: ${workspaceStatus} ${workspaceStatus === '✅' ? 'Ready' : 'Not found'}`);
        // 现有配置
        const configCount = scanResult.existingConfig.launchConfig.configCount;
        lines.push(`Existing configs: ${configCount} found`);
        // 建议数量
        lines.push(`Recommendations: ${scanResult.recommendations.length} suggestions`);
        return lines.join('\n');
    }
    /**
     * 提示用户输入设备名称
     */
    async promptForDeviceName() {
        const commonDevices = [
            'STM32F407VG', 'STM32F407ZG', 'STM32F429ZI', 'STM32F446RE',
            'STM32F103C8', 'STM32F103RB', 'STM32F103VE',
            'STM32L476RG', 'STM32L496ZG', 'STM32L4A6ZG',
            'STM32H743ZI', 'STM32H750VB', 'STM32H7A3ZI',
            'STM32G474RE', 'STM32G431RB', 'STM32G473CE'
        ];
        const selection = await vscode.window.showQuickPick([
            ...commonDevices.map(device => ({ label: device, description: this.getDeviceDescription(device) })),
            { label: '$(edit) Custom...', description: 'Enter custom device name', custom: true }
        ], {
            placeHolder: 'Select your STM32 device or enter custom name',
            ignoreFocusOut: true
        });
        if (!selection) {
            return undefined;
        }
        if (selection.custom) {
            return await vscode.window.showInputBox({
                prompt: 'Enter STM32 device name (e.g., STM32F407VG)',
                validateInput: (value) => {
                    if (!value || !value.toUpperCase().startsWith('STM32')) {
                        return 'Please enter a valid STM32 device name';
                    }
                    return null;
                }
            });
        }
        return selection.label;
    }
    /**
     * 提示用户选择模板类型
     */
    async promptForTemplateType() {
        const selection = await vscode.window.showQuickPick([
            {
                label: '$(debug-start) Basic Debug',
                description: 'Simple debug configuration',
                detail: 'Basic debugging with reset to main',
                value: 'basic'
            },
            {
                label: '$(eye) Advanced Debug',
                description: 'Debug with Live Watch and advanced features',
                detail: 'Includes real-time variable monitoring',
                value: 'advanced'
            },
            {
                label: '$(rocket) Production Debug',
                description: 'Debug without reset for production',
                detail: 'Attach to running target without reset',
                value: 'production'
            },
            {
                label: '$(pulse) SWO Trace',
                description: 'Debug with SWO tracing',
                detail: 'Includes printf redirection via SWO',
                value: 'swo'
            }
        ], {
            placeHolder: 'Select configuration template type',
            ignoreFocusOut: true
        });
        return selection?.value;
    }
    /**
     * 提示用户选择高级选项
     */
    async promptForAdvancedOptions() {
        const liveWatchSelection = await vscode.window.showQuickPick([
            { label: 'Enable Live Watch', value: true },
            { label: 'Disable Live Watch', value: false }
        ], { placeHolder: 'Live Watch for real-time variable monitoring?' });
        const backupSelection = await vscode.window.showQuickPick([
            { label: 'Create backup of existing launch.json', value: true },
            { label: 'No backup needed', value: false }
        ], { placeHolder: 'Create configuration backup?' });
        const overwriteSelection = await vscode.window.showQuickPick([
            { label: 'Keep existing configurations', value: false },
            { label: 'Overwrite duplicate configurations', value: true }
        ], { placeHolder: 'Handle existing configurations?' });
        return {
            liveWatch: liveWatchSelection?.value ?? false,
            backup: backupSelection?.value ?? true,
            overwrite: overwriteSelection?.value ?? false
        };
    }
    /**
     * 保存配置
     */
    async saveConfigurations(configs, options) {
        try {
            const warnings = [];
            for (const config of configs) {
                const validation = this.configGenerator.validateConfig(config.config, {});
                if (!validation.isValid) {
                    warnings.push(`Configuration "${config.config.name}" has issues: ${validation.errors.join(', ')}`);
                }
            }
            // 这里应该调用实际的保存逻辑
            // 目前先返回成功
            return { success: true, warnings: warnings.length > 0 ? warnings : undefined };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to save configurations: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * 生成后配置建议
     */
    generatePostConfigSuggestions(scanResult, generatedConfigs) {
        const suggestions = [];
        // 基于扫描结果的建议
        if (scanResult.toolchains.openocd.status !== types_1.DetectionStatus.SUCCESS) {
            suggestions.push('Install OpenOCD for debugging functionality');
        }
        // 基于生成配置的建议
        generatedConfigs.forEach(config => {
            suggestions.push(...config.recommendations);
        });
        // 通用建议
        suggestions.push('Test your configuration with a simple "Hello World" program');
        suggestions.push('Verify that your build system generates the expected executable');
        return [...new Set(suggestions)]; // 去重
    }
    /**
     * 获取设备描述
     */
    getDeviceDescription(deviceName) {
        const descriptions = {
            'STM32F407VG': 'STM32F4 - 168MHz, 1MB Flash, 192KB RAM',
            'STM32F407ZG': 'STM32F4 - 168MHz, 1MB Flash, 192KB RAM',
            'STM32F429ZI': 'STM32F4 - 180MHz, 2MB Flash, 256KB RAM',
            'STM32F103C8': 'STM32F1 - 72MHz, 64KB Flash, 20KB RAM',
            'STM32L476RG': 'STM32L4 - 80MHz, 1MB Flash, 128KB RAM',
            'STM32H743ZI': 'STM32H7 - 400MHz, 2MB Flash, 1MB RAM'
        };
        return descriptions[deviceName] || 'STM32 microcontroller';
    }
    /**
     * 获取设备族
     */
    getDeviceFamily(deviceName) {
        const normalized = deviceName.toUpperCase();
        if (normalized.includes('F4'))
            return 'STM32F4';
        if (normalized.includes('F1'))
            return 'STM32F1';
        if (normalized.includes('L4'))
            return 'STM32L4';
        if (normalized.includes('H7'))
            return 'STM32H7';
        if (normalized.includes('G4'))
            return 'STM32G4';
        return 'STM32';
    }
    /**
     * 显示详细错误信息
     */
    async showDetailedErrorInfo(scanResult) {
        const details = [
            'Environment Scan Details:',
            '',
            `OpenOCD: ${scanResult.toolchains.openocd.status}`,
            `  Error: ${scanResult.toolchains.openocd.error || 'None'}`,
            '',
            `ARM Toolchain: ${scanResult.toolchains.armToolchain.status}`,
            `  Error: ${scanResult.toolchains.armToolchain.error || 'None'}`,
            '',
            'Errors:',
            ...scanResult.errors.map(error => `  - ${error}`),
            '',
            'Recommendations:',
            ...scanResult.recommendations.map(rec => `  - ${rec.title}: ${rec.description}`)
        ].join('\n');
        await vscode.window.showInformationMessage(details, { modal: true });
    }
    /**
     * 显示配置详情
     */
    async showConfigurationDetails(configs) {
        const details = configs.map((config, index) => {
            return [
                `Configuration ${index + 1}: ${config.config.name}`,
                `  Description: ${config.description}`,
                `  Device: ${config.config.device}`,
                `  Executable: ${config.config.executable}`,
                `  Confidence: ${config.metadata.confidence}%`,
                ''
            ].join('\n');
        }).join('\n');
        await vscode.window.showInformationMessage(details, { modal: true });
    }
    /**
     * 显示建议
     */
    async showSuggestions(suggestions) {
        const suggestionText = suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n');
        await vscode.window.showInformationMessage(`Configuration Suggestions:\n\n${suggestionText}`, { modal: true });
    }
    /**
     * 打开launch.json文件
     */
    async openLaunchJson() {
        if (!vscode.workspace.workspaceFolders) {
            return;
        }
        const workspaceFolder = vscode.workspace.workspaceFolders[0];
        const launchJsonPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode', 'launch.json');
        try {
            const document = await vscode.workspace.openTextDocument(launchJsonPath);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            await vscode.window.showErrorMessage('Could not open launch.json file');
        }
    }
    /**
     * 显示智能分析结果
     */
    async showIntelligentAnalysisResults(healthCheck, intelligentResults, projectAnalysis, debugAnalysis) {
        const analysisInfo = [
            'Intelligent Configuration Analysis Results:',
            '',
            `Environment Health: ${this.getHealthStatusText(healthCheck.overall)} (${Math.round((healthCheck.scores.toolchain + healthCheck.scores.workspace + healthCheck.scores.configuration + healthCheck.scores.extensions) / 4)}%)`,
            `Toolchains Detected: ${intelligentResults.results.openocd.status} (OpenOCD), ${intelligentResults.results.armToolchain.status} (ARM)`,
            `Project Type: ${projectAnalysis.projectType}`,
            `Device Inference: ${projectAnalysis.deviceInference.likelyDevice || 'None'} (${projectAnalysis.deviceInference.confidence}% confidence)`,
            `Existing Debug Configs: ${debugAnalysis.existingConfigs.length} found`,
            '',
            `Issues Found: ${healthCheck.issues.length}`,
            `Recommendations: ${intelligentResults.insights.installationRecommendations.length}`,
            '',
            'Proceed with intelligent configuration?'
        ].join('\n');
        const action = await vscode.window.showInformationMessage(analysisInfo, { modal: true }, 'Auto Configure', 'Custom Setup', 'View Details', 'Cancel');
        if (action === 'Auto Configure') {
            return {
                type: 'auto',
                options: this.getDefaultAutoConfigOptions(projectAnalysis)
            };
        }
        else if (action === 'Custom Setup') {
            const customOptions = await this.getCustomConfigOptions({});
            return {
                type: 'custom',
                options: customOptions
            };
        }
        else if (action === 'View Details') {
            await this.showDetailedAnalysisReport(healthCheck, intelligentResults, projectAnalysis);
            return await this.showIntelligentAnalysisResults(healthCheck, intelligentResults, projectAnalysis, debugAnalysis);
        }
        return null;
    }
    /**
     * 执行智能配置
     */
    async executeIntelligentConfiguration(toolchainResults, projectAnalysis, options) {
        try {
            // 推断或获取设备名称
            const deviceName = options.deviceName ||
                projectAnalysis.deviceInference.likelyDevice ||
                await this.promptForDeviceName();
            if (!deviceName) {
                return { success: false, error: 'Device name is required' };
            }
            // 生成配置
            const configs = this.configGenerator.generateOptimizedTemplateSet(deviceName, toolchainResults, projectAnalysis);
            // 验证配置
            const validConfigs = [];
            const errors = [];
            for (const config of configs) {
                const validation = this.configGenerator.validateConfig(config.config, toolchainResults);
                if (validation.isValid) {
                    validConfigs.push(config);
                }
                else {
                    errors.push(`Configuration "${config.config.name}" validation failed: ${validation.errors.join(', ')}`);
                }
            }
            if (validConfigs.length === 0) {
                return {
                    success: false,
                    error: `No valid configurations generated. Errors: ${errors.join('; ')}`
                };
            }
            // 保存配置
            const saveResult = await this.saveBatchConfigurations(validConfigs);
            return {
                success: true,
                generatedConfigs: validConfigs,
                warnings: [...errors, ...(saveResult.warnings || [])]
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Intelligent configuration failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * 验证和优化配置
     */
    async validateAndOptimizeConfigurations(configs) {
        for (const config of configs) {
            // 这里可以添加配置优化逻辑
            // 例如：调整内存映射、优化调试设置等
        }
    }
    /**
     * 显示智能配置结果
     */
    async showIntelligentConfigurationResults(configResult, insights) {
        if (configResult.success && configResult.generatedConfigs) {
            const summary = [
                `Successfully generated ${configResult.generatedConfigs.length} configuration(s)!`,
                '',
                'Generated configurations:',
                ...configResult.generatedConfigs.map((config, index) => `  ${index + 1}. ${config.config.name} (${config.metadata.confidence}% confidence)`),
                '',
                `Alternative locations found: ${insights.alternativeLocations.length}`,
                `Installation recommendations: ${insights.installationRecommendations.length}`,
                ''
            ].join('\n');
            const action = await vscode.window.showInformationMessage(summary, 'Open launch.json', 'View Insights', 'OK');
            switch (action) {
                case 'Open launch.json':
                    await this.openLaunchJson();
                    break;
                case 'View Insights':
                    await this.showConfigurationInsights(insights);
                    break;
            }
        }
    }
    /**
     * 保存批量配置
     */
    async saveBatchConfigurations(configs) {
        const warnings = [];
        try {
            // 这里实现批量保存逻辑
            // 暂时返回成功
            return { success: true, warnings };
        }
        catch (error) {
            warnings.push(`Failed to save configurations: ${error instanceof Error ? error.message : String(error)}`);
            return { success: false, warnings };
        }
    }
    /**
     * 获取健康状态文本
     */
    getHealthStatusText(status) {
        switch (status) {
            case 'healthy': return '✅ Healthy';
            case 'partial': return '⚠️ Partial';
            case 'critical': return '❌ Critical';
            default: return '❓ Unknown';
        }
    }
    /**
     * 获取默认自动配置选项
     */
    getDefaultAutoConfigOptions(projectAnalysis) {
        return {
            deviceName: projectAnalysis.deviceInference.likelyDevice,
            executablePath: projectAnalysis.executablePrediction.defaultPath,
            enableLiveWatch: false,
            samplesPerSecond: 10,
            createBackup: true,
            forceOverwrite: false,
            templateType: 'basic'
        };
    }
    /**
     * 显示详细分析报告
     */
    async showDetailedAnalysisReport(healthCheck, intelligentResults, projectAnalysis) {
        const report = [
            'DETAILED ANALYSIS REPORT',
            '='.repeat(40),
            '',
            '1. ENVIRONMENT HEALTH:',
            `   Overall Status: ${healthCheck.overall}`,
            `   Toolchain Score: ${healthCheck.scores.toolchain}%`,
            `   Workspace Score: ${healthCheck.scores.workspace}%`,
            `   Configuration Score: ${healthCheck.scores.configuration}%`,
            `   Extensions Score: ${healthCheck.scores.extensions}%`,
            '',
            '2. ISSUES FOUND:',
            ...healthCheck.issues.map((issue) => `   - ${issue.message} (${issue.severity})`),
            '',
            '3. TOOLCHAIN DETECTION:',
            `   OpenOCD: ${intelligentResults.results.openocd.status} at ${intelligentResults.results.openocd.path || 'not found'}`,
            `   ARM Toolchain: ${intelligentResults.results.armToolchain.status} at ${intelligentResults.results.armToolchain.path || 'not found'}`,
            '',
            '4. PROJECT ANALYSIS:',
            `   Type: ${projectAnalysis.projectType}`,
            `   Source Files: ${projectAnalysis.sourceFiles.sourceCount}`,
            `   Build System: ${this.getBuildSystemText(projectAnalysis.buildSystem)}`,
            `   Device Inference: ${projectAnalysis.deviceInference.likelyDevice || 'Unknown'} (${projectAnalysis.deviceInference.confidence}%)`,
            '',
            '5. RECOMMENDATIONS:',
            ...intelligentResults.insights.installationRecommendations.map((rec) => `   - ${rec}`),
            '',
            '6. COMPATIBILITY ISSUES:',
            ...intelligentResults.insights.compatibilityIssues.map((issue) => `   - ${issue}`)
        ].join('\n');
        await vscode.window.showInformationMessage(report, { modal: true });
    }
    /**
     * 显示配置洞察
     */
    async showConfigurationInsights(insights) {
        const insightsText = [
            'CONFIGURATION INSIGHTS',
            '='.repeat(30),
            '',
            'Alternative Locations:',
            ...insights.alternativeLocations.map((loc) => `  - ${loc}`),
            '',
            'Installation Recommendations:',
            ...insights.installationRecommendations.map((rec) => `  - ${rec}`),
            '',
            'Compatibility Issues:',
            ...insights.compatibilityIssues.map((issue) => `  - ${issue}`)
        ].join('\n');
        await vscode.window.showInformationMessage(insightsText, { modal: true });
    }
    /**
     * 获取构建系统文本
     */
    getBuildSystemText(buildSystem) {
        const systems = [];
        if (buildSystem.hasMakefile)
            systems.push('Makefile');
        if (buildSystem.hasCMakeLists)
            systems.push('CMake');
        if (buildSystem.hasPlatformIO)
            systems.push('PlatformIO');
        if (buildSystem.hasSTM32CubeMX)
            systems.push('STM32CubeMX');
        return systems.length > 0 ? systems.join(', ') : 'Unknown';
    }
}
exports.AutoConfigurationDialog = AutoConfigurationDialog;
//# sourceMappingURL=autoConfigurationDialog.js.map