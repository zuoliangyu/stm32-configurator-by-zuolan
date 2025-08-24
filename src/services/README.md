# 统一工具链检测服务

## 概述

`ToolchainDetectionService` 是一个统一的工具链检测服务，集成了 OpenOCD 和 ARM 工具链的检测功能。该服务提供缓存机制、增量检测和与现有 UI 组件的完全兼容性。

## 主要特性

- **统一接口**: 集成 OpenOCD 和 ARM 工具链检测
- **智能缓存**: 避免重复检测，提升性能
- **增量检测**: 支持检测特定工具链
- **向后兼容**: 完全兼容现有 UI 组件
- **错误处理**: 完善的错误处理和回退机制

## 使用方式

### 基础用法

```typescript
import { ToolchainDetectionService } from './services';

// 获取服务实例
const detectionService = ToolchainDetectionService.getInstance();

// 检测所有工具链
const results = await detectionService.detectToolchains();
console.log('OpenOCD:', results.openocd);
console.log('ARM Toolchain:', results.armToolchain);
```

### 强制重新检测

```typescript
// 强制重新检测，忽略缓存
const results = await detectionService.detectToolchains({
    forceRedetection: true
});
```

### 检测特定工具链

```typescript
// 只检测 OpenOCD
const results = await detectionService.detectToolchains({
    specificTools: ['openocd']
});

// 只检测 ARM 工具链
const results = await detectionService.detectToolchains({
    specificTools: ['armToolchain']
});
```

### 自定义缓存时间

```typescript
// 设置缓存有效期为 10 分钟
const results = await detectionService.detectToolchains({
    cacheValidityMs: 10 * 60 * 1000
});
```

### UI 兼容性

```typescript
// 获取扩展的检测结果
const extendedResults = await detectionService.detectToolchains();

// 转换为 UI 兼容格式
const uiResults = detectionService.toUICompatibleResults(extendedResults);

// 传递给现有 UI 组件
const dialog = new ToolchainGuideDialog(context);
// UI 组件可以直接使用 uiResults
```

## 在现有代码中集成

### DetectionProgressHandler 集成示例

```typescript
export class DetectionProgressHandler {
    private detectionService: ToolchainDetectionService;

    constructor(localizationManager: LocalizationManager) {
        this.localizationManager = localizationManager;
        this.detectionService = ToolchainDetectionService.getInstance();
    }

    public async executeDetection(): Promise<ToolchainDetectionResults> {
        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Detecting toolchains...',
            cancellable: false
        }, async (progress) => {
            try {
                // 使用统一检测服务
                const extendedResults = await this.detectionService.detectToolchains({
                    forceRedetection: true
                });

                // 转换为 UI 兼容格式
                return this.detectionService.toUICompatibleResults(extendedResults);
            } catch (error) {
                // 回退到原有逻辑
                // ...
            }
        });
    }
}
```

## API 文档

### ToolchainDetectionService

#### 方法

##### `getInstance(): ToolchainDetectionService`
获取服务单例实例。

##### `detectToolchains(options?: DetectionOptions): Promise<ExtendedToolchainDetectionResults>`
检测工具链。

**参数:**
- `options` (可选): 检测选项
  - `forceRedetection?: boolean` - 强制重新检测
  - `specificTools?: ('openocd' | 'armToolchain')[]` - 特定工具链
  - `cacheValidityMs?: number` - 缓存有效期（毫秒）

##### `getCachedResults(): ExtendedToolchainDetectionResults | null`
获取缓存的检测结果。

##### `clearCache(): void`
清除缓存。

##### `toUICompatibleResults(results: ExtendedToolchainDetectionResults): ToolchainDetectionResults`
转换为 UI 兼容格式。

### 类型定义

#### `ExtendedToolchainDetectionResult`
扩展的工具链检测结果，包含额外信息如版本、配置文件、检测时间等。

#### `DetectionOptions`
检测选项接口，控制检测行为。

## 测试

服务包含完整的测试套件：

```typescript
import { runToolchainDetectionTests } from './services';

// 运行测试
const passed = await runToolchainDetectionTests();
if (passed) {
    console.log('All tests passed!');
}
```

## 注意事项

1. **单例模式**: 服务使用单例模式，确保全局状态一致
2. **缓存管理**: 默认缓存 5 分钟，可自定义
3. **错误处理**: 提供回退机制，确保稳定性
4. **向后兼容**: 不影响现有代码，可渐进式迁移