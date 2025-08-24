/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * UI组件类型定义模块
 * 定义工具链检测对话框相关的数据结构和枚举类型
 * 
 * @fileoverview UI组件类型定义
 * @author 左岚
 * @since 0.2.4
 */

import { ToolchainInfo } from '../utils/armToolchain';

/**
 * 工具链检测状态枚举
 * 定义工具链检测的可能状态
 */
export enum DetectionStatus {
    /** 检测中 */
    DETECTING = 'detecting',
    /** 检测成功 */
    SUCCESS = 'success',
    /** 检测失败 */
    FAILED = 'failed',
    /** 未检测 */
    NOT_DETECTED = 'not_detected'
}

/**
 * 工具链检测结果接口
 * 定义单个工具链的检测结果数据结构
 */
export interface ToolchainDetectionResult {
    /** 工具链名称 */
    name: string;
    /** 检测状态 */
    status: DetectionStatus;
    /** 检测到的路径，如果未找到则为null */
    path: string | null;
    /** 工具链信息，仅在检测成功时有值 */
    info?: ToolchainInfo;
    /** 错误消息，仅在检测失败时有值 */
    error?: string;
}

/**
 * 完整的工具链检测结果接口
 * 包含所有工具链的检测结果
 */
export interface ToolchainDetectionResults {
    /** OpenOCD检测结果 */
    openocd: ToolchainDetectionResult;
    /** ARM工具链检测结果 */
    armToolchain: ToolchainDetectionResult;
}

/**
 * 用户操作选择枚举
 * 定义用户在对话框中可以进行的操作
 */
export enum UserAction {
    /** 继续使用检测到的配置 */
    CONTINUE = 'continue',
    /** 手动配置路径 */
    CONFIGURE_MANUALLY = 'configure_manually',
    /** 下载工具链 */
    DOWNLOAD = 'download',
    /** 取消操作 */
    CANCEL = 'cancel'
}

/**
 * 下载链接信息接口
 * 定义工具链下载链接的数据结构
 */
export interface DownloadLinkInfo {
    /** 显示标签 */
    label: string;
    /** 描述信息 */
    description: string;
    /** 下载链接URL */
    url: string;
}