# STM32 Debug Configurator (by zuolan)

这是一个为 STM32 开发者设计的智能 VS Code 插件，旨在提供一个现代化的图形界面，用于快速、准确地生成 `Cortex-Debug` 调试配置文件 (`launch.json`)。

本插件能够智能检测你的本地环境，动态生成配置选项，让你摆脱手动编写和修改 JSON 文件的繁琐工作。

作者：左岚

---

## ✨ 功能特性

* **可视化配置**: 无需手动编写 JSON，通过一个直观的表单即可完成所有调试配置。

* **多种 GDB Server 支持**: 自由选择 `Cortex-Debug` 支持的主流 GDB 服务器，包括 **OpenOCD**, **pyOCD**, **J-Link** 等。

* **智能动态 UI**: 配置界面会根据你选择的 GDB 服务器，**自动显示或隐藏**相关的配置项，保持界面整洁、逻辑清晰。

* **OpenOCD 环境感知**:
    * **自动路径检测**: 插件启动时会自动扫描系统环境，查找已安装的 OpenOCD。
    * **动态加载配置**: 根据检测到的 OpenOCD 路径，**实时读取**其 `scripts` 目录下的探针 (`interface`) 和目标 (`target`) 配置文件，并动态填充到下拉菜单中。
    
* **解耦依赖**:
    * 可选择**自动检测**（需安装 ST 官方插件）或**手动指定** `.elf` 可执行文件路径，让本插件可以独立运行。

* **自动化助手**:
    * **智能更新 `launch.json`**: 自动在你的工作区 `.vscode` 目录下创建或更新 `launch.json`，且不会覆盖你已有的其他调试配置。
    * **自动配置 `Cortex-Debug`**: 当你提供 OpenOCD 路径时，插件会自动将其写入 VS Code 的全局设置中，免去手动配置 `cortex-debug.openocdPath` 的步骤。

* **主题自适应**: 界面会自动适应你当前的 VS Code 颜色主题（深色/浅色）。

## 🚀 如何使用

1.  在 VS Code 的扩展商店中，确保你已经安装了 **`Cortex-Debug`** (`marus25.cortex-debug`) 插件。
2.  在 VS Code 中打开你的 STM32 项目文件夹。
3.  按下 `Ctrl+Shift+P` 打开命令面板。
4.  输入 `STM32` 并选择命令: **"STM32: Generate Debug Configuration"**。
5.  在打开的图形化界面中，按顺序填写你的项目信息：
    * 选择 `.elf` 文件的获取方式（自动或手动）。
    * 选择你想要使用的 GDB 服务器。
    * 界面会自动更新，显示与你选择匹配的选项，请填写它们。
6.  点击 **"Generate Configuration"** 按钮。
7.  插件会自动帮你完成 `settings.json` (如果需要) 和 `.vscode/launch.json` 的配置。
8.  现在你可以去 VS Code 的“运行和调试”侧边栏，选择刚刚生成的配置项，开始调试了！

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

Copyright (c) 2025 左岚