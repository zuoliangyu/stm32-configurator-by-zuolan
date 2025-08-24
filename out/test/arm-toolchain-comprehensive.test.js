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
 * 综合ARM工具链测试套件
 * 全面测试ARM工具链检测、验证、配置和集成功能
 *
 * @fileoverview 综合ARM工具链测试
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const armToolchain_1 = require("../utils/armToolchain");
const pathUtils_1 = require("../utils/pathUtils");
const toolchainPaths_1 = require("../utils/toolchainPaths");
describe('ARM Toolchain Comprehensive Tests', () => {
    let sandbox;
    let mockContext;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock VS Code context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: sandbox.stub(),
                update: sandbox.stub().resolves(),
                keys: sandbox.stub().returns([])
            },
            globalState: {
                get: sandbox.stub(),
                update: sandbox.stub().resolves(),
                keys: sandbox.stub().returns([]),
                setKeysForSync: sandbox.stub()
            },
            extensionUri: vscode.Uri.file('/test'),
            extensionPath: '/test',
            extensionMode: vscode.ExtensionMode.Test
        };
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('ARM Toolchain Path Detection', () => {
        it('should detect ARM toolchain from cortex-debug configuration', async () => {
            const mockPath = process.platform === 'win32'
                ? 'C:\\arm-toolchain\\bin\\arm-none-eabi-gcc.exe'
                : '/usr/local/bin/arm-none-eabi-gcc';
            const configStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns(mockPath)
            });
            sandbox.stub(fs, 'existsSync').returns(true);
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            assert.ok(configStub.called);
            assert.strictEqual(result, (0, pathUtils_1.normalizePath)(mockPath));
        });
        it('should detect ARM toolchain from PATH environment', async () => {
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns('')
            });
            const mockExec = sandbox.stub().callsArgWith(1, null, process.platform === 'win32'
                ? 'C:\\mingw\\bin\\arm-none-eabi-gcc.exe\r\n'
                : '/usr/bin/arm-none-eabi-gcc\n');
            sandbox.replace(require('child_process'), 'exec', mockExec);
            sandbox.stub(fs, 'existsSync').returns(true);
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            const expectedPath = process.platform === 'win32'
                ? 'C:\\mingw\\bin\\arm-none-eabi-gcc.exe'
                : '/usr/bin/arm-none-eabi-gcc';
            assert.strictEqual(result, (0, pathUtils_1.normalizePath)(expectedPath));
        });
        it('should detect ARM toolchain from common installation paths on Windows', async () => {
            if (process.platform !== 'win32') {
                return; // Skip on non-Windows
            }
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns('')
            });
            const mockExec = sandbox.stub().callsArgWith(1, new Error('not found'));
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const mockPath = 'C:\\Program Files (x86)\\GNU Arm Embedded Toolchain\\10.3-2021.10\\bin\\arm-none-eabi-gcc.exe';
            const existsStub = sandbox.stub(fs, 'existsSync');
            existsStub.returns(false); // Default return false
            existsStub.withArgs((0, pathUtils_1.normalizePath)(mockPath)).returns(true);
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            assert.strictEqual(result, (0, pathUtils_1.normalizePath)(mockPath));
        });
        it('should return null when no ARM toolchain is found', async () => {
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns('')
            });
            const mockExec = sandbox.stub().callsArgWith(1, new Error('not found'));
            sandbox.replace(require('child_process'), 'exec', mockExec);
            sandbox.stub(fs, 'existsSync').returns(false);
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            assert.strictEqual(result, null);
        });
    });
    describe('ARM Toolchain Information Extraction', () => {
        it('should extract toolchain information successfully', async () => {
            const mockPath = '/usr/bin/arm-none-eabi-gcc';
            const mockVersionOutput = 'arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10.3-2021.10) 10.3.1 20210824 (release)\nCopyright (C) 2020 Free Software Foundation, Inc.';
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockExec = sandbox.stub().callsArgWith(2, null, mockVersionOutput);
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockPath);
            assert.strictEqual(result.version, '10.3.1');
            assert.strictEqual(result.gccPath, (0, pathUtils_1.normalizePath)(mockPath));
            assert.strictEqual(result.vendor, 'GNU Arm Embedded Toolchain');
            assert.strictEqual(result.target, 'GNU Arm Embedded Toolchain 10.3-2021.10');
            assert.ok(result.detectedAt);
        });
        it('should handle version detection timeout', async () => {
            const mockPath = '/usr/bin/arm-none-eabi-gcc';
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockExec = sandbox.stub().callsArgWith(2, new Error('timeout'), null);
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockPath);
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.gccPath, (0, pathUtils_1.normalizePath)(mockPath));
            assert.strictEqual(result.target, 'arm-none-eabi');
        });
        it('should handle invalid toolchain path', async () => {
            const mockPath = '/invalid/path';
            sandbox.stub(fs, 'existsSync').returns(false);
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockPath);
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.gccPath, (0, pathUtils_1.normalizePath)(mockPath));
        });
    });
    describe('ARM Toolchain Validation', () => {
        it('should validate complete ARM toolchain installation', async () => {
            const mockRootPath = '/opt/arm-toolchain';
            const mockGccPath = '/opt/arm-toolchain/bin/arm-none-eabi-gcc';
            // Mock all executable files exist
            const existsStub = sandbox.stub(fs, 'existsSync');
            existsStub.returns(true);
            // Mock version info
            const mockVersionOutput = 'arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10.3-2021.10) 10.3.1 20210824 (release)';
            const mockExec = sandbox.stub().callsArgWith(2, null, mockVersionOutput);
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const result = await (0, armToolchain_1.validateArmToolchainPath)(mockGccPath);
            assert.strictEqual(result.isValid, true);
            assert.ok(result.toolchainInfo);
            assert.strictEqual(result.toolchainInfo?.version, '10.3.1');
            assert.strictEqual(result.missingTools.length, 0);
            assert.strictEqual(result.errors.length, 0);
            assert.ok(result.executables.gcc);
            assert.ok(result.executables.gpp);
            assert.ok(result.executables.as);
            assert.ok(result.executables.ld);
            assert.ok(result.executables.ar);
        });
        it('should detect missing essential tools', async () => {
            const mockRootPath = '/opt/arm-toolchain';
            const mockGccPath = '/opt/arm-toolchain/bin/arm-none-eabi-gcc';
            // Mock only gcc exists
            const existsStub = sandbox.stub(fs, 'existsSync');
            existsStub.returns(false);
            existsStub.withArgs((0, pathUtils_1.normalizePath)(mockGccPath)).returns(true);
            const mockVersionOutput = 'arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10.3-2021.10) 10.3.1';
            const mockExec = sandbox.stub().callsArgWith(2, null, mockVersionOutput);
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const result = await (0, armToolchain_1.validateArmToolchainPath)(mockGccPath);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.missingTools.length > 0);
            assert.ok(result.errors.length > 0);
            assert.ok(result.executables.gcc);
        });
        it('should handle invalid root path validation', async () => {
            const result = await (0, armToolchain_1.validateArmToolchainPath)('');
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.includes('Toolchain path is empty'));
        });
        it('should validate toolchain from root directory path', async () => {
            const mockRootPath = '/opt/arm-toolchain';
            const mockGccPath = '/opt/arm-toolchain/bin/arm-none-eabi-gcc';
            const existsStub = sandbox.stub(fs, 'existsSync');
            existsStub.returns(true);
            const mockVersionOutput = 'arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10.3-2021.10) 10.3.1';
            const mockExec = sandbox.stub().callsArgWith(2, null, mockVersionOutput);
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const result = await (0, armToolchain_1.validateArmToolchainPath)(mockRootPath);
            assert.strictEqual(result.isValid, true);
            assert.ok(result.toolchainInfo);
            assert.strictEqual(result.missingTools.length, 0);
        });
    });
    describe('ARM Toolchain Executables Detection', () => {
        it('should build all toolchain executable paths correctly', () => {
            const rootPath = process.platform === 'win32'
                ? 'C:\\arm-toolchain'
                : '/opt/arm-toolchain';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(rootPath);
            const expectedTools = ['gcc', 'gpp', 'as', 'ld', 'ar', 'objcopy', 'objdump', 'size', 'nm', 'gdb'];
            expectedTools.forEach(tool => {
                assert.ok(executables[tool]);
                assert.ok(executables[tool].includes('arm-none-eabi-'));
                assert.ok(executables[tool].includes(tool === 'gpp' ? 'g++' : tool));
            });
        });
        it('should handle Windows path formatting correctly', () => {
            if (process.platform !== 'win32') {
                return; // Skip on non-Windows
            }
            const rootPath = 'C:\\Program Files\\ARM Toolchain';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(rootPath);
            assert.ok(executables.gcc.endsWith('.exe'));
            assert.ok(executables.gcc.includes('bin\\arm-none-eabi-gcc.exe'));
        });
    });
    describe('Cortex Debug Configuration Generation', () => {
        it('should generate valid Cortex Debug configuration', async () => {
            const mockToolchainPath = '/usr/bin/arm-none-eabi-gcc';
            // Mock validation
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockExec = sandbox.stub().callsArgWith(2, null, 'arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10.3-2021.10) 10.3.1');
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const options = {
                name: 'Debug STM32F4',
                device: 'STM32F407VG',
                configFiles: ['interface/stlink.cfg', 'target/stm32f4x.cfg'],
                executable: '${workspaceFolder}/build/firmware.elf',
                svdFile: '${workspaceFolder}/STM32F407.svd'
            };
            const config = await (0, armToolchain_1.generateCortexDebugConfig)(mockToolchainPath, options);
            assert.strictEqual(config.name, 'Debug STM32F4');
            assert.strictEqual(config.type, 'cortex-debug');
            assert.strictEqual(config.request, 'launch');
            assert.strictEqual(config.servertype, 'openocd');
            assert.strictEqual(config.device, 'STM32F407VG');
            assert.ok(config.configFiles);
            assert.ok(config.armToolchainPath);
            assert.ok(config.debuggerPath);
            assert.strictEqual(config.svdFile, '${workspaceFolder}/STM32F407.svd');
        });
        it('should generate launch.json content with multiple configurations', async () => {
            const mockToolchainPath = '/usr/bin/arm-none-eabi-gcc';
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockExec = sandbox.stub().callsArgWith(2, null, 'arm-none-eabi-gcc (GNU Arm Embedded Toolchain 10.3-2021.10) 10.3.1');
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const configs = [
                { name: 'Debug STM32F4', device: 'STM32F407VG' },
                { name: 'Debug STM32L4', device: 'STM32L476RG' }
            ];
            const launchContent = await (0, armToolchain_1.generateLaunchJsonContent)(mockToolchainPath, configs);
            assert.strictEqual(launchContent.version, '0.2.0');
            assert.ok(Array.isArray(launchContent.configurations));
            assert.strictEqual(launchContent.configurations.length, 2);
        });
        it('should throw error for invalid toolchain path in config generation', async () => {
            const invalidPath = '/invalid/toolchain/path';
            try {
                await (0, armToolchain_1.generateCortexDebugConfig)(invalidPath);
                assert.fail('Should have thrown error for invalid toolchain path');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.ok(error.message.includes('Invalid ARM toolchain path'));
            }
        });
    });
    describe('Path Utility Functions', () => {
        it('should normalize paths correctly across platforms', () => {
            const testPaths = process.platform === 'win32'
                ? ['C:/Program Files/ARM/bin', 'C:\\Program Files\\ARM\\bin\\', 'C:\\Program Files\\ARM\\bin\\arm-none-eabi-gcc.exe']
                : ['/usr/local/bin/', '/usr/local/bin', '/usr/local/bin/arm-none-eabi-gcc'];
            testPaths.forEach(testPath => {
                const normalized = (0, pathUtils_1.normalizePath)(testPath);
                assert.ok(normalized);
                assert.strictEqual(normalized, path.normalize(testPath));
            });
        });
        it('should expand environment variables in paths', () => {
            if (process.platform === 'win32') {
                const testPath = '%USERPROFILE%\\arm-toolchain\\bin\\arm-none-eabi-gcc.exe';
                const expanded = (0, pathUtils_1.expandPath)(testPath);
                assert.ok(expanded.length > 0);
                assert.ok(expanded[0].includes(process.env.USERPROFILE || ''));
            }
            else {
                const testPath = '~/arm-toolchain/bin/arm-none-eabi-gcc';
                const expanded = (0, pathUtils_1.expandPath)(testPath);
                assert.ok(expanded.length > 0);
                assert.ok(expanded[0].includes(process.env.HOME || ''));
            }
        });
        it('should validate executable paths correctly', () => {
            // Mock file system checks
            const existsStub = sandbox.stub(fs, 'existsSync');
            existsStub.returns(false);
            const validPath = process.platform === 'win32'
                ? 'C:\\arm-toolchain\\bin\\arm-none-eabi-gcc.exe'
                : '/usr/bin/arm-none-eabi-gcc';
            existsStub.withArgs(validPath).returns(true);
            assert.strictEqual((0, pathUtils_1.isValidExecutablePath)(validPath), true);
            assert.strictEqual((0, pathUtils_1.isValidExecutablePath)('/invalid/path'), false);
            assert.strictEqual((0, pathUtils_1.isValidExecutablePath)(''), false);
        });
        it('should build executable paths with correct extensions', () => {
            const binPath = process.platform === 'win32'
                ? 'C:\\arm-toolchain\\bin'
                : '/opt/arm-toolchain/bin';
            const gccPath = (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-gcc');
            const gdbPath = (0, pathUtils_1.buildExecutablePath)(binPath, 'arm-none-eabi-gdb');
            if (process.platform === 'win32') {
                assert.ok(gccPath.endsWith('.exe'));
                assert.ok(gdbPath.endsWith('.exe'));
            }
            assert.ok(gccPath.includes('arm-none-eabi-gcc'));
            assert.ok(gdbPath.includes('arm-none-eabi-gdb'));
        });
    });
    describe('Common Installation Paths', () => {
        it('should have comprehensive Windows installation paths', () => {
            assert.ok(Array.isArray(toolchainPaths_1.COMMON_ARM_TOOLCHAIN_PATHS));
            assert.ok(toolchainPaths_1.COMMON_ARM_TOOLCHAIN_PATHS.length > 0);
            // Check for common installation patterns
            const hasGnuArmEmbedded = toolchainPaths_1.COMMON_ARM_TOOLCHAIN_PATHS.some(p => p.includes('GNU Arm Embedded Toolchain'));
            const hasSTM32CubeIDE = toolchainPaths_1.COMMON_ARM_TOOLCHAIN_PATHS.some(p => p.includes('STM32CubeIDE'));
            const hasXPack = toolchainPaths_1.COMMON_ARM_TOOLCHAIN_PATHS.some(p => p.includes('xPacks'));
            assert.ok(hasGnuArmEmbedded, 'Should include GNU Arm Embedded paths');
            assert.ok(hasSTM32CubeIDE, 'Should include STM32CubeIDE paths');
            assert.ok(hasXPack, 'Should include xPack paths');
        });
        it('should contain valid path templates', () => {
            toolchainPaths_1.COMMON_ARM_TOOLCHAIN_PATHS.forEach(pathTemplate => {
                assert.ok(typeof pathTemplate === 'string');
                assert.ok(pathTemplate.length > 0);
                assert.ok(pathTemplate.includes('arm-none-eabi-gcc'));
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle file system permission errors gracefully', async () => {
            const mockPath = '/restricted/path/arm-none-eabi-gcc';
            // Mock permission error
            const existsStub = sandbox.stub(fs, 'existsSync');
            existsStub.throws(new Error('EACCES: permission denied'));
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            // Should not throw and return null
            assert.strictEqual(result, null);
        });
        it('should handle corrupted version output', async () => {
            const mockPath = '/usr/bin/arm-none-eabi-gcc';
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockExec = sandbox.stub().callsArgWith(2, null, 'corrupted output without version info');
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockPath);
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.vendor, 'Unknown');
        });
        it('should handle network timeouts during detection', async () => {
            const mockPath = '/usr/bin/arm-none-eabi-gcc';
            sandbox.stub(fs, 'existsSync').returns(true);
            const mockExec = sandbox.stub().callsArgWith(2, { code: 'ETIMEDOUT' }, null);
            sandbox.replace(require('child_process'), 'exec', mockExec);
            const result = await (0, armToolchain_1.getArmToolchainInfo)(mockPath);
            assert.strictEqual(result.version, 'Unknown');
        });
    });
});
//# sourceMappingURL=arm-toolchain-comprehensive.test.js.map