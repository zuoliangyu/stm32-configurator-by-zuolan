/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * 工具链集成测试
 * 测试工具链引导功能的完整集成
 * 
 * @fileoverview 工具链集成测试
 * @author 左岚
 * @since 0.2.5
 */

import * as assert from 'assert';
import { ToolchainDetectionService } from '../services';

describe('Toolchain Integration Tests', () => {

    describe('ToolchainDetectionService Integration', () => {
        it('should create service instance using singleton pattern', () => {
            const service1 = ToolchainDetectionService.getInstance();
            const service2 = ToolchainDetectionService.getInstance();
            
            assert.strictEqual(service1, service2, 'Service should follow singleton pattern');
        });

        it('should have detectToolchains method available', () => {
            const service = ToolchainDetectionService.getInstance();
            
            assert.strictEqual(typeof service.detectToolchains, 'function', 'Service should have detectToolchains method');
        });
    });

    describe('Service Module Export', () => {
        it('should export ToolchainDetectionService from services index', () => {
            // Verify that the service is properly exported
            assert.ok(ToolchainDetectionService, 'ToolchainDetectionService should be exported');
            assert.strictEqual(typeof ToolchainDetectionService, 'function', 'ToolchainDetectionService should be a constructor');
        });
        
        it('should verify services are importable without errors', () => {
            // This test ensures that our imports in extension.ts will work
            try {
                const serviceModule = require('../services');
                assert.ok(serviceModule.ToolchainDetectionService, 'ToolchainDetectionService should be available in services module');
                
                const uiModule = require('../ui');
                assert.ok(uiModule.ToolchainGuideDialog, 'ToolchainGuideDialog should be available in UI module');
            } catch (error) {
                assert.fail(`Module imports failed: ${error}`);
            }
        });
    });
});