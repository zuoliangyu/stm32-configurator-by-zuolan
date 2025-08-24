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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 工具链集成测试
 * 测试工具链引导功能的完整集成
 *
 * @fileoverview 工具链集成测试
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const services_1 = require("../services");
describe('Toolchain Integration Tests', () => {
    describe('ToolchainDetectionService Integration', () => {
        it('should create service instance using singleton pattern', () => {
            const service1 = services_1.ToolchainDetectionService.getInstance();
            const service2 = services_1.ToolchainDetectionService.getInstance();
            assert.strictEqual(service1, service2, 'Service should follow singleton pattern');
        });
        it('should have detectToolchains method available', () => {
            const service = services_1.ToolchainDetectionService.getInstance();
            assert.strictEqual(typeof service.detectToolchains, 'function', 'Service should have detectToolchains method');
        });
    });
    describe('Service Module Export', () => {
        it('should export ToolchainDetectionService from services index', () => {
            // Verify that the service is properly exported
            assert.ok(services_1.ToolchainDetectionService, 'ToolchainDetectionService should be exported');
            assert.strictEqual(typeof services_1.ToolchainDetectionService, 'function', 'ToolchainDetectionService should be a constructor');
        });
        it('should verify services are importable without errors', () => {
            // This test ensures that our imports in extension.ts will work
            try {
                const serviceModule = require('../services');
                assert.ok(serviceModule.ToolchainDetectionService, 'ToolchainDetectionService should be available in services module');
                const uiModule = require('../ui');
                assert.ok(uiModule.ToolchainGuideDialog, 'ToolchainGuideDialog should be available in UI module');
            }
            catch (error) {
                assert.fail(`Module imports failed: ${error}`);
            }
        });
    });
});
//# sourceMappingURL=toolchain-integration.test.js.map