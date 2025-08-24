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
 * 配置管理功能测试
 * 测试全局Settings写入、路径验证和配置存储功能
 *
 * @fileoverview 配置管理测试套件
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const configurationHandler_1 = require("../ui/configurationHandler");
const types_1 = require("../ui/types");
describe('Configuration Management Tests', () => {
    let sandbox;
    let mockContext;
    let configHandler;
    let mockLocalizationManager;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock ExtensionContext
        mockContext = {
            subscriptions: [],
            workspaceState: { get: sandbox.stub(), update: sandbox.stub(), keys: sandbox.stub() },
            globalState: {
                get: sandbox.stub(),
                update: sandbox.stub(),
                keys: sandbox.stub(),
                setKeysForSync: sandbox.stub()
            },
            secrets: {
                get: sandbox.stub(),
                store: sandbox.stub(),
                delete: sandbox.stub(),
                onDidChange: sandbox.stub()
            },
            extensionUri: vscode.Uri.file('/test'),
            extensionPath: '/test',
            environmentVariableCollection: {},
            storagePath: '/test/storage',
            globalStoragePath: '/test/global',
            logPath: '/test/logs',
            extensionMode: vscode.ExtensionMode.Test,
            extension: {},
            logUri: vscode.Uri.file('/test/logs'),
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global')
        };
        // Mock LocalizationManager
        mockLocalizationManager = {
            getString: sandbox.stub().returns('Test String'),
            getCurrentLanguage: sandbox.stub().returns('en'),
            switchLanguage: sandbox.stub(),
            getAllStrings: sandbox.stub().returns({}),
            formatString: sandbox.stub().returns('Formatted String')
        };
        configHandler = new configurationHandler_1.ConfigurationHandler(mockLocalizationManager);
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('Global Settings Writing', () => {
        it('should write OpenOCD path to global settings', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin/openocd'
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.FAILED,
                    path: null
                }
            };
            const updateStub = sandbox.stub().resolves();
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should save OpenOCD path to global settings
            assert.ok(updateStub.calledWith('openocdPath', '/usr/local/bin/openocd', vscode.ConfigurationTarget.Global));
        });
        it('should write ARM toolchain path to global settings', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.FAILED,
                    path: null
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/bin/arm-none-eabi-gcc'
                }
            };
            const updateStub = sandbox.stub().resolves();
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should save ARM toolchain path to cortex-debug settings
            assert.ok(updateStub.calledWith('armToolchainPath', '/usr/bin/arm-none-eabi-gcc', vscode.ConfigurationTarget.Global));
        });
        it('should write both paths when both tools are found', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/opt/openocd/bin/openocd'
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/opt/gcc-arm/bin/arm-none-eabi-gcc'
                }
            };
            const updateStub = sandbox.stub().resolves();
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should save both paths
            assert.ok(updateStub.calledWith('openocdPath', '/opt/openocd/bin/openocd', vscode.ConfigurationTarget.Global));
            assert.ok(updateStub.calledWith('armToolchainPath', '/opt/gcc-arm/bin/arm-none-eabi-gcc', vscode.ConfigurationTarget.Global));
        });
        it('should not write paths for tools not found', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.FAILED,
                    path: null
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.FAILED,
                    path: null
                }
            };
            const updateStub = sandbox.stub().resolves();
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should not call update for any paths
            assert.ok(updateStub.notCalled);
        });
    });
    describe('Path Format Validation and Normalization', () => {
        it('should normalize Windows paths to use forward slashes', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: 'C:\\Program Files\\OpenOCD\\bin\\openocd.exe'
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: 'C:\\Program Files\\ARM\\bin\\arm-none-eabi-gcc.exe'
                }
            };
            let savedOpenOCDPath = '';
            let savedArmPath = '';
            const updateStub = sandbox.stub().callsFake((key, value) => {
                if (key === 'openocdPath') {
                    savedOpenOCDPath = value;
                }
                if (key === 'armToolchainPath') {
                    savedArmPath = value;
                }
                return Promise.resolve();
            });
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Check that paths use forward slashes
            assert.ok(savedOpenOCDPath.includes('/'), 'OpenOCD path should use forward slashes');
            assert.ok(!savedOpenOCDPath.includes('\\'), 'OpenOCD path should not contain backslashes');
            assert.strictEqual(savedOpenOCDPath, 'C:/Program Files/OpenOCD/bin/openocd.exe');
            assert.ok(savedArmPath.includes('/'), 'ARM path should use forward slashes');
            assert.ok(!savedArmPath.includes('\\'), 'ARM path should not contain backslashes');
            assert.strictEqual(savedArmPath, 'C:/Program Files/ARM/bin/arm-none-eabi-gcc.exe');
        });
        it('should handle Unix paths without modification', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin/openocd'
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/bin/arm-none-eabi-gcc'
                }
            };
            let savedOpenOCDPath = '';
            let savedArmPath = '';
            const updateStub = sandbox.stub().callsFake((key, value) => {
                if (key === 'openocdPath') {
                    savedOpenOCDPath = value;
                }
                if (key === 'armToolchainPath') {
                    savedArmPath = value;
                }
                return Promise.resolve();
            });
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Unix paths should remain unchanged
            assert.strictEqual(savedOpenOCDPath, '/usr/local/bin/openocd');
            assert.strictEqual(savedArmPath, '/usr/bin/arm-none-eabi-gcc');
        });
        it('should handle empty or null paths gracefully', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: ''
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: null
                }
            };
            const updateStub = sandbox.stub().resolves();
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should not attempt to save empty or null paths
            assert.ok(updateStub.notCalled);
        });
        it('should validate path format before saving', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: 'invalid\\path\\with\\mixed/slashes'
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: types_1.DetectionStatus.FAILED,
                    path: null
                }
            };
            let savedPath = '';
            const updateStub = sandbox.stub().callsFake((key, value) => {
                savedPath = value;
                return Promise.resolve();
            });
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should normalize mixed slashes to forward slashes
            assert.strictEqual(savedPath, 'invalid/path/with/mixed/slashes');
        });
    });
    describe('Configuration Error Handling', () => {
        it('should handle configuration access errors', async () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: types_1.DetectionStatus.SUCCESS, path: '/test' },
                armToolchain: { name: 'ARM GCC', status: types_1.DetectionStatus.SUCCESS, path: '/test' }
            };
            // Mock getConfiguration to throw error
            sandbox.stub(vscode.workspace, 'getConfiguration').throws(new Error('Configuration access failed'));
            try {
                await configHandler.saveToolchainConfiguration(mockResults);
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, 'Configuration access failed');
            }
        });
        it('should handle configuration update failures', async () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test/openocd' },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null }
            };
            // Mock update to fail
            const updateStub = sandbox.stub().rejects(new Error('Update failed'));
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            try {
                await configHandler.saveToolchainConfiguration(mockResults);
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, 'Update failed');
            }
        });
        it('should handle partial configuration save failures', async () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test/openocd' },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test/arm-gcc' }
            };
            // Mock first update to succeed, second to fail
            const updateStub = sandbox.stub()
                .onFirstCall().resolves()
                .onSecondCall().rejects(new Error('Second update failed'));
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            try {
                await configHandler.saveToolchainConfiguration(mockResults);
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, 'Second update failed');
            }
        });
        it('should validate configuration scope parameter', async () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test' },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null }
            };
            const updateStub = sandbox.stub().resolves();
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Verify that Global scope is used
            assert.ok(updateStub.calledWith(sinon.match.string, sinon.match.string, vscode.ConfigurationTarget.Global));
        });
    });
    describe('Configuration Override Behavior', () => {
        it('should overwrite existing configuration values', async () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/new/openocd/path' },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null }
            };
            const updateStub = sandbox.stub().resolves();
            // Mock existing configuration
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns('/old/openocd/path'),
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should overwrite with new path
            assert.ok(updateStub.calledWith('openocdPath', '/new/openocd/path', vscode.ConfigurationTarget.Global));
        });
        it('should preserve unrelated configuration values', async () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test/openocd' },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null }
            };
            const updateStub = sandbox.stub().resolves();
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: updateStub
            });
            await configHandler.saveToolchainConfiguration(mockResults);
            // Should only update the specific keys we care about
            const updateCalls = updateStub.getCalls();
            assert.strictEqual(updateCalls.length, 1);
            assert.strictEqual(updateCalls[0].args[0], 'openocdPath');
        });
    });
    describe('Failed Toolchain Identification', () => {
        it('should correctly identify OpenOCD as failed', () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'not_found', path: null },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test' }
            };
            const failed = configHandler.getFailedToolchains(mockResults);
            assert.deepStrictEqual(failed, ['openocd']);
        });
        it('should correctly identify ARM toolchain as failed', () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test' },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null }
            };
            const failed = configHandler.getFailedToolchains(mockResults);
            assert.deepStrictEqual(failed, ['armToolchain']);
        });
        it('should identify both toolchains as failed', () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'not_found', path: null },
                armToolchain: { name: 'ARM GCC', status: 'error', path: null }
            };
            const failed = configHandler.getFailedToolchains(mockResults);
            assert.deepStrictEqual(failed.sort(), ['armToolchain', 'openocd']);
        });
        it('should return empty array when all toolchains found', () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test/openocd' },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test/gcc' }
            };
            const failed = configHandler.getFailedToolchains(mockResults);
            assert.deepStrictEqual(failed, []);
        });
    });
    describe('Toolchain Path Updates', () => {
        it('should update OpenOCD path and status', () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'not_found', path: null },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test' }
            };
            const newPath = '/custom/openocd/bin/openocd';
            configHandler.updateToolchainPath(mockResults, 'openocd', newPath);
            assert.strictEqual(mockResults.openocd.path, newPath);
            assert.strictEqual(mockResults.openocd.status, 'found');
        });
        it('should update ARM toolchain path and status', () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test' },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null }
            };
            const newPath = '/custom/arm/bin/arm-none-eabi-gcc';
            configHandler.updateToolchainPath(mockResults, 'armToolchain', newPath);
            assert.strictEqual(mockResults.armToolchain.path, newPath);
            assert.strictEqual(mockResults.armToolchain.status, 'found');
        });
        it('should handle unknown toolchain gracefully', () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: types_1.DetectionStatus.SUCCESS, path: '/test' },
                armToolchain: { name: 'ARM GCC', status: types_1.DetectionStatus.SUCCESS, path: '/test' }
            };
            // Should not throw when updating unknown toolchain
            assert.doesNotThrow(() => {
                configHandler.updateToolchainPath(mockResults, 'unknown', '/test/path');
            });
        });
    });
});
//# sourceMappingURL=configuration-management.test.js.map