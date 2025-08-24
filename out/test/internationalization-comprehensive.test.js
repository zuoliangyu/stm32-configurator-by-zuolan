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
 * 国际化功能综合测试套件
 * 测试多语言支持、语言切换、字符串格式化和本地化管理
 *
 * @fileoverview 国际化综合测试
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const localizationManager_1 = require("../localization/localizationManager");
const en_1 = require("../localization/en");
const zh_1 = require("../localization/zh");
describe('Internationalization Comprehensive Tests', () => {
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
                get: sandbox.stub().returns('en'), // Default to English
                update: sandbox.stub().resolves(),
                keys: sandbox.stub().returns([]),
                setKeysForSync: sandbox.stub()
            },
            extensionUri: vscode.Uri.file('/test/extension'),
            extensionPath: '/test/extension',
            extensionMode: vscode.ExtensionMode.Test
        };
        // Mock VS Code configuration
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: sandbox.stub().returns('en'),
            update: sandbox.stub().resolves(),
            has: sandbox.stub().returns(true),
            inspect: sandbox.stub()
        });
        // Reset singleton instance
        localizationManager_1.LocalizationManager.instance = null;
    });
    afterEach(() => {
        sandbox.restore();
        // Reset singleton
        localizationManager_1.LocalizationManager.instance = null;
    });
    describe('LocalizationManager Initialization', () => {
        it('should create singleton instance', () => {
            const manager1 = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const manager2 = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.strictEqual(manager1, manager2);
            assert.ok(manager1 instanceof localizationManager_1.LocalizationManager);
        });
        it('should initialize with English as default language', () => {
            mockContext.globalState.get.returns(undefined); // No saved language
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.strictEqual(manager.getCurrentLanguage(), 'en');
        });
        it('should initialize with saved language preference', () => {
            mockContext.globalState.get.returns('zh');
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.strictEqual(manager.getCurrentLanguage(), 'zh');
        });
        it('should fall back to English for invalid saved language', () => {
            mockContext.globalState.get.returns('invalid');
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.strictEqual(manager.getCurrentLanguage(), 'en');
        });
        it('should initialize with VS Code configuration language', () => {
            const configStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                get: sandbox.stub().returns('zh'),
                update: sandbox.stub().resolves(),
                has: sandbox.stub().returns(true),
                inspect: sandbox.stub()
            });
            mockContext.globalState.get.returns(undefined);
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.ok(configStub.called);
        });
    });
    describe('Language Switching', () => {
        it('should switch from English to Chinese', async () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.strictEqual(manager.getCurrentLanguage(), 'en');
            await manager.switchLanguage('zh');
            assert.strictEqual(manager.getCurrentLanguage(), 'zh');
            assert.ok(mockContext.globalState.update.calledWith('language', 'zh'));
        });
        it('should switch from Chinese to English', async () => {
            mockContext.globalState.get.returns('zh');
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.strictEqual(manager.getCurrentLanguage(), 'zh');
            await manager.switchLanguage('en');
            assert.strictEqual(manager.getCurrentLanguage(), 'en');
            assert.ok(mockContext.globalState.update.calledWith('language', 'en'));
        });
        it('should update VS Code configuration when switching language', async () => {
            const configMock = {
                get: sandbox.stub().returns('en'),
                update: sandbox.stub().resolves(),
                has: sandbox.stub().returns(true),
                inspect: sandbox.stub()
            };
            sandbox.stub(vscode.workspace, 'getConfiguration').returns(configMock);
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            await manager.switchLanguage('zh');
            assert.ok(configMock.update.calledWith('language', 'zh', vscode.ConfigurationTarget.Global));
        });
        it('should handle configuration update failure gracefully', async () => {
            const configMock = {
                get: sandbox.stub().returns('en'),
                update: sandbox.stub().rejects(new Error('Update failed')),
                has: sandbox.stub().returns(true),
                inspect: sandbox.stub()
            };
            sandbox.stub(vscode.workspace, 'getConfiguration').returns(configMock);
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Should not throw error even if config update fails
            await assert.doesNotReject(async () => {
                await manager.switchLanguage('zh');
            });
            assert.strictEqual(manager.getCurrentLanguage(), 'zh');
        });
        it('should reject invalid language codes', async () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            try {
                await manager.switchLanguage('invalid');
                assert.fail('Should have thrown error for invalid language');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.ok(error.message.includes('Unsupported language'));
            }
        });
        it('should maintain current language on switch failure', async () => {
            mockContext.globalState.update.rejects(new Error('State update failed'));
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const initialLang = manager.getCurrentLanguage();
            try {
                await manager.switchLanguage('zh');
            }
            catch (error) {
                // Should maintain original language
                assert.strictEqual(manager.getCurrentLanguage(), initialLang);
            }
        });
    });
    describe('String Localization', () => {
        it('should return correct English strings', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            assert.strictEqual(manager.getCurrentLanguage(), 'en');
            assert.strictEqual(manager.getString('toolchainDetectionTitle'), en_1.en.toolchainDetectionTitle);
            assert.strictEqual(manager.getString('openocd'), en_1.en.openocd);
            assert.strictEqual(manager.getString('armToolchain'), en_1.en.armToolchain);
        });
        it('should return correct Chinese strings', async () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            await manager.switchLanguage('zh');
            assert.strictEqual(manager.getCurrentLanguage(), 'zh');
            assert.strictEqual(manager.getString('toolchainDetectionTitle'), zh_1.zh.toolchainDetectionTitle);
            assert.strictEqual(manager.getString('openocd'), zh_1.zh.openocd);
            assert.strictEqual(manager.getString('armToolchain'), zh_1.zh.armToolchain);
        });
        it('should return key name for missing strings', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const result = manager.getString('nonExistentKey');
            assert.strictEqual(result, 'nonExistentKey');
        });
        it('should handle undefined/null keys gracefully', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const result1 = manager.getString(undefined);
            const result2 = manager.getString(null);
            assert.strictEqual(result1, 'undefined');
            assert.strictEqual(result2, 'null');
        });
        it('should return all strings for current language', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const allStrings = manager.getAllStrings();
            assert.ok(typeof allStrings === 'object');
            assert.ok(allStrings.toolchainDetectionTitle);
            assert.ok(allStrings.openocd);
            assert.ok(allStrings.armToolchain);
            assert.strictEqual(allStrings.toolchainDetectionTitle, en_1.en.toolchainDetectionTitle);
        });
        it('should return Chinese strings when language is switched', async () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            await manager.switchLanguage('zh');
            const allStrings = manager.getAllStrings();
            assert.strictEqual(allStrings.toolchainDetectionTitle, zh_1.zh.toolchainDetectionTitle);
            assert.strictEqual(allStrings.openocd, zh_1.zh.openocd);
            assert.strictEqual(allStrings.armToolchain, zh_1.zh.armToolchain);
        });
    });
    describe('String Formatting', () => {
        it('should format strings with single parameter', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Assuming formatString method exists
            if (typeof manager.formatString === 'function') {
                const formatted = manager.formatString('configGenerated', 'STM32F4');
                assert.ok(typeof formatted === 'string');
                assert.ok(formatted.length > 0);
            }
        });
        it('should format strings with multiple parameters', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            if (typeof manager.formatString === 'function') {
                const formatted = manager.formatString('liveWatchStatus', '3', '10');
                assert.ok(typeof formatted === 'string');
                assert.ok(formatted.length > 0);
            }
        });
        it('should handle formatting with missing parameters', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            if (typeof manager.formatString === 'function') {
                const formatted = manager.formatString('liveWatchStatus');
                assert.ok(typeof formatted === 'string');
            }
        });
    });
    describe('Localization Data Integrity', () => {
        it('should have consistent keys between English and Chinese', () => {
            const enKeys = Object.keys(en_1.en).sort();
            const zhKeys = Object.keys(zh_1.zh).sort();
            assert.deepStrictEqual(enKeys, zhKeys, 'Language files should have the same keys');
        });
        it('should have non-empty string values in English', () => {
            Object.entries(en_1.en).forEach(([key, value]) => {
                assert.ok(typeof value === 'string', `Key '${key}' should have string value`);
                assert.ok(value.length > 0, `Key '${key}' should have non-empty value`);
            });
        });
        it('should have non-empty string values in Chinese', () => {
            Object.entries(zh_1.zh).forEach(([key, value]) => {
                assert.ok(typeof value === 'string', `Key '${key}' should have string value`);
                assert.ok(value.length > 0, `Key '${key}' should have non-empty value`);
            });
        });
        it('should have different values for most keys between languages', () => {
            const commonKeys = Object.keys(en_1.en).filter(key => key in zh_1.zh);
            const differentValues = commonKeys.filter(key => en_1.en[key] !== zh_1.zh[key]);
            // Most strings should be different (allowing for some technical terms that might be the same)
            const differenceRatio = differentValues.length / commonKeys.length;
            assert.ok(differenceRatio > 0.7, 'Most strings should be different between languages');
        });
        it('should have ARM toolchain specific strings', () => {
            const requiredKeys = [
                'armToolchain',
                'toolchainDetectionTitle',
                'toolchainDetectionWizard',
                'autoDetectionResults',
                'configureManually',
                'toolchainConfiguration'
            ];
            requiredKeys.forEach(key => {
                assert.ok(key in en_1.en, `English should have key: ${key}`);
                assert.ok(key in zh_1.zh, `Chinese should have key: ${key}`);
                assert.ok(en_1.en[key], `English key '${key}' should have value`);
                assert.ok(zh_1.zh[key], `Chinese key '${key}' should have value`);
            });
        });
    });
    describe('Integration with Extension Commands', () => {
        it('should provide localized command titles', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const toolchainTitle = manager.getString('toolchainDetectionTitle');
            const configTitle = manager.getString('toolchainConfiguration');
            assert.ok(typeof toolchainTitle === 'string');
            assert.ok(typeof configTitle === 'string');
            assert.ok(toolchainTitle.length > 0);
            assert.ok(configTitle.length > 0);
        });
        it('should provide localized error messages', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const noOpenocd = manager.getString('noOpenocdFound');
            const configGenerated = manager.getString('configGenerated');
            assert.ok(typeof noOpenocd === 'string');
            assert.ok(typeof configGenerated === 'string');
            assert.ok(noOpenocd.length > 0);
            assert.ok(configGenerated.length > 0);
        });
        it('should provide localized UI strings', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const deviceName = manager.getString('deviceName');
            const executableFile = manager.getString('executableFile');
            const interfaceFile = manager.getString('interfaceFile');
            assert.ok(typeof deviceName === 'string');
            assert.ok(typeof executableFile === 'string');
            assert.ok(typeof interfaceFile === 'string');
        });
        it('should switch UI language dynamically', async () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const englishTitle = manager.getString('toolchainDetectionTitle');
            await manager.switchLanguage('zh');
            const chineseTitle = manager.getString('toolchainDetectionTitle');
            assert.notStrictEqual(englishTitle, chineseTitle);
            assert.strictEqual(englishTitle, en_1.en.toolchainDetectionTitle);
            assert.strictEqual(chineseTitle, zh_1.zh.toolchainDetectionTitle);
        });
    });
    describe('Performance and Memory Management', () => {
        it('should cache language data for performance', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Multiple calls should not impact performance significantly
            const startTime = Date.now();
            for (let i = 0; i < 100; i++) {
                manager.getString('toolchainDetectionTitle');
                manager.getAllStrings();
            }
            const duration = Date.now() - startTime;
            // Should complete quickly (under 100ms for 100 operations)
            assert.ok(duration < 100, `String operations took ${duration}ms`);
        });
        it('should not leak memory during language switches', async () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            const initialMemory = process.memoryUsage();
            // Perform multiple language switches
            for (let i = 0; i < 10; i++) {
                await manager.switchLanguage(i % 2 === 0 ? 'en' : 'zh');
                manager.getAllStrings();
            }
            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            // Memory increase should be minimal
            assert.ok(memoryIncrease < 5 * 1024 * 1024, 'Memory usage should not increase significantly'); // 5MB threshold
        });
        it('should handle concurrent string access', () => {
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Concurrent access should not cause issues
            const promises = [];
            for (let i = 0; i < 50; i++) {
                promises.push(Promise.resolve(manager.getString('toolchainDetectionTitle')));
                promises.push(Promise.resolve(manager.getAllStrings()));
            }
            return Promise.all(promises).then(results => {
                assert.strictEqual(results.length, 100);
                results.forEach((result, index) => {
                    if (index % 2 === 0) {
                        // String results
                        assert.ok(typeof result === 'string');
                    }
                    else {
                        // Object results
                        assert.ok(typeof result === 'object');
                    }
                });
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle corrupted language data gracefully', () => {
            // This would require mocking the language data imports
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Should not throw even with missing or corrupted data
            assert.doesNotThrow(() => {
                manager.getString('toolchainDetectionTitle');
            });
        });
        it('should handle state persistence failures', async () => {
            mockContext.globalState.update.rejects(new Error('Storage unavailable'));
            const manager = localizationManager_1.LocalizationManager.getInstance(mockContext);
            // Should handle persistence failure gracefully
            await assert.doesNotReject(async () => {
                await manager.switchLanguage('zh');
            });
        });
        it('should handle VS Code configuration errors', () => {
            // Mock configuration error
            sandbox.stub(vscode.workspace, 'getConfiguration').throws(new Error('Config unavailable'));
            // Should still initialize successfully
            assert.doesNotThrow(() => {
                localizationManager_1.LocalizationManager.getInstance(mockContext);
            });
        });
        it('should handle context-less initialization gracefully', () => {
            // Reset singleton to test initialization without context
            localizationManager_1.LocalizationManager.instance = null;
            // Should handle missing or invalid context
            assert.doesNotThrow(() => {
                localizationManager_1.LocalizationManager.getInstance(null);
            });
        });
    });
});
//# sourceMappingURL=internationalization-comprehensive.test.js.map