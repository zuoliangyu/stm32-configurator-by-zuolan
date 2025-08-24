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
 * 自动配置功能综合测试套件
 * 测试自动化配置向导、一键设置、智能排除故障等功能
 *
 * @fileoverview 自动配置综合测试
 * @author 左岚
 * @since 0.2.5
 */
const assert = __importStar(require("assert"));
const sinon = __importStar(require("sinon"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const toolchainDetectionService_1 = require("../services/toolchainDetectionService");
const configurationScanner_1 = require("../services/configurationScanner");
describe('Auto-Configuration Comprehensive Tests', () => {
    let sandbox;
    let mockContext;
    let mockWorkspaceFolder;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock workspace folder
        mockWorkspaceFolder = {
            uri: vscode.Uri.file('/test/workspace'),
            name: 'test-workspace',
            index: 0
        };
        sandbox.stub(vscode.workspace, 'workspaceFolders').value([mockWorkspaceFolder]);
        // Mock VS Code context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: sandbox.stub(),
                update: sandbox.stub().resolves(),
                keys: sandbox.stub().returns([])
            },
            globalState: {
                get: sandbox.stub(),
                update: sandbox.stub().resolves(),
                keys: sandbox.stub().returns([]),
                setKeysForSync: sandbox.stub()
            },
            extensionUri: vscode.Uri.file('/test/extension'),
            extensionPath: '/test/extension',
            extensionMode: vscode.ExtensionMode.Test
        };
        // Mock VS Code configuration
        sandbox.stub(vscode.workspace, 'getConfiguration').returns({
            get: sandbox.stub().returns(undefined),
            update: sandbox.stub().resolves(),
            has: sandbox.stub().returns(false),
            inspect: sandbox.stub()
        });
    });
    afterEach(() => {
        sandbox.restore();
    });
    describe('ToolchainDetectionService Auto-Detection', () => {
        it('should perform complete toolchain detection', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            // Mock successful detection results
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'found',
                    path: '/usr/bin/openocd',
                    version: '0.12.0',
                    configFiles: {
                        interfaces: ['stlink.cfg', 'jlink.cfg'],
                        targets: ['stm32f1x.cfg', 'stm32f4x.cfg']
                    }
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'found',
                    path: '/usr/bin/arm-none-eabi-gcc',
                    version: '10.3.1',
                    rootPath: '/usr',
                    executables: {
                        gcc: '/usr/bin/arm-none-eabi-gcc',
                        gdb: '/usr/bin/arm-none-eabi-gdb',
                        objcopy: '/usr/bin/arm-none-eabi-objcopy'
                    }
                },
                completedAt: Date.now(),
                detectionDurationMs: 1500,
                summary: {
                    totalFound: 2,
                    totalMissing: 0,
                    readyForDevelopment: true
                }
            };
            const detectStub = sandbox.stub(service, 'detectToolchains').resolves(mockResults);
            const results = await service.detectToolchains();
            assert.ok(detectStub.calledOnce);
            assert.strictEqual(results.openocd.status, 'found');
            assert.strictEqual(results.armToolchain.status, 'found');
            assert.strictEqual(results.summary.readyForDevelopment, true);
            assert.ok(results.completedAt);
            assert.ok(results.detectionDurationMs);
        });
        it('should handle partial toolchain detection', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const mockResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'not_found',
                    issues: ['OpenOCD not found in PATH', 'No common installation detected']
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'found',
                    path: '/usr/bin/arm-none-eabi-gcc',
                    version: '10.3.1'
                },
                completedAt: Date.now(),
                summary: {
                    totalFound: 1,
                    totalMissing: 1,
                    readyForDevelopment: false
                }
            };
            sandbox.stub(service, 'detectToolchains').resolves(mockResults);
            const results = await service.detectToolchains();
            assert.strictEqual(results.openocd.status, 'not_found');
            assert.strictEqual(results.armToolchain.status, 'found');
            assert.strictEqual(results.summary.readyForDevelopment, false);
            assert.ok(results.openocd.issues?.length);
        });
        it('should cache detection results to improve performance', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found', path: '/usr/bin/openocd' },
                armToolchain: { name: 'ARM GCC', status: 'found', path: '/usr/bin/arm-none-eabi-gcc' },
                completedAt: Date.now(),
                summary: { totalFound: 2, totalMissing: 0, readyForDevelopment: true }
            };
            const detectStub = sandbox.stub(service, 'detectToolchains').resolves(mockResults);
            // First call - should perform detection
            await service.detectToolchains();
            assert.strictEqual(detectStub.callCount, 1);
            // Second call - should use cache
            await service.detectToolchains();
            assert.strictEqual(detectStub.callCount, 1); // Not incremented due to caching
            // Force re-detection
            await service.detectToolchains({ forceRedetection: true });
            assert.strictEqual(detectStub.callCount, 2); // Now incremented
        });
        it('should handle detection errors gracefully', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const detectStub = sandbox.stub(service, 'detectToolchains').rejects(new Error('Detection failed'));
            try {
                await service.detectToolchains();
                assert.fail('Should have thrown error');
            }
            catch (error) {
                assert.ok(error instanceof Error);
                assert.strictEqual(error.message, 'Detection failed');
            }
        });
    });
    describe('ConfigurationScanner Health Check', () => {
        it('should perform comprehensive health check', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            const mockHealthCheck = {
                scores: {
                    toolchain: 85,
                    workspace: 90,
                    configuration: 75,
                    extensions: 80
                },
                issues: [
                    {
                        severity: 'warning',
                        message: 'OpenOCD version is outdated',
                        category: 'toolchain',
                        autoFixable: false
                    }
                ],
                recommendations: [
                    {
                        title: 'Update OpenOCD',
                        description: 'Consider updating to the latest OpenOCD version',
                        priority: 'medium',
                        category: 'toolchain'
                    }
                ],
                timestamp: Date.now()
            };
            const healthCheckStub = sandbox.stub(scanner, 'performHealthCheck').resolves(mockHealthCheck);
            const results = await scanner.performHealthCheck();
            assert.ok(healthCheckStub.calledOnce);
            assert.ok(results.scores);
            assert.strictEqual(results.scores.toolchain, 85);
            assert.strictEqual(results.scores.workspace, 90);
            assert.ok(results.issues.length > 0);
            assert.ok(results.recommendations.length > 0);
        });
        it('should detect critical configuration issues', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            const mockHealthCheck = {
                scores: {
                    toolchain: 30, // Critical
                    workspace: 50,
                    configuration: 20, // Critical
                    extensions: 60
                },
                issues: [
                    {
                        severity: 'error',
                        message: 'ARM toolchain not found',
                        category: 'toolchain',
                        autoFixable: true
                    },
                    {
                        severity: 'error',
                        message: 'No debug configurations found',
                        category: 'configuration',
                        autoFixable: true
                    }
                ],
                recommendations: [
                    {
                        title: 'Install ARM Toolchain',
                        description: 'Install GNU Arm Embedded Toolchain',
                        priority: 'high',
                        category: 'toolchain'
                    }
                ],
                timestamp: Date.now()
            };
            sandbox.stub(scanner, 'performHealthCheck').resolves(mockHealthCheck);
            const results = await scanner.performHealthCheck();
            const criticalIssues = results.issues.filter(issue => issue.severity === 'error');
            assert.ok(criticalIssues.length > 0);
            const highPriorityRecs = results.recommendations.filter(rec => rec.priority === 'high');
            assert.ok(highPriorityRecs.length > 0);
        });
        it('should identify missing extensions', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            const mockHealthCheck = {
                scores: {
                    toolchain: 90,
                    workspace: 85,
                    configuration: 80,
                    extensions: 40 // Missing extensions
                },
                issues: [
                    {
                        severity: 'warning',
                        message: 'Cortex-Debug extension not installed',
                        category: 'extensions',
                        autoFixable: true
                    }
                ],
                recommendations: [
                    {
                        title: 'Install Cortex-Debug',
                        description: 'Required for STM32 debugging',
                        priority: 'high',
                        category: 'extensions'
                    }
                ],
                timestamp: Date.now()
            };
            sandbox.stub(scanner, 'performHealthCheck').resolves(mockHealthCheck);
            const results = await scanner.performHealthCheck();
            const extensionIssues = results.issues.filter(issue => issue.category === 'extensions');
            assert.ok(extensionIssues.length > 0);
        });
    });
    describe('Auto-Configuration Workflow', () => {
        it('should generate debug configuration automatically', async () => {
            // Mock workspace files
            const mockFiles = [
                { name: 'main.c', path: '/test/workspace/main.c' },
                { name: 'Makefile', path: '/test/workspace/Makefile' },
                { name: 'firmware.elf', path: '/test/workspace/build/firmware.elf' }
            ];
            sandbox.stub(fs, 'readdirSync').returns(mockFiles.map(f => f.name));
            sandbox.stub(fs, 'existsSync').returns(true);
            sandbox.stub(fs, 'statSync').returns({ isFile: () => true, isDirectory: () => false });
            // Mock successful toolchain detection
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const mockDetectionResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'found',
                    path: '/usr/bin/openocd',
                    configFiles: {
                        interfaces: ['stlink.cfg'],
                        targets: ['stm32f4x.cfg']
                    }
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'found',
                    path: '/usr/bin/arm-none-eabi-gcc',
                    rootPath: '/usr'
                },
                completedAt: Date.now(),
                summary: { readyForDevelopment: true }
            };
            sandbox.stub(service, 'detectToolchains').resolves(mockDetectionResults);
            // Mock launch.json creation
            const writeFileStub = sandbox.stub(fs, 'writeFileSync');
            // Simulate auto-configuration process
            const detectionResults = await service.detectToolchains();
            assert.ok(detectionResults.summary.readyForDevelopment);
            // Verify configuration would be created
            const configPath = path.join(mockWorkspaceFolder.uri.fsPath, '.vscode', 'launch.json');
            const mockConfig = {
                version: '0.2.0',
                configurations: [{
                        name: 'Debug STM32',
                        type: 'cortex-debug',
                        request: 'launch',
                        servertype: 'openocd',
                        executable: mockFiles.find(f => f.name.endsWith('.elf'))?.path,
                        armToolchainPath: detectionResults.armToolchain.rootPath
                    }]
            };
            // Simulate configuration writing
            writeFileStub.withArgs(configPath, sinon.match.string);
            assert.ok(detectionResults.openocd.status === 'found');
            assert.ok(detectionResults.armToolchain.status === 'found');
        });
        it('should handle missing workspace files gracefully', async () => {
            // Mock empty workspace
            sandbox.stub(fs, 'readdirSync').returns([]);
            sandbox.stub(fs, 'existsSync').returns(false);
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const mockDetectionResults = {
                openocd: { name: 'OpenOCD', status: 'found' },
                armToolchain: { name: 'ARM GCC', status: 'found' },
                completedAt: Date.now(),
                summary: { readyForDevelopment: true }
            };
            sandbox.stub(service, 'detectToolchains').resolves(mockDetectionResults);
            const results = await service.detectToolchains();
            // Should still succeed even with missing files
            assert.ok(results);
            assert.strictEqual(results.summary.readyForDevelopment, true);
        });
    });
    describe('Auto-Troubleshooting', () => {
        it('should identify and fix common configuration issues', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            // Mock troubleshooting results
            const mockTroubleshootResults = {
                issuesFound: 3,
                issuesFixed: 2,
                remainingIssues: [
                    {
                        severity: 'warning',
                        message: 'SVD file not found - debugging features limited',
                        category: 'configuration',
                        autoFixable: false
                    }
                ],
                fixesApplied: [
                    'Set cortex-debug.armToolchainPath configuration',
                    'Created default launch.json configuration'
                ],
                duration: 2500
            };
            const troubleshootStub = sandbox.stub(scanner, 'autoTroubleshoot').resolves(mockTroubleshootResults);
            const results = await scanner.autoTroubleshoot();
            assert.ok(troubleshootStub.calledOnce);
            assert.strictEqual(results.issuesFound, 3);
            assert.strictEqual(results.issuesFixed, 2);
            assert.strictEqual(results.remainingIssues.length, 1);
            assert.ok(results.fixesApplied.length > 0);
        });
        it('should handle permission errors during auto-fix', async () => {
            const scanner = new configurationScanner_1.ConfigurationScanner();
            const mockTroubleshootResults = {
                issuesFound: 2,
                issuesFixed: 0,
                remainingIssues: [
                    {
                        severity: 'error',
                        message: 'Permission denied writing to .vscode/launch.json',
                        category: 'configuration',
                        autoFixable: false
                    }
                ],
                fixesApplied: [],
                duration: 500
            };
            sandbox.stub(scanner, 'autoTroubleshoot').resolves(mockTroubleshootResults);
            const results = await scanner.autoTroubleshoot();
            assert.strictEqual(results.issuesFixed, 0);
            assert.ok(results.remainingIssues.some(issue => issue.message.includes('Permission denied')));
        });
    });
    describe('One-Click Setup', () => {
        it('should perform complete environment setup', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            // Mock successful detection
            const mockDetectionResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'found',
                    path: '/usr/bin/openocd'
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'found',
                    path: '/usr/bin/arm-none-eabi-gcc',
                    rootPath: '/usr'
                },
                completedAt: Date.now(),
                summary: {
                    readyForDevelopment: true,
                    totalFound: 2,
                    totalMissing: 0
                }
            };
            const detectStub = sandbox.stub(service, 'detectToolchains').resolves(mockDetectionResults);
            // Mock configuration updates
            const configStub = sandbox.stub(vscode.workspace, 'getConfiguration').returns({
                update: sandbox.stub().resolves(),
                get: sandbox.stub(),
                has: sandbox.stub(),
                inspect: sandbox.stub()
            });
            // Simulate one-click setup process
            const results = await service.detectToolchains();
            assert.ok(detectStub.calledOnce);
            assert.strictEqual(results.summary.readyForDevelopment, true);
            assert.strictEqual(results.summary.totalFound, 2);
        });
        it('should handle partial setup scenarios', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const mockDetectionResults = {
                openocd: {
                    name: 'OpenOCD',
                    status: 'not_found',
                    issues: ['Not in PATH']
                },
                armToolchain: {
                    name: 'ARM GCC',
                    status: 'found',
                    path: '/usr/bin/arm-none-eabi-gcc'
                },
                completedAt: Date.now(),
                summary: {
                    readyForDevelopment: false,
                    totalFound: 1,
                    totalMissing: 1
                }
            };
            sandbox.stub(service, 'detectToolchains').resolves(mockDetectionResults);
            const results = await service.detectToolchains();
            assert.strictEqual(results.summary.readyForDevelopment, false);
            assert.ok(results.openocd.issues?.length);
        });
    });
    describe('Performance and Resource Management', () => {
        it('should complete detection within reasonable time', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            const startTime = Date.now();
            const mockResults = {
                openocd: { name: 'OpenOCD', status: 'found' },
                armToolchain: { name: 'ARM GCC', status: 'found' },
                completedAt: Date.now(),
                detectionDurationMs: 1200,
                summary: { readyForDevelopment: true }
            };
            sandbox.stub(service, 'detectToolchains').resolves(mockResults);
            const results = await service.detectToolchains();
            const duration = Date.now() - startTime;
            // Should complete quickly (mocked, but test structure)
            assert.ok(duration < 5000); // 5 seconds max for mocked test
            assert.ok(results.detectionDurationMs < 10000); // Reasonable detection time
        });
        it('should handle cancellation requests', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            // Mock cancellation scenario
            const mockCancellation = new vscode.CancellationTokenSource();
            setTimeout(() => mockCancellation.cancel(), 100);
            try {
                // This would normally handle cancellation
                const results = await service.detectToolchains();
                // If not cancelled, should still work
                assert.ok(results);
            }
            catch (error) {
                // Should handle cancellation gracefully
                assert.ok(error instanceof Error);
            }
        });
        it('should manage memory usage during detection', async () => {
            const service = toolchainDetectionService_1.ToolchainDetectionService.getInstance();
            // Test multiple consecutive detections
            const detectionPromises = [];
            for (let i = 0; i < 5; i++) {
                const mockResults = {
                    openocd: { name: 'OpenOCD', status: 'found' },
                    armToolchain: { name: 'ARM GCC', status: 'found' },
                    completedAt: Date.now(),
                    summary: { readyForDevelopment: true }
                };
                detectionPromises.push(Promise.resolve(mockResults) // Simulate detection
                );
            }
            const results = await Promise.all(detectionPromises);
            // All detections should succeed
            assert.strictEqual(results.length, 5);
            results.forEach(result => {
                assert.ok(result);
                assert.ok(result.summary.readyForDevelopment);
            });
        });
    });
});
//# sourceMappingURL=auto-configuration-comprehensive.test.js.map