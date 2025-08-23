# Git 推送和发布文档

本文档详细说明了 STM32 Debug Configurator 扩展的版本发布流程和 Git 操作步骤。

## 🚀 发布流程概述

### 版本发布的完整流程
1. **代码完善** - 添加功能、修复问题、完善文档
2. **版本升级** - 更新 package.json 中的版本号
3. **更新文档** - 更新 CHANGELOG.md 和 README
4. **Git 提交** - 提交所有变更到本地仓库
5. **创建标签** - 创建版本标签（如 v0.2.1）
6. **推送代码** - 推送到远程仓库
7. **推送标签** - 推送版本标签
8. **创建 Release** - 在 GitHub 创建正式发布版本

## 📝 Git 操作命令

### 1. 检查当前状态
```bash
# 查看当前工作区状态
git status

# 查看文件变更详情
git diff

# 查看已暂存的变更
git diff --cached
```

### 2. 暂存变更文件
```bash
# 添加所有变更文件
git add .

# 或者选择性添加文件
git add README.md README_zh.md CHANGELOG.md package.json src/

# 查看已暂存的文件
git status
```

### 3. 提交变更
```bash
# 提交变更（推荐使用多行提交信息）
git commit -m "0.2.1: 完善文档和代码注释

- 添加完整的中文版 README 文档
- 增强英文版 README 的详细程度
- 为所有 TypeScript 文件添加 JSDoc 中文注释
- 更新版本号到 0.2.1
- 完善 CHANGELOG 记录版本变更历史

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 4. 创建版本标签
```bash
# 创建带注释的版本标签
git tag -a v0.2.1 -m "Release version 0.2.1

主要更新：
- 🌍 完整的中文版 README 文档
- 📖 增强的英文版 README 文档
- 📝 完整的 JSDoc 风格中文注释
- 🔍 改进的文档结构和用户指南

技术改进：
- 💻 标准化的 JSDoc 注释覆盖所有 TypeScript 源代码
- 📁 改进的代码可维护性和开发者体验
- 🔧 增强的代码文档完整性"

# 查看创建的标签
git tag -l
```

### 5. 推送到远程仓库
```bash
# 推送代码到主分支
git push origin main

# 推送所有标签
git push origin --tags

# 或者推送特定标签
git push origin v0.2.1
```

### 6. 验证推送结果
```bash
# 查看远程分支状态
git remote -v

# 查看最近提交
git log --oneline -5 --decorate

# 验证标签是否推送成功
git ls-remote --tags origin
```

## 🔧 高级 Git 操作

### 撤销操作（紧急情况下使用）
```bash
# 撤销最近一次提交（保留文件变更）
git reset --soft HEAD~1

# 撤销暂存区的文件
git reset HEAD <file>

# 查看提交历史
git reflog
```

### 分支管理
```bash
# 查看所有分支
git branch -a

# 创建新分支（如需要）
git checkout -b feature/new-feature

# 切换分支
git checkout main
```

## 📋 发布检查清单

### 发布前检查 ✅
- [ ] 版本号已更新到 0.2.1
- [ ] CHANGELOG.md 已更新当前版本信息
- [ ] README.md 和 README_zh.md 内容准确完整
- [ ] 所有 TypeScript 文件已添加 JSDoc 注释
- [ ] 代码编译通过（`npm run compile`）
- [ ] 测试通过（如有）
- [ ] 工作区无未提交变更

### 发布执行 🚀
- [ ] Git 状态检查完成
- [ ] 所有文件已暂存
- [ ] 提交信息格式正确
- [ ] 版本标签已创建
- [ ] 代码已推送到远程仓库
- [ ] 标签已推送到远程仓库

### 发布后验证 ✅
- [ ] GitHub 仓库显示最新提交
- [ ] 版本标签在 GitHub 可见
- [ ] README 在 GitHub 正确显示
- [ ] 中文 README 链接正常工作

## 🌍 GitHub Release 创建

### 自动创建 Release（推荐）
推送标签后，可以在 GitHub 仓库中：

1. 进入 **Releases** 页面
2. 点击 **Create a new release**
3. 选择刚推送的标签 `v0.2.1`
4. 填写发布标题：`STM32 Debug Configurator v0.2.1`
5. 从 CHANGELOG.md 复制相关版本内容到发布说明
6. 勾选 **Set as the latest release**
7. 点击 **Publish release**

### 命令行创建 Release（需要 GitHub CLI）
```bash
# 安装 GitHub CLI（如未安装）
# Windows: winget install --id GitHub.cli
# macOS: brew install gh

# 登录 GitHub
gh auth login

# 创建 Release
gh release create v0.2.1 \
  --title "STM32 Debug Configurator v0.2.1" \
  --notes-file CHANGELOG.md \
  --latest
```

## 📚 常用 Git 配置

### 设置提交信息模板（可选）
```bash
# 设置全局提交信息模板
git config --global commit.template ~/.gitmessage

# 在 ~/.gitmessage 文件中添加模板内容
```

### 设置 GPG 签名（可选）
```bash
# 设置 GPG 签名
git config --global user.signingkey YOUR_GPG_KEY
git config --global commit.gpgsign true
```

## ⚠️ 注意事项

### 重要提醒
1. **谨慎推送**：确保所有变更已经测试验证
2. **标签不可变**：一旦推送标签，应避免删除或修改
3. **版本一致性**：确保 package.json、README.md、CHANGELOG.md 中的版本号一致
4. **备份重要**：重要操作前建议创建分支备份

### 故障处理
- 如果推送失败，检查网络连接和 Git 凭据
- 如果标签冲突，先删除本地标签再重新创建
- 如果需要修改已推送的提交，请联系项目维护者

---

**📝 文档版本**: 0.2.1  
**🔄 最后更新**: 2025-08-23  
**👨‍💻 维护者**: 左岚

此文档将随着项目发展持续更新和完善。