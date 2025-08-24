"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationHandler = exports.UserInteractionHandler = exports.ResultDisplayHandler = exports.DetectionProgressHandler = exports.UserAction = exports.DetectionStatus = exports.ToolchainGuideDialog = void 0;
/**
 * UI组件模块导出
 * 统一导出所有用户界面组件，便于其他模块使用
 *
 * @fileoverview UI组件模块入口
 * @author 左岚
 * @since 0.2.4
 */
// 导出主对话框类
var toolchainGuideDialog_1 = require("./toolchainGuideDialog");
Object.defineProperty(exports, "ToolchainGuideDialog", { enumerable: true, get: function () { return toolchainGuideDialog_1.ToolchainGuideDialog; } });
// 导出类型定义
var types_1 = require("./types");
Object.defineProperty(exports, "DetectionStatus", { enumerable: true, get: function () { return types_1.DetectionStatus; } });
Object.defineProperty(exports, "UserAction", { enumerable: true, get: function () { return types_1.UserAction; } });
// 导出处理器类（可选，供高级用户使用）
var detectionProgressHandler_1 = require("./detectionProgressHandler");
Object.defineProperty(exports, "DetectionProgressHandler", { enumerable: true, get: function () { return detectionProgressHandler_1.DetectionProgressHandler; } });
var resultDisplayHandler_1 = require("./resultDisplayHandler");
Object.defineProperty(exports, "ResultDisplayHandler", { enumerable: true, get: function () { return resultDisplayHandler_1.ResultDisplayHandler; } });
var userInteractionHandler_1 = require("./userInteractionHandler");
Object.defineProperty(exports, "UserInteractionHandler", { enumerable: true, get: function () { return userInteractionHandler_1.UserInteractionHandler; } });
var configurationHandler_1 = require("./configurationHandler");
Object.defineProperty(exports, "ConfigurationHandler", { enumerable: true, get: function () { return configurationHandler_1.ConfigurationHandler; } });
//# sourceMappingURL=index.js.map