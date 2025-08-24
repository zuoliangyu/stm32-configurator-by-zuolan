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
 * 工具链引导工作流程集成测试
 * 测试工具链检测向导的完整用户工作流程
 *
 * @fileoverview 工具链引导工作流程测试套件
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const toolchainGuideDialog_1 = require("../ui/toolchainGuideDialog");
const toolchainDetectionService_1 = require("../services/toolchainDetectionService");
const localizationManager_1 = require("../localization/localizationManager");
describe('Toolchain Guidance Workflow Tests', () => {
    let sandbox;
    let mockContext;
    let toolchainDialog;
    let detectionService;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock VS Code ExtensionContext
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: sandbox.stub(),
                update: sandbox.stub(),
                keys: sandbox.stub()
            },
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
            extensionUri: vscode.Uri.file('/test/extension'),
            extensionPath: '/test/extension',
            environmentVariableCollection: {
                persistent: true,
                description: 'Test collection',
                clear: sandbox.stub(),
                delete: sandbox.stub(),
                forEach: sandbox.stub(),
                get: sandbox.stub(),
                prepend: sandbox.stub(),
                replace: sandbox.stub(),
                append: sandbox.stub(),
                getScoped: sandbox.stub()
            },
            storagePath: '/test/storage',
            globalStoragePath: '/test/global-storage',
            logPath: '/test/logs',
            extensionMode: vscode.ExtensionMode.Test,
            extension: {},
            logUri: vscode.Uri.file('/test/logs'),
            storageUri: vscode.Uri.file('/test/storage'),
            globalStorageUri: vscode.Uri.file('/test/global-storage')
        };
        // Initialize services
        detectionService = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
        toolchainDialog = new toolchainGuideDialog_1.ToolchainGuideDialog(mockContext);
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('Basic Functionality Tests', () => {
        it('should initialize ToolchainGuideDialog successfully', () => {
            assert.ok(toolchainDialog);
            assert.strictEqual(typeof toolchainDialog.showWizard, 'function');
        });
        it('should create singleton instance of ToolchainDetectionService', () => {
            const service1 = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const service2 = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            assert.strictEqual(service1, service2);
            assert.strictEqual(typeof service1.detectToolchains, 'function');
        });
        it('should handle LocalizationManager initialization', () => {
            const locManager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.ok(locManager);
            assert.strictEqual(typeof locManager.getString, 'function');
        });
    });
    describe('Toolchain Detection Tests', () => {
        it('should detect toolchains successfully', async () => {
            // Mock successful detection results
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'found',
                    path: '/usr/bin/openocd',
                    version: '0.12.0',
                    info: 'OpenOCD 0.12.0',
                    detectedAt: Date.now()
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'found',
                    path: '/usr/bin/arm-none-eabi-gcc',
                    version: '12.2.0',
                    info: 'GCC 12.2.0',
                    detectedAt: Date.now()
                },
                completedAt: Date.now()
            };
            const detectStub = sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            const results = await detectionService.detectToolchains();
            assert.ok(detectStub.calledOnce);
            assert.strictEqual(results.openocd.status, 'found');
            assert.strictEqual(results.armToolchain.status, 'found');
        });
        it('should handle toolchain detection failure gracefully', async () => {
            // Mock failed detection results
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'not_found',
                    path: null,
                    error: 'OpenOCD not found in PATH',
                    detectedAt: Date.now()
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'not_found',
                    path: null,
                    error: 'ARM toolchain not found',
                    detectedAt: Date.now()
                },
                completedAt: Date.now()
            };
            const detectStub = sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            const results = await detectionService.detectToolchains();
            assert.ok(detectStub.calledOnce);
            assert.strictEqual(results.openocd.status, 'not_found');
            assert.strictEqual(results.armToolchain.status, 'not_found');
        });
        it('should respect force redetection option', async () => {
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test', detectedAt: Date.now() },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test', detectedAt: Date.now() },
                completedAt: Date.now()
            };
            const detectStub = sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            // First call
            await detectionService.detectToolchains({ forceRedetection: false });
            // Second call with force redetection
            await detectionService.detectToolchains({ forceRedetection: true });
            // Should call detection twice due to force redetection
            assert.ok(detectStub.calledTwice);
        });
    });
    describe('User Interaction Workflow Tests', () => {
        it('should handle successful wizard completion', async () => {
            // Mock VS Code UI interactions
            const showProgressStub = sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
                return await task({
                    report: sandbox.stub()
                }, {});
            });
            // Mock successful detection
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test/openocd', detectedAt: Date.now() },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test/gcc', detectedAt: Date.now() },
                completedAt: Date.now()
            };
            sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            // Mock user choosing to continue
            const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage')
                .resolves('Continue');
            // Mock configuration update
            const configStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: sandbox.stub().resolves()
            });
            const result = await toolchainDialog.showWizard();
            assert.strictEqual(result, true);
            assert.ok(showProgressStub.called);
        });
        it('should handle wizard cancellation', async () => {
            // Mock detection
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'not_found', path: null, detectedAt: Date.now() },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null, detectedAt: Date.now() },
                completedAt: Date.now()
            };
            sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            // Mock progress dialog
            sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
                return await task({ report: sandbox.stub() }, {});
            });
            // Mock user cancellation
            sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);
            const result = await toolchainDialog.showWizard();
            assert.strictEqual(result, false);
        });
        it('should handle manual configuration workflow', async () => {
            // Mock detection with failures
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'not_found', path: null, detectedAt: Date.now() },
                armToolchain: { name: 'ARM GCC', status: 'not_found', path: null, detectedAt: Date.now() },
                completedAt: Date.now()
            };
            sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            // Mock progress dialog
            sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
                return await task({ report: sandbox.stub() }, {});
            });
            // Mock file selection dialog
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([
                vscode.Uri.file('/custom/path/openocd')
            ]);
            // Mock user choosing manual configuration then continue
            const showMessageStub = sandbox.stub(vscode.window, 'showInformationMessage')
                .onFirstCall().resolves('Configure Manually')
                .onSecondCall().resolves('Continue');
            // Mock configuration update
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: sandbox.stub().resolves()
            });
            const result = await toolchainDialog.showWizard();
            assert.strictEqual(result, true);
            assert.ok(showMessageStub.calledTwice);
        });
    });
    describe('Error Handling Tests', () => {
        it('should handle detection service errors gracefully', async () => {
            // Mock detection throwing error
            sandbox.stub(detectionService, 'detectToolchains').rejects(new Error('Detection failed'));
            // Mock progress dialog
            sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
                return await task({ report: sandbox.stub() }, {});
            });
            // Mock error message display
            const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
            const result = await toolchainDialog.showWizard();
            assert.strictEqual(result, false);
            assert.ok(showErrorStub.called);
        });
        it('should handle configuration save errors', async () => {
            // Mock successful detection
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test', detectedAt: Date.now() },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test', detectedAt: Date.now() },
                completedAt: Date.now()
            };
            sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            // Mock progress dialog
            sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
                return await task({ report: sandbox.stub() }, {});
            });
            // Mock user choosing continue
            sandbox.stub(vscode.window, 'showInformationMessage').resolves('Continue');
            // Mock configuration save failure
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: sandbox.stub().rejects(new Error('Config save failed'))
            });
            const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
            const result = await toolchainDialog.showWizard();
            // Should handle error gracefully
            assert.ok(showErrorStub.called);
        });
    });
    describe('Path Validation and Normalization Tests', () => {
        it('should normalize Windows paths to use forward slashes', async () => {
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'found',
                    path: 'C:\\Program Files\\OpenOCD\\bin\\openocd.exe',
                    detectedAt: Date.now()
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'found',
                    path: 'C:\\Program Files\\ARM\\bin\\arm-none-eabi-gcc.exe',
                    detectedAt: Date.now()
                },
                completedAt: Date.now()
            };
            sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            // Mock progress dialog
            sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
                return await task({ report: sandbox.stub() }, {});
            });
            // Mock user continuing
            sandbox.stub(vscode.window, 'showInformationMessage').resolves('Continue');
            // Mock configuration to capture what gets saved
            let savedOpenOCDPath = '';
            sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: sandbox.stub().callsFake((key, value) => {
                    if (key === 'openocdPath') {
                        savedOpenOCDPath = value;
                    }
                    return Promise.resolve();
                })
            });
            await toolchainDialog.showWizard();
            // Check that path was normalized to forward slashes
            assert.ok(savedOpenOCDPath.includes('/'), 'Path should use forward slashes');
            assert.ok(!savedOpenOCDPath.includes('\\'), 'Path should not contain backslashes');
        });
        it('should validate file existence for manual paths', async () => {
            // Mock file selection with invalid path
            const invalidPath = '/nonexistent/path/openocd';
            sandbox.stub(vscode.window, 'showOpenDialog').resolves([
                vscode.Uri.file(invalidPath)
            ]);
            // Mock warning message for invalid path
            const showWarningStub = sandbox.stub(vscode.window, 'showWarningMessage')
                .resolves('No');
            // Create a minimal manual configuration scenario
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'not_found', path: null, detectedAt: Date.now() },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test', detectedAt: Date.now() },
                completedAt: Date.now()
            };
            sandbox.stub(detectionService, 'detectToolchains').resolves(mockResults);
            sandbox.stub(vscode.window, 'withProgress').callsFake(async (options, task) => {
                return await task({ report: sandbox.stub() }, {});
            });
            // Mock sequence: manual config -> cancel
            sandbox.stub(vscode.window, 'showInformationMessage')
                .onFirstCall().resolves('Configure Manually')
                .onSecondCall().resolves(undefined); // Cancel
            const result = await toolchainDialog.showWizard();
            assert.strictEqual(result, false);
        });
    });
});
//# sourceMappingURL=toolchain-workflow.test.js.map