/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 数据提供器模块导出
 * 统一导出所有数据提供器相关的类型和类，便于外部模块导入使用
 * 
 * @fileoverview 数据提供器模块导出文件
 * @author 左岚
 * @since 0.1.0
 */

/**
 * 重新导出所有数据类型
 * 包括DebugConfiguration和RecentConfig接口
 */
export * from './types';

/**
 * 重新导出STM32树形项目类
 * 用于创建树形视图中的各种项目
 */
export { STM32TreeItem } from './stm32TreeItem';

/**
 * 重新导出STM32树形数据提供器类
 * VS Code扩展的主要数据提供器实现
 */
export { STM32TreeDataProvider } from './treeDataProvider';

/**
 * 重新导出最近配置管理器类
 * 管理用户最近使用的调试配置
 */
export { RecentConfigManager } from './recentConfigManager';