"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.en = void 0;
/**
 * 英文本地化字符串对象
 * 包含扩展所有用户界面文本的英文版本
 */
exports.en = {
    // Main UI
    title: "STM32 Debug Configuration",
    subtitle: "Fill in the details below to generate a `launch.json` configuration for Cortex-Debug.",
    generateButton: "Generate Configuration",
    // Form labels
    elfSource: "Executable (.elf) Path Source",
    autoDetectElf: "Auto-detect (Requires ST's STM32 Extension)",
    manualElf: "Manual Path",
    manualElfPath: "Manual .elf Path",
    deviceName: "Device Name (e.g., STM32F407ZG)",
    gdbServer: "GDB Server",
    openocdPath: "OpenOCD Path (Optional)",
    openocdPathOptional: "OpenOCD Path (Optional)",
    browseButton: "Browse",
    searchInterface: "Search interface files...",
    searchTarget: "Search target files...",
    scanButton: "Scan",
    interfaceFile: "Interface File",
    targetFile: "Target File / ID",
    svdFile: "SVD File Path (Optional)",
    adapterSpeed: "Adapter Speed (kHz)",
    // Live Watch
    liveWatchEnable: "Enable Live Watch",
    liveWatchVariables: "Variables to Watch",
    liveWatchFrequency: "Update Frequency (samples/second)",
    liveWatchVariablesPlaceholder: "Enter variable names (one per line or comma-separated):\nvariable1\nvariable2\nmyStruct.field",
    liveWatchVariablesHelp: "Specify global variables, function parameters, or structure fields to monitor in real-time",
    liveWatchFrequencyHelp: "Higher values provide more frequent updates but may impact debugging performance",
    addVariable: "Add Variable",
    removeVariable: "Remove",
    variableName: "Variable Name",
    currentVariables: "Current Variables",
    // Language switching
    language: "Language",
    switchToEnglish: "English",
    switchToChinese: "中文",
    // Messages
    noOpenocdFound: "OpenOCD not found.",
    downloadOpenocd: "Download it here",
    openocdDetected: "OpenOCD found at:",
    configGenerated: "launch.json has been updated successfully!",
    liveWatchStatus: "Live Watch enabled with {0} variables at {1}Hz.",
    variableAdded: "Variable '{0}' added successfully",
    variableRemoved: "Variable '{0}' removed successfully",
    // Placeholders and help text
    devicePlaceholder: "e.g., STM32F407ZG",
    svdPlaceholder: "e.g., ${workspaceFolder}/STM32F407.svd",
    autoDetecting: "Auto-detecting...",
    autoDetectionFailed: "Auto-detection failed. Please specify the path manually.",
    noCfgFiles: "No .cfg files found",
    providePath: "Provide valid OpenOCD path to populate...",
    // Footer
    createdBy: "Created by 左岚",
    // Additional messages
    noVariables: "No variables added yet"
};
//# sourceMappingURL=en.js.map