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
exports.expandPath = expandPath;
exports.normalizePath = normalizePath;
exports.isValidExecutablePath = isValidExecutablePath;
exports.buildExecutablePath = buildExecutablePath;
/**
 * 路径处理工具模块
 * 提供跨平台路径处理、环境变量展开和通配符解析功能
 *
 * @fileoverview 路径处理工具类
 * @author 左岚
 * @since 0.2.3
 */
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * 展开路径中的环境变量和通配符
 * 解析路径中的%VAR%格式环境变量和*通配符
 *
 * @param pathStr - 包含环境变量或通配符的路径字符串
 * @returns 展开后的路径数组，如果包含通配符则可能返回多个路径
 * @example
 * ```typescript
 * expandPath('%USERPROFILE%\\Tools\\bin\\executable.exe');
 * expandPath('C:\\Program Files\\Tool\\*\\bin\\executable.exe');
 * ```
 */
function expandPath(pathStr) {
    // Expand environment variables
    let expanded = pathStr.replace(/%([^%]+)%/g, (_, varName) => {
        return process.env[varName] || '';
    });
    // Handle USERPROFILE and LOCALAPPDATA specifically
    expanded = expanded.replace(/\$\{USERPROFILE\}/g, os.homedir());
    expanded = expanded.replace(/\$\{LOCALAPPDATA\}/g, process.env.LOCALAPPDATA || '');
    // If path contains wildcards, try to resolve them
    if (expanded.includes('*')) {
        return resolveWildcardPath(expanded);
    }
    return [expanded];
}
/**
 * 解析包含通配符的路径
 * 处理路径中的*通配符，返回匹配的真实路径
 *
 * @param pathWithWildcard - 包含*通配符的路径
 * @returns 匹配的路径数组，按版本倒序排列
 * @private
 */
function resolveWildcardPath(pathWithWildcard) {
    try {
        const basePath = pathWithWildcard.substring(0, pathWithWildcard.indexOf('*'));
        const pattern = pathWithWildcard.substring(pathWithWildcard.indexOf('*'));
        const baseDir = path.dirname(basePath);
        if (fs.existsSync(baseDir)) {
            const entries = fs.readdirSync(baseDir);
            const matches = [];
            for (const entry of entries) {
                const testPath = path.join(baseDir, entry, pattern.substring(1));
                if (fs.existsSync(testPath)) {
                    matches.push(testPath);
                }
            }
            return matches.sort().reverse(); // 返回最新版本优先
        }
    }
    catch (error) {
        // Ignore glob expansion errors
    }
    return [];
}
/**
 * 路径标准化函数
 * 将Windows风格的反斜杠路径转换为正斜杠，并处理路径格式
 *
 * @param inputPath - 输入的文件路径
 * @returns 标准化后的路径，使用正斜杠分隔符
 * @example
 * ```typescript
 * normalizePath('C:\\Program Files\\tool\\bin\\executable.exe');
 * // 返回: 'C:/Program Files/tool/bin/executable.exe'
 * ```
 */
function normalizePath(inputPath) {
    if (!inputPath) {
        return '';
    }
    // 将反斜杠转换为正斜杠
    let normalized = inputPath.replace(/\\/g, '/');
    // 处理重复的斜杠
    normalized = normalized.replace(/\/+/g, '/');
    // 移除末尾的斜杠（除非是根路径）
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }
    return normalized;
}
/**
 * 检查文件路径是否存在且为文件
 * 安全地检查路径有效性，避免异常抛出
 *
 * @param filePath - 要检查的文件路径
 * @returns 如果路径存在且为文件则返回true，否则返回false
 */
function isValidExecutablePath(filePath) {
    try {
        if (!filePath) {
            return false;
        }
        const normalizedPath = normalizePath(filePath);
        return fs.existsSync(normalizedPath) && fs.statSync(normalizedPath).isFile();
    }
    catch {
        return false;
    }
}
/**
 * 构建可执行文件路径
 * 根据平台自动添加正确的可执行文件扩展名
 *
 * @param basePath - 基础路径（通常是bin目录）
 * @param executableName - 可执行文件名（不含扩展名）
 * @returns 完整的可执行文件路径
 */
function buildExecutablePath(basePath, executableName) {
    const extension = process.platform === 'win32' ? '.exe' : '';
    const fullName = executableName + extension;
    return path.join(basePath, fullName);
}
//# sourceMappingURL=pathUtils.js.map