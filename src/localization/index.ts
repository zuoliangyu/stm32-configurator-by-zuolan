/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 本地化字符串接口模块
 * 定义扩展的本地化字符串结构，确保所有语言版本都包含相同的键
 * 用于约束中文和英文本地化文件的结构一致性
 * 
 * @fileoverview 本地化字符串接口定义
 * @author 左岚
 * @since 0.1.0
 */

/**
 * 本地化字符串接口
 * 定义扩展中所有可本地化的字符串的键名和类型
 * 所有语言版本都必须实现此接口以确保一致性
 * 
 * @interface LocalizedStrings
 * @since 0.1.0
 */
export interface LocalizedStrings {
    // 主界面文本
    /** 主标题 */
    title: string;
    /** 副标题 */
    subtitle: string;
    /** 生成按钮文本 */
    generateButton: string;
    
    // 表单标签
    /** ELF文件来源 */
    elfSource: string;
    /** 自动检测ELF文件 */
    autoDetectElf: string;
    /** 手动指定ELF文件 */
    manualElf: string;
    /** 手动ELF路径 */
    manualElfPath: string;
    /** 设备名称 */
    deviceName: string;
    /** GDB服务器 */
    gdbServer: string;
    /** OpenOCD路径 */
    openocdPath: string;
    /** OpenOCD路径（可选） */
    openocdPathOptional: string;
    /** 浏览按钮 */
    browseButton: string;
    /** 搜索接口文件 */
    searchInterface: string;
    /** 搜索目标文件 */
    searchTarget: string;
    /** 扫描按钮 */
    scanButton: string;
    /** 接口文件 */
    interfaceFile: string;
    /** 目标文件/ID */
    targetFile: string;
    /** SVD文件 */
    svdFile: string;
    /** 适配器速度 */
    adapterSpeed: string;
    
    // 实时监视
    /** 启用实时监视 */
    liveWatchEnable: string;
    /** 监视变量 */
    liveWatchVariables: string;
    /** 更新频率 */
    liveWatchFrequency: string;
    /** 变量占位符 */
    liveWatchVariablesPlaceholder: string;
    /** 变量帮助信息 */
    liveWatchVariablesHelp: string;
    /** 频率帮助信息 */
    liveWatchFrequencyHelp: string;
    /** 添加变量按钮 */
    addVariable: string;
    /** 移除变量按钮 */
    removeVariable: string;
    /** 变量名称 */
    variableName: string;
    /** 当前变量 */
    currentVariables: string;
    
    // 语言切换
    /** 语言设置 */
    language: string;
    /** 切换到英文 */
    switchToEnglish: string;
    /** 切换到中文 */
    switchToChinese: string;
    
    // 消息文本
    /** 未OpenOCD未找到 */
    noOpenocdFound: string;
    /** 下载OpenOCD链接 */
    downloadOpenocd: string;
    /** OpenOCD检测到 */
    openocdDetected: string;
    /** 配置生成成功 */
    configGenerated: string;
    /** 实时监视状态 */
    liveWatchStatus: string;
    /** 变量添加成功 */
    variableAdded: string;
    /** 变量移除成功 */
    variableRemoved: string;
    
    // 占位符和帮助文本
    /** 设备名占位符 */
    devicePlaceholder: string;
    /** SVD文件占位符 */
    svdPlaceholder: string;
    /** 自动检测中 */
    autoDetecting: string;
    /** 自动检测失败 */
    autoDetectionFailed: string;
    /** 没有配置文件 */
    noCfgFiles: string;
    /** 请提供路径 */
    providePath: string;
    
    // 页脚
    /** 创作者 */
    createdBy: string;
    
    // 附加消息
    /** 没有变量 */
    noVariables: string;
}