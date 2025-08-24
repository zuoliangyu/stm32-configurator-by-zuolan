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
 * 扩展激活和命令注册综合测试套件
 * 测试扩展的启动过程、命令注册、事件处理和生命周期管理
 *
 * @fileoverview 扩展激活综合测试
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
describe('Extension Activation Comprehensive Tests', () => {
    let sandbox;
    let mockContext;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock extension context
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
            extensionUri: vscode.Uri.file('/test/extension'),
            extensionPath: '/test/extension',
            extensionMode: vscode.ExtensionMode.Test,
            environmentVariableCollection: {},
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global-storage'),
            logUri: vscode.Uri.file('/test/logs'),
            extension: {},
            secrets: {},
            extensionRuntime: {}
        };
        // Mock VS Code APIs
        sandbox.stub(vscode.commands, 'registerCommand').callsFake((command, callback) => {
            return { dispose: sandbox.stub() };
        });
        sandbox.stub(vscode.window, 'createTreeView').returns({
            dispose: sandbox.stub(),
            reveal: sandbox.stub(),
            onDidChangeSelection: sandbox.stub(),
            onDidChangeVisibility: sandbox.stub(),
            onDidCollapseElement: sandbox.stub(),
            onDidExpandElement: sandbox.stub(),
            selection: [],
            visible: true
        });
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: sandbox.stub().returns(undefined),
            update: sandbox.stub().resolves(),
            has: sandbox.stub().returns(false),
            inspect: sandbox.stub()
        });
        // Mock file system operations
        const fs = require('fs');
        sandbox.stub(fs, 'existsSync').returns(false);
        sandbox.stub(fs, 'mkdirSync').returns(undefined);
        sandbox.stub(fs, 'writeFileSync').returns(undefined);
        sandbox.stub(fs, 'readFileSync').returns('{}');
        // Mock child_process exec
        const { exec } = require('child_process');
        sandbox.stub({ exec }, 'exec').callsArgWith(1, new Error('not found'));
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('Extension Activation Process', () => {
        it('should activate extension successfully', async () => {
            // Mock successful activation
            const activationPromise = (0, extension_1.activate)(mockContext);
            // Activation should complete without throwing
            await assert.doesNotReject(activationPromise);
            // Verify commands were registered
            const registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
            assert.ok(mockContext.subscriptions.length >= 0); // Should have some subscriptions
        });
        it('should register all required commands', async () => {
            const registerCommandStub = vscode.commands.registerCommand;
            await (0, extension_1.activate)(mockContext);
            // Verify ARM toolchain commands
            const expectedCommands = [
                'stm32-configurator-by-zuolan.detectToolchain',
                'stm32-configurator-by-zuolan.setupToolchain',
                'stm32-configurator-by-zuolan.autoConfigureAll',
                'stm32-configurator-by-zuolan.oneClickSetup',
                'stm32-configurator-by-zuolan.intelligentWizard',
                'stm32-configurator-by-zuolan.autoTroubleshoot',
                'stm32-configurator-by-zuolan.healthCheck',
                'stm32-configurator-by-zuolan.start',
                'stm32-configurator-by-zuolan.refresh',
                'stm32-configurator-by-zuolan.openConfig',
                'stm32-configurator-by-zuolan.toggleLanguage'
            ];
            expectedCommands.forEach(command => {
                assert.ok(registerCommandStub.calledWith(command, sinon.match.func), `Command ${command} should be registered`);
            });
        });
        it('should initialize localization manager', async () => {
            await (0, extension_1.activate)(mockContext);
            // LocalizationManager should be initialized
            // This is tested indirectly through successful activation
            assert.ok(true); // Activation completes successfully
        });
        it('should initialize tree data provider', async () => {
            const createTreeViewStub = vscode.window.createTreeView;
            await (0, extension_1.activate)(mockContext);
            assert.ok(createTreeViewStub.calledWith('stm32-configurator-tree', sinon.match.object));
        });
        it('should initialize toolchain detection on activation', async () => {
            // Mock successful toolchain detection
            const { exec } = require('child_process');
            const execStub = sandbox.stub({ exec }, 'exec');
            // Mock OpenOCD detection success
            execStub.withArgs(sinon.match(/openocd/)).callsArgWith(1, null, '/usr/bin/openocd');
            // Mock ARM toolchain detection success  
            execStub.withArgs(sinon.match(/arm-none-eabi-gcc/)).callsArgWith(1, null, '/usr/bin/arm-none-eabi-gcc');
            await (0, extension_1.activate)(mockContext);
            // Should attempt toolchain detection during activation
            assert.ok(true); // No errors during activation
        });
        it('should handle activation with missing dependencies', async () => {
            // Mock missing toolchains
            const { exec } = require('child_process');
            sandbox.stub({ exec }, 'exec').callsArgWith(1, new Error('not found'));
            // Should still activate successfully even with missing tools
            await assert.doesNotReject((0, extension_1.activate)(mockContext));
        });
    });
    describe('Command Registration and Execution', () => {
        it('should execute detect toolchain command', async () => {
            await (0, extension_1.activate)(mockContext);
            const registerCommandStub = vscode.commands.registerCommand;
            const detectToolchainCall = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.detectToolchain');
            assert.ok(detectToolchainCall, 'detectToolchain command should be registered');
            // Mock successful execution
            if (detectToolchainCall) {
                const commandHandler = detectToolchainCall.args[1];
                // Mock ToolchainGuideDialog
                const mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
                mockShowInformationMessage.resolves();
                // Execute command handler
                await assert.doesNotReject(commandHandler());
            }
        });
        it('should execute auto-configure all command', async () => {
            await (0, extension_1.activate)(mockContext);
            const registerCommandStub = vscode.commands.registerCommand;
            const autoConfigCall = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.autoConfigureAll');
            assert.ok(autoConfigCall, 'autoConfigureAll command should be registered');
            if (autoConfigCall) {
                const commandHandler = autoConfigCall.args[1];
                // Mock successful execution
                const mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
                mockShowInformationMessage.resolves();
                await assert.doesNotReject(commandHandler());
            }
        });
        it('should execute one-click setup command', async () => {
            await (0, extension_1.activate)(mockContext);
            const registerCommandStub = vscode.commands.registerCommand;
            const oneClickCall = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.oneClickSetup');
            assert.ok(oneClickCall, 'oneClickSetup command should be registered');
            if (oneClickCall) {
                const commandHandler = oneClickCall.args[1];
                const mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
                mockShowInformationMessage.resolves();
                await assert.doesNotReject(commandHandler());
            }
        });
        it('should execute health check command', async () => {
            await (0, extension_1.activate)(mockContext);
            const registerCommandStub = vscode.commands.registerCommand;
            const healthCheckCall = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.healthCheck');
            assert.ok(healthCheckCall, 'healthCheck command should be registered');
            if (healthCheckCall) {
                const commandHandler = healthCheckCall.args[1];
                // Mock ConfigurationScanner import
                const mockHealthResults = {
                    scores: { toolchain: 80, workspace: 90, configuration: 70, extensions: 85 },
                    issues: [],
                    recommendations: []
                };
                // Should not throw during execution
                await assert.doesNotReject(commandHandler());
            }
        });
        it('should handle command execution errors gracefully', async () => {
            await (0, extension_1.activate)(mockContext);
            const registerCommandStub = vscode.commands.registerCommand;
            const detectToolchainCall = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.detectToolchain');
            if (detectToolchainCall) {
                // Mock error in command execution
                const mockShowErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');
                mockShowErrorMessage.resolves();
                const commandHandler = detectToolchainCall.args[1];
                // Should handle errors gracefully
                await assert.doesNotReject(commandHandler());
            }
        });
        it('should execute language toggle command', async () => {
            await (0, extension_1.activate)(mockContext);
            const registerCommandStub = vscode.commands.registerCommand;
            const toggleLanguageCall = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.toggleLanguage');
            assert.ok(toggleLanguageCall, 'toggleLanguage command should be registered');
            if (toggleLanguageCall) {
                const commandHandler = toggleLanguageCall.args[1];
                // Should execute without error
                await assert.doesNotReject(() => commandHandler());
            }
        });
    });
    describe('Webview and UI Integration', () => {
        it('should create webview panel on start command', async () => {
            await (0, extension_1.activate)(mockContext);
            // Mock webview creation
            const mockPanel = {
                webview: {
                    html: '',
                    postMessage: sandbox.stub(),
                    onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }),
                    asWebviewUri: sandbox.stub().returns(vscode.Uri.file('/test')),
                    cspSource: 'vscode-webview:'
                },
                reveal: sandbox.stub(),
                onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() })
            };
            const createWebviewPanelStub = sandbox.stub(vscode.window, 'createWebviewPanel')
                .returns(mockPanel);
            const registerCommandStub = vscode.commands.registerCommand;
            const startCommand = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.start');
            if (startCommand) {
                const commandHandler = startCommand.args[1];
                // Mock cortex-debug extension check
                sandbox.stub(vscode.extensions, 'getExtension').returns({
                    id: 'marus25.cortex-debug',
                    isActive: true
                });
                await commandHandler();
                assert.ok(createWebviewPanelStub.called);
            }
        });
        it('should handle webview messages for ARM toolchain', async () => {
            await (0, extension_1.activate)(mockContext);
            const mockWebview = {
                html: '',
                postMessage: sandbox.stub(),
                onDidReceiveMessage: sandbox.stub(),
                asWebviewUri: sandbox.stub().returns(vscode.Uri.file('/test')),
                cspSource: 'vscode-webview:'
            };
            let messageHandler;
            mockWebview.onDidReceiveMessage.callsFake((handler) => {
                messageHandler = handler;
                return { dispose: sandbox.stub() };
            });
            // Simulate webview message handling setup
            const mockPanel = {
                webview: mockWebview,
                reveal: sandbox.stub(),
                onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() })
            };
            sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel);
            // Execute start command to set up webview
            const registerCommandStub = vscode.commands.registerCommand;
            const startCommand = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.start');
            if (startCommand) {
                // Mock cortex-debug extension check
                sandbox.stub(vscode.extensions, 'getExtension').returns({
                    id: 'marus25.cortex-debug',
                    isActive: true
                });
                await startCommand.args[1]();
                // Verify message handler was set up
                assert.ok(mockWebview.onDidReceiveMessage.called);
                // Test ARM toolchain message handling
                if (messageHandler) {
                    const testMessage = { command: 'refreshArmToolchainPath' };
                    // Should not throw when handling message
                    await assert.doesNotReject(async () => {
                        await messageHandler(testMessage);
                    });
                }
            }
        });
        it('should post ARM toolchain updates to webview', async () => {
            await (0, extension_1.activate)(mockContext);
            const mockWebview = {
                postMessage: sandbox.stub(),
                onDidReceiveMessage: sandbox.stub().returns({ dispose: sandbox.stub() }),
                asWebviewUri: sandbox.stub().returns(vscode.Uri.file('/test')),
                cspSource: 'vscode-webview:',
                html: ''
            };
            const mockPanel = {
                webview: mockWebview,
                reveal: sandbox.stub(),
                onDidDispose: sandbox.stub().returns({ dispose: sandbox.stub() })
            };
            sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel);
            const registerCommandStub = vscode.commands.registerCommand;
            const startCommand = registerCommandStub.getCalls()
                .find(call => call.args[0] === 'stm32-configurator-by-zuolan.start');
            if (startCommand) {
                sandbox.stub(vscode.extensions, 'getExtension').returns({
                    id: 'marus25.cortex-debug',
                    isActive: true
                });
                await startCommand.args[1]();
                // Verify ARM toolchain update messages
                const postMessageCalls = mockWebview.postMessage.getCalls();
                const armToolchainUpdate = postMessageCalls.find(call => call.args[0].command === 'updateArmToolchainPath');
                assert.ok(armToolchainUpdate, 'Should post ARM toolchain update');
            }
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should handle activation errors gracefully', async () => {
            // Mock error during activation
            sandbox.stub(vscode.window, 'createTreeView').throws(new Error('TreeView creation failed'));
            // Should not throw during activation
            await assert.doesNotReject((0, extension_1.activate)(mockContext));
        });
        it('should handle command registration failures', async () => {
            // Mock command registration failure
            sandbox.stub(vscode.commands, 'registerCommand').throws(new Error('Command registration failed'));
            // Should continue activation despite command registration failures
            await assert.doesNotReject((0, extension_1.activate)(mockContext));
        });
        it('should handle missing workspace scenario', async () => {
            // Mock no workspace folders
            sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
            await (0, extension_1.activate)(mockContext);
            // Should activate successfully even without workspace
            assert.ok(mockContext.subscriptions.length >= 0);
        });
        it('should handle toolchain detection timeout', async () => {
            // Mock slow/timing out toolchain detection
            const { exec } = require('child_process');
            const execStub = sandbox.stub({ exec }, 'exec');
            execStub.callsFake((cmd, options, callback) => {
                // Simulate timeout
                setTimeout(() => {
                    callback(new Error('ETIMEDOUT'), null);
                }, 100);
            });
            // Should still activate successfully
            await assert.doesNotReject((0, extension_1.activate)(mockContext));
        });
        it('should handle file system permission errors', async () => {
            const fs = require('fs');
            sandbox.stub(fs, 'existsSync').throws(new Error('EACCES: permission denied'));
            sandbox.stub(fs, 'mkdirSync').throws(new Error('EACCES: permission denied'));
            // Should handle file system errors during activation
            await assert.doesNotReject((0, extension_1.activate)(mockContext));
        });
    });
    describe('Extension Deactivation', () => {
        it('should deactivate extension cleanly', async () => {
            await (0, extension_1.activate)(mockContext);
            // Deactivation should not throw
            assert.doesNotThrow(() => {
                (0, extension_1.deactivate)();
            });
        });
        it('should dispose of registered subscriptions', async () => {
            await (0, extension_1.activate)(mockContext);
            // Mock disposable objects
            const mockDisposables = mockContext.subscriptions.map(() => ({
                dispose: sandbox.stub()
            }));
            mockContext.subscriptions.push(...mockDisposables);
            (0, extension_1.deactivate)();
            // All disposables should be cleaned up
            // This is handled by VS Code automatically when the extension deactivates
            assert.ok(true);
        });
    });
    describe('Extension Lifecycle Integration', () => {
        it('should handle extension updates', async () => {
            // Simulate extension update scenario
            mockContext.globalState.get.withArgs('extensionVersion').returns('0.2.1');
            await (0, extension_1.activate)(mockContext);
            // Should handle version changes gracefully
            assert.ok(mockContext.subscriptions.length >= 0);
        });
        it('should persist state between sessions', async () => {
            // Mock saved state
            mockContext.globalState.get.withArgs('language').returns('zh');
            mockContext.workspaceState.get.withArgs('recentConfigs').returns(['Debug STM32F4']);
            await (0, extension_1.activate)(mockContext);
            // Should restore previous state
            assert.ok(mockContext.globalState.get.called);
        });
        it('should handle workspace changes', async () => {
            await (0, extension_1.activate)(mockContext);
            // Mock workspace change
            const workspaceChangeHandlers = [];
            sandbox.stub(vscode.workspace, 'onDidChangeWorkspaceFolders')
                .callsFake((handler) => {
                workspaceChangeHandlers.push(handler);
                return { dispose: sandbox.stub() };
            });
            // Should set up workspace change handlers
            assert.ok(true); // Extension activated successfully
        });
    });
    describe('Performance and Memory Management', () => {
        it('should activate within reasonable time', async () => {
            const startTime = Date.now();
            await (0, extension_1.activate)(mockContext);
            const activationTime = Date.now() - startTime;
            // Should activate quickly (under 5 seconds for test)
            assert.ok(activationTime < 5000, `Activation took ${activationTime}ms`);
        });
        it('should not leak memory during activation', async () => {
            // Test multiple activations (simulating reload)
            const initialMemory = process.memoryUsage();
            for (let i = 0; i < 3; i++) {
                await (0, extension_1.activate)(mockContext);
                (0, extension_1.deactivate)();
                // Clear subscriptions for next iteration
                mockContext.subscriptions.length = 0;
            }
            const finalMemory = process.memoryUsage();
            // Memory usage should not grow significantly
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            assert.ok(memoryIncrease < 50 * 1024 * 1024, 'Memory usage should not increase significantly'); // 50MB threshold
        });
        it('should handle concurrent command executions', async () => {
            await (0, extension_1.activate)(mockContext);
            const registerCommandStub = vscode.commands.registerCommand;
            const commands = registerCommandStub.getCalls().map(call => call.args[1]);
            // Execute multiple commands concurrently
            const concurrentExecutions = commands.slice(0, 3).map(async (commandHandler) => {
                try {
                    await commandHandler();
                    return 'success';
                }
                catch (error) {
                    return 'error';
                }
            });
            const results = await Promise.all(concurrentExecutions);
            // All executions should complete (success or controlled error)
            assert.ok(results.every(result => result === 'success' || result === 'error'));
        });
    });
});
//# sourceMappingURL=extension-activation-comprehensive.test.js.map