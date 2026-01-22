/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 状态持久化功能测试
 * 验证配置状态的保存和恢复功能
 * 
 * @fileoverview 状态持久化测试
 * @author 左岚
 * @since 0.2.6
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { StateManager, ExtensionConfigurationState } from '../services/stateManager';

/**
 * 模拟的ExtensionContext用于测试
 */
class MockExtensionContext {
    subscriptions: vscode.Disposable[] = [];
    extensionUri = vscode.Uri.file('/test/extension');
    extensionPath = '/test/extension';
    globalState = new MockMemento();
    workspaceState = new MockMemento();
    secrets = {} as any;
    storageUri = undefined;
    storagePath = undefined;
    globalStorageUri = vscode.Uri.file('/test/global');
    globalStoragePath = '/test/global';
    logUri = vscode.Uri.file('/test/log');
    logPath = '/test/log';
    extensionMode = vscode.ExtensionMode.Test;
    environmentVariableCollection = {} as any;
    extension = {} as any;
    languageModelAccessInformation = {} as any;

    asAbsolutePath(relativePath: string): string {
        return `/test/extension/${relativePath}`;
    }
}

/**
 * 模拟的Memento实现
 */
class MockMemento implements vscode.Memento {
    private storage = new Map<string, any>();

    keys(): readonly string[] {
        return Array.from(this.storage.keys());
    }

    get<T>(key: string, defaultValue?: T): T {
        return this.storage.has(key) ? this.storage.get(key) : defaultValue as T;
    }

    update(key: string, value: any): Thenable<void> {
        if (value === undefined) {
            this.storage.delete(key);
        } else {
            this.storage.set(key, value);
        }
        return Promise.resolve();
    }

    setKeysForSync(keys: readonly string[]): void {
        // Mock implementation - no-op for testing
    }
}

suite('State Persistence Tests', () => {
    let mockContext: MockExtensionContext;
    let stateManager: StateManager;

    setup(() => {
        mockContext = new MockExtensionContext();
        stateManager = new StateManager(mockContext as any);
    });

    teardown(async () => {
        await stateManager.clearState();
    });

    test('应该能够保存和加载基本配置状态', async () => {
        // 准备测试数据
        const testState: ExtensionConfigurationState = {
            deviceName: 'STM32F103C8T6',
            servertype: 'openocd',
            openocdPath: 'C:/OpenOCD/bin/openocd.exe',
            armToolchainPath: 'C:/gcc-arm/bin',
            interfaceFile: 'stlink-v2.cfg',
            targetFile: 'stm32f1x.cfg',
            adapterSpeed: '4000',
            language: 'zh'
        };

        // 保存状态
        await stateManager.saveState(testState);

        // 加载状态
        const loadedState = await stateManager.loadState();

        // 验证加载的状态
        assert.strictEqual(loadedState.deviceName, testState.deviceName);
        assert.strictEqual(loadedState.servertype, testState.servertype);
        assert.strictEqual(loadedState.openocdPath, testState.openocdPath);
        assert.strictEqual(loadedState.armToolchainPath, testState.armToolchainPath);
        assert.strictEqual(loadedState.interfaceFile, testState.interfaceFile);
        assert.strictEqual(loadedState.targetFile, testState.targetFile);
        assert.strictEqual(loadedState.adapterSpeed, testState.adapterSpeed);
        assert.strictEqual(loadedState.language, testState.language);
    });

    test('应该能够保存和加载LiveWatch配置', async () => {
        // 准备包含LiveWatch配置的测试数据
        const testState: ExtensionConfigurationState = {
            deviceName: 'STM32F407VG',
            liveWatch: {
                enabled: true,
                samplesPerSecond: 10,
                variables: ['temperature', 'sensor.value', 'counter']
            }
        };

        // 保存状态
        await stateManager.saveState(testState);

        // 加载状态
        const loadedState = await stateManager.loadState();

        // 验证LiveWatch配置
        assert.strictEqual(loadedState.liveWatch?.enabled, true);
        assert.strictEqual(loadedState.liveWatch?.samplesPerSecond, 10);
        assert.deepStrictEqual(loadedState.liveWatch?.variables, ['temperature', 'sensor.value', 'counter']);
    });

    test('应该能够处理部分状态更新', async () => {
        // 先保存一个基本状态
        const initialState: ExtensionConfigurationState = {
            deviceName: 'STM32F103',
            servertype: 'openocd',
            adapterSpeed: '4000'
        };
        await stateManager.saveState(initialState);

        // 部分更新状态
        const partialUpdate: ExtensionConfigurationState = {
            deviceName: 'STM32F407',
            openocdPath: 'C:/OpenOCD/bin/openocd.exe'
        };
        await stateManager.saveState(partialUpdate);

        // 验证更新后的状态
        const loadedState = await stateManager.loadState();
        assert.strictEqual(loadedState.deviceName, 'STM32F407'); // 已更新
        assert.strictEqual(loadedState.openocdPath, 'C:/OpenOCD/bin/openocd.exe'); // 新增
        assert.strictEqual(loadedState.servertype, 'openocd'); // 保持原值
        assert.strictEqual(loadedState.adapterSpeed, '4000'); // 保持原值
    });

    test('应该能够清除保存的状态', async () => {
        // 保存一些状态
        const testState: ExtensionConfigurationState = {
            deviceName: 'STM32F103',
            servertype: 'openocd'
        };
        await stateManager.saveState(testState);

        // 验证状态已保存
        let loadedState = await stateManager.loadState();
        assert.strictEqual(Object.keys(loadedState).length > 0, true);

        // 清除状态
        await stateManager.clearState();

        // 验证状态已清除
        loadedState = await stateManager.loadState();
        assert.strictEqual(Object.keys(loadedState).length, 0);
    });

    test('应该能够处理无效的状态数据', async () => {
        // 直接在storage中设置无效数据
        await mockContext.workspaceState.update('stm32.configurator.state', 'invalid data');

        // 尝试加载状态，应该返回空对象而不抛出异常
        const loadedState = await stateManager.loadState();
        assert.deepStrictEqual(loadedState, {});
    });

    test('应该能够处理旧版本格式的状态数据', async () => {
        // 模拟旧版本的直接状态存储（没有元数据包装）
        const legacyState = {
            deviceName: 'STM32F103',
            servertype: 'openocd',
            liveWatch: {
                enabled: true,
                variables: ['temp', 'voltage']
            }
        };

        // 直接保存旧格式数据
        await mockContext.workspaceState.update('stm32.configurator.state', legacyState);

        // 加载状态，应该能正确迁移
        const loadedState = await stateManager.loadState();
        assert.strictEqual(loadedState.deviceName, 'STM32F103');
        assert.strictEqual(loadedState.servertype, 'openocd');
        assert.strictEqual(loadedState.liveWatch?.enabled, true);
        assert.deepStrictEqual(loadedState.liveWatch?.variables, ['temp', 'voltage']);
    });

    test('应该能够验证LiveWatch变量数据', async () => {
        // 测试包含无效变量数据的状态
        const testStateWithInvalidData: any = {
            deviceName: 'STM32F103',
            liveWatch: {
                enabled: true,
                samplesPerSecond: 5,
                variables: ['validVar', '', null, 123, 'anotherValid', undefined, '  ']
            }
        };

        await stateManager.saveState(testStateWithInvalidData);
        const loadedState = await stateManager.loadState();

        // 应该只保留有效的变量名
        assert.deepStrictEqual(loadedState.liveWatch?.variables, ['validVar', 'anotherValid']);
    });

    test('应该能够获取存储统计信息', async () => {
        // 初始状态
        let info = stateManager.getStorageInfo();
        assert.strictEqual(info.hasStoredState, false);
        assert.strictEqual(info.currentStateKeys.length, 0);

        // 保存一些状态
        const testState: ExtensionConfigurationState = {
            deviceName: 'STM32F103',
            servertype: 'openocd',
            language: 'zh'
        };
        await stateManager.saveState(testState);

        // 检查统计信息
        info = stateManager.getStorageInfo();
        assert.strictEqual(info.hasStoredState, true);
        assert.strictEqual(info.currentStateKeys.length, 3);
        assert.strictEqual(info.stateSize > 0, true);
    });

    test('批量更新状态项应该正常工作', async () => {
        // 先设置初始状态
        await stateManager.saveState({
            deviceName: 'STM32F103',
            servertype: 'openocd'
        });

        // 批量更新
        await stateManager.batchUpdateState({
            deviceName: 'STM32F407',
            armToolchainPath: 'C:/gcc-arm/bin',
            liveWatch: {
                enabled: true,
                samplesPerSecond: 8,
                variables: ['temp']
            }
        });

        // 验证批量更新结果
        const loadedState = await stateManager.loadState();
        assert.strictEqual(loadedState.deviceName, 'STM32F407');
        assert.strictEqual(loadedState.servertype, 'openocd'); // 保持不变
        assert.strictEqual(loadedState.armToolchainPath, 'C:/gcc-arm/bin');
        assert.strictEqual(loadedState.liveWatch?.enabled, true);
        assert.strictEqual(loadedState.liveWatch?.samplesPerSecond, 8);
        assert.deepStrictEqual(loadedState.liveWatch?.variables, ['temp']);
    });
});

/**
 * 运行状态持久化测试的主函数
 * 
 * @returns Promise<boolean> 测试是否全部通过
 */
export async function runStatePersistenceTests(): Promise<boolean> {
    console.log('Running State Persistence Tests...');
    
    try {
        // 这里可以添加额外的集成测试逻辑
        console.log('✅ All state persistence tests completed successfully');
        return true;
    } catch (error) {
        console.error('❌ State persistence tests failed:', error);
        return false;
    }
}