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
 * 自动配置功能测试
 * 验证自动配置系统的各项功能，包括扫描、检测、生成和验证
 *
 * @fileoverview 自动配置功能测试
 * @author 左岚
 * @since 0.2.6
 */
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
// import * as sinon from 'sinon';
const autoConfigurationService_1 = require("../services/autoConfigurationService");
const configurationScanner_1 = require("../services/configurationScanner");
const cortexDebugConfigGenerator_1 = require("../services/cortexDebugConfigGenerator");
const toolchainDetectionService_1 = require("../services/toolchainDetectionService");
const autoConfigurationDialog_1 = require("../ui/autoConfigurationDialog");
const types_1 = require("../ui/types");
suite('Auto-Configuration Tests', () => {
    // let sandbox: sinon.SinonSandbox;
    let mockContext;
    setup(() => {
        // sandbox = sinon.createSandbox();
        mockContext = {
            subscriptions: [],
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            extensionPath: '/test/extension/path',
            extensionUri: vscode.Uri.file('/test/extension/path')
        };
    });
    teardown(() => {
        // sandbox.restore();
    });
    suite('AutoConfigurationService', () => {
        test('should create singleton instance', () => {
            const service1 = autoConfigurationService_1.AutoConfigurationService.getInstance();
            const service2 = autoConfigurationService_1.AutoConfigurationService.getInstance();
            assert.strictEqual(service1, service2, 'Should return same instance');
        });
        test('should scan configuration successfully', async () => {
            const service = autoConfigurationService_1.AutoConfigurationService.getInstance();
            // Mock workspace folders - would need proper mocking in real tests
            const result = await service.scanConfiguration();
            assert.ok(result, 'Should return scan result');
            assert.ok(['success', 'partial', 'failed'].includes(result.status), 'Should have valid status');
            assert.ok(Array.isArray(result.errors), 'Should have errors array');
            assert.ok(Array.isArray(result.recommendations), 'Should have recommendations array');
        });
        test('should validate configuration correctly', async () => {
            const service = autoConfigurationService_1.AutoConfigurationService.getInstance();
            // Mock workspace folders - would need proper mocking in real tests
            const validation = await service.validateConfiguration();
            assert.ok(typeof validation.isValid === 'boolean', 'Should have isValid boolean');
            assert.ok(Array.isArray(validation.issues), 'Should have issues array');
            assert.ok(Array.isArray(validation.suggestions), 'Should have suggestions array');
        });
    });
    suite('ConfigurationScanner', () => {
        test('should analyze project structure', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            // Mock workspace folders - would need proper mocking in real tests
            const analysis = await scanner.analyzeProjectStructure();
            assert.ok(analysis, 'Should return analysis result');
            assert.ok(typeof analysis.projectType === 'string', 'Should have project type');
            assert.ok(typeof analysis.sourceFiles === 'object', 'Should have source files info');
            assert.ok(typeof analysis.buildSystem === 'object', 'Should have build system info');
            assert.ok(typeof analysis.executablePrediction === 'object', 'Should have executable prediction');
            assert.ok(typeof analysis.deviceInference === 'object', 'Should have device inference');
        });
        test('should perform health check', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            const healthCheck = await scanner.performHealthCheck();
            assert.ok(healthCheck, 'Should return health check result');
            assert.ok(['healthy', 'partial', 'critical'].includes(healthCheck.overall), 'Should have valid overall status');
            assert.ok(typeof healthCheck.scores === 'object', 'Should have scores object');
            assert.ok(Array.isArray(healthCheck.issues), 'Should have issues array');
            assert.ok(Array.isArray(healthCheck.recommendations), 'Should have recommendations array');
        });
        test('should generate repair plan', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            const mockIssues = [
                { category: 'toolchain', message: 'OpenOCD not found' },
                { category: 'extension', message: 'Cortex-Debug not installed' }
            ];
            const repairPlan = await scanner.generateConfigurationRepairPlan(mockIssues);
            assert.ok(repairPlan, 'Should return repair plan');
            assert.ok(Array.isArray(repairPlan.steps), 'Should have steps array');
            assert.ok(typeof repairPlan.estimatedTime === 'string', 'Should have estimated time');
            assert.ok(['simple', 'moderate', 'complex'].includes(repairPlan.complexity), 'Should have valid complexity');
        });
    });
    suite('CortexDebugConfigGenerator', () => {
        test('should generate basic configuration', () => {
            const generator = new cortexDebugConfigGenerator_1.CortexDebugConfigGenerator();
            const mockToolchains = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin/openocd',
                    detectedAt: Date.now()
                },
                armToolchain: {
                    name: 'ARM GNU Toolchain',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin',
                    detectedAt: Date.now()
                },
                completedAt: Date.now()
            };
            const config = generator.generateConfig('STM32F407VG', mockToolchains);
            assert.ok(config, 'Should return generated config');
            assert.ok(config.config, 'Should have config object');
            assert.ok(config.metadata, 'Should have metadata');
            assert.ok(config.description, 'Should have description');
            assert.ok(Array.isArray(config.recommendations), 'Should have recommendations array');
            // Validate basic config structure
            assert.strictEqual(config.config.type, 'cortex-debug', 'Should be cortex-debug type');
            assert.strictEqual(config.config.request, 'launch', 'Should be launch request');
            assert.strictEqual(config.config.device, 'STM32F407VG', 'Should have correct device');
        });
        test('should validate configuration', () => {
            const generator = new cortexDebugConfigGenerator_1.CortexDebugConfigGenerator();
            const mockToolchains = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin/openocd',
                    detectedAt: Date.now()
                },
                armToolchain: {
                    name: 'ARM GNU Toolchain',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin',
                    detectedAt: Date.now()
                },
                completedAt: Date.now()
            };
            const validConfig = {
                name: 'Debug STM32F407VG',
                type: 'cortex-debug',
                request: 'launch',
                executable: 'test.elf',
                device: 'STM32F407VG',
                servertype: 'openocd',
                configFiles: ['interface/stlink-v2-1.cfg', 'target/stm32f4x.cfg']
            };
            const validation = generator.validateConfig(validConfig, mockToolchains);
            assert.ok(validation, 'Should return validation result');
            assert.ok(typeof validation.isValid === 'boolean', 'Should have isValid boolean');
            assert.ok(Array.isArray(validation.errors), 'Should have errors array');
            assert.ok(Array.isArray(validation.warnings), 'Should have warnings array');
            assert.ok(Array.isArray(validation.suggestions), 'Should have suggestions array');
        });
        test('should generate multiple templates', () => {
            const generator = new cortexDebugConfigGenerator_1.CortexDebugConfigGenerator();
            const mockToolchains = {
                openocd: {
                    name: 'OpenOCD',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin/openocd',
                    detectedAt: Date.now()
                },
                armToolchain: {
                    name: 'ARM GNU Toolchain',
                    status: types_1.DetectionStatus.SUCCESS,
                    path: '/usr/local/bin',
                    detectedAt: Date.now()
                },
                completedAt: Date.now()
            };
            const mockProjectAnalysis = {
                projectType: 'cmake',
                sourceFiles: { hasMain: true, mainFiles: [], sourceCount: 10, headerCount: 5 },
                buildSystem: { hasMakefile: false, hasCMakeLists: true, hasPlatformIO: false, hasSTM32CubeMX: false },
                executablePrediction: { likelyPaths: [], buildOutputDirs: [], defaultPath: 'build/test.elf' },
                deviceInference: { confidence: 80, evidenceFiles: [] }
            };
            const templates = generator.generateMultipleTemplates('STM32F407VG', mockToolchains, mockProjectAnalysis);
            assert.ok(Array.isArray(templates), 'Should return array of templates');
            assert.ok(templates.length > 0, 'Should generate at least one template');
            // Check each template has required structure
            templates.forEach((template, index) => {
                assert.ok(template.config, `Template ${index} should have config`);
                assert.ok(template.metadata, `Template ${index} should have metadata`);
                assert.ok(template.description, `Template ${index} should have description`);
                assert.strictEqual(template.config.type, 'cortex-debug', `Template ${index} should be cortex-debug type`);
            });
        });
    });
    suite('ToolchainDetectionService', () => {
        test('should create singleton instance', () => {
            const service1 = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const service2 = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            assert.strictEqual(service1, service2, 'Should return same instance');
        });
        test('should detect toolchains', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const results = await service.detectToolchains();
            assert.ok(results, 'Should return detection results');
            assert.ok(results.openocd, 'Should have openocd results');
            assert.ok(results.armToolchain, 'Should have armToolchain results');
            assert.ok(typeof results.completedAt === 'number', 'Should have completion timestamp');
            // Check result structure
            ['openocd', 'armToolchain'].forEach(tool => {
                const toolResult = results[tool];
                if (typeof toolResult !== 'number') {
                    assert.ok(typeof toolResult.name === 'string', `${tool} should have name`);
                    assert.ok([types_1.DetectionStatus.SUCCESS, types_1.DetectionStatus.FAILED].includes(toolResult.status), `${tool} should have valid status`);
                    assert.ok(typeof toolResult.detectedAt === 'number', `${tool} should have detection timestamp`);
                }
            });
        });
        test('should perform intelligent detection', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const intelligentResults = await service.performIntelligentDetection();
            assert.ok(intelligentResults, 'Should return intelligent detection results');
            assert.ok(intelligentResults.results, 'Should have results');
            assert.ok(intelligentResults.insights, 'Should have insights');
            // Check insights structure
            const insights = intelligentResults.insights;
            assert.ok(typeof insights.detectionStrategy === 'string', 'Should have detection strategy');
            assert.ok(Array.isArray(insights.alternativeLocations), 'Should have alternative locations array');
            assert.ok(Array.isArray(insights.installationRecommendations), 'Should have installation recommendations array');
            assert.ok(Array.isArray(insights.compatibilityIssues), 'Should have compatibility issues array');
        });
    });
    suite('AutoConfigurationDialog', () => {
        test('should create dialog instance', () => {
            const dialog = new autoConfigurationDialog_1.AutoConfigurationDialog(mockContext);
            assert.ok(dialog, 'Should create dialog instance');
        });
        // Note: UI tests would require more complex mocking of VS Code UI components
        // For now, we focus on testing the underlying services
    });
    suite('Integration Tests', () => {
        test('should complete end-to-end auto-configuration flow', async () => {
            // Mock workspace environment - would need proper mocking in real tests
            // Test the complete flow
            const autoConfigService = autoConfigurationService_1.AutoConfigurationService.getInstance();
            // 1. Scan configuration
            const scanResult = await autoConfigService.scanConfiguration();
            assert.ok(scanResult, 'Should complete configuration scan');
            // 2. Validate configuration
            const validation = await autoConfigService.validateConfiguration();
            assert.ok(validation, 'Should complete configuration validation');
            // 3. Health check
            const scanner = new configurationScanner_1.ConfigurationScanner();
            const healthCheck = await scanner.performHealthCheck();
            assert.ok(healthCheck, 'Should complete health check');
            console.log('Auto-configuration integration test completed successfully');
        });
    });
});
//# sourceMappingURL=auto-configuration.test.js.map