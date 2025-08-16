/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    const vscode = acquireVsCodeApi();

    // --- 获取所有需要操作的 DOM 元素 ---
    const generateButton = document.getElementById('generate-button');
    const refreshButton = document.getElementById('refresh-button');
    const openocdPathInput = document.getElementById('openocdPath');
    const downloadLinkContainer = document.getElementById('download-link-container');
    const servertypeSelect = document.getElementById('servertype');
    const openocdOptions = document.getElementById('openocd-options');
    const manualElfPathGroup = document.getElementById('manual-elf-path-group');
    const elfSourceRadios = document.querySelectorAll('input[name="elfSource"]');
    const interfaceFileSelect = document.getElementById('interfaceFile');
    const targetFileSelect = document.getElementById('targetFile');

    // --- 动态 UI 逻辑 ---

    /**
     * 新增：请求后端获取 CFG 文件列表
     */
    function requestCFGFiles() {
        const path = openocdPathInput.value;
        if (path) {
            vscode.postMessage({ command: 'getCFGFiles', path: path });
        }
    }

    /**
     * 新增：填充下拉菜单的辅助函数
     * @param {HTMLSelectElement} selectElement
     * @param {string[]} options
     */
    function populateDropdown(selectElement, options) {
        selectElement.innerHTML = ''; // 清空现有选项
        if (options.length === 0) {
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "No .cfg files found";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            selectElement.appendChild(defaultOption);
            return;
        }
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
        });
    }


    function updateVisibleOptions() { /* ... 此函数保持不变 ... */ }
    function updateElfSourceVisibility() { /* ... 此函数保持不变 ... */ }

    // --- 事件监听器 ---

    // 当 OpenOCD 路径输入框失去焦点时，请求 CFG 文件列表
    openocdPathInput.addEventListener('blur', requestCFGFiles);

    // ... 已有的其他事件监听器保持不变 ...

    // 监听从后端 (extension.ts) 发送过来的消息
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updatePath':
                const path = message.path;
                if (path) {
                    openocdPathInput.value = path;
                    openocdPathInput.placeholder = "Leave empty to use system PATH...";
                    downloadLinkContainer.classList.add('hidden');
                    // --- 新增：自动检测到路径后，立即请求 CFG 文件 ---
                    requestCFGFiles();
                } else {
                    openocdPathInput.value = "";
                    openocdPathInput.placeholder = "Auto-detection failed. Please specify the path manually.";
                    downloadLinkContainer.classList.remove('hidden');
                }
                break;

            // --- 新增：处理后端发送过来的 CFG 文件列表 ---
            case 'updateCFGLists':
                populateDropdown(interfaceFileSelect, message.data.interfaces);
                populateDropdown(targetFileSelect, message.data.targets);
                break;
        }
    });

    // (其余 JS 代码保持不变)
    toggleOpenOCDPathVisibility(); // 函数名修正
    updateElfSourceVisibility();
    servertypeSelect.addEventListener('change', toggleOpenOCDPathVisibility);
    elfSourceRadios.forEach(radio => radio.addEventListener('change', updateElfSourceVisibility));
    generateButton.addEventListener('click', () => {
        const elfSource = document.querySelector('input[name="elfSource"]:checked').value;
        const executablePath = elfSource === 'auto'
            ? '${command:st-stm32-ide-debug-launch.get-projects-binary-from-context1}'
            : document.getElementById('executablePath').value;

        const data = {
            executablePath: executablePath,
            deviceName: document.getElementById('deviceName').value,
            servertype: servertypeSelect.value,
            openocdPath: openocdPathInput.value,
            interfaceFile: interfaceFileSelect.value,
            targetFile: targetFileSelect.value,
            svdFilePath: document.getElementById('svdFilePath').value,
            adapterSpeed: document.getElementById('adapterSpeed').value
        };
        vscode.postMessage({ command: 'generate', data: data });
    });
    refreshButton.addEventListener('click', () => {
        openocdPathInput.value = "";
        openocdPathInput.placeholder = "Auto-detecting...";
        downloadLinkContainer.classList.add('hidden');
        vscode.postMessage({ command: 'refreshPath' });
    });
}());

function toggleOpenOCDPathVisibility() {
    const servertypeSelect = document.getElementById('servertype');
    const openocdOptions = document.getElementById('openocd-options');
    if (servertypeSelect.value === 'openocd') {
        openocdOptions.classList.remove('hidden');
    } else {
        openocdOptions.classList.add('hidden');
    }
}