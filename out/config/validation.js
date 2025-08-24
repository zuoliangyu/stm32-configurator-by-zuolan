"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToolchainSettings = validateToolchainSettings;
/**
 * 配置验证逻辑模块
 * 提供工具链配置的验证功能
 *
 * @fileoverview 配置验证逻辑
 * @author 左岚
 * @since 0.2.3
 */
const pathUtils_1 = require("../utils/pathUtils");
/**
 * 验证工具链配置的有效性
 * 检查路径格式和文件存在性
 *
 * @param config - 要验证的工具链配置
 * @returns 验证结果，包含错误和警告信息
 * @example
 * ```typescript
 * const result = validateToolchainSettings(config);
 * if (!result.isValid) {
 *     console.error('Validation errors:', result.errors);
 * }
 * ```
 */
function validateToolchainSettings(config) {
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
        else if (!(0, pathUtils_1.isValidExecutablePath)(config.openocdPath)) {
            warnings.push(`OpenOCD executable not found at: ${config.openocdPath}`);
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
        else {
            // ARM工具链路径通常是bin目录，不是可执行文件
            const normalizedPath = (0, pathUtils_1.normalizePath)(config.armToolchainPath);
            // 这里可以添加更复杂的ARM工具链验证逻辑
            if (normalizedPath.length === 0) {
                errors.push('Invalid ARM toolchain path format');
            }
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
//# sourceMappingURL=validation.js.map