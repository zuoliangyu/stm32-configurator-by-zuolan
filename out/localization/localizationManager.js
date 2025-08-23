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
const vscode = __importStar(require("vscode"));
const en_1 = require("./en");
const zh_1 = require("./zh");
class LocalizationManager {
    static instance;
    currentLanguage = 'en';
    strings = en_1.en;
    context;
    constructor(context) {
        this.context = context;
        this.loadLanguage();
    }
    static getInstance(context) {
        if (!LocalizationManager.instance && context) {
            LocalizationManager.instance = new LocalizationManager(context);
        }
        return LocalizationManager.instance;
    }
    getCurrentLanguage() {
        return this.currentLanguage;
    }
    switchLanguage(language) {
        this.currentLanguage = language;
        this.strings = language === 'zh' ? zh_1.zh : en_1.en;
        this.saveLanguage();
    }
    getString(key) {
        return this.strings[key];
    }
    formatString(key, ...args) {
        let str = this.strings[key];
        args.forEach((arg, index) => {
            str = str.replace(`{${index}}`, arg);
        });
        return str;
    }
    getAllStrings() {
        return { ...this.strings };
    }
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
    saveLanguage() {
        this.context.globalState.update('stm32-configurator.language', this.currentLanguage);
    }
}
exports.LocalizationManager = LocalizationManager;
//# sourceMappingURL=localizationManager.js.map