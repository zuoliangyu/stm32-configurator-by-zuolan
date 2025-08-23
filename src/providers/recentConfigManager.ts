/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 最近配置管理器模块
 * 负责管理用户最近使用的调试配置，包括存储、加载和排序
 * 
 * @fileoverview 最近配置管理器
 * @author 左岚
 * @since 0.2.0
 */

import * as vscode from 'vscode';
import { RecentConfig } from './types';

/**
 * 最近配置管理器类
 * 提供最近使用的STM32调试配置的管理功能
 * 
 * @class RecentConfigManager
 * @since 0.2.0
 */
export class RecentConfigManager {
    /** 最近配置列表 */
    private recentConfigs: RecentConfig[] = [];
    
    /** 最多保存的最近配置数量 */
    private readonly maxRecentConfigs = 5;
    
    /** 存储键名 */
    private readonly storageKey = 'stm32.recentConfigs';

    /**
     * 构造最近配置管理器
     * 
     * @param context - VS Code扩展上下文，用于存储和加载数据
     */
    constructor(private context: vscode.ExtensionContext) {
        this.loadRecentConfigs();
    }

    /**
     * 获取最近配置列表
     * 返回最近配置的副本，防止外部直接修改
     * 
     * @returns 最近配置数组的副本
     */
    public getRecentConfigs(): RecentConfig[] {
        return [...this.recentConfigs];
    }

    /**
     * 检查是否有最近配置
     * 
     * @returns 如果存在最近配置返回true，否则返回false
     */
    public hasRecentConfigs(): boolean {
        return this.recentConfigs.length > 0;
    }

    /**
     * 添加最近配置
     * 将新的调试配置添加到最近列表中，如果已存在相同名称的配置则更新其位置
     * 
     * @param name - 配置名称
     * @param deviceName - 设备名称
     * @example
     * ```typescript
     * manager.addRecentConfig('My STM32 Config', 'STM32F407VG');
     * ```
     */
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

    /**
     * 加载最近配置
     * 从扩展的全局状态中加载保存的最近配置
     * 
     * @private
     * @throws {Error} 当加载失败时记录错误并重置为空数组
     */
    private loadRecentConfigs(): void {
        try {
            const stored = this.context.globalState.get<RecentConfig[]>(this.storageKey, []);
            this.recentConfigs = stored;
        } catch (error) {
            console.error('Error loading recent configurations:', error);
            this.recentConfigs = [];
        }
    }

    /**
     * 保存最近配置
     * 将当前的最近配置列表保存到扩展的全局状态中
     * 
     * @private
     * @throws {Error} 当保存失败时记录错误信息
     */
    private saveRecentConfigs(): void {
        try {
            this.context.globalState.update(this.storageKey, this.recentConfigs);
        } catch (error) {
            console.error('Error saving recent configurations:', error);
        }
    }
}