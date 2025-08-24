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
 * 配置验证逻辑独立测试
 * 测试配置验证功能，不依赖VSCode API
 *
 * @fileoverview 配置验证逻辑测试
 * @author 左岚
 * @since 0.2.3
 */
const assert = __importStar(require("assert"));
// 复制验证逻辑（独立于VSCode）
function validateToolchainSettingsStandalone(config) {
    const errors = [];
    const warnings = [];
    // 验证配置对象不为空
    if (!config || typeof config !== 'object') {
        errors.push('Configuration object is required');
        return { isValid: false, errors, warnings };
    }
    // 验证OpenOCD路径
    if (config.openocdPath !== undefined) {
        if (typeof config.openocdPath !== 'string') {
            errors.push('OpenOCD path must be a string');
        }
        else if (config.openocdPath.trim() === '') {
            warnings.push('OpenOCD path is empty');
        }
    }
    // 验证ARM工具链路径
    if (config.armToolchainPath !== undefined) {
        if (typeof config.armToolchainPath !== 'string') {
            errors.push('ARM toolchain path must be a string');
        }
        else if (config.armToolchainPath.trim() === '') {
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
            const config = {
                openocdPath: 'C:/OpenOCD/bin/openocd.exe',
                armToolchainPath: 'C:/gcc-arm-none-eabi/bin'
            };
            const result = validateToolchainSettingsStandalone(config);
            assert.strictEqual(result.isValid, true);
            assert.strictEqual(result.errors.length, 0);
        });
        it('should reject null or undefined config', () => {
            const result1 = validateToolchainSettingsStandalone(null);
            const result2 = validateToolchainSettingsStandalone(undefined);
            assert.strictEqual(result1.isValid, false);
            assert.strictEqual(result2.isValid, false);
            assert.ok(result1.errors.some(e => e.includes('Configuration object is required')));
        });
        it('should reject non-string path values', () => {
            const config = {
                openocdPath: 123,
                armToolchainPath: true
            };
            const result = validateToolchainSettingsStandalone(config);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('OpenOCD path must be a string')));
            assert.ok(result.errors.some(e => e.includes('ARM toolchain path must be a string')));
        });
        it('should warn about empty paths', () => {
            const config = {
                openocdPath: '',
                armToolchainPath: '   '
            };
            const result = validateToolchainSettingsStandalone(config);
            // Empty strings should generate warnings, not errors
            assert.ok(result.warnings.some(w => w.includes('OpenOCD path is empty')));
            assert.ok(result.warnings.some(w => w.includes('ARM toolchain path is empty')));
        });
        it('should require at least one configuration', () => {
            const config = {};
            const result = validateToolchainSettingsStandalone(config);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('At least one toolchain configuration is required')));
        });
        it('should handle partial configuration', () => {
            const config1 = {
                openocdPath: 'C:/OpenOCD/bin/openocd.exe'
            };
            const config2 = {
                armToolchainPath: 'C:/gcc-arm-none-eabi/bin'
            };
            const result1 = validateToolchainSettingsStandalone(config1);
            const result2 = validateToolchainSettingsStandalone(config2);
            // Both should be valid as they have at least one configuration
            assert.strictEqual(result1.isValid, true);
            assert.strictEqual(result2.isValid, true);
        });
        it('should handle mixed valid and invalid paths', () => {
            const config = {
                openocdPath: 'C:/OpenOCD/bin/openocd.exe', // Valid
                armToolchainPath: 123 // Invalid
            };
            const result = validateToolchainSettingsStandalone(config);
            assert.strictEqual(result.isValid, false);
            assert.ok(result.errors.some(e => e.includes('ARM toolchain path must be a string')));
        });
        it('should handle whitespace-only paths', () => {
            const config = {
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
//# sourceMappingURL=validation.test.js.map