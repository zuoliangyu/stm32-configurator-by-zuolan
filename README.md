# STM32 Debug Configurator (by zuolan)

这是一个简单的 VS Code 插件，旨在提供一个可视化的图形界面，用于快速生成针对 STM32 微控制器的 `cortex-debug` 调试配置文件 (`launch.json`)。

作者：左岚

---

## ✨ 功能特性

* **可视化配置**: 无需手动编写 JSON，通过简单的表单即可配置调试参数。
* **核心参数支持**: 支持配置可执行文件、设备型号、调试接口、目标芯片、SVD 文件和适配器速度。
* **智能更新**: 自动在你的工作区 `.vscode` 目录下创建或更新 `launch.json` 文件，且不会覆盖你已有的其他调试配置。
* **主题自适应**: 界面会自动适应你当前的 VS Code 颜色主题（深色/浅色）。

## 🚀 如何使用

1.  确保你已经安装了 `Cortex-Debug` 插件。
2.  在 VS Code 中打开你的 STM32 项目文件夹。
3.  按下 `Ctrl+Shift+P` 打开命令面板。
4.  输入 `STM32` 并选择命令: **"STM32: Generate Debug Configuration"**。
5.  在打开的界面中，填写你的项目信息。
6.  点击 **"Generate Configuration"** 按钮。
7.  插件会自动在 `.vscode/launch.json` 中生成配置。
8.  现在你可以去 VS Code 的“运行和调试”侧边栏启动调试了！

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

Copyright (c) 2025 左岚