"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateArmToolchainDetection = demonstrateArmToolchainDetection;
exports.demonstrateTypeDefinitions = demonstrateTypeDefinitions;
exports.runDemo = runDemo;
/**
 * ARM工具链检测功能演示
 * 展示如何使用ARM工具链检测和配置功能
 *
 * @fileoverview ARM工具链功能演示
 * @author 左岚
 * @since 0.2.3
 */
const armToolchain_1 = require("../utils/armToolchain");
/**
 * 演示ARM工具链检测功能
 * 展示完整的工具链检测和配置生成流程
 */
async function demonstrateArmToolchainDetection() {
    console.log('=== ARM Toolchain Detection Demo ===\n');
    try {
        // 1. 查找ARM工具链路径
        console.log('1. 查找ARM工具链路径...');
        const toolchainPath = await (0, armToolchain_1.findArmToolchainPath)();
        if (!toolchainPath) {
            console.log('   ❌ 未找到ARM工具链');
            console.log('   💡 请确保已安装ARM工具链并添加到PATH环境变量');
            return;
        }
        console.log(`   ✅ 找到ARM工具链: ${toolchainPath}\n`);
        // 2. 获取工具链信息
        console.log('2. 获取工具链详细信息...');
        const toolchainInfo = await (0, armToolchain_1.getArmToolchainInfo)(toolchainPath);
        console.log(`   版本: ${toolchainInfo.version}`);
        console.log(`   目标架构: ${toolchainInfo.target}`);
        console.log(`   供应商: ${toolchainInfo.vendor || 'Unknown'}`);
        console.log(`   GCC路径: ${toolchainInfo.gccPath}`);
        console.log(`   根路径: ${toolchainInfo.rootPath}\n`);
        // 3. 获取所有可执行文件路径
        console.log('3. 获取工具链可执行文件...');
        const executables = (0, armToolchain_1.getArmToolchainExecutables)(toolchainInfo.rootPath);
        console.log('   可执行文件列表:');
        Object.entries(executables).forEach(([tool, path]) => {
            console.log(`     ${tool.padEnd(8)}: ${path}`);
        });
        console.log();
        // 4. 验证工具链安装
        console.log('4. 验证工具链安装完整性...');
        const validation = await (0, armToolchain_1.validateArmToolchainPath)(toolchainPath);
        if (validation.isValid) {
            console.log('   ✅ 工具链验证通过');
            console.log(`   可用工具: ${Object.keys(validation.executables).length} 个`);
        }
        else {
            console.log('   ⚠️  工具链验证失败');
            if (validation.missingTools.length > 0) {
                console.log(`   缺失工具: ${validation.missingTools.join(', ')}`);
            }
            validation.errors.forEach(error => {
                console.log(`   错误: ${error}`);
            });
        }
        console.log();
        // 5. 生成调试配置
        console.log('5. 生成Cortex-Debug配置...');
        const debugConfig = await (0, armToolchain_1.generateCortexDebugConfig)(toolchainPath, {
            name: 'Debug STM32F407VG',
            device: 'STM32F407VG',
            svdFile: '${workspaceFolder}/STM32F407.svd',
            executable: '${workspaceFolder}/build/firmware.elf'
        });
        console.log('   ✅ 调试配置生成成功');
        console.log(`   配置名称: ${debugConfig.name}`);
        console.log(`   目标设备: ${debugConfig.device}`);
        console.log(`   调试器路径: ${debugConfig.debuggerPath}`);
        console.log();
        // 6. 生成launch.json内容
        console.log('6. 生成launch.json文件内容...');
        const launchJsonContent = await (0, armToolchain_1.generateLaunchJsonContent)(toolchainPath, [
            {
                name: 'Debug STM32F103C8',
                device: 'STM32F103C8',
                configFiles: ['interface/stlink.cfg', 'target/stm32f1x.cfg']
            },
            {
                name: 'Debug STM32F407VG',
                device: 'STM32F407VG',
                configFiles: ['interface/stlink.cfg', 'target/stm32f4x.cfg'],
                svdFile: '${workspaceFolder}/STM32F407.svd'
            }
        ]);
        console.log('   ✅ launch.json内容生成成功');
        console.log(`   VS Code版本: ${launchJsonContent.version}`);
        console.log(`   配置数量: ${launchJsonContent.configurations.length} 个`);
        // 显示生成的配置摘要
        launchJsonContent.configurations.forEach((config, index) => {
            console.log(`     配置 ${index + 1}: ${config.name} (${config.device})`);
        });
        console.log('\n🎉 ARM工具链检测演示完成！');
    }
    catch (error) {
        console.error('❌ 演示过程中发生错误:', error);
    }
}
/**
 * 演示类型定义和接口使用
 */
function demonstrateTypeDefinitions() {
    console.log('\n=== Type Definitions Demo ===\n');
    // 演示ToolchainInfo类型
    const toolchainInfo = {
        version: '10.3.1',
        gccPath: '/opt/arm-toolchain/bin/arm-none-eabi-gcc',
        rootPath: '/opt/arm-toolchain',
        target: 'arm-none-eabi',
        vendor: 'GNU Arm Embedded Toolchain',
        detectedAt: Date.now()
    };
    console.log('ToolchainInfo 示例:');
    console.log(JSON.stringify(toolchainInfo, null, 2));
    // 演示CortexDebugConfig类型
    const debugConfig = {
        name: 'Debug Config Example',
        device: 'STM32F407VG',
        configFiles: [
            'interface/stlink.cfg',
            'target/stm32f4x.cfg'
        ],
        svdFile: '${workspaceFolder}/STM32F407.svd',
        executable: '${workspaceFolder}/build/firmware.elf',
        debuggerArgs: ['--batch', '--quiet'],
        runToEntryPoint: 'main',
        cwd: '${workspaceFolder}'
    };
    console.log('\nCortexDebugConfig 示例:');
    console.log(JSON.stringify(debugConfig, null, 2));
    console.log('\n✅ 类型定义演示完成！');
}
/**
 * 主演示函数
 * 运行所有演示功能
 */
async function runDemo() {
    console.log('STM32 ARM Toolchain Detection & Configuration Demo');
    console.log('==================================================\n');
    // 演示类型定义
    demonstrateTypeDefinitions();
    // 演示工具链检测（仅在实际环境中运行）
    if (process.env.NODE_ENV !== 'test') {
        await demonstrateArmToolchainDetection();
    }
    else {
        console.log('\n⏭️  跳过实际工具链检测（测试环境）');
    }
    console.log('\n演示结束。感谢使用 STM32 Configurator by zuolan!');
}
// 如果直接运行此文件，执行演示
if (require.main === module) {
    runDemo().catch(error => {
        console.error('Demo execution failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=arm-toolchain-demo.js.map