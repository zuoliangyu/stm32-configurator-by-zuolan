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
 * 简化的工具链引导功能测试
 * 快速验证核心功能是否正常工作
 *
 * @fileoverview 简化工具链引导测试
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const toolchainDetectionService_1 = require("../services/toolchainDetectionService");
const localizationManager_1 = require("../localization/localizationManager");
describe('Simple Toolchain Guidance Tests', () => {
    let sandbox;
    let mockContext;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Minimal mock context
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
        // Mock VS Code configuration
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: sandbox.stub().returns('en'),
            update: sandbox.stub().resolves(),
            has: sandbox.stub().returns(true),
            inspect: sandbox.stub()
        });
    });
    afterEach(() => {
        sandbox.restore();
        // Reset singleton
        localizationManager_1.LocalizationManager.instance = null;
    });
    describe('Service Initialization', () => {
        it('should create ToolchainDetectionService singleton', () => {
            const service1 = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const service2 = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            assert.strictEqual(service1, service2);
            assert.ok(typeof service1.detectToolchains === 'function');
        });
        it('should initialize LocalizationManager', () => {
            const locManager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.ok(locManager);
            assert.ok(typeof locManager.getString === 'function');
            assert.ok(['en', 'zh'].includes(locManager.getCurrentLanguage()));
        });
    });
    describe('Basic Functionality', () => {
        it('should handle toolchain detection service calls', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            // Mock the detection to return a simple result
            const mockResult = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test' },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test' },
                completedAt: Date.now()
            };
            const detectStub = sandbox.stub(service, 'detectToolchains').resolves(mockResult);
            const result = await service.detectToolchains();
            assert.ok(detectStub.calledOnce);
            assert.ok(result);
        });
        it('should handle language switching', async () => {
            const locManager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const initialLang = locManager.getCurrentLanguage();
            const newLang = initialLang === 'en' ? 'zh' : 'en';
            await locManager.switchLanguage(newLang);
            assert.strictEqual(locManager.getCurrentLanguage(), newLang);
        });
        it('should provide localized strings', () => {
            const locManager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const strings = ['toolchainDetectionTitle', 'openocd', 'armToolchain'];
            strings.forEach(key => {
                const value = locManager.getString(key);
                assert.ok(typeof value === 'string');
                assert.ok(value.length > 0);
            });
        });
    });
    describe('Configuration Management', () => {
        it('should handle VS Code configuration access', () => {
            const config = vscode.workspace.getConfiguration('stm32-configurator');
            assert.ok(config);
            assert.ok(typeof config.get === 'function');
            assert.ok(typeof config.update === 'function');
        });
        it('should handle global state operations', async () => {
            const updateStub = mockContext.globalState.update;
            await mockContext.globalState.update('testKey', 'testValue');
            assert.ok(updateStub.calledOnce);
            assert.ok(updateStub.calledWith('testKey', 'testValue'));
        });
    });
    describe('Error Handling', () => {
        it('should handle service initialization errors gracefully', () => {
            // Test that service creation doesn't throw
            assert.doesNotThrow(() => {
                toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            });
        });
        it('should handle localization errors gracefully', () => {
            const locManager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Test with non-existent key
            const result = locManager.getString('nonExistentKey');
            assert.strictEqual(typeof result, 'string');
        });
        it('should handle configuration update failures', async () => {
            // Mock configuration update to fail
            const mockConfig = {
                get: sandbox.stub().returns('en'),
                update: sandbox.stub().rejects(new Error('Update failed')),
                has: sandbox.stub().returns(true),
                inspect: sandbox.stub()
            };
            sandbox.stub(vscode.workspace, 'getConfiguration').returns(mockConfig);
            const locManager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Should not throw error
            await assert.doesNotReject(async () => {
                await locManager.switchLanguage('zh');
            });
        });
    });
});
//# sourceMappingURL=simple-toolchain.test.js.map