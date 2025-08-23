"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentConfigManager = exports.STM32TreeDataProvider = exports.STM32TreeItem = void 0;
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
__exportStar(require("./types"), exports);
/**
 * 重新导出STM32树形项目类
 * 用于创建树形视图中的各种项目
 */
var stm32TreeItem_1 = require("./stm32TreeItem");
Object.defineProperty(exports, "STM32TreeItem", { enumerable: true, get: function () { return stm32TreeItem_1.STM32TreeItem; } });
/**
 * 重新导出STM32树形数据提供器类
 * VS Code扩展的主要数据提供器实现
 */
var treeDataProvider_1 = require("./treeDataProvider");
Object.defineProperty(exports, "STM32TreeDataProvider", { enumerable: true, get: function () { return treeDataProvider_1.STM32TreeDataProvider; } });
/**
 * 重新导出最近配置管理器类
 * 管理用户最近使用的调试配置
 */
var recentConfigManager_1 = require("./recentConfigManager");
Object.defineProperty(exports, "RecentConfigManager", { enumerable: true, get: function () { return recentConfigManager_1.RecentConfigManager; } });
//# sourceMappingURL=index.js.map