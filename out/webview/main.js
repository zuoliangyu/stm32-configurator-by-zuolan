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
        browseButton: document.getElementById('browse-button'),
        refreshButton: document.getElementById('refresh-button'),
        openocdPathInput: document.getElementById('openocdPath'),
        downloadLinkContainer: document.getElementById('download-link-container'),
        servertypeSelect: document.getElementById('servertype'),
        openocdOptions: document.getElementById('openocd-options'),
        manualElfPathGroup: document.getElementById('manual-elf-path-group'),
        elfSourceRadios: document.querySelectorAll('input[name="elfSource"]'),
        interfaceFileSelect: document.getElementById('interfaceFile'),
        targetFileSelect: document.getElementById('targetFile'),
        interfaceFileSearch: document.getElementById('interfaceFileSearch'),
        targetFileSearch: document.getElementById('targetFileSearch'),
        interfaceFileSearchClear: document.getElementById('interfaceFileSearchClear'),
        targetFileSearchClear: document.getElementById('targetFileSearchClear'),
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

    // Store original options for search functionality
    const originalOptions = {
        interface: [],
        target: []
    };

    function populateDropdown(selectElement, options) {
        // Store original options for search
        if (selectElement.id === 'interfaceFile') {
            originalOptions.interface = [...options];
        } else if (selectElement.id === 'targetFile') {
            originalOptions.target = [...options];
        }

        selectElement.innerHTML = '';
        const searchableContainer = selectElement.closest('.searchable-select');
        
        if (options.length === 0) {
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = strings.noCfgFiles || "No .cfg files found";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            selectElement.appendChild(defaultOption);
            
            // Hide search input when no options
            if (searchableContainer) {
                searchableContainer.classList.add('disabled');
            }
            return;
        }
        
        // Show search input when options available
        if (searchableContainer) {
            searchableContainer.classList.remove('disabled');
        }
        
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
        });
    }

    // Search functionality
    function createSearchHandler(searchInput, selectElement, optionsKey) {
        return function(event) {
            const searchTerm = event.target.value.toLowerCase();
            const originalList = originalOptions[optionsKey];
            
            if (!originalList || originalList.length === 0) {
                return;
            }
            
            // Filter options based on search term
            const filteredOptions = originalList.filter(option => 
                option.toLowerCase().includes(searchTerm)
            );
            
            // Clear and repopulate select
            selectElement.innerHTML = '';
            
            if (filteredOptions.length === 0) {
                const noResultOption = document.createElement('option');
                noResultOption.value = "";
                noResultOption.textContent = searchTerm ? `No results for "${event.target.value}"` : strings.noCfgFiles || "No .cfg files found";
                noResultOption.disabled = true;
                noResultOption.selected = true;
                selectElement.appendChild(noResultOption);
            } else {
                filteredOptions.forEach(optionValue => {
                    const option = document.createElement('option');
                    option.value = optionValue;
                    
                    // Highlight matching text (using textContent to avoid XSS)
                    if (searchTerm) {
                        // For display purposes, we'll use a simpler approach
                        option.textContent = optionValue;
                        option.setAttribute('data-search-term', searchTerm);
                    } else {
                        option.textContent = optionValue;
                    }
                    
                    selectElement.appendChild(option);
                });
                
                // Auto-select first result if only one match
                if (filteredOptions.length === 1) {
                    selectElement.selectedIndex = 0;
                }
            }
        };
    }

    // Clear search functionality
    function createClearHandler(searchInput, selectElement, optionsKey) {
        return function() {
            searchInput.value = '';
            const originalList = originalOptions[optionsKey];
            
            if (originalList && originalList.length > 0) {
                populateDropdown(selectElement, originalList);
            }
        };
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

        // Browse for OpenOCD path
        elements.browseButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'browseOpenOCDPath' });
        });

        // Search functionality for interface files
        elements.interfaceFileSearch.addEventListener('input', 
            createSearchHandler(elements.interfaceFileSearch, elements.interfaceFileSelect, 'interface')
        );
        
        elements.interfaceFileSearchClear.addEventListener('click', 
            createClearHandler(elements.interfaceFileSearch, elements.interfaceFileSelect, 'interface')
        );

        // Keyboard navigation for interface files
        elements.interfaceFileSearch.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                elements.interfaceFileSelect.focus();
                if (elements.interfaceFileSelect.options.length > 0) {
                    elements.interfaceFileSelect.selectedIndex = 0;
                }
            } else if (event.key === 'Enter') {
                if (elements.interfaceFileSelect.options.length === 1 && !elements.interfaceFileSelect.options[0].disabled) {
                    elements.interfaceFileSelect.selectedIndex = 0;
                    elements.interfaceFileSelect.focus();
                }
            } else if (event.key === 'Escape') {
                elements.interfaceFileSearch.value = '';
                const originalList = originalOptions['interface'];
                if (originalList && originalList.length > 0) {
                    populateDropdown(elements.interfaceFileSelect, originalList);
                }
            }
        });

        // Search functionality for target files
        elements.targetFileSearch.addEventListener('input', 
            createSearchHandler(elements.targetFileSearch, elements.targetFileSelect, 'target')
        );
        
        elements.targetFileSearchClear.addEventListener('click', 
            createClearHandler(elements.targetFileSearch, elements.targetFileSelect, 'target')
        );

        // Keyboard navigation for target files
        elements.targetFileSearch.addEventListener('keydown', function(event) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                elements.targetFileSelect.focus();
                if (elements.targetFileSelect.options.length > 0) {
                    elements.targetFileSelect.selectedIndex = 0;
                }
            } else if (event.key === 'Enter') {
                if (elements.targetFileSelect.options.length === 1 && !elements.targetFileSelect.options[0].disabled) {
                    elements.targetFileSelect.selectedIndex = 0;
                    elements.targetFileSelect.focus();
                }
            } else if (event.key === 'Escape') {
                elements.targetFileSearch.value = '';
                const originalList = originalOptions['target'];
                if (originalList && originalList.length > 0) {
                    populateDropdown(elements.targetFileSelect, originalList);
                }
            }
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

            case 'updateOpenOCDPath':
                if (message.path) {
                    elements.openocdPathInput.value = message.path;
                    elements.downloadLinkContainer.classList.add('hidden');
                    requestCFGFiles();
                }
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