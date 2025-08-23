/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LocalizedStrings } from './index';
import { en } from './en';
import { zh } from './zh';

export type SupportedLanguage = 'en' | 'zh';

export class LocalizationManager {
    private static instance: LocalizationManager;
    private currentLanguage: SupportedLanguage = 'en';
    private strings: LocalizedStrings = en;
    private context: vscode.ExtensionContext;
    
    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadLanguage();
    }
    
    public static getInstance(context?: vscode.ExtensionContext): LocalizationManager {
        if (!LocalizationManager.instance && context) {
            LocalizationManager.instance = new LocalizationManager(context);
        }
        return LocalizationManager.instance;
    }
    
    public getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }
    
    public switchLanguage(language: SupportedLanguage): void {
        this.currentLanguage = language;
        this.strings = language === 'zh' ? zh : en;
        this.saveLanguage();
    }
    
    public getString(key: keyof LocalizedStrings): string {
        return this.strings[key];
    }
    
    public formatString(key: keyof LocalizedStrings, ...args: string[]): string {
        let str = this.strings[key];
        args.forEach((arg, index) => {
            str = str.replace(`{${index}}`, arg);
        });
        return str;
    }
    
    public getAllStrings(): LocalizedStrings {
        return { ...this.strings };
    }
    
    private loadLanguage(): void {
        const savedLanguage = this.context.globalState.get<SupportedLanguage>('stm32-configurator.language');
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
            this.switchLanguage(savedLanguage);
        } else {
            // Auto-detect from VS Code locale
            const locale = vscode.env.language;
            if (locale.startsWith('zh')) {
                this.switchLanguage('zh');
            } else {
                this.switchLanguage('en');
            }
        }
    }
    
    private saveLanguage(): void {
        this.context.globalState.update('stm32-configurator.language', this.currentLanguage);
    }
}