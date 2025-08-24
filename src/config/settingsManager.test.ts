/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 配置管理器单元测试
 * 测试工具链配置的验证、读写操作
 * 
 * @fileoverview 配置管理器单元测试
 * @author 左岚
 * @since 0.2.3
 */

import * as assert from 'assert';
import { GlobalSettingsManager, validateToolchainSettings } from './settingsManager';
import { ToolchainSettings } from './types';

describe('GlobalSettingsManager', () => {
    let settingsManager: GlobalSettingsManager;
    
    beforeEach(() => {
        settingsManager = new GlobalSettingsManager();
    });

    describe('validateToolchainSettings', () => {
        it('should validate valid configuration', () => {
            const config: ToolchainSettings = {
                openocdPath: 'C:/OpenOCD/bin/openocd.exe',
                armToolchainPath: 'C:/gcc-arm-none-eabi/bin'
            };

            const result = settingsManager.validateToolchainSettings(config);
            
            assert.strictEqual(result.isValid, true);
            assert.strictEqual(result.errors.length, 0);
        });

        it('should reject null or undefined config', () => {
            const result1 = settingsManager.validateToolchainSettings(null as any);
            const result2 = settingsManager.validateToolchainSettings(undefined as any);
            
            assert.strictEqual(result1.isValid, false);
            assert.strictEqual(result2.isValid, false);
            assert.ok(result1.errors.some(e => e.includes('Configuration object is required')));
        });

        it('should reject non-string path values', () => {
            const config: ToolchainSettings = {
                openocdPath: 123 as any,
                armToolchainPath: true as any
            };

            const result = settingsManager.validateToolchainSettings(config);
            
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('OpenOCD path must be a string')));
            assert.ok(result.errors.some(e => e.includes('ARM toolchain path must be a string')));
        });

        it('should warn about empty paths', () => {
            const config: ToolchainSettings = {
                openocdPath: '',
                armToolchainPath: '   '
            };

            const result = settingsManager.validateToolchainSettings(config);
            
            // Empty strings should generate warnings, not errors
            assert.ok(result.warnings.some(w => w.includes('OpenOCD path is empty')));
            assert.ok(result.warnings.some(w => w.includes('ARM toolchain path is empty')));
        });

        it('should require at least one configuration', () => {
            const config: ToolchainSettings = {};

            const result = settingsManager.validateToolchainSettings(config);
            
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('At least one toolchain configuration is required')));
        });

        it('should handle partial configuration', () => {
            const config1: ToolchainSettings = {
                openocdPath: 'C:/OpenOCD/bin/openocd.exe'
            };
            
            const config2: ToolchainSettings = {
                armToolchainPath: 'C:/gcc-arm-none-eabi/bin'
            };

            const result1 = settingsManager.validateToolchainSettings(config1);
            const result2 = settingsManager.validateToolchainSettings(config2);
            
            // Both should be valid as they have at least one configuration
            assert.strictEqual(result1.isValid, true);
            assert.strictEqual(result2.isValid, true);
        });
    });

    // Note: VSCode API dependent tests are excluded from unit tests
    // Integration tests would be needed to fully test read/write operations
});

describe('Standalone validation function', () => {
    it('should work independently of class instance', () => {
        const config: ToolchainSettings = {
            openocdPath: 'C:/OpenOCD/bin/openocd.exe'
        };

        const result = validateToolchainSettings(config);
        
        assert.strictEqual(result.isValid, true);
        assert.strictEqual(result.errors.length, 0);
    });
});