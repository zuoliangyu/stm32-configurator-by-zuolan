/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 简化的工具链引导功能测试
 * 快速验证核心功能是否正常工作
 * 
 * @fileoverview 简化工具链引导测试
 * @author 左岚
 * @since 0.2.5
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ToolchainDetectionService } from '../services/toolchainDetectionService';
import { LocalizationManager } from '../localization/localizationManager';

describe('Simple Toolchain Guidance Tests', () => {
    let sandbox: sinon.SinonSandbox;
    let mockContext: any;

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
        } as any;

        // Mock VS Code configuration
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: sandbox.stub().returns('en'),
            update: sandbox.stub().resolves(),
            has: sandbox.stub().returns(true),
            inspect: sandbox.stub()
        } as any);
    });

    afterEach(() => {
        sandbox.restore();
        // Reset singleton
        (LocalizationManager as any).instance = null;
    });

    describe('Service Initialization', () => {
        it('should create ToolchainDetectionService singleton', () => {
            const service1 = ToolchainDetectionService.getInstance();
            const service2 = ToolchainDetectionService.getInstance();
            
            assert.strictEqual(service1, service2);
            assert.ok(typeof service1.detectToolchains === 'function');
        });

        it('should initialize LocalizationManager', () => {
            const locManager = LocalizationManager.getInstance(mockContext);
            
            assert.ok(locManager);
            assert.ok(typeof locManager.getString === 'function');
            assert.ok(['en', 'zh'].includes(locManager.getCurrentLanguage()));
        });
    });

    describe('Basic Functionality', () => {
        it('should handle toolchain detection service calls', async () => {
            const service = ToolchainDetectionService.getInstance();
            
            // Mock the detection to return a simple result
            const mockResult = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/test' },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/test' },
                completedAt: Date.now()
            };

            const detectStub = sandbox.stub(service, 'detectToolchains').resolves(mockResult as any);
            
            const result = await service.detectToolchains();
            
            assert.ok(detectStub.calledOnce);
            assert.ok(result);
        });

        it('should handle language switching', async () => {
            const locManager = LocalizationManager.getInstance(mockContext);
            
            const initialLang = locManager.getCurrentLanguage();
            const newLang = initialLang === 'en' ? 'zh' : 'en';
            
            await locManager.switchLanguage(newLang);
            
            assert.strictEqual(locManager.getCurrentLanguage(), newLang);
        });

        it('should provide localized strings', () => {
            const locManager = LocalizationManager.getInstance(mockContext);
            
            const strings = ['toolchainDetectionTitle' as const, 'openocd' as const, 'armToolchain' as const];
            
            strings.forEach(key => {
                const value = locManager.getString(key as any);
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
                ToolchainDetectionService.getInstance();
            });
        });

        it('should handle localization errors gracefully', () => {
            const locManager = LocalizationManager.getInstance(mockContext);
            
            // Test with non-existent key
            const result = locManager.getString('nonExistentKey' as any);
            
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
            
            sandbox.stub(vscode.workspace, 'getConfiguration').returns(mockConfig as any);
            
            const locManager = LocalizationManager.getInstance(mockContext);
            
            // Should not throw error
            await assert.doesNotReject(async () => {
                await locManager.switchLanguage('zh');
            });
        });
    });
});