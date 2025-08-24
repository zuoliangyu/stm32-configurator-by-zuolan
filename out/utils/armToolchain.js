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
exports.checkArmToolchainPath = exports.normalizeToolchainPath = void 0;
exports.findArmToolchainPath = findArmToolchainPath;
exports.generateCortexDebugConfig = generateCortexDebugConfig;
exports.generateLaunchJsonContent = generateLaunchJsonContent;
exports.getArmToolchainExecutables = getArmToolchainExecutables;
exports.validateArmToolchainPath = validateArmToolchainPath;
exports.getArmToolchainInfo = getArmToolchainInfo;
/**
 * ARM工具链检测模块
 * 提供ARM工具链路径检测和信息获取功能
 * 支持Windows、macOS和Linux平台的ARM工具链安装检测
 *
 * @fileoverview ARM工具链检测工具类
 * @author 左岚
 * @since 0.2.3
 */
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
const pathUtils_1 = require("./pathUtils");
const toolchainPaths_1 = require("./toolchainPaths");
// 向后兼容的导出函数
exports.normalizeToolchainPath = pathUtils_1.normalizePath;
exports.checkArmToolchainPath = pathUtils_1.isValidExecutablePath;
function checkCortexDebugConfig() {
    const config = vscode.workspace.getConfiguration('cortex-debug');
    const userToolchainPath = config.get('armToolchainPath');
    if (!userToolchainPath) {
        return null;
    }
    let gccPath = userToolchainPath;
    if (!gccPath.includes('arm-none-eabi-gcc')) {
        gccPath = (0, pathUtils_1.buildExecutablePath)(path.join(gccPath, 'bin'), 'arm-none-eabi-gcc');
    }
    const normalizedPath = (0, pathUtils_1.normalizePath)(gccPath);
    return (0, pathUtils_1.isValidExecutablePath)(normalizedPath) ? normalizedPath : null;
}
function findInPath() {
    return new Promise((resolve) => {
        const executableName = process.platform === 'win32' ? 'arm-none-eabi-gcc.exe' : 'arm-none-eabi-gcc';
        const command = process.platform === 'win32' ? `where ${executableName}` : `which ${executableName}`;
        (0, child_process_1.exec)(command, (error, stdout) => {
            if (error) {
                resolve(null);
                return;
            }
            const firstPath = stdout.split(/\r?\n/)[0].trim();
            const normalizedPath = (0, pathUtils_1.normalizePath)(firstPath);
            resolve((0, pathUtils_1.isValidExecutablePath)(normalizedPath) ? normalizedPath : null);
        });
    });
}
function findInCommonPaths() {
    if (process.platform !== 'win32') {
        return null;
    }
    for (const pathTemplate of toolchainPaths_1.COMMON_ARM_TOOLCHAIN_PATHS) {
        const expandedPaths = (0, pathUtils_1.expandPath)(pathTemplate);
        for (const testPath of expandedPaths) {
            const normalizedPath = (0, pathUtils_1.normalizePath)(testPath);
            if ((0, pathUtils_1.isValidExecutablePath)(normalizedPath)) {
                return normalizedPath;
            }
        }
    }
    return null;
}
/**
 * 使用多种检测方法查找ARM工具链路径
 * 按以下顺序检测：
 * 1. VSCode Cortex-Debug扩展配置的路径
 * 2. PATH环境变量中的arm-none-eabi-gcc
 * 3. 常见安装路径（仅Windows）
 *
 * @returns ARM GCC可执行文件的完整路径，如果未找到则返回null
 * @since 0.2.3
 */
async function findArmToolchainPath() {
    // Method 1: Check cortex-debug configuration
    const configPath = checkCortexDebugConfig();
    if (configPath) {
        return configPath;
    }
    // Method 2: Try PATH environment variable
    const pathResult = await findInPath();
    if (pathResult) {
        return pathResult;
    }
    // Method 3: Check common installation paths (Windows only)
    return findInCommonPaths();
}
function parseVersionOutput(stdout, toolchainPath) {
    const lines = stdout.split('\n');
    const versionLine = lines[0] || '';
    // 提取版本号
    const versionMatch = versionLine.match(/(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : 'Unknown';
    // 提取目标架构信息
    const targetMatch = versionLine.match(/\(([^)]+)\)/);
    const target = targetMatch ? targetMatch[1] : 'arm-none-eabi';
    // 提取供应商信息
    let vendor = 'Unknown';
    if (versionLine.toLowerCase().includes('gnu')) {
        if (versionLine.toLowerCase().includes('arm')) {
            vendor = 'GNU Arm Embedded Toolchain';
        }
        else {
            vendor = 'GNU Toolchain';
        }
    }
    else if (versionLine.toLowerCase().includes('xpack')) {
        vendor = 'xPack GNU Arm Embedded GCC';
    }
    const normalizedPath = (0, pathUtils_1.normalizePath)(toolchainPath);
    const binDir = path.dirname(normalizedPath);
    const rootPath = (0, pathUtils_1.normalizePath)(path.dirname(binDir));
    return {
        version,
        gccPath: normalizedPath,
        rootPath,
        target,
        vendor,
        detectedAt: Date.now()
    };
}
/**
 * 生成Cortex Debug调试配置
 * 根据ARM工具链路径生成VS Code的launch.json配置
 *
 * @param toolchainPath - ARM工具链路径
 * @param options - 可选配置参数
 * @returns 生成的Cortex Debug配置对象
 * @since 0.2.3
 */
async function generateCortexDebugConfig(toolchainPath, options = {}) {
    const validation = await validateArmToolchainPath(toolchainPath);
    if (!validation.isValid || !validation.toolchainInfo) {
        throw new Error(`Invalid ARM toolchain path: ${validation.errors.join(', ')}`);
    }
    const { name = 'Debug STM32', device = 'STM32F103C8', configFiles = [
        'interface/stlink.cfg',
        'target/stm32f1x.cfg'
    ], svdFile, executable = '${workspaceFolder}/build/firmware.elf', debuggerArgs = [], runToEntryPoint = 'main', cwd = '${workspaceFolder}' } = options;
    const config = {
        name,
        cwd,
        executable,
        request: 'launch',
        type: 'cortex-debug',
        runToEntryPoint,
        servertype: 'openocd',
        device,
        configFiles,
        toolchainPath: validation.toolchainInfo.rootPath,
        armToolchainPath: validation.toolchainInfo.rootPath,
        debuggerPath: validation.executables.gdb || (0, pathUtils_1.buildExecutablePath)(path.join(validation.toolchainInfo.rootPath, 'bin'), 'arm-none-eabi-gdb'),
        debuggerArgs: [
            '-q',
            '--interpreter=mi2',
            ...debuggerArgs
        ],
        swoConfig: {
            enabled: true,
            cpuFrequency: 72000000,
            swoFrequency: 2000000,
            source: 'probe',
            decoders: [
                {
                    type: 'console',
                    label: 'ITM',
                    port: 0
                }
            ]
        },
        graphConfig: [
            {
                label: 'CPU Usage',
                timespan: 30,
                maximum: 100,
                minimum: 0,
                plots: [
                    {
                        label: 'Core',
                        expr: 'cpuUsage',
                        color: '#ff6b6b'
                    }
                ]
            }
        ]
    };
    // 添加SVD文件配置（如果提供）
    if (svdFile) {
        config.svdFile = svdFile;
    }
    return config;
}
/**
 * 生成完整的launch.json文件内容
 * 创建VS Code项目的.vscode/launch.json文件内容
 *
 * @param toolchainPath - ARM工具链路径
 * @param configs - 多个调试配置选项
 * @returns launch.json的完整内容对象
 * @since 0.2.3
 */
async function generateLaunchJsonContent(toolchainPath, configs = [{}]) {
    const configurations = [];
    for (const config of configs) {
        try {
            const debugConfig = await generateCortexDebugConfig(toolchainPath, config);
            configurations.push(debugConfig);
        }
        catch (error) {
            console.error('Error generating debug configuration:', error);
            // 继续处理其他配置
        }
    }
    if (configurations.length === 0) {
        throw new Error('No valid debug configurations could be generated');
    }
    return {
        version: '0.2.0',
        configurations
    };
}
/**
 * 获取ARM工具链信息
 * 通过执行arm-none-eabi-gcc --version命令获取工具链的详细信息
 *
 * @param toolchainPath - ARM GCC可执行文件的完整路径
 * @returns 包含工具链版本、路径和目标信息的对象
 * @since 0.2.3
 */
/**
 * 获取ARM工具链中所有可执行文件的路径
 * 根据工具链根路径构建各种工具的完整路径
 *
 * @param toolchainRootPath - 工具链根目录路径
 * @returns 包含所有可执行文件路径的对象
 * @since 0.2.3
 */
function getArmToolchainExecutables(toolchainRootPath) {
    const binPath = path.join(toolchainRootPath, 'bin');
    const toolNames = ['gcc', 'g++', 'as', 'ld', 'ar', 'objcopy', 'objdump', 'size', 'nm', 'gdb'];
    return {
        gcc: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-gcc'),
        gpp: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-g++'),
        as: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-as'),
        ld: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-ld'),
        ar: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-ar'),
        objcopy: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-objcopy'),
        objdump: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-objdump'),
        size: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-size'),
        nm: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-nm'),
        gdb: (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-gdb')
    };
}
/**
 * 验证ARM工具链路径的完整性
 * 检查工具链安装是否完整，包括必要的可执行文件
 *
 * @param toolchainPath - ARM GCC可执行文件路径或工具链根目录路径
 * @returns 详细的验证结果，包括可用工具和缺失工具信息
 * @since 0.2.3
 */
async function validateArmToolchainPath(toolchainPath) {
    const result = {
        isValid: false,
        toolchainInfo: null,
        executables: {},
        missingTools: [],
        errors: []
    };
    if (!toolchainPath) {
        result.errors.push('Toolchain path is empty');
        return result;
    }
    try {
        let gccPath = (0, pathUtils_1.normalizePath)(toolchainPath);
        let rootPath = '';
        // 确定GCC路径和根路径
        if (toolchainPath.includes('arm-none-eabi-gcc')) {
            // 输入的是GCC可执行文件路径
            if (!(0, pathUtils_1.isValidExecutablePath)(gccPath)) {
                result.errors.push('GCC executable not found at specified path');
                return result;
            }
            const binDir = path.dirname(gccPath);
            rootPath = path.dirname(binDir);
        }
        else {
            // 输入的是工具链根目录
            rootPath = gccPath;
            gccPath = (0, pathUtils_1.buildExecutablePath)(path.join(rootPath, 'bin'), 'arm-none-eabi-gcc');
            if (!(0, pathUtils_1.isValidExecutablePath)(gccPath)) {
                result.errors.push('GCC executable not found in toolchain bin directory');
                return result;
            }
        }
        // 获取工具链信息
        result.toolchainInfo = await getArmToolchainInfo(gccPath);
        // 检查所有可执行文件
        const allExecutables = getArmToolchainExecutables(rootPath);
        const coreTools = ['gcc', 'gpp', 'as', 'ld', 'ar', 'objcopy', 'objdump'];
        const optionalTools = ['size', 'nm', 'gdb'];
        // 验证核心工具
        for (const tool of coreTools) {
            const toolPath = allExecutables[tool];
            if ((0, pathUtils_1.isValidExecutablePath)(toolPath)) {
                result.executables[tool] = toolPath;
            }
            else {
                result.missingTools.push(`arm-none-eabi-${tool}`);
            }
        }
        // 验证可选工具（不影响总体有效性）
        for (const tool of optionalTools) {
            const toolPath = allExecutables[tool];
            if ((0, pathUtils_1.isValidExecutablePath)(toolPath)) {
                result.executables[tool] = toolPath;
            }
        }
        // 判断工具链是否有效（至少要有GCC）
        result.isValid = result.missingTools.length === 0 &&
            result.toolchainInfo !== null &&
            result.toolchainInfo.version !== 'Unknown';
        if (result.missingTools.length > 0) {
            result.errors.push(`Missing essential tools: ${result.missingTools.join(', ')}`);
        }
    }
    catch (error) {
        result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return result;
}
async function getArmToolchainInfo(toolchainPath) {
    const defaultInfo = {
        version: 'Unknown',
        gccPath: (0, pathUtils_1.normalizePath)(toolchainPath),
        rootPath: '',
        target: 'arm-none-eabi',
        detectedAt: Date.now()
    };
    if (!toolchainPath || !(0, exports.checkArmToolchainPath)(toolchainPath)) {
        return defaultInfo;
    }
    return new Promise((resolve) => {
        const normalizedPath = (0, pathUtils_1.normalizePath)(toolchainPath);
        const command = `"${normalizedPath}" --version`;
        (0, child_process_1.exec)(command, { timeout: 5000 }, (error, stdout) => {
            if (error) {
                console.error('Error getting ARM toolchain version:', error);
                resolve(defaultInfo);
                return;
            }
            try {
                const info = parseVersionOutput(stdout, toolchainPath);
                info.detectedAt = Date.now();
                resolve(info);
            }
            catch (parseError) {
                console.error('Error parsing ARM toolchain version output:', parseError);
                resolve(defaultInfo);
            }
        });
    });
}
//# sourceMappingURL=armToolchain.js.map