/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 扩展配置状态持久化管理器
 * 提供STM32配置器界面状态的保存和恢复功能
 * 
 * @fileoverview 状态持久化管理器
 * @author 左岚
 * @since 0.2.6
 */

import * as vscode from 'vscode';

/**
 * 扩展配置状态接口
 * 定义需要持久化的配置项
 */
export interface ExtensionConfigurationState {
    /** 设备名称 */
    deviceName?: string;
    /** 可执行文件路径 */
    executablePath?: string;
    /** 服务器类型 (openocd | pyocd) */
    servertype?: 'openocd' | 'pyocd';
    /** OpenOCD路径 */
    openocdPath?: string;
    /** ARM工具链路径 */
    armToolchainPath?: string;
    /** 接口文件 */
    interfaceFile?: string;
    /** 目标文件 */
    targetFile?: string;
    /** SVD文件路径 */
    svdFilePath?: string;
    /** 适配器速度 */
    adapterSpeed?: string;
    /** ELF文件来源 (auto | manual) */
    elfSource?: 'auto' | 'manual';
    /** 实时监视配置 */
    liveWatch?: LiveWatchState;
    /** 界面显示语言 */
    language?: string;
}

/**
 * 实时监视状态接口
 */
export interface LiveWatchState {
    /** 是否启用实时监视 */
    enabled: boolean;
    /** 采样频率 (Hz) */
    samplesPerSecond?: number;
    /** 监视变量列表 */
    variables?: string[];
}

/**
 * 状态持久化管理器类
 * 负责扩展状态的保存、加载和管理
 */
export class StateManager {
    private static readonly STATE_KEY = 'stm32.configurator.state';
    private static readonly SCHEMA_VERSION = '1.0.0';
    
    /** VS Code扩展上下文 */
    private readonly context: vscode.ExtensionContext;
    
    /** 当前状态缓存 */
    private currentState: ExtensionConfigurationState = {};

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 保存当前配置状态到持久化存储
     * 使用workspaceState保存到工作区级别
     * 
     * @param state - 要保存的配置状态
     * @returns Promise<void>
     */
    async saveState(state: ExtensionConfigurationState): Promise<void> {
        try {
            // 合并当前状态
            this.currentState = { ...this.currentState, ...state };
            
            // 创建带版本信息的状态对象
            const stateWithMetadata = {
                version: StateManager.SCHEMA_VERSION,
                timestamp: Date.now(),
                state: this.currentState
            };
            
            // 保存到工作区状态
            await this.context.workspaceState.update(
                StateManager.STATE_KEY, 
                stateWithMetadata
            );
            
            console.log('Configuration state saved successfully:', {
                keys: Object.keys(state),
                timestamp: stateWithMetadata.timestamp
            });
            
        } catch (error) {
            console.error('Failed to save configuration state:', error);
            throw new Error(`状态保存失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 从持久化存储中加载配置状态
     * 支持版本兼容性检查和错误恢复
     * 
     * @returns Promise<ExtensionConfigurationState> 加载的配置状态
     */
    async loadState(): Promise<ExtensionConfigurationState> {
        try {
            const savedData = this.context.workspaceState.get<any>(StateManager.STATE_KEY);
            
            if (!savedData) {
                console.log('No saved configuration state found, using defaults');
                return {};
            }
            
            // 检查数据格式
            if (typeof savedData !== 'object') {
                console.warn('Invalid saved state format, using defaults');
                return {};
            }
            
            // 处理旧版本数据（直接保存的状态，无元数据）
            if (!savedData.version) {
                console.log('Loading legacy state format');
                this.currentState = this.migrateLegacyState(savedData);
                return { ...this.currentState };
            }
            
            // 版本兼容性检查
            if (!this.isCompatibleVersion(savedData.version)) {
                console.warn(`Incompatible state version: ${savedData.version}, using defaults`);
                return {};
            }
            
            // 验证状态数据完整性
            const state = savedData.state;
            if (!state || typeof state !== 'object') {
                console.warn('Invalid state data, using defaults');
                return {};
            }
            
            this.currentState = this.validateState(state);
            
            console.log('Configuration state loaded successfully:', {
                version: savedData.version,
                timestamp: savedData.timestamp,
                keys: Object.keys(this.currentState)
            });
            
            return { ...this.currentState };
            
        } catch (error) {
            console.error('Failed to load configuration state:', error);
            // 发生错误时返回默认状态，不抛出异常
            return {};
        }
    }

    /**
     * 清除保存的配置状态
     * 
     * @returns Promise<void>
     */
    async clearState(): Promise<void> {
        try {
            await this.context.workspaceState.update(StateManager.STATE_KEY, undefined);
            this.currentState = {};
            console.log('Configuration state cleared successfully');
        } catch (error) {
            console.error('Failed to clear configuration state:', error);
            throw new Error(`状态清除失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * 获取当前缓存的状态
     * 
     * @returns ExtensionConfigurationState 当前状态的副本
     */
    getCurrentState(): ExtensionConfigurationState {
        return { ...this.currentState };
    }

    /**
     * 更新特定配置项
     * 
     * @param key - 配置项键名
     * @param value - 配置项值
     * @returns Promise<void>
     */
    async updateStateItem<K extends keyof ExtensionConfigurationState>(
        key: K, 
        value: ExtensionConfigurationState[K]
    ): Promise<void> {
        const partialState = { [key]: value } as Partial<ExtensionConfigurationState>;
        await this.saveState(partialState);
    }

    /**
     * 批量更新配置项
     * 
     * @param updates - 配置更新对象
     * @returns Promise<void>
     */
    async batchUpdateState(updates: Partial<ExtensionConfigurationState>): Promise<void> {
        await this.saveState(updates);
    }

    /**
     * 检查版本兼容性
     * 
     * @private
     * @param version - 保存的版本号
     * @returns boolean 是否兼容
     */
    private isCompatibleVersion(version: string): boolean {
        const [majorSaved] = version.split('.').map(Number);
        const [majorCurrent] = StateManager.SCHEMA_VERSION.split('.').map(Number);
        
        // 主版本号相同则兼容
        return majorSaved === majorCurrent;
    }

    /**
     * 迁移旧版本状态数据
     * 
     * @private
     * @param legacyState - 旧版本状态数据
     * @returns ExtensionConfigurationState 迁移后的状态
     */
    private migrateLegacyState(legacyState: any): ExtensionConfigurationState {
        // 处理旧版本的状态结构
        const migratedState: ExtensionConfigurationState = {};
        
        // 只迁移已知的有效字段
        const validKeys: (keyof ExtensionConfigurationState)[] = [
            'deviceName', 'executablePath', 'servertype', 'openocdPath', 
            'armToolchainPath', 'interfaceFile', 'targetFile', 'svdFilePath', 
            'adapterSpeed', 'elfSource', 'language'
        ];
        
        validKeys.forEach(key => {
            if (legacyState[key] !== undefined) {
                migratedState[key] = legacyState[key];
            }
        });
        
        // 特殊处理实时监视配置
        if (legacyState.liveWatch && typeof legacyState.liveWatch === 'object') {
            migratedState.liveWatch = this.validateLiveWatchState(legacyState.liveWatch);
        }
        
        return migratedState;
    }

    /**
     * 验证状态数据的有效性
     * 
     * @private
     * @param state - 待验证的状态
     * @returns ExtensionConfigurationState 验证后的状态
     */
    private validateState(state: any): ExtensionConfigurationState {
        const validatedState: ExtensionConfigurationState = {};
        
        // 验证字符串字段
        const stringFields: (keyof ExtensionConfigurationState)[] = [
            'deviceName', 'executablePath', 'openocdPath', 'armToolchainPath',
            'interfaceFile', 'targetFile', 'svdFilePath', 'adapterSpeed', 'language'
        ];
        
        stringFields.forEach(field => {
            if (typeof state[field] === 'string' && (state[field] as string).length > 0) {
                (validatedState as any)[field] = state[field];
            }
        });
        
        // 验证枚举字段
        if (state.servertype === 'openocd' || state.servertype === 'pyocd') {
            validatedState.servertype = state.servertype;
        }
        
        if (state.elfSource === 'auto' || state.elfSource === 'manual') {
            validatedState.elfSource = state.elfSource;
        }
        
        // 验证实时监视配置
        if (state.liveWatch && typeof state.liveWatch === 'object') {
            validatedState.liveWatch = this.validateLiveWatchState(state.liveWatch);
        }
        
        return validatedState;
    }

    /**
     * 验证实时监视状态
     * 
     * @private
     * @param liveWatch - 待验证的实时监视配置
     * @returns LiveWatchState 验证后的实时监视配置
     */
    private validateLiveWatchState(liveWatch: any): LiveWatchState {
        const validated: LiveWatchState = {
            enabled: Boolean(liveWatch.enabled)
        };
        
        if (typeof liveWatch.samplesPerSecond === 'number' && 
            liveWatch.samplesPerSecond > 0 && 
            liveWatch.samplesPerSecond <= 1000) {
            validated.samplesPerSecond = liveWatch.samplesPerSecond;
        }
        
        if (Array.isArray(liveWatch.variables)) {
            validated.variables = liveWatch.variables
                .filter((v: any) => typeof v === 'string' && v.trim().length > 0)
                .map((v: any) => v.trim());
        }
        
        return validated;
    }

    /**
     * 获取状态存储统计信息
     * 
     * @returns 存储统计信息
     */
    getStorageInfo(): {
        hasStoredState: boolean;
        currentStateKeys: string[];
        stateSize: number;
    } {
        const savedData = this.context.workspaceState.get<any>(StateManager.STATE_KEY);
        
        return {
            hasStoredState: !!savedData,
            currentStateKeys: Object.keys(this.currentState),
            stateSize: savedData ? JSON.stringify(savedData).length : 0
        };
    }
}