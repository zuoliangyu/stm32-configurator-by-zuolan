/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 数据提供器类型定义模块
 * 定义用于调试配置和最近配置的数据结构
 * 
 * @fileoverview 数据提供器类型定义
 * @author 左岚
 * @since 0.1.0
 */

/**
 * 调试配置接口
 * 定义STM32调试配置的基本结构
 * 
 * @interface DebugConfiguration
 * @since 0.1.0
 */
export interface DebugConfiguration {
    /** 配置名称，在launch.json中显示的名称 */
    name: string;
    
    /** 调试器类型，通常为'cortex-debug' */
    type: string;
    
    /** 调试服务器类型，可选值为'openocd'或'pyocd' */
    servertype?: string;
    
    /** STM32设备型号 */
    device?: string;
    
    /** 可执行文件路径 */
    executable?: string;
}

/**
 * 最近使用的配置接口
 * 存储用户最近创建或使用的调试配置信息
 * 
 * @interface RecentConfig
 * @since 0.2.0
 */
export interface RecentConfig {
    /** 配置名称 */
    name: string;
    
    /** 设备名称 */
    deviceName: string;
    
    /** 创建时间戳，用于排序和过期判断 */
    timestamp: number;
}