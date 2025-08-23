"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.zh = void 0;
exports.zh = {
    // Main UI
    title: "STM32 调试配置",
    subtitle: "请填写下方详细信息，为 Cortex-Debug 生成 `launch.json` 配置。",
    generateButton: "生成配置",
    // Form labels
    elfSource: "可执行文件 (.elf) 路径来源",
    autoDetectElf: "自动检测 (需要ST的STM32扩展)",
    manualElf: "手动路径",
    manualElfPath: "手动 .elf 路径",
    deviceName: "设备名称 (例如: STM32F407ZG)",
    gdbServer: "GDB 服务器",
    openocdPath: "OpenOCD 路径 (可选)",
    openocdPathOptional: "OpenOCD 路径 (可选)",
    scanButton: "扫描",
    interfaceFile: "接口文件",
    targetFile: "目标文件 / ID",
    svdFile: "SVD 文件路径 (可选)",
    adapterSpeed: "适配器速度 (kHz)",
    // Live Watch
    liveWatchEnable: "启用实时监视",
    liveWatchVariables: "监视变量",
    liveWatchFrequency: "更新频率 (采样/秒)",
    liveWatchVariablesPlaceholder: "输入变量名 (每行一个或逗号分隔):\nvariable1\nvariable2\nmyStruct.field",
    liveWatchVariablesHelp: "指定要实时监控的全局变量、函数参数或结构体字段",
    liveWatchFrequencyHelp: "更高的值提供更频繁的更新，但可能影响调试性能",
    addVariable: "添加变量",
    removeVariable: "移除",
    variableName: "变量名",
    currentVariables: "当前变量",
    // Language switching
    language: "语言",
    switchToEnglish: "English",
    switchToChinese: "中文",
    // Messages
    noOpenocdFound: "未找到 OpenOCD。",
    downloadOpenocd: "点此下载",
    openocdDetected: "OpenOCD 检测到位置:",
    configGenerated: "launch.json 已成功更新!",
    liveWatchStatus: "实时监视已启用，{0} 个变量，频率 {1}Hz。",
    variableAdded: "变量 '{0}' 添加成功",
    variableRemoved: "变量 '{0}' 移除成功",
    // Placeholders and help text
    devicePlaceholder: "例如: STM32F407ZG",
    svdPlaceholder: "例如: ${workspaceFolder}/STM32F407.svd",
    autoDetecting: "自动检测中...",
    autoDetectionFailed: "自动检测失败。请手动指定路径。",
    noCfgFiles: "未找到 .cfg 文件",
    providePath: "请提供有效的 OpenOCD 路径以填充...",
    // Footer
    createdBy: "由 左岚 创建",
    // Additional messages
    noVariables: "尚未添加变量"
};
//# sourceMappingURL=zh.js.map