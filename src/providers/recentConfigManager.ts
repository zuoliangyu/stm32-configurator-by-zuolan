/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as vscode from 'vscode';
import { RecentConfig } from './types';

export class RecentConfigManager {
    private recentConfigs: RecentConfig[] = [];
    private readonly maxRecentConfigs = 5;
    private readonly storageKey = 'stm32.recentConfigs';

    constructor(private context: vscode.ExtensionContext) {
        this.loadRecentConfigs();
    }

    public getRecentConfigs(): RecentConfig[] {
        return [...this.recentConfigs];
    }

    public hasRecentConfigs(): boolean {
        return this.recentConfigs.length > 0;
    }

    public addRecentConfig(name: string, deviceName: string): void {
        const timestamp = Date.now();
        
        // Remove existing entry if it exists
        this.recentConfigs = this.recentConfigs.filter(config => config.name !== name);
        
        // Add new entry at the beginning
        this.recentConfigs.unshift({ name, deviceName, timestamp });
        
        // Keep only the most recent configs
        if (this.recentConfigs.length > this.maxRecentConfigs) {
            this.recentConfigs = this.recentConfigs.slice(0, this.maxRecentConfigs);
        }
        
        this.saveRecentConfigs();
    }

    private loadRecentConfigs(): void {
        try {
            const stored = this.context.globalState.get<RecentConfig[]>(this.storageKey, []);
            this.recentConfigs = stored;
        } catch (error) {
            console.error('Error loading recent configurations:', error);
            this.recentConfigs = [];
        }
    }

    private saveRecentConfigs(): void {
        try {
            this.context.globalState.update(this.storageKey, this.recentConfigs);
        } catch (error) {
            console.error('Error saving recent configurations:', error);
        }
    }
}