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
 * ARM工具链基础功能测试
 * 测试基础接口和类型定义
 *
 * @fileoverview ARM工具链基础测试套件
 * @author 左岚
 * @since 0.2.3
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const fs = __importStar(require("fs"));
const cp = __importStar(require("child_process"));
const vscode = __importStar(require("vscode"));
const armToolchain_1 = require("../utils/armToolchain");
describe('ARM Toolchain Basic Tests', () => {
    let sandbox;
    const mockToolchainPath = '/test/arm-toolchain';
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
    describe('Type Definitions', () => {
        it('should have correct ToolchainInfo interface', () => {
            const info = {
                version: '10.3.1',
                gccPath: '/test/gcc',
                rootPath: '/test',
                target: 'arm-none-eabi',
                vendor: 'GNU',
                detectedAt: Date.now()
            };
            assert.strictEqual(info.version, '10.3.1');
            assert.strictEqual(info.target, 'arm-none-eabi');
            assert.ok(typeof info.detectedAt === 'number');
        });
        it('should have correct ToolchainExecutables interface', () => {
            const executables = {
                gcc: '/test/gcc',
                gpp: '/test/g++',
                as: '/test/as',
                ld: '/test/ld',
                ar: '/test/ar',
                objcopy: '/test/objcopy',
                objdump: '/test/objdump',
                size: '/test/size',
                nm: '/test/nm',
                gdb: '/test/gdb'
            };
            assert.ok(executables.gcc.includes('gcc'));
            assert.ok(executables.gdb.includes('gdb'));
            assert.strictEqual(Object.keys(executables).length, 10);
        });
        it('should have correct CortexDebugConfig interface', () => {
            const config = {
                name: 'Test Config',
                device: 'STM32F103C8',
                configFiles: ['interface/stlink.cfg'],
                svdFile: '/test.svd',
                executable: '/test.elf',
                debuggerArgs: ['--batch'],
                runToEntryPoint: 'main',
                cwd: '/workspace'
            };
            assert.strictEqual(config.name, 'Test Config');
            assert.strictEqual(config.device, 'STM32F103C8');
            assert.ok(Array.isArray(config.configFiles));
            assert.ok(Array.isArray(config.debuggerArgs));
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
        it('should handle Unix paths correctly', () => {
            const originalPlatform = process.platform;
            Object.defineProperty(process, 'platform', { value: 'linux' });
            const rootPath = '/opt/arm-toolchain';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(rootPath);
            // Unix executables should not have .exe extension
            assert.ok(!executables.gcc.endsWith('.exe'));
            assert.ok(!executables.gdb.endsWith('.exe'));
            assert.ok(executables.gcc.includes('arm-none-eabi-gcc'));
            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });
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
        it('should handle PATH environment search gracefully', async () => {
            // Mock cortex-debug configuration to return null
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns(null)
            });
            // Mock exec to simulate command not found
            sandbox.stub(cp, 'exec').callsArgWith(1, new Error('Command not found'), '', '');
            const result = await (0, armToolchain_1.findArmToolchainPath)();
            // Should handle gracefully and return null
            assert.strictEqual(result, null);
        });
    });
    describe('getArmToolchainInfo', () => {
        it('should return default info for invalid toolchain path', async () => {
            const result = await (0, armToolchain_1.getArmToolchainInfo)('');
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.target, 'arm-none-eabi');
            assert.ok(typeof result.detectedAt === 'number');
        });
        it('should handle file system errors gracefully', async () => {
            // Mock file existence check to fail
            sandbox.stub(fs, 'existsSync').returns(false);
            const result = await (0, armToolchain_1.getArmToolchainInfo)('/nonexistent/gcc');
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.target, 'arm-none-eabi');
        });
        it('should handle exec timeout gracefully', async () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec to timeout
            sandbox.stub(cp, 'exec').callsArgWith(2, new Error('Timeout'), '', '');
            const result = await (0, armToolchain_1.getArmToolchainInfo)('/test/gcc');
            assert.strictEqual(result.version, 'Unknown');
        });
        it('should parse version output correctly when successful', async () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec to return version output
            sandbox.stub(cp, 'exec').callsArgWith(2, null, mockVersionOutput, '');
            const result = await (0, armToolchain_1.getArmToolchainInfo)('/test/arm-toolchain/bin/arm-none-eabi-gcc');
            assert.strictEqual(result.version, '10.3.1');
            assert.strictEqual(result.vendor, 'GNU Arm Embedded Toolchain');
            assert.ok(result.gccPath.includes('arm-none-eabi-gcc'));
            assert.ok(result.rootPath.length > 0);
            assert.ok(typeof result.detectedAt === 'number');
        });
        it('should handle malformed version output gracefully', async () => {
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true });
            // Mock exec to return malformed output
            sandbox.stub(cp, 'exec').callsArgWith(2, null, 'Invalid version output without proper format', '');
            const result = await (0, armToolchain_1.getArmToolchainInfo)('/test/gcc');
            assert.strictEqual(result.version, 'Unknown');
            assert.strictEqual(result.vendor, 'Unknown');
            assert.ok(typeof result.detectedAt === 'number');
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle empty paths gracefully', async () => {
            const result = await (0, armToolchain_1.getArmToolchainInfo)('');
            assert.strictEqual(result.version, 'Unknown');
            const executables = (0, armToolchain_1.getArmToolchainExecutables)('');
            assert.ok(executables.gcc.includes('arm-none-eabi-gcc'));
        });
        it('should handle extremely long paths', async () => {
            const longPath = 'x'.repeat(1000);
            const result = await (0, armToolchain_1.getArmToolchainInfo)(longPath);
            assert.strictEqual(result.version, 'Unknown');
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(longPath);
            assert.ok(executables.gcc.includes('arm-none-eabi-gcc'));
        });
        it('should handle special characters in paths', async () => {
            const specialPath = '/path with spaces & symbols!/toolchain';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(specialPath);
            assert.ok(executables.gcc.includes(specialPath));
            assert.ok(executables.gcc.includes('arm-none-eabi-gcc'));
        });
        it('should handle null and undefined inputs safely', async () => {
            const result1 = await (0, armToolchain_1.getArmToolchainInfo)(null);
            assert.strictEqual(result1.version, 'Unknown');
            const result2 = await (0, armToolchain_1.getArmToolchainInfo)(undefined);
            assert.strictEqual(result2.version, 'Unknown');
        });
    });
    describe('Cross-Platform Compatibility', () => {
        it('should handle Windows path separators', () => {
            const windowsPath = 'C:\\Program Files\\ARM\\bin';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(windowsPath);
            assert.ok(executables.gcc.includes(windowsPath));
            assert.ok(executables.gcc.includes('arm-none-eabi-gcc'));
        });
        it('should handle Unix path separators', () => {
            const unixPath = '/opt/arm-toolchain/bin';
            const executables = (0, armToolchain_1.getArmToolchainExecutables)(unixPath);
            assert.ok(executables.gcc.includes(unixPath));
            assert.ok(executables.gcc.includes('arm-none-eabi-gcc'));
        });
        it('should adapt executable extensions based on platform', () => {
            const originalPlatform = process.platform;
            // Test Windows
            Object.defineProperty(process, 'platform', { value: 'win32' });
            let executables = (0, armToolchain_1.getArmToolchainExecutables)('/test');
            assert.ok(executables.gcc.endsWith('.exe'));
            // Test Linux
            Object.defineProperty(process, 'platform', { value: 'linux' });
            executables = (0, armToolchain_1.getArmToolchainExecutables)('/test');
            assert.ok(!executables.gcc.endsWith('.exe'));
            // Test macOS
            Object.defineProperty(process, 'platform', { value: 'darwin' });
            executables = (0, armToolchain_1.getArmToolchainExecutables)('/test');
            assert.ok(!executables.gcc.endsWith('.exe'));
            Object.defineProperty(process, 'platform', { value: originalPlatform });
        });
    });
});
//# sourceMappingURL=arm-toolchain-basic.test.js.map