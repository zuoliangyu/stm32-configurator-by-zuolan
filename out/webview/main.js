/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    const vscode = acquireVsCodeApi();

    // State management
    let currentLanguage = 'en';
    let strings = {};
    let liveWatchVariables = [];

    // DOM elements
    const elements = {
        languageSelect: document.getElementById('language-select'),
        generateButton: document.getElementById('generate-button'),
        refreshButton: document.getElementById('refresh-button'),
        openocdPathInput: document.getElementById('openocdPath'),
        downloadLinkContainer: document.getElementById('download-link-container'),
        servertypeSelect: document.getElementById('servertype'),
        openocdOptions: document.getElementById('openocd-options'),
        manualElfPathGroup: document.getElementById('manual-elf-path-group'),
        elfSourceRadios: document.querySelectorAll('input[name="elfSource"]'),
        interfaceFileSelect: document.getElementById('interfaceFile'),
        targetFileSelect: document.getElementById('targetFile'),
        liveWatchEnabledCheckbox: document.getElementById('liveWatchEnabled'),
        liveWatchOptionsGroup: document.getElementById('livewatch-options'),
        variableList: document.getElementById('variable-list'),
        newVariableInput: document.getElementById('newVariableInput'),
        addVariableButton: document.getElementById('addVariableButton')
    };

    // Localization functions
    function updateUILanguage() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (strings[key]) {
                if (element.tagName === 'INPUT' && element.type !== 'radio') {
                    // For input elements, don't change the value, just placeholders
                } else {
                    element.textContent = strings[key];
                }
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (strings[key]) {
                element.placeholder = strings[key];
            }
        });

        // Update language select
        elements.languageSelect.value = currentLanguage;
    }

    // Variable management functions
    function addVariable(variableName) {
        if (!variableName || variableName.trim() === '') return false;
        
        const trimmedName = variableName.trim();
        if (liveWatchVariables.includes(trimmedName)) {
            showMessage('Variable already exists', 'warning');
            return false;
        }

        liveWatchVariables.push(trimmedName);
        updateVariableList();
        elements.newVariableInput.value = '';
        
        // Notify extension about variable addition
        vscode.postMessage({
            command: 'addLiveWatchVariable',
            variable: trimmedName
        });
        
        return true;
    }

    function removeVariable(variableName) {
        const index = liveWatchVariables.indexOf(variableName);
        if (index > -1) {
            liveWatchVariables.splice(index, 1);
            updateVariableList();
            
            // Notify extension about variable removal
            vscode.postMessage({
                command: 'removeLiveWatchVariable',
                variable: variableName
            });
        }
    }

    function updateVariableList() {
        if (!liveWatchVariables.length) {
            elements.variableList.innerHTML = `
                <div class="variable-list-empty">
                    ${strings.noVariables || 'No variables added yet'}
                </div>
            `;
            return;
        }

        elements.variableList.innerHTML = liveWatchVariables.map(variable => `
            <div class="variable-item">
                <span class="variable-name">${escapeHtml(variable)}</span>
                <button type="button" class="variable-remove" 
                        onclick="removeVariableHandler('${escapeHtml(variable)}')"
                        data-i18n="removeVariable">
                    ${strings.removeVariable || 'Remove'}
                </button>
            </div>
        `).join('');
    }

    // Global function for remove button onclick
    window.removeVariableHandler = function(variableName) {
        removeVariable(variableName);
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showMessage(message, type = 'info') {
        // Simple message display - could be enhanced with toast notifications
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Configuration and file handling
    function requestCFGFiles() {
        const path = elements.openocdPathInput.value;
        if (path) {
            vscode.postMessage({ command: 'getCFGFiles', path: path });
        }
    }

    function populateDropdown(selectElement, options) {
        selectElement.innerHTML = '';
        if (options.length === 0) {
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = strings.noCfgFiles || "No .cfg files found";
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

    // UI visibility controls
    function updateLiveWatchVisibility() {
        if (elements.liveWatchEnabledCheckbox.checked) {
            elements.liveWatchOptionsGroup.classList.remove('hidden');
        } else {
            elements.liveWatchOptionsGroup.classList.add('hidden');
        }
    }

    function updateElfSourceVisibility() {
        const elfSource = document.querySelector('input[name="elfSource"]:checked').value;
        if (elfSource === 'manual') {
            elements.manualElfPathGroup.classList.remove('hidden');
        } else {
            elements.manualElfPathGroup.classList.add('hidden');
        }
    }

    function toggleOpenOCDPathVisibility() {
        if (elements.servertypeSelect.value === 'openocd') {
            elements.openocdOptions.classList.remove('hidden');
        } else {
            elements.openocdOptions.classList.add('hidden');
        }
    }

    // Event listeners
    function setupEventListeners() {
        // Language switching
        elements.languageSelect.addEventListener('change', (e) => {
            const newLanguage = e.target.value;
            vscode.postMessage({
                command: 'switchLanguage',
                language: newLanguage
            });
        });

        // Variable management
        elements.addVariableButton.addEventListener('click', () => {
            const variableName = elements.newVariableInput.value;
            addVariable(variableName);
        });

        elements.newVariableInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const variableName = elements.newVariableInput.value;
                addVariable(variableName);
            }
        });

        // OpenOCD path handling
        elements.openocdPathInput.addEventListener('blur', requestCFGFiles);

        // UI visibility controls
        elements.servertypeSelect.addEventListener('change', toggleOpenOCDPathVisibility);
        elements.elfSourceRadios.forEach(radio => 
            radio.addEventListener('change', updateElfSourceVisibility)
        );
        elements.liveWatchEnabledCheckbox.addEventListener('change', updateLiveWatchVisibility);

        // Generate configuration
        elements.generateButton.addEventListener('click', () => {
            const elfSource = document.querySelector('input[name="elfSource"]:checked').value;
            const executablePath = elfSource === 'auto'
                ? '${command:st-stm32-ide-debug-launch.get-projects-binary-from-context1}'
                : document.getElementById('executablePath').value;

            const liveWatchEnabled = elements.liveWatchEnabledCheckbox.checked;
            let liveWatchData = null;
            
            if (liveWatchEnabled && liveWatchVariables.length > 0) {
                const frequency = parseInt(document.getElementById('liveWatchFrequency').value) || 4;
                liveWatchData = {
                    enabled: true,
                    samplesPerSecond: frequency,
                    variables: [...liveWatchVariables]
                };
            }

            const data = {
                executablePath: executablePath,
                deviceName: document.getElementById('deviceName').value,
                servertype: elements.servertypeSelect.value,
                openocdPath: elements.openocdPathInput.value,
                interfaceFile: elements.interfaceFileSelect.value,
                targetFile: elements.targetFileSelect.value,
                svdFilePath: document.getElementById('svdFilePath').value,
                adapterSpeed: document.getElementById('adapterSpeed').value,
                liveWatch: liveWatchData
            };
            
            vscode.postMessage({ command: 'generate', data: data });
        });

        // Refresh OpenOCD path
        elements.refreshButton.addEventListener('click', () => {
            elements.openocdPathInput.value = "";
            elements.openocdPathInput.placeholder = strings.autoDetecting || "Auto-detecting...";
            elements.downloadLinkContainer.classList.add('hidden');
            vscode.postMessage({ command: 'refreshPath' });
        });
    }

    // Message handling from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'updatePath':
                const path = message.path;
                if (path) {
                    elements.openocdPathInput.value = path;
                    elements.openocdPathInput.placeholder = "Leave empty to use system PATH...";
                    elements.downloadLinkContainer.classList.add('hidden');
                    requestCFGFiles();
                } else {
                    elements.openocdPathInput.value = "";
                    elements.openocdPathInput.placeholder = strings.autoDetectionFailed || 
                        "Auto-detection failed. Please specify the path manually.";
                    elements.downloadLinkContainer.classList.remove('hidden');
                }
                break;

            case 'updateCFGLists':
                populateDropdown(elements.interfaceFileSelect, message.data.interfaces);
                populateDropdown(elements.targetFileSelect, message.data.targets);
                break;

            case 'updateLanguage':
                currentLanguage = message.language;
                strings = message.strings;
                updateUILanguage();
                updateVariableList(); // Refresh variable list with new language
                break;

            case 'liveWatchVariableAdded':
                showMessage(strings.variableAdded?.replace('{0}', message.variable) || 
                    `Variable '${message.variable}' added successfully`, 'success');
                break;

            case 'liveWatchVariableRemoved':
                showMessage(strings.variableRemoved?.replace('{0}', message.variable) || 
                    `Variable '${message.variable}' removed successfully`, 'success');
                break;

            case 'showError':
                showMessage(message.error, 'error');
                break;
        }
    });

    // Initialize UI
    function initialize() {
        setupEventListeners();
        toggleOpenOCDPathVisibility(); 
        updateElfSourceVisibility();
        updateLiveWatchVisibility();
        updateVariableList();
        
        // Request initial language and strings from extension
        vscode.postMessage({ command: 'getLanguage' });
    }

    // Start the application
    initialize();
}());