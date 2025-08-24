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
/**
 * ARM工具链检测功能单元测试
 * 测试ARM工具链路径检测、验证和配置生成功能
 *
 * @fileoverview ARM工具链检测测试套件
 * @author 左岚
 * @since 0.2.3
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const fs = __importStar(require("fs"));
const cp = __importStar(require("child_process"));
const vscode = __importStar(require("vscode"));
const armToolchain_1 = require("../utils/armToolchain");
describe('ARM Toolchain Detection Tests', () => {
    let sandbox;
    const mockToolchainPath = '/test/arm-toolchain';
    const mockGccPath = '/test/arm-toolchain/bin/arm-none-eabi-gcc.exe';
    const mockVersionOutput = 'arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10.3-2021.10) 10.3.1 20210824 (release)';
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock VS Code configuration
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: sandbox.stub().returns(null),
            update: sandbox.stub().resolves(),
            has: sandbox.stub().returns(false),
            inspect: sandbox.stub()
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('findArmToolchainPath', () => {
        it('should return null when no toolchain is found', async () => {
            // Mock all detection methods to fail
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns(null)
            });
            // Mock exec to simulate command failure
            sandbox.stub(cp, 'exec').callsArgWith(1, new Error('Command not found'), '', '');
            // Mock file system to simulate no common paths exist
            sandbox.stub(fs, 'existsSync').returns(false);
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            assert.strictEqual(result, null);
        });
        it('should return cortex-debug configured path when available', async () => {
            const mockPath = '/configured/arm-toolchain/bin/arm-none-eabi-gcc';
            // Mock cortex-debug configuration
            sandbox.stub(vscode.workspace, 'getConfiguration').withArgs('cortex-debug').returns({
                get: sandbox.stub().withArgs('armToolchainPath').returns('/configured/arm-toolchain')
            });
            // Mock file existence check
            sandbox.stub(fs, 'existsSync').withArgs(mockPath.replace(/\\/g, '/')).returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            assert.strictEqual(result, mockPath.replace(/\\/g, '/'));
        });
        it('should find toolchain in PATH environment variable', async () => {
            // Mock cortex-debug to return null
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns(null)
            });
            // Mock exec to simulate successful PATH search
            sandbox.stub(cp, 'exec').callsArgWith(1, null, mockGccPath, '');
            // Mock file existence
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            assert.ok(result);
            assert.ok(result.includes('arm-none-eabi-gcc'));
        });
    });
    describe('getArmToolchainInfo', () => {
        it('should return default info for invalid toolchain path', async () => {
            const result = await (0, armToolchain_1.getArmToolchainInfo)('');
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.target, 'arm-none-eabi');
            assert.ok(typeof result.detectedAt === 'number');
        });
        it('should parse toolchain version correctly', async () => {
            // Mock file existence check
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec to return version output
            sandbox.stub(cp, 'exec').callsFake((cmd, options, callback) => {
                callback(null, mockVersionOutput, '');
            });
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockGccPath);
            assert.strictEqual(result.version, '10.3.1');
            assert.strictEqual(result.vendor, 'GNU Arm Embedded Toolchain');
            assert.ok(result.gccPath.includes('arm-none-eabi-gcc'));
            assert.ok(result.rootPath.length > 0);
            assert.ok(typeof result.detectedAt === 'number');
        });
        it('should handle exec timeout gracefully', async () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec to timeout
            sandbox.stub(cp, 'exec').callsFake((cmd, options, callback) => {
                setTimeout(() => {
                    callback(new Error('Timeout'), '', '');
                }, 100);
            });
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockGccPath);
            assert.strictEqual(result.version, 'Unknown');
        });
    });
    describe('getArmToolchainExecutables', () => {
        it('should generate all executable paths correctly', () => {
            const rootPath = '/test/toolchain';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(rootPath);
            // Check that all expected tools are included
            const expectedTools = ['gcc', 'gpp', 'as', 'ld', 'ar', 'objcopy', 'objdump', 'size', 'nm', 'gdb'];
            expectedTools.forEach(tool => {
                assert.ok(tool in executables);
                assert.ok(executables[tool].includes('arm-none-eabi'));
                assert.ok(executables[tool].includes(rootPath));
            });
        });
        it('should handle Windows paths correctly', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'win32' });
            const rootPath = 'C:\\test\\toolchain';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(rootPath);
            // Windows executables should have .exe extension
            assert.ok(executables.gcc.endsWith('.exe'));
            assert.ok(executables.gdb.endsWith('.exe'));
            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });
    });
    describe('validateArmToolchainPath', () => {
        it('should return invalid result for empty path', async () => {
            const result = await (0, armToolchain_1.validateArmToolchainPath)('');
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.length > 0);
            assert.ok(result.errors[0].includes('empty'));
        });
        it('should validate complete toolchain installation', async () => {
            // Mock file system calls to simulate all tools exist
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec for version info
            sandbox.stub(cp, 'exec').callsFake((cmd, options, callback) => {
                callback(null, mockVersionOutput, '');
            });
            const result = await (0, armToolchain_1.validateArmToolchainPath)(mockGccPath);
            assert.strictEqual(result.isValid, true);
            assert.strictEqual(result.errors.length, 0);
            assert.strictEqual(result.missingTools.length, 0);
            assert.ok(result.toolchainInfo);
            assert.ok(Object.keys(result.executables).length > 0);
        });
        it('should detect missing essential tools', async () => {
            // Mock some files exist, others don't
            sandbox.stub(fs, 'existsSync').callsFake((filePath) => {
                const pathStr = filePath.toString();
                return pathStr.includes('gcc') || pathStr.includes('g++'); // Only GCC and G++ exist
            });
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec for version info
            sandbox.stub(cp, 'exec').callsFake((cmd, options, callback) => {
                callback(null, mockVersionOutput, '');
            });
            const result = await (0, armToolchain_1.validateArmToolchainPath)(mockGccPath);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.missingTools.length > 0);
            assert.ok(result.missingTools.includes('arm-none-eabi-as'));
            assert.ok(result.errors.some(err => err.includes('Missing essential tools')));
        });
    });
    describe('generateCortexDebugConfig', () => {
        const mockValidationResult = {
            isValid: true,
            toolchainInfo: {
                version: '10.3.1',
                gccPath: mockGccPath,
                rootPath: mockToolchainPath,
                target: 'arm-none-eabi',
                vendor: 'GNU Arm Embedded Toolchain',
                detectedAt: Date.now()
            },
            executables: {
                gcc: `${mockToolchainPath}/bin/arm-none-eabi-gcc`,
                gdb: `${mockToolchainPath}/bin/arm-none-eabi-gdb`
            },
            missingTools: [],
            errors: []
        };
        it('should generate basic debug configuration', async () => {
            // Mock validateArmToolchainPath
            sandbox.stub(require('../utils/armToolchain'), 'validateArmToolchainPath').resolves(mockValidationResult);
            const config = await (0, armToolchain_1.generateCortexDebugConfig)(mockGccPath);
            assert.ok(config);
            assert.strictEqual(config.name, 'Debug STM32');
            assert.strictEqual(config.type, 'cortex-debug');
            assert.strictEqual(config.request, 'launch');
            assert.strictEqual(config.servertype, 'openocd');
            assert.ok(config.configFiles);
            assert.ok(config.toolchainPath);
            assert.ok(config.debuggerPath);
        });
        it('should apply custom configuration options', async () => {
            sandbox.stub(require('../utils/armToolchain'), 'validateArmToolchainPath').resolves(mockValidationResult);
            const options = {
                name: 'Custom Debug Config',
                device: 'STM32F407VG',
                svdFile: '/path/to/stm32f407.svd',
                executable: '${workspaceFolder}/build/custom.elf'
            };
            const config = await (0, armToolchain_1.generateCortexDebugConfig)(mockGccPath, options);
            assert.strictEqual(config.name, 'Custom Debug Config');
            assert.strictEqual(config.device, 'STM32F407VG');
            assert.strictEqual(config.svdFile, '/path/to/stm32f407.svd');
            assert.strictEqual(config.executable, '${workspaceFolder}/build/custom.elf');
        });
        it('should reject invalid toolchain path', async () => {
            const invalidResult = {
                isValid: false,
                toolchainInfo: null,
                executables: {},
                missingTools: ['arm-none-eabi-gcc'],
                errors: ['GCC not found']
            };
            sandbox.stub(require('../utils/armToolchain'), 'validateArmToolchainPath').resolves(invalidResult);
            try {
                await (0, armToolchain_1.generateCortexDebugConfig)('/invalid/path');
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.ok(error.message.includes('Invalid ARM toolchain path'));
            }
        });
    });
    describe('generateLaunchJsonContent', () => {
        const mockValidationResult = {
            isValid: true,
            toolchainInfo: {
                version: '10.3.1',
                gccPath: mockGccPath,
                rootPath: mockToolchainPath,
                target: 'arm-none-eabi',
                detectedAt: Date.now()
            },
            executables: {
                gcc: `${mockToolchainPath}/bin/arm-none-eabi-gcc`,
                gdb: `${mockToolchainPath}/bin/arm-none-eabi-gdb`
            },
            missingTools: [],
            errors: []
        };
        it('should generate launch.json with default configuration', async () => {
            sandbox.stub(require('../utils/armToolchain'), 'validateArmToolchainPath').resolves(mockValidationResult);
            const launchJson = await (0, armToolchain_1.generateLaunchJsonContent)(mockGccPath);
            assert.strictEqual(launchJson.version, '0.2.0');
            assert.ok(Array.isArray(launchJson.configurations));
            assert.strictEqual(launchJson.configurations.length, 1);
            assert.strictEqual(launchJson.configurations[0].name, 'Debug STM32');
        });
        it('should generate multiple configurations', async () => {
            sandbox.stub(require('../utils/armToolchain'), 'validateArmToolchainPath').resolves(mockValidationResult);
            const configs = [
                { name: 'Debug Config 1', device: 'STM32F103C8' },
                { name: 'Debug Config 2', device: 'STM32F407VG' }
            ];
            const launchJson = await (0, armToolchain_1.generateLaunchJsonContent)(mockGccPath, configs);
            assert.strictEqual(launchJson.configurations.length, 2);
            assert.strictEqual(launchJson.configurations[0].name, 'Debug Config 1');
            assert.strictEqual(launchJson.configurations[1].name, 'Debug Config 2');
        });
        it('should handle partial configuration failures gracefully', async () => {
            // Mock first config to succeed, second to fail
            let callCount = 0;
            sandbox.stub(require('../utils/armToolchain'), 'validateArmToolchainPath').callsFake(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(mockValidationResult);
                }
                else {
                    return Promise.resolve({
                        isValid: false,
                        toolchainInfo: null,
                        executables: {},
                        missingTools: [],
                        errors: ['Validation failed']
                    });
                }
            });
            const configs = [
                { name: 'Valid Config' },
                { name: 'Invalid Config' }
            ];
            const launchJson = await (0, armToolchain_1.generateLaunchJsonContent)(mockGccPath, configs);
            // Should have only the valid configuration
            assert.strictEqual(launchJson.configurations.length, 1);
            assert.strictEqual(launchJson.configurations[0].name, 'Valid Config');
        });
        it('should throw error when no valid configurations can be generated', async () => {
            const invalidResult = {
                isValid: false,
                toolchainInfo: null,
                executables: {},
                missingTools: ['arm-none-eabi-gcc'],
                errors: ['All tools missing']
            };
            sandbox.stub(require('../utils/armToolchain'), 'validateArmToolchainPath').resolves(invalidResult);
            try {
                await (0, armToolchain_1.generateLaunchJsonContent)('/invalid/path');
                assert.fail('Should have thrown an error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.ok(error.message.includes('No valid debug configurations'));
            }
        });
    });
    describe('Integration Tests', () => {
        it('should handle complete workflow from detection to configuration generation', async () => {
            // Mock successful detection
            sandbox.stub(vscode.workspace, 'getConfiguration').withArgs('cortex-debug').returns({
                get: sandbox.stub().withArgs('armToolchainPath').returns(mockToolchainPath)
            });
            // Mock file system
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec for version detection
            sandbox.stub(cp, 'exec').callsFake((cmd, options, callback) => {
                callback(null, mockVersionOutput, '');
            });
            // Test complete workflow
            const toolchainPath = await (0, armToolchain_1.findArmToolchainPath)();
            assert.ok(toolchainPath);
            const info = await (0, armToolchain_1.getArmToolchainInfo)(toolchainPath);
            assert.strictEqual(info.version, '10.3.1');
            const validation = await (0, armToolchain_1.validateArmToolchainPath)(toolchainPath);
            assert.strictEqual(validation.isValid, true);
            const debugConfig = await (0, armToolchain_1.generateCortexDebugConfig)(toolchainPath);
            assert.ok(debugConfig);
            const launchJson = await (0, armToolchain_1.generateLaunchJsonContent)(toolchainPath);
            assert.ok(launchJson.configurations.length > 0);
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle malformed version output gracefully', async () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec to return malformed output
            sandbox.stub(cp, 'exec').callsFake((cmd, options, callback) => {
                callback(null, 'Invalid version output without proper format', '');
            });
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockGccPath);
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.vendor, 'Unknown');
            assert.ok(typeof result.detectedAt === 'number');
        });
        it('should handle file system permission errors', async () => {
            // Mock file existence but stat failure
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').throws(new Error('Permission denied'));
            const result = await (0, armToolchain_1.validateArmToolchainPath)(mockGccPath);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(err => err.includes('Permission denied')));
        });
        it('should handle extremely long paths correctly', async () => {
            const longPath = '/'.repeat(1000) + 'arm-none-eabi-gcc';
            const result = await (0, armToolchain_1.validateArmToolchainPath)(longPath);
            // Should handle gracefully without crashing
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.length > 0);
        });
    });
});
//# sourceMappingURL=arm-toolchain-detection.test.js.map