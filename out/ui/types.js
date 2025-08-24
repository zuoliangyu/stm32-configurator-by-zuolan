"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAction = exports.DetectionStatus = void 0;
/**
 * 工具链检测状态枚举
 * 定义工具链检测的可能状态
 */
var DetectionStatus;
(function (DetectionStatus) {
    /** 检测中 */
    DetectionStatus["DETECTING"] = "detecting";
    /** 检测成功 */
    DetectionStatus["SUCCESS"] = "success";
    /** 检测失败 */
    DetectionStatus["FAILED"] = "failed";
    /** 未检测 */
    DetectionStatus["NOT_DETECTED"] = "not_detected";
})(DetectionStatus || (exports.DetectionStatus = DetectionStatus = {}));
/**
 * 用户操作选择枚举
 * 定义用户在对话框中可以进行的操作
 */
var UserAction;
(function (UserAction) {
    /** 继续使用检测到的配置 */
    UserAction["CONTINUE"] = "continue";
    /** 手动配置路径 */
    UserAction["CONFIGURE_MANUALLY"] = "configure_manually";
    /** 下载工具链 */
    UserAction["DOWNLOAD"] = "download";
    /** 取消操作 */
    UserAction["CANCEL"] = "cancel";
})(UserAction || (exports.UserAction = UserAction = {}));
//# sourceMappingURL=types.js.map