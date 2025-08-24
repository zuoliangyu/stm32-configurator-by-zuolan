# ARM Toolchain JavaScript Interactions Specification

## Overview

This document specifies the JavaScript functionality needed for the ARM Toolchain UI components in the webview. These interactions should be added to `src/webview/main.js` to provide full functionality for the ARM toolchain detection and configuration interface.

## 1. Core JavaScript Functions

### 1.1 ARM Toolchain Detection Function

```javascript
/**
 * ARM Toolchain Detection Handler
 * Manages ARM toolchain path detection, validation, and UI updates
 */
class ARMToolchainHandler {
    constructor() {
        this.armPathInput = document.getElementById('armToolchainPath');
        this.browseArmButton = document.getElementById('browse-arm-button');
        this.refreshArmButton = document.getElementById('refresh-arm-button');
        this.armDownloadContainer = document.getElementById('arm-download-link-container');
        this.armInfoPanel = document.getElementById('arm-toolchain-info');
        this.armVersionSpan = document.getElementById('arm-version');
        this.armTargetSpan = document.getElementById('arm-target');
        
        this.initializeEventListeners();
        this.performAutoDetection();
    }

    /**
     * Initialize event listeners for ARM toolchain controls
     */
    initializeEventListeners() {
        // Browse button click handler
        this.browseArmButton.addEventListener('click', () => {
            this.browseForArmToolchain();
        });

        // Refresh/Scan button click handler
        this.refreshArmButton.addEventListener('click', () => {
            this.refreshArmToolchain();
        });

        // Path input change handler
        this.armPathInput.addEventListener('input', (event) => {
            this.validateArmPath(event.target.value);
        });

        // Path input blur handler for validation
        this.armPathInput.addEventListener('blur', (event) => {
            if (event.target.value.trim()) {
                this.verifyArmToolchain(event.target.value);
            }
        });
    }

    /**
     * Perform automatic ARM toolchain detection on page load
     */
    async performAutoDetection() {
        try {
            this.setDetectionState(true);
            const result = await this.sendMessage({
                command: 'detectArmToolchain'
            });

            this.handleDetectionResult(result);
        } catch (error) {
            console.error('ARM toolchain auto-detection failed:', error);
            this.showDetectionError();
        } finally {
            this.setDetectionState(false);
        }
    }

    /**
     * Handle browse for ARM toolchain executable
     */
    async browseForArmToolchain() {
        try {
            const result = await this.sendMessage({
                command: 'browseArmToolchain'
            });

            if (result.success && result.path) {
                this.armPathInput.value = result.path;
                await this.verifyArmToolchain(result.path);
            }
        } catch (error) {
            console.error('ARM toolchain browse failed:', error);
            this.showBrowseError();
        }
    }

    /**
     * Refresh/re-scan for ARM toolchain
     */
    async refreshArmToolchain() {
        this.performAutoDetection();
    }

    /**
     * Validate ARM toolchain path input
     * @param {string} path - Path to validate
     */
    validateArmPath(path) {
        const trimmedPath = path.trim();
        
        // Basic path validation
        if (!trimmedPath) {
            this.clearValidation();
            return false;
        }

        // Check for common ARM toolchain patterns
        const isArmExecutable = /arm-none-eabi-gcc(.exe)?$/i.test(trimmedPath) ||
                              /arm-linux-gnueabihf-gcc(.exe)?$/i.test(trimmedPath);

        if (!isArmExecutable) {
            this.showValidationWarning('Please select an ARM toolchain executable (e.g., arm-none-eabi-gcc)');
            return false;
        }

        this.clearValidation();
        return true;
    }

    /**
     * Verify ARM toolchain executable and get version info
     * @param {string} path - Path to verify
     */
    async verifyArmToolchain(path) {
        if (!this.validateArmPath(path)) {
            return;
        }

        try {
            this.setVerificationState(true);
            const result = await this.sendMessage({
                command: 'verifyArmToolchain',
                path: path
            });

            this.handleVerificationResult(result);
        } catch (error) {
            console.error('ARM toolchain verification failed:', error);
            this.showVerificationError();
        } finally {
            this.setVerificationState(false);
        }
    }

    /**
     * Handle ARM toolchain detection result
     * @param {Object} result - Detection result
     */
    handleDetectionResult(result) {
        if (result.success && result.path) {
            // Success case
            this.armPathInput.value = result.path;
            this.showToolchainInfo(result.info);
            this.hideDownloadLink();
            this.showSuccessIndicator('ARM Toolchain detected successfully');
        } else {
            // Failed case
            this.armPathInput.value = '';
            this.hideToolchainInfo();
            this.showDownloadLink();
            this.clearSuccessIndicator();
        }
    }

    /**
     * Handle ARM toolchain verification result
     * @param {Object} result - Verification result
     */
    handleVerificationResult(result) {
        if (result.success && result.info) {
            this.showToolchainInfo(result.info);
            this.hideDownloadLink();
            this.showSuccessIndicator('ARM Toolchain verified successfully');
        } else {
            this.hideToolchainInfo();
            this.showDownloadLink();
            this.showValidationError('Invalid ARM toolchain executable');
        }
    }

    /**
     * Show ARM toolchain information
     * @param {Object} info - Toolchain information
     */
    showToolchainInfo(info) {
        if (info.version) {
            this.armVersionSpan.textContent = info.version;
        }
        if (info.target) {
            this.armTargetSpan.textContent = info.target;
        }
        
        this.armInfoPanel.classList.remove('hidden');
    }

    /**
     * Hide ARM toolchain information panel
     */
    hideToolchainInfo() {
        this.armInfoPanel.classList.add('hidden');
        this.armVersionSpan.textContent = '-';
        this.armTargetSpan.textContent = '-';
    }

    /**
     * Show download link
     */
    showDownloadLink() {
        this.armDownloadContainer.classList.remove('hidden');
    }

    /**
     * Hide download link
     */
    hideDownloadLink() {
        this.armDownloadContainer.classList.add('hidden');
    }

    /**
     * Set detection state (show/hide loading indicators)
     * @param {boolean} isDetecting - Whether detection is in progress
     */
    setDetectionState(isDetecting) {
        if (isDetecting) {
            this.armPathInput.placeholder = getLocalizedString('autoDetecting') || 'Auto-detecting...';
            this.refreshArmButton.disabled = true;
            this.browseArmButton.disabled = true;
        } else {
            this.armPathInput.placeholder = '';
            this.refreshArmButton.disabled = false;
            this.browseArmButton.disabled = false;
        }
    }

    /**
     * Set verification state
     * @param {boolean} isVerifying - Whether verification is in progress
     */
    setVerificationState(isVerifying) {
        if (isVerifying) {
            this.armPathInput.classList.add('validating');
        } else {
            this.armPathInput.classList.remove('validating');
        }
    }

    /**
     * Show success indicator
     * @param {string} message - Success message
     */
    showSuccessIndicator(message) {
        // Add success styling to input
        this.armPathInput.classList.remove('error', 'warning');
        this.armPathInput.classList.add('success');
        
        // Show tooltip or brief message
        this.armPathInput.title = message;
    }

    /**
     * Clear success indicator
     */
    clearSuccessIndicator() {
        this.armPathInput.classList.remove('success');
        this.armPathInput.title = '';
    }

    /**
     * Show validation warning
     * @param {string} message - Warning message
     */
    showValidationWarning(message) {
        this.armPathInput.classList.remove('error', 'success');
        this.armPathInput.classList.add('warning');
        this.armPathInput.title = message;
    }

    /**
     * Show validation error
     * @param {string} message - Error message
     */
    showValidationError(message) {
        this.armPathInput.classList.remove('warning', 'success');
        this.armPathInput.classList.add('error');
        this.armPathInput.title = message;
    }

    /**
     * Clear validation styling
     */
    clearValidation() {
        this.armPathInput.classList.remove('error', 'warning', 'success');
        this.armPathInput.title = '';
    }

    /**
     * Show detection error
     */
    showDetectionError() {
        this.armPathInput.placeholder = 'Detection failed';
        this.showDownloadLink();
    }

    /**
     * Show browse error
     */
    showBrowseError() {
        // Show user-friendly error message
        const message = getLocalizedString('browseFailed') || 'Failed to browse for ARM toolchain';
        this.showNotification(message, 'error');
    }

    /**
     * Show verification error
     */
    showVerificationError() {
        this.showValidationError('Failed to verify ARM toolchain');
        this.hideToolchainInfo();
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning)
     */
    showNotification(message, type = 'info') {
        // Implementation depends on existing notification system
        // This could integrate with VS Code's message system
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    /**
     * Send message to VS Code extension
     * @param {Object} message - Message to send
     * @returns {Promise} Response from extension
     */
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            if (typeof vscode !== 'undefined') {
                vscode.postMessage(message);
                
                // Listen for response (implementation may vary)
                const handler = (event) => {
                    if (event.data.command === message.command + 'Response') {
                        window.removeEventListener('message', handler);
                        resolve(event.data);
                    }
                };
                window.addEventListener('message', handler);
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    window.removeEventListener('message', handler);
                    reject(new Error('Timeout waiting for response'));
                }, 10000);
            } else {
                reject(new Error('VS Code API not available'));
            }
        });
    }
}
```

### 1.2 Additional CSS for Interactive States

```css
/* ARM Toolchain Interactive States */
#armToolchainPath.validating {
    background-image: linear-gradient(45deg, 
        transparent 25%, rgba(255,255,255,0.1) 25%, 
        rgba(255,255,255,0.1) 50%, transparent 50%, 
        transparent 75%, rgba(255,255,255,0.1) 75%);
    background-size: 20px 20px;
    animation: validating 1s linear infinite;
}

@keyframes validating {
    0% { background-position: 0 0; }
    100% { background-position: 20px 0; }
}

#armToolchainPath.success {
    border-color: var(--vscode-inputValidation-infoBackground);
    box-shadow: 0 0 0 1px var(--vscode-inputValidation-infoBackground);
}

#armToolchainPath.warning {
    border-color: var(--vscode-inputValidation-warningBackground);
    box-shadow: 0 0 0 1px var(--vscode-inputValidation-warningBackground);
}

#armToolchainPath.error {
    border-color: var(--vscode-inputValidation-errorBackground);
    box-shadow: 0 0 0 1px var(--vscode-inputValidation-errorBackground);
}

/* Button disabled state */
#browse-arm-button:disabled,
#refresh-arm-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Smooth transitions */
.toolchain-info,
#arm-download-link-container {
    transition: all 0.3s ease;
    opacity: 1;
}

.toolchain-info.hidden,
#arm-download-link-container.hidden {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
}
```

## 2. Integration with Main JavaScript

### 2.1 Initialization Code

Add to the main webview JavaScript file:

```javascript
// ARM Toolchain Handler Initialization
let armToolchainHandler;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize ARM toolchain handler
    armToolchainHandler = new ARMToolchainHandler();
    
    // ... other existing initialization code
});

// Helper function to get localized strings
function getLocalizedString(key) {
    // Integration with existing localization system
    const element = document.querySelector(`[data-i18n="${key}"]`);
    return element ? element.textContent : null;
}
```

## 3. VS Code Extension Message Handlers

### 3.1 Required Message Handlers

The extension should handle these messages from the webview:

```typescript
// In webview message handler
switch (message.command) {
    case 'detectArmToolchain':
        return await handleDetectArmToolchain();
    
    case 'browseArmToolchain':
        return await handleBrowseArmToolchain();
    
    case 'verifyArmToolchain':
        return await handleVerifyArmToolchain(message.path);
}

async function handleDetectArmToolchain() {
    try {
        const result = await armToolchainService.detectArmToolchain();
        return {
            success: result.status === 'SUCCESS',
            path: result.path,
            info: result.info
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleBrowseArmToolchain() {
    const result = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        filters: {
            'Executables': process.platform === 'win32' ? ['exe'] : ['*']
        },
        title: 'Select ARM Toolchain Executable'
    });

    if (result && result[0]) {
        return {
            success: true,
            path: result[0].fsPath
        };
    }
    return { success: false };
}

async function handleVerifyArmToolchain(path: string) {
    try {
        const result = await armToolchainService.verifyArmToolchain(path);
        return {
            success: result.isValid,
            info: result.info
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

## 4. User Experience Flow Implementation

### 4.1 Loading States

```javascript
// Loading state management
class LoadingStateManager {
    static setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = button.innerHTML.replace(/^/, '⏳ ');
        } else {
            button.disabled = false;
            button.innerHTML = button.innerHTML.replace('⏳ ', '');
        }
    }
    
    static setInputLoading(input, isLoading) {
        if (isLoading) {
            input.classList.add('loading');
            input.placeholder = 'Processing...';
        } else {
            input.classList.remove('loading');
            input.placeholder = '';
        }
    }
}
```

### 4.2 Error Recovery

```javascript
// Error recovery mechanisms
class ErrorRecoveryManager {
    static handleConnectionError() {
        // Show retry option
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.onclick = () => armToolchainHandler.performAutoDetection();
        
        document.getElementById('arm-toolchain-section').appendChild(retryButton);
    }
    
    static handlePermissionError() {
        // Show permission guidance
        const helpText = document.createElement('small');
        helpText.textContent = 'If permission denied, try running VS Code as administrator';
        helpText.className = 'error-help';
        
        document.getElementById('arm-download-link-container').appendChild(helpText);
    }
}
```

## 5. Testing Strategy

### 5.1 Unit Tests

```javascript
// Example test cases
describe('ARMToolchainHandler', () => {
    let handler;
    
    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <input id="armToolchainPath" />
            <button id="browse-arm-button">Browse</button>
            <button id="refresh-arm-button">Scan</button>
            <div id="arm-download-link-container" class="hidden"></div>
            <div id="arm-toolchain-info" class="hidden">
                <span id="arm-version">-</span>
                <span id="arm-target">-</span>
            </div>
        `;
        
        handler = new ARMToolchainHandler();
    });
    
    test('should validate ARM toolchain paths correctly', () => {
        expect(handler.validateArmPath('arm-none-eabi-gcc')).toBe(true);
        expect(handler.validateArmPath('invalid-path')).toBe(false);
    });
    
    test('should show toolchain info on successful detection', () => {
        handler.handleDetectionResult({
            success: true,
            path: '/usr/bin/arm-none-eabi-gcc',
            info: { version: '10.3.1', target: 'arm-none-eabi' }
        });
        
        expect(document.getElementById('armToolchainPath').value).toBe('/usr/bin/arm-none-eabi-gcc');
        expect(document.getElementById('arm-toolchain-info').classList.contains('hidden')).toBe(false);
    });
});
```

## 6. Performance Considerations

### 6.1 Debouncing

```javascript
// Debounce input validation
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

// Apply to path validation
this.armPathInput.addEventListener('input', debounce((event) => {
    this.validateArmPath(event.target.value);
}, 300));
```

### 6.2 Caching

```javascript
// Cache detection results
class DetectionCache {
    static cache = new Map();
    
    static get(path) {
        return this.cache.get(path);
    }
    
    static set(path, result) {
        this.cache.set(path, result);
        // Expire after 5 minutes
        setTimeout(() => this.cache.delete(path), 5 * 60 * 1000);
    }
}
```

---

This comprehensive JavaScript interaction specification provides all the necessary functionality for the ARM Toolchain UI components, ensuring smooth user experience and proper integration with the VS Code extension architecture.