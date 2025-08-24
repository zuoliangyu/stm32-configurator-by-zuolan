# UI 组件模块

本模块提供工具链检测和配置向导的用户界面组件。

## 主要组件

### ToolchainGuideDialog
工具链引导对话框的主控制器，协调各个处理器组件完成工具链检测和配置流程。

### 处理器组件

- **DetectionProgressHandler**: 负责执行工具链检测并显示进度
- **ResultDisplayHandler**: 负责格式化和显示检测结果
- **UserInteractionHandler**: 负责处理用户交互（手动配置、下载链接）
- **ConfigurationHandler**: 负责保存工具链配置到VSCode设置

## 使用示例

```typescript
import * as vscode from 'vscode';
import { ToolchainGuideDialog } from '../ui';

// 在命令处理函数中使用
export async function showToolchainWizard(context: vscode.ExtensionContext) {
    const dialog = new ToolchainGuideDialog(context);
    const configured = await dialog.showWizard();
    
    if (configured) {
        vscode.window.showInformationMessage('Toolchains configured successfully!');
    } else {
        vscode.window.showWarningMessage('Toolchain configuration cancelled.');
    }
}
```

## 特性

- ✅ 自动检测 OpenOCD 和 ARM 工具链
- ✅ 显示检测进度和结果
- ✅ 支持手动配置路径
- ✅ 提供官方下载链接
- ✅ 多语言支持（中文/英文）
- ✅ 类型安全的 TypeScript 实现
- ✅ 遵循模块化设计原则（每个文件 <200 行）

## 架构设计

本模块采用职责分离的设计模式：

- **ToolchainGuideDialog**: 主控制器，协调各个组件
- **各个Handler**: 专门处理特定职责的组件
- **types.ts**: 统一的类型定义
- **index.ts**: 统一的导出接口

这种设计确保了代码的可维护性、可测试性和可扩展性。