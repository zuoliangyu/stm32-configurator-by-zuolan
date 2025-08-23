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
exports.LocalizationManager = void 0;
/**
 * 本地化管理器模块
 * 提供多语言支持和本地化字符串管理功能
 * 支持中文和英文两种语言，可自动检测VS Code语言设置
 *
 * @fileoverview 本地化管理器
 * @author 左岚
 * @since 0.1.0
 */
const vscode = __importStar(require("vscode"));
const en_1 = require("./en");
const zh_1 = require("./zh");
/**
 * 本地化管理器类
 * 单例模式实现的本地化管理器，管理扩展的多语言支持
 *
 * @class LocalizationManager
 * @since 0.1.0
 */
class LocalizationManager {
    /** 单例实例 */
    static instance;
    /** 当前语言设置 */
    currentLanguage = 'en';
    /** 当前语言的本地化字符串 */
    strings = en_1.en;
    /** VS Code扩展上下文 */
    context;
    /**
     * 私有构造函数
     * 初始化本地化管理器并加载保存的语言设置
     *
     * @private
     * @param context - VS Code扩展上下文
     */
    constructor(context) {
        this.context = context;
        this.loadLanguage();
    }
    /**
     * 获取本地化管理器的单例实例
     * 如果实例不存在且提供了context，则创建新实例
     *
     * @param context - VS Code扩展上下文（只在首次创建时需要）
     * @returns 本地化管理器实例
     * @example
     * ```typescript
     * // 首次创建时需要提供context
     * const manager = LocalizationManager.getInstance(context);
     * // 后续使用时可以不提供
     * const manager2 = LocalizationManager.getInstance();
     * ```
     */
    static getInstance(context) {
        if (!LocalizationManager.instance && context) {
            LocalizationManager.instance = new LocalizationManager(context);
        }
        return LocalizationManager.instance;
    }
    /**
     * 获取当前语言设置
     *
     * @returns 当前语言的标识符
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    /**
     * 切换语言
     * 切换扩展的显示语言并保存设置
     *
     * @param language - 目标语言的标识符
     * @example
     * ```typescript
     * manager.switchLanguage('zh'); // 切换到中文
     * manager.switchLanguage('en'); // 切换到英文
     * ```
     */
    switchLanguage(language) {
        this.currentLanguage = language;
        this.strings = language === 'zh' ? zh_1.zh : en_1.en;
        this.saveLanguage();
    }
    /**
     * 获取本地化字符串
     * 根据键名获取当前语言对应的本地化字符串
     *
     * @param key - 本地化字符串的键名
     * @returns 本地化后的字符串
     * @example
     * ```typescript
     * const message = manager.getString('configGenerated');
     * ```
     */
    getString(key) {
        return this.strings[key];
    }
    /**
     * 格式化本地化字符串
     * 获取本地化字符串并使用提供的参数进行格式化
     * 支持{0}, {1}等占位符替换
     *
     * @param key - 本地化字符串的键名
     * @param args - 用于替换占位符的参数数组
     * @returns 格式化后的字符串
     * @example
     * ```typescript
     * // 假设模板为: "Configuration {0} saved for device {1}"
     * const message = manager.formatString('configSaved', 'Debug Config', 'STM32F407');
     * // 结果: "Configuration Debug Config saved for device STM32F407"
     * ```
     */
    formatString(key, ...args) {
        let str = this.strings[key];
        args.forEach((arg, index) => {
            str = str.replace(`{${index}}`, arg);
        });
        return str;
    }
    /**
     * 获取所有本地化字符串
     * 返回当前语言的所有本地化字符串的副本
     *
     * @returns 当前语言的所有本地化字符串对象
     */
    getAllStrings() {
        return { ...this.strings };
    }
    /**
     * 加载语言设置
     * 从保存的设置中加载语言，如果没有保存则自动检测VS Code的语言设置
     *
     * @private
     */
    loadLanguage() {
        const savedLanguage = this.context.globalState.get('stm32-configurator.language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
            this.switchLanguage(savedLanguage);
        }
        else {
            // Auto-detect from VS Code locale
            const locale = vscode.env.language;
            if (locale.startsWith('zh')) {
                this.switchLanguage('zh');
            }
            else {
                this.switchLanguage('en');
            }
        }
    }
    /**
     * 保存语言设置
     * 将当前语言设置保存到扩展的全局状态中
     *
     * @private
     */
    saveLanguage() {
        this.context.globalState.update('stm32-configurator.language', this.currentLanguage);
    }
}
exports.LocalizationManager = LocalizationManager;
//# sourceMappingURL=localizationManager.js.map