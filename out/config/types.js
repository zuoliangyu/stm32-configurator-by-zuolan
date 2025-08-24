"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsError = void 0;
/**
 * 配置操作错误类
 * 封装配置读写操作中可能出现的各种错误
 */
class SettingsError extends Error {
    operation;
    originalError;
    constructor(message, operation, originalError) {
        super(message);
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'SettingsError';
    }
}
exports.SettingsError = SettingsError;
//# sourceMappingURL=types.js.map