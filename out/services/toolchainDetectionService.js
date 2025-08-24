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
exports.ToolchainDetectionService = void 0;
/**
 * 统一工具链检测服务模块
 * 集成OpenOCD和ARM工具链检测功能，提供统一的检测接口
 * 支持结果缓存、增量检测和完整检测功能
 *
 * @fileoverview 统一工具链检测服务
 * @author 左岚
 * @since 0.2.5
 */
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../ui/types");
const cacheManager_1 = require("./cacheManager");
const toolchainDetectors_1 = require("./toolchainDetectors");
/**
 * 统一工具链检测服务类
 * 提供工具链检测、缓存管理和结果统一化功能
 *
 * @class ToolchainDetectionService
 * @since 0.2.5
 */
class ToolchainDetectionService {
    /** 单例实例 */
    static instance;
    /** 缓存管理器 */
    cacheManager;
    /** 默认缓存有效期（5分钟） */
    DEFAULT_CACHE_VALIDITY_MS = 5 * 60 * 1000;
    /**
     * 私有构造函数，确保单例模式
     */
    constructor() {
        this.cacheManager = new cacheManager_1.DefaultCacheManager();
    }
    /**
     * 获取服务实例（单例模式）
     */
    static getInstance() {
        if (!ToolchainDetectionService.instance) {
            ToolchainDetectionService.instance = new ToolchainDetectionService();
        }
        return ToolchainDetectionService.instance;
    }
    /**
     * 检测所有工具链
     */
    async detectToolchains(options = {}) {
        const { forceRedetection = false, specificTools, cacheValidityMs = this.DEFAULT_CACHE_VALIDITY_MS } = options;
        // 检查缓存
        if (!forceRedetection && this.cacheManager.isValid(cacheValidityMs)) {
            if (specificTools) {
                return this.cacheManager.getSpecificFromCache(specificTools);
            }
            return this.cacheManager.getCached();
        }
        // 执行检测
        const results = await this.performDetection(specificTools);
        // 更新缓存
        if (!specificTools) {
            this.cacheManager.setCached(results);
        }
        else {
            this.cacheManager.updateSpecific(results, specificTools);
        }
        return results;
    }
    /**
     * 获取缓存的检测结果
     */
    getCachedResults() {
        return this.cacheManager.getCached();
    }
    /**
     * 清除缓存的检测结果
     */
    clearCache() {
        this.cacheManager.clear();
    }
    /**
     * 转换为UI兼容的检测结果格式
     */
    toUICompatibleResults(results) {
        return {
            openocd: {
                name: results.openocd.name,
                status: results.openocd.status,
                path: results.openocd.path,
                info: results.openocd.info,
                error: results.openocd.error
            },
            armToolchain: {
                name: results.armToolchain.name,
                status: results.armToolchain.status,
                path: results.armToolchain.path,
                info: results.armToolchain.info,
                error: results.armToolchain.error
            }
        };
    }
    /**
     * 执行深度智能检测
     * 使用多种检测策略和启发式算法找到工具链
     */
    async performIntelligentDetection() {
        const results = this.createEmptyResults();
        const insights = {
            detectionStrategy: 'intelligent',
            alternativeLocations: [],
            installationRecommendations: [],
            compatibilityIssues: []
        };
        const detectionTime = Date.now();
        // 1. 标准检测
        const standardResults = await this.performDetection();
        Object.assign(results, standardResults);
        // 2. 如果标准检测失败，执行高级检测
        if (results.openocd.status !== types_1.DetectionStatus.SUCCESS) {
            await this.performAdvancedOpenOCDDetection(results, insights);
        }
        if (results.armToolchain.status !== types_1.DetectionStatus.SUCCESS) {
            await this.performAdvancedArmToolchainDetection(results, insights);
        }
        // 3. 检查兼容性问题
        await this.checkCompatibilityIssues(results, insights);
        // 4. 生成安装建议
        this.generateInstallationRecommendations(results, insights);
        results.completedAt = detectionTime;
        return { results, insights };
    }
    /**
     * 验证工具链完整性
     * 检查工具链是否完整且功能正常
     */
    async validateToolchainIntegrity(toolchainPath, type) {
        const validation = {
            isValid: true,
            completeness: 100,
            missingComponents: [],
            functionalIssues: [],
            performanceMetrics: {
                detectionTime: 0,
                versionCheckTime: 0,
                configAccessTime: 0
            }
        };
        const startTime = Date.now();
        try {
            if (type === 'openocd') {
                await this.validateOpenOCDIntegrity(toolchainPath, validation);
            }
            else if (type === 'arm') {
                await this.validateArmToolchainIntegrity(toolchainPath, validation);
            }
            validation.performanceMetrics.detectionTime = Date.now() - startTime;
            validation.isValid = validation.missingComponents.length === 0 && validation.functionalIssues.length === 0;
        }
        catch (error) {
            validation.isValid = false;
            validation.functionalIssues.push(`Validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        return validation;
    }
    /**
     * 自动修复工具链配置问题
     * 尝试自动解决常见的配置问题
     */
    async autoRepairConfiguration() {
        const repair = {
            repairsAttempted: 0,
            repairsSuccessful: 0,
            repairActions: [],
            newDetectionResults: undefined
        };
        try {
            // 1. 检查和修复PATH环境变量
            await this.repairPathEnvironment(repair);
            // 2. 检查和修复VS Code设置
            await this.repairVSCodeSettings(repair);
            // 3. 检查和修复权限问题
            await this.repairPermissionIssues(repair);
            // 4. 重新检测工具链
            const newResults = await this.detectToolchains({ forceRedetection: true });
            repair.newDetectionResults = newResults;
        }
        catch (error) {
            repair.repairActions.push({
                action: 'Auto-repair process',
                target: 'System',
                result: 'failed',
                details: `Auto-repair failed: ${error instanceof Error ? error.message : String(error)}`
            });
        }
        return repair;
    }
    /**
     * 执行实际的工具链检测
     *
     * @private
     */
    async performDetection(specificTools) {
        const results = this.cacheManager.getCached() || this.createEmptyResults();
        const detectionTime = Date.now();
        // 并行检测
        const tasks = [];
        if (!specificTools || specificTools.includes('openocd')) {
            tasks.push(toolchainDetectors_1.DetectorFactory.getOpenOCDDetector().detect(detectionTime)
                .then(result => { results.openocd = result; }));
        }
        if (!specificTools || specificTools.includes('armToolchain')) {
            tasks.push(toolchainDetectors_1.DetectorFactory.getArmToolchainDetector().detect(detectionTime)
                .then(result => { results.armToolchain = result; }));
        }
        await Promise.all(tasks);
        results.completedAt = Date.now();
        return results;
    }
    /**
     * 创建空的检测结果对象
     *
     * @private
     */
    createEmptyResults() {
        return this.cacheManager.createEmptyResults();
    }
    /**
     * 执行高级OpenOCD检测
     */
    async performAdvancedOpenOCDDetection(results, insights) {
        const commonPaths = [
            // Windows常见路径
            'C:\\Program Files\\OpenOCD\\bin',
            'C:\\Program Files (x86)\\OpenOCD\\bin',
            'C:\\tools\\openocd\\bin',
            'C:\\openocd\\bin',
            // Linux常见路径
            '/usr/local/bin',
            '/opt/openocd/bin',
            '/usr/share/openocd/bin',
            // macOS常见路径
            '/usr/local/Cellar/openocd/*/bin',
            '/opt/homebrew/bin'
        ];
        for (const searchPath of commonPaths) {
            const openocdPath = path.join(searchPath, process.platform === 'win32' ? 'openocd.exe' : 'openocd');
            if (fs.existsSync(openocdPath)) {
                insights.alternativeLocations.push(openocdPath);
                try {
                    // 尝试验证这个路径
                    const validation = await this.validateOpenOCDIntegrity(openocdPath, {
                        isValid: true,
                        completeness: 100,
                        missingComponents: [],
                        functionalIssues: []
                    });
                    if (validation.isValid) {
                        results.openocd.status = types_1.DetectionStatus.SUCCESS;
                        results.openocd.path = openocdPath;
                        results.openocd.error = undefined;
                        break;
                    }
                }
                catch (error) {
                    insights.compatibilityIssues.push(`OpenOCD found at ${openocdPath} but has issues: ${error}`);
                }
            }
        }
        // 检查VS Code设置中的自定义路径
        const config = vscode.workspace.getConfiguration('cortex-debug');
        const customPath = config.get('openocdPath');
        if (customPath && fs.existsSync(customPath)) {
            insights.alternativeLocations.push(customPath);
        }
    }
    /**
     * 执行高级ARM工具链检测
     */
    async performAdvancedArmToolchainDetection(results, insights) {
        const commonPaths = [
            // Windows常见路径
            'C:\\Program Files (x86)\\GNU Arm Embedded Toolchain',
            'C:\\Program Files\\GNU Arm Embedded Toolchain',
            'C:\\tools\\gcc-arm-none-eabi',
            // Linux常见路径
            '/usr/local/gcc-arm-none-eabi',
            '/opt/gcc-arm-none-eabi',
            '/usr/arm-none-eabi',
            // macOS常见路径
            '/usr/local/Cellar/arm-none-eabi-gcc',
            '/opt/homebrew/Cellar/arm-none-eabi-gcc'
        ];
        for (const basePath of commonPaths) {
            if (fs.existsSync(basePath)) {
                // 查找bin目录
                const binPath = this.findArmToolchainBinPath(basePath);
                if (binPath) {
                    const gccPath = path.join(binPath, process.platform === 'win32' ? 'arm-none-eabi-gcc.exe' : 'arm-none-eabi-gcc');
                    if (fs.existsSync(gccPath)) {
                        insights.alternativeLocations.push(binPath);
                        try {
                            const validation = await this.validateArmToolchainIntegrity(binPath, {
                                isValid: true,
                                completeness: 100,
                                missingComponents: [],
                                functionalIssues: []
                            });
                            if (validation.isValid) {
                                results.armToolchain.status = types_1.DetectionStatus.SUCCESS;
                                results.armToolchain.path = binPath;
                                results.armToolchain.error = undefined;
                                break;
                            }
                        }
                        catch (error) {
                            insights.compatibilityIssues.push(`ARM toolchain found at ${binPath} but has issues: ${error}`);
                        }
                    }
                }
            }
        }
    }
    /**
     * 检查兼容性问题
     */
    async checkCompatibilityIssues(results, insights) {
        // 检查版本兼容性
        if (results.openocd.version && results.armToolchain.version) {
            // 这里可以添加具体的版本兼容性检查逻辑
        }
        // 检查平台兼容性
        if (process.platform === 'darwin' && process.arch === 'arm64') {
            insights.compatibilityIssues.push('Some toolchain binaries may require Rosetta 2 on Apple Silicon');
        }
        // 检查权限问题
        if (results.openocd.path && !this.checkExecutePermission(results.openocd.path)) {
            insights.compatibilityIssues.push('OpenOCD binary lacks execute permissions');
        }
        if (results.armToolchain.path) {
            const gccPath = path.join(results.armToolchain.path, process.platform === 'win32' ? 'arm-none-eabi-gcc.exe' : 'arm-none-eabi-gcc');
            if (!this.checkExecutePermission(gccPath)) {
                insights.compatibilityIssues.push('ARM toolchain binaries lack execute permissions');
            }
        }
    }
    /**
     * 生成安装建议
     */
    generateInstallationRecommendations(results, insights) {
        if (results.openocd.status !== types_1.DetectionStatus.SUCCESS) {
            if (process.platform === 'win32') {
                insights.installationRecommendations.push('Download OpenOCD from official website or install via package manager');
            }
            else if (process.platform === 'darwin') {
                insights.installationRecommendations.push('Install OpenOCD using Homebrew: brew install openocd');
            }
            else {
                insights.installationRecommendations.push('Install OpenOCD using your distribution package manager');
            }
        }
        if (results.armToolchain.status !== types_1.DetectionStatus.SUCCESS) {
            insights.installationRecommendations.push('Download ARM GNU Toolchain from ARM Developer website');
            if (process.platform === 'darwin') {
                insights.installationRecommendations.push('Or install via Homebrew: brew install --cask gcc-arm-embedded');
            }
        }
    }
    /**
     * 验证OpenOCD完整性
     */
    async validateOpenOCDIntegrity(toolchainPath, validation) {
        const openocdBinary = toolchainPath.endsWith('.exe') || toolchainPath.includes('openocd') ?
            toolchainPath : path.join(toolchainPath, process.platform === 'win32' ? 'openocd.exe' : 'openocd');
        if (!fs.existsSync(openocdBinary)) {
            validation.missingComponents.push('OpenOCD executable not found');
            validation.completeness -= 50;
            return validation;
        }
        // 检查配置文件目录
        const configDir = path.join(path.dirname(openocdBinary), '..', 'scripts');
        if (!fs.existsSync(configDir)) {
            validation.missingComponents.push('OpenOCD configuration scripts directory not found');
            validation.completeness -= 30;
        }
        // 检查关键配置文件
        const requiredConfigs = ['interface', 'target'];
        for (const configType of requiredConfigs) {
            const configPath = path.join(configDir, configType);
            if (!fs.existsSync(configPath)) {
                validation.missingComponents.push(`${configType} configuration directory not found`);
                validation.completeness -= 10;
            }
        }
        return validation;
    }
    /**
     * 验证ARM工具链完整性
     */
    async validateArmToolchainIntegrity(toolchainPath, validation) {
        const requiredTools = [
            'arm-none-eabi-gcc',
            'arm-none-eabi-g++',
            'arm-none-eabi-gdb',
            'arm-none-eabi-objdump',
            'arm-none-eabi-size'
        ];
        const extension = process.platform === 'win32' ? '.exe' : '';
        for (const tool of requiredTools) {
            const toolPath = path.join(toolchainPath, `${tool}${extension}`);
            if (!fs.existsSync(toolPath)) {
                validation.missingComponents.push(`${tool} not found`);
                validation.completeness -= 20;
            }
        }
        return validation;
    }
    /**
     * 查找ARM工具链bin路径
     */
    findArmToolchainBinPath(basePath) {
        const possiblePaths = [
            path.join(basePath, 'bin'),
            path.join(basePath, 'latest', 'bin'),
            // 查找版本号目录
            ...this.findVersionDirectories(basePath).map(v => path.join(basePath, v, 'bin'))
        ];
        for (const binPath of possiblePaths) {
            if (fs.existsSync(binPath)) {
                const gccPath = path.join(binPath, process.platform === 'win32' ? 'arm-none-eabi-gcc.exe' : 'arm-none-eabi-gcc');
                if (fs.existsSync(gccPath)) {
                    return binPath;
                }
            }
        }
        return null;
    }
    /**
     * 查找版本目录
     */
    findVersionDirectories(basePath) {
        try {
            return fs.readdirSync(basePath)
                .filter(item => {
                const fullPath = path.join(basePath, item);
                return fs.statSync(fullPath).isDirectory() && /^\d+\.\d+/.test(item);
            })
                .sort((a, b) => b.localeCompare(a)); // 按版本号降序排列
        }
        catch (error) {
            return [];
        }
    }
    /**
     * 检查执行权限
     */
    checkExecutePermission(filePath) {
        try {
            fs.accessSync(filePath, fs.constants.F_OK | fs.constants.R_OK);
            if (process.platform !== 'win32') {
                fs.accessSync(filePath, fs.constants.X_OK);
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 修复PATH环境变量
     */
    async repairPathEnvironment(repair) {
        repair.repairsAttempted++;
        // 这里主要是检测和建议，实际修复PATH需要用户权限
        repair.repairActions.push({
            action: 'Check PATH environment',
            target: 'System Environment',
            result: 'skipped',
            details: 'PATH environment variable modification requires manual user action'
        });
    }
    /**
     * 修复VS Code设置
     */
    async repairVSCodeSettings(repair) {
        repair.repairsAttempted++;
        try {
            const config = vscode.workspace.getConfiguration('cortex-debug');
            // 检查是否需要设置openocdPath
            const openocdPath = config.get('openocdPath');
            if (!openocdPath) {
                // 尝试自动设置
                const detectedPath = await this.findOpenOCDPath();
                if (detectedPath) {
                    await config.update('openocdPath', detectedPath, vscode.ConfigurationTarget.Workspace);
                    repair.repairsSuccessful++;
                    repair.repairActions.push({
                        action: 'Set OpenOCD path',
                        target: 'VS Code Settings',
                        result: 'success',
                        details: `Set openocdPath to ${detectedPath}`
                    });
                }
                else {
                    repair.repairActions.push({
                        action: 'Set OpenOCD path',
                        target: 'VS Code Settings',
                        result: 'failed',
                        details: 'Could not automatically detect OpenOCD path'
                    });
                }
            }
        }
        catch (error) {
            repair.repairActions.push({
                action: 'Repair VS Code settings',
                target: 'VS Code Settings',
                result: 'failed',
                details: `Failed to update settings: ${error}`
            });
        }
    }
    /**
     * 修复权限问题
     */
    async repairPermissionIssues(repair) {
        repair.repairsAttempted++;
        // 权限问题通常需要用户手动修复
        repair.repairActions.push({
            action: 'Fix permissions',
            target: 'File System',
            result: 'skipped',
            details: 'Permission issues require manual user action (chmod +x on Unix systems)'
        });
    }
    /**
     * 查找OpenOCD路径的辅助方法
     */
    async findOpenOCDPath() {
        // 这里应该调用现有的OpenOCD检测逻辑
        // 暂时返回null，实际实现应该复用现有的检测代码
        return null;
    }
}
exports.ToolchainDetectionService = ToolchainDetectionService;
//# sourceMappingURL=toolchainDetectionService.js.map