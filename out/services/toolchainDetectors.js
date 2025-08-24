"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetectorFactory = exports.ArmToolchainDetector = exports.OpenOCDDetector = void 0;
/**
 * 工具链检测器实现模块
 * 提供具体的 OpenOCD 和 ARM 工具链检测器
 *
 * @fileoverview 工具链检测器实现
 * @author 左岚
 * @since 0.2.5
 */
const openocd_1 = require("../utils/openocd");
const armToolchain_1 = require("../utils/armToolchain");
const types_1 = require("../ui/types");
/**
 * OpenOCD 检测器类
 * 负责检测和获取 OpenOCD 工具信息
 */
class OpenOCDDetector {
    name = 'OpenOCD';
    /**
     * 检测 OpenOCD 工具
     *
     * @param detectionTime - 检测开始时间
     * @returns OpenOCD检测结果
     */
    async detect(detectionTime) {
        const result = {
            name: this.name,
            status: types_1.DetectionStatus.DETECTING,
            path: null,
            detectedAt: detectionTime,
            fromCache: false
        };
        try {
            const path = await (0, openocd_1.findOpenOCDPath)();
            if (path) {
                result.status = types_1.DetectionStatus.SUCCESS;
                result.path = path;
                // 获取配置文件信息
                try {
                    result.configs = await (0, openocd_1.getOpenOCDConfigFiles)(path);
                }
                catch (configError) {
                    console.warn('Failed to get OpenOCD config files:', configError);
                    result.configs = { interfaces: [], targets: [] };
                }
            }
            else {
                result.status = types_1.DetectionStatus.FAILED;
                result.error = 'OpenOCD executable not found';
            }
        }
        catch (error) {
            result.status = types_1.DetectionStatus.FAILED;
            result.error = error instanceof Error ? error.message : String(error);
        }
        return result;
    }
}
exports.OpenOCDDetector = OpenOCDDetector;
/**
 * ARM 工具链检测器类
 * 负责检测和获取 ARM 工具链信息
 */
class ArmToolchainDetector {
    name = 'ARM Toolchain';
    /**
     * 检测 ARM 工具链
     *
     * @param detectionTime - 检测开始时间
     * @returns ARM工具链检测结果
     */
    async detect(detectionTime) {
        const result = {
            name: this.name,
            status: types_1.DetectionStatus.DETECTING,
            path: null,
            detectedAt: detectionTime,
            fromCache: false
        };
        try {
            const path = await (0, armToolchain_1.findArmToolchainPath)();
            if (path) {
                result.status = types_1.DetectionStatus.SUCCESS;
                result.path = path;
                // 获取工具链信息
                try {
                    const toolchainInfo = await (0, armToolchain_1.getArmToolchainInfo)(path);
                    result.info = toolchainInfo;
                    result.version = toolchainInfo.version;
                }
                catch (infoError) {
                    console.warn('Failed to get ARM toolchain info:', infoError);
                    // 即使获取信息失败，路径检测成功仍然有效
                }
            }
            else {
                result.status = types_1.DetectionStatus.FAILED;
                result.error = 'ARM toolchain executable not found';
            }
        }
        catch (error) {
            result.status = types_1.DetectionStatus.FAILED;
            result.error = error instanceof Error ? error.message : String(error);
        }
        return result;
    }
}
exports.ArmToolchainDetector = ArmToolchainDetector;
/**
 * 检测器工厂类
 * 提供创建和管理检测器实例的功能
 */
class DetectorFactory {
    static openocdDetector;
    static armToolchainDetector;
    /**
     * 获取 OpenOCD 检测器实例
     */
    static getOpenOCDDetector() {
        if (!this.openocdDetector) {
            this.openocdDetector = new OpenOCDDetector();
        }
        return this.openocdDetector;
    }
    /**
     * 获取 ARM 工具链检测器实例
     */
    static getArmToolchainDetector() {
        if (!this.armToolchainDetector) {
            this.armToolchainDetector = new ArmToolchainDetector();
        }
        return this.armToolchainDetector;
    }
    /**
     * 根据名称获取检测器
     *
     * @param name - 检测器名称
     * @returns 对应的检测器实例
     */
    static getDetector(name) {
        switch (name) {
            case 'openocd':
                return this.getOpenOCDDetector();
            case 'armToolchain':
                return this.getArmToolchainDetector();
            default:
                throw new Error(`Unknown detector: ${name}`);
        }
    }
}
exports.DetectorFactory = DetectorFactory;
//# sourceMappingURL=toolchainDetectors.js.map