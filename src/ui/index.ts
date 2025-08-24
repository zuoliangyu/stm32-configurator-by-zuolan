/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * UI组件模块导出
 * 统一导出所有用户界面组件，便于其他模块使用
 * 
 * @fileoverview UI组件模块入口
 * @author 左岚
 * @since 0.2.4
 */

// 导出主对话框类
export { ToolchainGuideDialog } from './toolchainGuideDialog';

// 导出类型定义
export {
    DetectionStatus,
    UserAction,
    type ToolchainDetectionResult,
    type ToolchainDetectionResults,
    type DownloadLinkInfo
} from './types';

// 导出处理器类（可选，供高级用户使用）
export { DetectionProgressHandler } from './detectionProgressHandler';
export { ResultDisplayHandler } from './resultDisplayHandler';
export { UserInteractionHandler } from './userInteractionHandler';
export { ConfigurationHandler } from './configurationHandler';