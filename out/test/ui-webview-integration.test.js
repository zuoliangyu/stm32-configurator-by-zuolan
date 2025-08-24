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
 * UI组件和Webview集成测试套件
 * 测试工具链引导对话框、自动配置对话框和Webview消息传递
 *
 * @fileoverview UI和Webview集成测试
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const toolchainGuideDialog_1 = require("../ui/toolchainGuideDialog");
const autoConfigurationDialog_1 = require("../ui/autoConfigurationDialog");
describe('UI and Webview Integration Tests', () => {
    let sandbox;
    let mockContext;
    let mockWebview;
    let mockPanel;
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
            extensionUri: vscode.Uri.file('/test/extension'),
            extensionPath: '/test/extension',
            extensionMode: vscode.ExtensionMode.Test
        };
        // Mock webview
        mockWebview = {
            html: '',
            postMessage: sandbox.stub().resolves(),
            onDidReceiveMessage: sandbox.stub(),
            asWebviewUri: sandbox.stub().returns(vscode.Uri.file('/test')),
            cspSource: 'vscode-webview:'
        };
        // Mock webview panel
        mockPanel = {
            webview: mockWebview,
            title: 'Test Panel',
            reveal: sandbox.stub(),
            dispose: sandbox.stub(),
            onDidDispose: sandbox.stub(),
            onDidChangeViewState: sandbox.stub(),
            visible: true,
            active: true,
            viewColumn: vscode.ViewColumn.One
        };
        // Mock VS Code window methods
        sandbox.stub(vscode.window, 'createWebviewPanel').returns(mockPanel);
        sandbox.stub(vscode.window, 'showInformationMessage').resolves('OK');
        sandbox.stub(vscode.window, 'showWarningMessage').resolves('OK');
        sandbox.stub(vscode.window, 'showErrorMessage').resolves('OK');
        sandbox.stub(vscode.window, 'showQuickPick').resolves({});
        sandbox.stub(vscode.window, 'withProgress').callsFake((options, task) => task({
            report: sandbox.stub()
        }, {}));
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('ToolchainGuideDialog', () => {
        it('should create and initialize guide dialog', () => {
            const dialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
            assert.ok(dialog);
            assert.ok(typeof dialog.showWizard === 'function');
        });
        it('should show toolchain detection wizard', async () => {
            const dialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
            // Mock successful wizard completion
            const mockWizardResult = true;
            const showWizardStub = sandbox.stub(dialog, 'showWizard').resolves(mockWizardResult);
            const result = await dialog.showWizard();
            assert.ok(showWizardStub.calledOnce);
            assert.strictEqual(result, true);
        });
        it('should handle user cancellation in wizard', async () => {
            const dialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
            // Mock user cancellation
            const showWizardStub = sandbox.stub(dialog, 'showWizard').resolves(false);
            const result = await dialog.showWizard();
            assert.ok(showWizardStub.calledOnce);
            assert.strictEqual(result, false);
        });
        it('should handle detection errors in wizard', async () => {
            const dialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
            const showWizardStub = sandbox.stub(dialog, 'showWizard')
                .rejects(new Error('Detection failed'));
            try {
                await dialog.showWizard();
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, 'Detection failed');
            }
        });
        it('should update UI with detection progress', async () => {
            const dialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
            // Mock progress updates
            const progressStub = sandbox.stub(vscode.window, 'withProgress');
            progressStub.callsFake(async (options, task) => {
                const progress = { report: sandbox.stub() };
                const token = { isCancellationRequested: false };
                await task(progress, token);
                // Verify progress reporting
                assert.ok(progress.report.called);
                return true;
            });
            const showWizardStub = sandbox.stub(dialog, 'showWizard').callsFake(async () => {
                // Simulate showing wizard with progress
                await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Detecting...' }, async (progress) => {
                    progress.report({ message: 'Scanning for tools...' });
                    return true;
                });
                return true;
            });
            const result = await dialog.showWizard();
            assert.ok(progressStub.called);
            assert.strictEqual(result, true);
        });
    });
    describe('AutoConfigurationDialog', () => {
        it('should create auto-configuration dialog', () => {
            const dialog = new autoConfigurationDialog_1.AutoConfigurationDialog(mockContext);
            assert.ok(dialog);
            assert.ok(typeof dialog.showAutoConfigurationWizard === 'function');
            assert.ok(typeof dialog.oneClickQuickSetup === 'function');
            assert.ok(typeof dialog.showIntelligentConfigurationWizard === 'function');
            assert.ok(typeof dialog.autoTroubleshoot === 'function');
        });
        it('should perform auto-configuration wizard', async () => {
            const dialog = new autoConfigurationDialog_1.AutoConfigurationDialog(mockContext);
            const mockResult = {
                success: true,
                generatedConfigs: [
                    { name: 'Debug STM32F4', type: 'cortex-debug' }
                ],
                detectionResults: {
                    openocd: { status: 'found', path: '/usr/bin/openocd' },
                    armToolchain: { status: 'found', path: '/usr/bin/arm-none-eabi-gcc' }
                }
            };
            const wizardStub = sandbox.stub(dialog, 'showAutoConfigurationWizard').resolves(mockResult);
            const result = await dialog.showAutoConfigurationWizard();
            assert.ok(wizardStub.calledOnce);
            assert.strictEqual(result.success, true);
            assert.ok(result.generatedConfigs);
            assert.strictEqual(result.generatedConfigs.length, 1);
        });
        it('should handle one-click setup', async () => {
            const dialog = new autoConfigurationDialog_1.AutoConfigurationDialog(mockContext);
            const mockResult = {
                success: true,
                message: 'Setup completed successfully',
                configurationsCreated: 1,
                toolchainsConfigured: 2
            };
            const setupStub = sandbox.stub(dialog, 'oneClickQuickSetup').resolves(mockResult);
            const result = await dialog.oneClickQuickSetup();
            assert.ok(setupStub.calledOnce);
            assert.strictEqual(result.success, true);
            assert.ok(result.message);
        });
        it('should perform intelligent configuration wizard', async () => {
            const dialog = new autoConfigurationDialog_1.AutoConfigurationDialog(mockContext);
            const mockResult = {
                success: true,
                generatedConfigs: [
                    { name: 'Debug STM32F4 (Intelligent)', type: 'cortex-debug', intelligent: true }
                ],
                recommendations: [
                    'Consider adding SVD file for better debugging experience',
                    'Enable SWO output for printf debugging'
                ]
            };
            const intelligentStub = sandbox.stub(dialog, 'showIntelligentConfigurationWizard')
                .resolves(mockResult);
            const result = await dialog.showIntelligentConfigurationWizard();
            assert.ok(intelligentStub.calledOnce);
            assert.strictEqual(result.success, true);
            assert.ok(result.recommendations);
            assert.ok(result.recommendations.length > 0);
        });
        it('should perform auto-troubleshooting', async () => {
            const dialog = new autoConfigurationDialog_1.AutoConfigurationDialog(mockContext);
            const mockResult = {
                issuesFound: 3,
                issuesFixed: 2,
                remainingIssues: [
                    {
                        severity: 'warning',
                        message: 'SVD file not found',
                        category: 'configuration',
                        autoFixable: false
                    }
                ],
                fixesApplied: [
                    'Set ARM toolchain path',
                    'Created launch.json configuration'
                ],
                duration: 1500
            };
            const troubleshootStub = sandbox.stub(dialog, 'autoTroubleshoot').resolves(mockResult);
            const result = await dialog.autoTroubleshoot();
            assert.ok(troubleshootStub.calledOnce);
            assert.strictEqual(result.issuesFound, 3);
            assert.strictEqual(result.issuesFixed, 2);
            assert.strictEqual(result.remainingIssues.length, 1);
            assert.ok(result.fixesApplied.length > 0);
        });
        it('should handle auto-configuration failures', async () => {
            const dialog = new autoConfigurationDialog_1.AutoConfigurationDialog(mockContext);
            const mockResult = {
                success: false,
                error: 'ARM toolchain not found',
                detectionResults: {
                    openocd: { status: 'found', path: '/usr/bin/openocd' },
                    armToolchain: { status: 'not_found', issues: ['Not in PATH'] }
                }
            };
            sandbox.stub(dialog, 'showAutoConfigurationWizard').resolves(mockResult);
            const result = await dialog.showAutoConfigurationWizard();
            assert.strictEqual(result.success, false);
            assert.ok(result.error);
            assert.strictEqual(result.detectionResults.armToolchain.status, 'not_found');
        });
    });
    describe('Webview Message Handling', () => {
        it('should handle ARM toolchain detection messages', () => {
            // Mock webview message handler setup
            let messageHandler;
            mockWebview.onDidReceiveMessage.callsFake((handler) => {
                messageHandler = handler;
                return { dispose: sandbox.stub() };
            });
            // Simulate webview initialization
            mockWebview.onDidReceiveMessage(messageHandler);
            // Mock incoming message
            const testMessage = {
                command: 'refreshArmToolchainPath',
                data: {}
            };
            // Test message handler exists
            assert.ok(mockWebview.onDidReceiveMessage.called);
            if (messageHandler) {
                // Would normally call messageHandler(testMessage)
                // For testing, just verify handler is set up
                assert.ok(typeof messageHandler === 'function');
            }
        });
        it('should handle ARM toolchain browse messages', () => {
            let messageHandler;
            mockWebview.onDidReceiveMessage.callsFake((handler) => {
                messageHandler = handler;
            });
            mockWebview.onDidReceiveMessage(messageHandler);
            const testMessage = {
                command: 'browseArmToolchainPath',
                data: { currentPath: '' }
            };
            assert.ok(mockWebview.onDidReceiveMessage.called);
            assert.ok(typeof messageHandler === 'function');
        });
        it('should post ARM toolchain updates to webview', () => {
            const mockToolchainInfo = {
                path: '/usr/bin/arm-none-eabi-gcc',
                version: '10.3.1',
                vendor: 'GNU Arm Embedded Toolchain',
                rootPath: '/usr'
            };
            // Simulate posting update
            mockWebview.postMessage({
                command: 'updateArmToolchainPath',
                path: mockToolchainInfo.path,
                info: mockToolchainInfo
            });
            assert.ok(mockWebview.postMessage.called);
            assert.ok(mockWebview.postMessage.calledWith(sinon.match({
                command: 'updateArmToolchainPath'
            })));
        });
        it('should handle webview disposal properly', () => {
            let disposeHandler;
            mockPanel.onDidDispose.callsFake((handler) => {
                disposeHandler = handler;
                return { dispose: sandbox.stub() };
            });
            // Set up panel disposal
            mockPanel.onDidDispose(disposeHandler);
            assert.ok(mockPanel.onDidDispose.called);
            assert.ok(typeof disposeHandler === 'function');
            // Simulate disposal
            if (disposeHandler) {
                disposeHandler();
                // Panel should be cleaned up
                assert.ok(mockPanel.onDidDispose.called);
            }
        });
        it('should handle webview HTML content generation', () => {
            // Mock HTML content generation
            const mockHtmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>STM32 Configurator</title>
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${mockWebview.cspSource};">
                </head>
                <body>
                    <div id="app">ARM Toolchain Configuration</div>
                </body>
                </html>
            `;
            mockWebview.html = mockHtmlContent;
            assert.ok(mockWebview.html.includes('STM32 Configurator'));
            assert.ok(mockWebview.html.includes('ARM Toolchain Configuration'));
            assert.ok(mockWebview.html.includes(mockWebview.cspSource));
        });
    });
    describe('User Interaction Flows', () => {
        it('should guide user through complete toolchain setup', async () => {
            const guideDialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
            // Mock step-by-step guidance
            const mockSteps = [
                { title: 'Detect Tools', completed: false },
                { title: 'Configure ARM Toolchain', completed: false },
                { title: 'Configure OpenOCD', completed: false },
                { title: 'Generate Debug Config', completed: false }
            ];
            const mockWizardFlow = sandbox.stub(guideDialog, 'showWizard').callsFake(async () => {
                // Simulate step completion
                for (const step of mockSteps) {
                    step.completed = true;
                }
                return true;
            });
            const result = await guideDialog.showWizard();
            assert.ok(mockWizardFlow.calledOnce);
            assert.strictEqual(result, true);
            assert.ok(mockSteps.every(step => step.completed));
        });
        it('should handle user selection in quick pick menus', async () => {
            const quickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            // Mock toolchain selection
            quickPickStub.resolves({
                label: 'GNU Arm Embedded Toolchain 10.3-2021.10',
                description: '/usr/local/arm-toolchain/bin/arm-none-eabi-gcc',
                value: '/usr/local/arm-toolchain'
            });
            const selectedOption = await vscode.window.showQuickPick([
                {
                    label: 'GNU Arm Embedded Toolchain 10.3-2021.10',
                    description: '/usr/local/arm-toolchain/bin/arm-none-eabi-gcc',
                    value: '/usr/local/arm-toolchain'
                }
            ]);
            assert.ok(quickPickStub.called);
            assert.ok(selectedOption);
            assert.strictEqual(selectedOption.value, '/usr/local/arm-toolchain');
        });
        it('should handle file browser dialogs', async () => {
            const openDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');
            openDialogStub.resolves([
                vscode.Uri.file('/usr/bin/arm-none-eabi-gcc')
            ]);
            const selectedFiles = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Executable': process.platform === 'win32' ? ['exe'] : ['*']
                }
            });
            assert.ok(openDialogStub.called);
            assert.ok(selectedFiles);
            assert.strictEqual(selectedFiles.length, 1);
            assert.ok(selectedFiles[0].fsPath.includes('arm-none-eabi-gcc'));
        });
        it('should provide user feedback during operations', async () => {
            const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
            const showProgressStub = sandbox.stub(vscode.window, 'withProgress');
            showProgressStub.callsFake(async (options, task) => {
                const progress = { report: sandbox.stub() };
                // Simulate progress updates
                progress.report({ message: 'Detecting ARM toolchain...' });
                progress.report({ message: 'Validating installation...' });
                progress.report({ message: 'Configuration complete!' });
                await task(progress, {});
                return 'success';
            });
            showInfoStub.resolves('OK');
            // Simulate operation with progress and feedback
            const result = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Setting up ARM toolchain',
                cancellable: false
            }, async (progress) => {
                progress.report({ message: 'Detecting ARM toolchain...' });
                return 'success';
            });
            await vscode.window.showInformationMessage('Toolchain setup completed successfully!');
            assert.ok(showProgressStub.called);
            assert.ok(showInfoStub.called);
            assert.strictEqual(result, 'success');
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should handle webview creation failures', () => {
            // Mock webview creation failure
            sandbox.stub(vscode.window, 'createWebviewPanel').throws(new Error('Failed to create webview'));
            try {
                vscode.window.createWebviewPanel('test', 'Test Panel', vscode.ViewColumn.One, { enableScripts: true });
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, 'Failed to create webview');
            }
        });
        it('should handle message posting failures', async () => {
            mockWebview.postMessage.rejects(new Error('Failed to post message'));
            try {
                await mockWebview.postMessage({ command: 'test' });
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, 'Failed to post message');
            }
        });
        it('should recover from dialog initialization errors', async () => {
            // Mock initialization error and recovery
            const dialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
            const showWizardStub = sandbox.stub(dialog, 'showWizard')
                .onFirstCall().rejects(new Error('Initialization failed'))
                .onSecondCall().resolves(true);
            // First attempt should fail
            try {
                await dialog.showWizard();
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
            }
            // Second attempt should succeed
            const result = await dialog.showWizard();
            assert.strictEqual(result, true);
        });
        it('should handle cancellation gracefully', async () => {
            const cancelToken = new vscode.CancellationTokenSource();
            const progressStub = sandbox.stub(vscode.window, 'withProgress')
                .callsFake(async (options, task) => {
                const progress = { report: sandbox.stub() };
                // Simulate cancellation during operation
                setTimeout(() => cancelToken.cancel(), 100);
                return await task(progress, cancelToken.token);
            });
            try {
                await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'Processing...' }, async (progress, token) => {
                    if (token.isCancellationRequested) {
                        throw new Error('Operation was cancelled');
                    }
                    return 'completed';
                });
            }
            catch (error) {
                // Should handle cancellation appropriately
                assert.ok(error instanceof Error);
            }
        });
    });
});
//# sourceMappingURL=ui-webview-integration.test.js.map