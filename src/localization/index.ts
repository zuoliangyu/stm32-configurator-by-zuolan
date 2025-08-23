/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface LocalizedStrings {
    // Main UI
    title: string;
    subtitle: string;
    generateButton: string;
    
    // Form labels
    elfSource: string;
    autoDetectElf: string;
    manualElf: string;
    manualElfPath: string;
    deviceName: string;
    gdbServer: string;
    openocdPath: string;
    openocdPathOptional: string;
    scanButton: string;
    interfaceFile: string;
    targetFile: string;
    svdFile: string;
    adapterSpeed: string;
    
    // Live Watch
    liveWatchEnable: string;
    liveWatchVariables: string;
    liveWatchFrequency: string;
    liveWatchVariablesPlaceholder: string;
    liveWatchVariablesHelp: string;
    liveWatchFrequencyHelp: string;
    addVariable: string;
    removeVariable: string;
    variableName: string;
    currentVariables: string;
    
    // Language switching
    language: string;
    switchToEnglish: string;
    switchToChinese: string;
    
    // Messages
    noOpenocdFound: string;
    downloadOpenocd: string;
    openocdDetected: string;
    configGenerated: string;
    liveWatchStatus: string;
    variableAdded: string;
    variableRemoved: string;
    
    // Placeholders and help text
    devicePlaceholder: string;
    svdPlaceholder: string;
    autoDetecting: string;
    autoDetectionFailed: string;
    noCfgFiles: string;
    providePath: string;
    
    // Footer
    createdBy: string;
    
    // Additional messages
    noVariables: string;
}