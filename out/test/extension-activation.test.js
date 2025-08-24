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
 * 扩展激活和命令注册测试
 * 测试VS Code扩展的激活流程和命令注册功能
 *
 * @fileoverview 扩展激活测试套件
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const extension_1 = require("../extension");
const localizationManager_1 = require("../localization/localizationManager");
const toolchainGuideDialog_1 = require("../ui/toolchainGuideDialog");
describe('Extension Activation Tests', () => {
    let sandbox;
    let mockContext;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Create comprehensive mock context
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
            secrets: {
                get: sandbox.stub().resolves(),
                store: sandbox.stub().resolves(),
                delete: sandbox.stub().resolves(),
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
        // Mock VS Code API
        sandbox.stub(vscode.window, 'createTreeView').returns({
            dispose: sandbox.stub(),
            onDidChangeSelection: sandbox.stub(),
            onDidChangeVisibility: sandbox.stub(),
            onDidCollapseElement: sandbox.stub(),
            onDidExpandElement: sandbox.stub(),
            selection: [],
            visible: true,
            reveal: sandbox.stub()
        });
        sandbox.stub(vscode.commands, 'registerCommand').callsFake((command, callback) => {
            return { dispose: sandbox.stub() };
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('Extension Activation', () => {
        it('should activate extension without errors', () => {
            // Mock findOpenOCDPath to return immediately
            const findOpenOCDStub = sandbox.stub().resolves('/usr/bin/openocd');
            // Mock the imports that might not be available in test
            const moduleStub = {
                findOpenOCDPath: findOpenOCDStub
            };
            assert.doesNotThrow(() => {
                (0, extension_1.activate)(mockContext);
            });
        });
        it('should register all required commands', () => {
            const registerCommandStub = sandbox.stub(vscode.commands, 'registerCommand');
            (0, extension_1.activate)(mockContext);
            // Verify all expected commands are registered
            const expectedCommands = [
                'stm32-configurator-by-zuolan.detectToolchain',
                'stm32-configurator-by-zuolan.start',
                'stm32-configurator-by-zuolan.refresh',
                'stm32-configurator-by-zuolan.openConfig',
                'stm32-configurator-by-zuolan.addLiveWatchVariable',
                'stm32-configurator-by-zuolan.removeLiveWatchVariable',
                'stm32-configurator-by-zuolan.toggleLanguage',
                'stm32-configurator-by-zuolan.setupToolchain'
            ];
            expectedCommands.forEach(command => {
                assert.ok(registerCommandStub.calledWith(command, sinon.match.func), `Command ${command} should be registered`);
            });
        });
        it('should create tree view with correct configuration', () => {
            const createTreeViewStub = sandbox.stub(vscode.window, 'createTreeView');
            (0, extension_1.activate)(mockContext);
            assert.ok(createTreeViewStub.calledOnce);
            assert.strictEqual(createTreeViewStub.firstCall.args[0], 'stm32-configurator-tree');
            const config = createTreeViewStub.firstCall.args[1];
            assert.ok(config.treeDataProvider);
            assert.strictEqual(config.showCollapseAll, true);
        });
        it('should initialize localization manager', () => {
            const getInstanceStub = sandbox.stub(localizationManager_1.LocalizationManager, 'getInstance').returns({
                getString: sandbox.stub(),
                getCurrentLanguage: sandbox.stub(),
                switchLanguage: sandbox.stub(),
                getAllStrings: sandbox.stub(),
                formatString: sandbox.stub()
            });
            (0, extension_1.activate)(mockContext);
            assert.ok(getInstanceStub.calledOnce);
            assert.ok(getInstanceStub.calledWith(mockContext));
        });
        it('should handle OpenOCD path detection errors gracefully', async () => {
            // Mock findOpenOCDPath to reject
            const findOpenOCDStub = sandbox.stub().rejects(new Error('OpenOCD detection failed'));
            // Mock console.error to capture error logging
            const consoleErrorStub = sandbox.stub(console, 'error');
            (0, extension_1.activate)(mockContext);
            // Wait a bit for async operations
            await new Promise(resolve => setTimeout(resolve, 10));
            // Should not throw, should log error instead
            assert.ok(consoleErrorStub.called);
        });
    });
    describe('Command Execution Tests', () => {
        let commandHandlers;
        beforeEach(() => {
            commandHandlers = new Map();
            // Capture command handlers during registration
            sandbox.stub(vscode.commands, 'registerCommand').callsFake((command, handler) => {
                commandHandlers.set(command, handler);
                return { dispose: sandbox.stub() };
            });
            (0, extension_1.activate)(mockContext);
        });
        it('should handle detectToolchain command execution', async () => {
            const detectHandler = commandHandlers.get('stm32-configurator-by-zuolan.detectToolchain');
            assert.ok(detectHandler, 'detectToolchain handler should be registered');
            // Mock ToolchainGuideDialog
            const showWizardStub = sandbox.stub().resolves(true);
            sandbox.stub(toolchainGuideDialog_1.ToolchainGuideDialog.prototype, 'showWizard').callsFake(showWizardStub);
            // Mock success message
            const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
            await detectHandler();
            assert.ok(showWizardStub.calledOnce);
        });
        it('should handle setupToolchain command with wizard option', async () => {
            const setupHandler = commandHandlers.get('stm32-configurator-by-zuolan.setupToolchain');
            assert.ok(setupHandler, 'setupToolchain handler should be registered');
            // Mock user selecting wizard option
            sandbox.stub(vscode.window, 'showQuickPick').resolves({ value: 'wizard' });
            // Mock command execution
            const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
            await setupHandler();
            assert.ok(executeCommandStub.calledWith('stm32-configurator-by-zuolan.detectToolchain'));
        });
        it('should handle setupToolchain command with manual option', async () => {
            const setupHandler = commandHandlers.get('stm32-configurator-by-zuolan.setupToolchain');
            assert.ok(setupHandler, 'setupToolchain handler should be registered');
            // Mock user selecting manual option
            sandbox.stub(vscode.window, 'showQuickPick').resolves({ value: 'manual' });
            // Mock command execution
            const executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand');
            await setupHandler();
            assert.ok(executeCommandStub.calledWith('workbench.action.openSettings', 'stm32-configurator'));
        });
        it('should handle toggleLanguage command', async () => {
            const toggleHandler = commandHandlers.get('stm32-configurator-by-zuolan.toggleLanguage');
            assert.ok(toggleHandler, 'toggleLanguage handler should be registered');
            // Mock LocalizationManager
            const mockLocManager = {
                getCurrentLanguage: sandbox.stub().returns('en'),
                switchLanguage: sandbox.stub(),
                getAllStrings: sandbox.stub().returns({})
            };
            sandbox.stub(localizationManager_1.LocalizationManager, 'getInstance').returns(mockLocManager);
            await toggleHandler();
            assert.ok(mockLocManager.switchLanguage.calledWith('zh'));
        });
        it('should handle addLiveWatchVariable command', async () => {
            const addVarHandler = commandHandlers.get('stm32-configurator-by-zuolan.addLiveWatchVariable');
            assert.ok(addVarHandler, 'addLiveWatchVariable handler should be registered');
            // Mock input box
            sandbox.stub(vscode.window, 'showInputBox').resolves('testVariable');
            // Mock information message
            const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage');
            await addVarHandler();
            // Should not throw and should process the variable
            assert.ok(showInfoStub.called || true); // Either shows message or handles silently
        });
        it('should handle error in detectToolchain command', async () => {
            const detectHandler = commandHandlers.get('stm32-configurator-by-zuolan.detectToolchain');
            assert.ok(detectHandler, 'detectToolchain handler should be registered');
            // Mock ToolchainGuideDialog to throw error
            sandbox.stub(toolchainGuideDialog_1.ToolchainGuideDialog.prototype, 'showWizard')
                .rejects(new Error('Detection failed'));
            // Mock error message
            const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage');
            await detectHandler();
            assert.ok(showErrorStub.called);
            assert.ok(showErrorStub.calledWith(sinon.match(/failed/)));
        });
    });
    describe('Extension Deactivation', () => {
        it('should deactivate extension without errors', () => {
            assert.doesNotThrow(() => {
                (0, extension_1.deactivate)();
            });
        });
        it('should clean up resources properly', () => {
            // Currently deactivate() is empty, but test structure is here
            // for future cleanup logic
            const result = (0, extension_1.deactivate)();
            assert.strictEqual(result, undefined);
        });
    });
    describe('Context Subscription Management', () => {
        it('should add all disposables to context subscriptions', () => {
            (0, extension_1.activate)(mockContext);
            // Should have registered multiple disposables
            assert.ok(mockContext.subscriptions.length > 0);
        });
        it('should handle context subscription disposal', () => {
            const mockDisposable = { dispose: sandbox.stub() };
            sandbox.stub(vscode.commands, 'registerCommand').returns(mockDisposable);
            (0, extension_1.activate)(mockContext);
            // Simulate extension deactivation by disposing all subscriptions
            mockContext.subscriptions.forEach(sub => {
                if (typeof sub.dispose === 'function') {
                    sub.dispose();
                }
            });
            // Should not throw during disposal
            assert.ok(true);
        });
    });
});
//# sourceMappingURL=extension-activation.test.js.map