/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 配置验证逻辑独立测试
 * 测试配置验证功能，不依赖VSCode API
 * 
 * @fileoverview 配置验证逻辑测试
 * @author 左岚
 * @since 0.2.3
 */

import * as assert from 'assert';

// 直接导入验证逻辑，避免VSCode依赖
interface ToolchainSettings {
    openocdPath?: string;
    armToolchainPath?: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// 复制验证逻辑（独立于VSCode）
function validateToolchainSettingsStandalone(config: ToolchainSettings): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证配置对象不为空
    if (!config || typeof config !== 'object') {
        errors.push('Configuration object is required');
        return { isValid: false, errors, warnings };
    }

    // 验证OpenOCD路径
    if (config.openocdPath !== undefined) {
        if (typeof config.openocdPath !== 'string') {
            errors.push('OpenOCD path must be a string');
        } else if (config.openocdPath.trim() === '') {
            warnings.push('OpenOCD path is empty');
        }
    }

    // 验证ARM工具链路径
    if (config.armToolchainPath !== undefined) {
        if (typeof config.armToolchainPath !== 'string') {
            errors.push('ARM toolchain path must be a string');
        } else if (config.armToolchainPath.trim() === '') {
            warnings.push('ARM toolchain path is empty');
        }
    }

    // 至少需要一个配置项
    if (!config.openocdPath && !config.armToolchainPath) {
        errors.push('At least one toolchain configuration is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

describe('Toolchain Settings Validation', () => {
    describe('validateToolchainSettings', () => {
        it('should validate valid configuration', () => {
            const config: ToolchainSettings = {
                openocdPath: 'C:/OpenOCD/bin/openocd.exe',
                armToolchainPath: 'C:/gcc-arm-none-eabi/bin'
            };

            const result = validateToolchainSettingsStandalone(config);
            
            assert.strictEqual(result.isValid, true);
            assert.strictEqual(result.errors.length, 0);
        });

        it('should reject null or undefined config', () => {
            const result1 = validateToolchainSettingsStandalone(null as any);
            const result2 = validateToolchainSettingsStandalone(undefined as any);
            
            assert.strictEqual(result1.isValid, false);
            assert.strictEqual(result2.isValid, false);
            assert.ok(result1.errors.some(e => e.includes('Configuration object is required')));
        });

        it('should reject non-string path values', () => {
            const config: ToolchainSettings = {
                openocdPath: 123 as any,
                armToolchainPath: true as any
            };

            const result = validateToolchainSettingsStandalone(config);
            
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('OpenOCD path must be a string')));
            assert.ok(result.errors.some(e => e.includes('ARM toolchain path must be a string')));
        });

        it('should warn about empty paths', () => {
            const config: ToolchainSettings = {
                openocdPath: '',
                armToolchainPath: '   '
            };

            const result = validateToolchainSettingsStandalone(config);
            
            // Empty strings should generate warnings, not errors
            assert.ok(result.warnings.some(w => w.includes('OpenOCD path is empty')));
            assert.ok(result.warnings.some(w => w.includes('ARM toolchain path is empty')));
        });

        it('should require at least one configuration', () => {
            const config: ToolchainSettings = {};

            const result = validateToolchainSettingsStandalone(config);
            
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

            const result1 = validateToolchainSettingsStandalone(config1);
            const result2 = validateToolchainSettingsStandalone(config2);
            
            // Both should be valid as they have at least one configuration
            assert.strictEqual(result1.isValid, true);
            assert.strictEqual(result2.isValid, true);
        });

        it('should handle mixed valid and invalid paths', () => {
            const config: ToolchainSettings = {
                openocdPath: 'C:/OpenOCD/bin/openocd.exe', // Valid
                armToolchainPath: 123 as any // Invalid
            };

            const result = validateToolchainSettingsStandalone(config);
            
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('ARM toolchain path must be a string')));
        });

        it('should handle whitespace-only paths', () => {
            const config: ToolchainSettings = {
                openocdPath: '   \t\n   ', // Whitespace only
                armToolchainPath: 'C:/gcc-arm-none-eabi/bin' // Valid
            };

            const result = validateToolchainSettingsStandalone(config);
            
            // Should pass validation but generate warning
            assert.strictEqual(result.isValid, true);
            assert.ok(result.warnings.some(w => w.includes('OpenOCD path is empty')));
        });
    });
});