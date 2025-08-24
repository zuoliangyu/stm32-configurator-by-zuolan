# 测试套件修复指南

本指南提供了解决测试套件中发现问题的具体步骤和代码修复方案。

## 问题1: TypeScript类型不匹配

### 问题描述
- `DetectionStatus`枚举值与现有代码中的字符串字面量不匹配
- 测试中使用的状态值如`'found'`, `'not_found'`与枚举定义不一致

### 修复方案

#### 步骤1: 更新DetectionStatus枚举
```typescript
// src/ui/types.ts
export enum DetectionStatus {
    /** 检测中 */
    DETECTING = 'detecting',
    /** 检测成功 - 匹配现有代码 */
    FOUND = 'found',
    /** 检测失败 - 匹配现有代码 */
    NOT_FOUND = 'not_found',
    /** 检测错误 */
    ERROR = 'error'
}
```

#### 步骤2: 更新服务层代码
```typescript
// src/services/detectionTypes.ts
export interface ExtendedDetectionResult {
    name: string;
    status: 'found' | 'not_found' | 'error' | 'detecting';  // 使用字符串字面量类型
    path: string | null;
    version?: string;
    info?: string;
    error?: string;
    detectedAt: number;
}
```

## 问题2: VS Code测试环境配置

### 问题描述
- 测试无法直接运行，需要VS Code扩展测试环境
- 缺少适当的测试运行器

### 修复方案

#### 步骤1: 创建测试索引文件
```typescript
// src/test/index.ts
import * as path from 'path';
import * as Mocha from 'mocha';
import * as glob from 'glob';

export function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'bdd',
        color: true,
        timeout: 10000
    });

    const testsRoot = path.resolve(__dirname, '.');

    return new Promise((c, e) => {
        glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
            if (err) {
                return e(err);
            }

            // Add files to the test suite
            files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

            try {
                // Run the mocha test
                mocha.run(failures => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }
        });
    });
}
```

#### 步骤2: 创建测试运行器
```typescript
// src/test/runTest.ts
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './index');

        // Download VS Code, unzip it and run the integration test
        await runTests({ 
            extensionDevelopmentPath, 
            extensionTestsPath,
            launchArgs: ['--disable-extensions']
        });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
```

## 问题3: Mock对象类型兼容性

### 问题描述
- `ExtensionContext` mock对象缺少必要属性
- Sinon stub类型推断问题

### 修复方案

#### 步骤1: 创建测试工具模块
```typescript
// src/test/testUtils.ts
import * as vscode from 'vscode';
import * as sinon from 'sinon';

export function createMockExtensionContext(): Partial<vscode.ExtensionContext> {
    return {
        subscriptions: [],
        workspaceState: {
            get: sinon.stub(),
            update: sinon.stub().resolves(),
            keys: sinon.stub().returns([])
        },
        globalState: {
            get: sinon.stub(),
            update: sinon.stub().resolves(),
            keys: sinon.stub().returns([]),
            setKeysForSync: sinon.stub()
        },
        secrets: {
            get: sinon.stub().resolves(),
            store: sinon.stub().resolves(),
            delete: sinon.stub().resolves(),
            onDidChange: sinon.stub()
        },
        extensionUri: vscode.Uri.file('/test'),
        extensionPath: '/test',
        extensionMode: vscode.ExtensionMode.Test,
        asAbsolutePath: sinon.stub().callsFake((relativePath: string) => `/test/${relativePath}`),
        environmentVariableCollection: {
            persistent: true,
            description: 'Test collection',
            clear: sinon.stub(),
            delete: sinon.stub(),
            forEach: sinon.stub(),
            get: sinon.stub(),
            prepend: sinon.stub(),
            replace: sinon.stub(),
            append: sinon.stub(),
            getScoped: sinon.stub()
        } as any,
        storagePath: '/test/storage',
        globalStoragePath: '/test/global',
        logPath: '/test/logs',
        logUri: vscode.Uri.file('/test/logs'),
        storageUri: vscode.Uri.file('/test/storage'),
        globalStorageUri: vscode.Uri.file('/test/global')
    };
}

export function createMockToolchainResults(overrides: any = {}) {
    return {
        openocd: {
            name: 'OpenOCD',
            status: 'found',
            path: '/usr/bin/openocd',
            info: 'OpenOCD 0.12.0',
            detectedAt: Date.now(),
            ...overrides.openocd
        },
        armToolchain: {
            name: 'ARM GCC',
            status: 'found',
            path: '/usr/bin/arm-none-eabi-gcc',
            info: 'GCC 12.2.0',
            detectedAt: Date.now(),
            ...overrides.armToolchain
        },
        completedAt: Date.now(),
        ...overrides
    };
}
```

#### 步骤2: 更新测试文件使用工具模块
```typescript
// 在测试文件中使用
import { createMockExtensionContext, createMockToolchainResults } from './testUtils';

describe('Test Suite', () => {
    let mockContext: Partial<vscode.ExtensionContext>;
    
    beforeEach(() => {
        mockContext = createMockExtensionContext();
    });
    
    it('should work with mock results', () => {
        const results = createMockToolchainResults({
            openocd: { status: 'not_found', path: null }
        });
        // 测试逻辑...
    });
});
```

## 问题4: 测试脚本优化

### 修复方案

#### 更新package.json脚本
```json
{
  "scripts": {
    "pretest": "npm run compile",
    "test": "node ./out/test/runTest.js",
    "test:unit": "npm run compile && npm run test:vscode -- --grep 'Unit'",
    "test:integration": "npm run compile && npm run test:vscode -- --grep 'Integration'",
    "test:toolchain": "npm run compile && npm run test:vscode -- --grep 'Toolchain'",
    "test:vscode": "node ./out/test/runTest.js",
    "test:all": "npm run test",
    "test:coverage": "c8 npm run test"
  }
}
```

## 问题5: 配置类型安全

### 修复方案

#### 创建类型安全的配置助手
```typescript
// src/test/configTestHelpers.ts
import * as vscode from 'vscode';
import { DetectionStatus } from '../ui/types';

export interface TestToolchainResult {
    name: string;
    status: DetectionStatus;
    path: string | null;
    info?: string;
    error?: string;
}

export interface TestToolchainResults {
    openocd: TestToolchainResult;
    armToolchain: TestToolchainResult;
}

export function createTestResult(
    status: DetectionStatus,
    path: string | null = null,
    info?: string,
    error?: string
): TestToolchainResult {
    return {
        name: 'Test Tool',
        status,
        path,
        info,
        error
    };
}

export function mockVSCodeConfiguration(values: Record<string, any> = {}) {
    return {
        get: (key: string) => values[key],
        update: jest.fn().mockResolvedValue(undefined),
        has: (key: string) => key in values,
        inspect: jest.fn()
    };
}
```

## 执行修复的步骤

### 1. 类型系统修复
```bash
# 1. 更新类型定义
# 编辑 src/ui/types.ts
# 编辑 src/services/detectionTypes.ts

# 2. 更新所有使用这些类型的文件
# 使用全局查找替换统一状态值
```

### 2. 测试环境修复
```bash
# 1. 创建测试基础设施
touch src/test/index.ts
touch src/test/runTest.ts
touch src/test/testUtils.ts

# 2. 更新package.json脚本
# 编辑 package.json

# 3. 重新编译
npm run compile
```

### 3. 运行修复后的测试
```bash
# 运行单个测试套件
npm run test:toolchain

# 运行所有测试
npm run test:all

# 生成覆盖率报告
npm run test:coverage
```

## 验证修复效果

### 1. 编译检查
```bash
npx tsc --noEmit  # 检查类型错误
```

### 2. 测试运行
```bash
npm test  # 运行完整测试套件
```

### 3. 覆盖率检查
```bash
npm run test:coverage
# 目标: >85% 覆盖率
```

## 附加建议

### 1. CI/CD集成
创建 `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
      - run: npm run test:coverage
```

### 2. 预提交钩子
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:all && npm run lint"
    }
  }
}
```

### 3. 持续监控
- 设置测试失败通知
- 监控覆盖率趋势
- 定期审查测试性能

通过按照这个指南执行修复，测试套件将能够正常运行并提供可靠的质量保障。