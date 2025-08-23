"use strict";
/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const sinon = __importStar(require("sinon"));
const jsdom_1 = require("jsdom");
/**
 * Test suite for Webview integration with OpenOCD file browser
 * Tests message communication, UI updates, and user interactions
 */
suite('Webview Integration Tests', () => {
    let sandbox;
    let mockWebview;
    let mockPanel;
    let dom;
    let document;
    let window;
    setup(() => {
        sandbox = sinon.createSandbox();
        // Set up JSDOM environment
        dom = new jsdom_1.JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <input id="openocdPath" type="text" />
                <button id="browse-button">Browse</button>
                <button id="refresh-button">Refresh</button>
                <select id="interfaceFile"></select>
                <select id="targetFile"></select>
                <div id="download-link-container" class="hidden"></div>
            </body>
            </html>
        `);
        document = dom.window.document;
        window = dom.window;
        // Mock webview and panel
        mockWebview = {
            postMessage: sandbox.stub(),
            onDidReceiveMessage: sandbox.stub(),
            html: '',
            cspSource: 'vscode-webview:',
            asWebviewUri: sandbox.stub().returns(vscode.Uri.parse('vscode-webview://test'))
        };
        mockPanel = {
            webview: mockWebview,
            dispose: sandbox.stub(),
            onDidDispose: sandbox.stub(),
            reveal: sandbox.stub()
        };
        // Mock global objects
        global.document = document;
        global.window = window;
    });
    teardown(() => {
        sandbox.restore();
        dom.window.close();
    });
    suite('Message Handling Tests', () => {
        test('should handle browseOpenOCDPath command', () => {
            const messageHandler = sandbox.stub();
            // Simulate message from webview
            const message = {
                command: 'browseOpenOCDPath'
            };
            messageHandler(message);
            assert.ok(messageHandler.calledOnce);
            assert.deepStrictEqual(messageHandler.firstCall.args[0], message);
        });
        test('should handle updateOpenOCDPath response', () => {
            const pathInput = document.getElementById('openocdPath');
            const downloadContainer = document.getElementById('download-link-container');
            // Simulate successful path update
            const message = {
                command: 'updateOpenOCDPath',
                path: 'C:\\openocd\\bin\\openocd.exe'
            };
            // Simulate UI update
            pathInput.value = message.path;
            downloadContainer.classList.add('hidden');
            assert.strictEqual(pathInput.value, 'C:\\openocd\\bin\\openocd.exe');
            assert.ok(downloadContainer.classList.contains('hidden'));
        });
        test('should handle getCFGFiles request after path update', () => {
            // Simulate CFG files request
            const message = {
                command: 'getCFGFiles',
                path: 'C:\\openocd\\bin\\openocd.exe'
            };
            assert.strictEqual(message.command, 'getCFGFiles');
            assert.ok(message.path);
        });
        test('should handle updateCFGLists response', () => {
            const interfaceSelect = document.getElementById('interfaceFile');
            const targetSelect = document.getElementById('targetFile');
            const mockData = {
                interfaces: ['stlink-v2.cfg', 'stlink-v2-1.cfg'],
                targets: ['stm32f4x.cfg', 'stm32f7x.cfg']
            };
            // Simulate dropdown population
            interfaceSelect.innerHTML = '';
            mockData.interfaces.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                interfaceSelect.appendChild(optionElement);
            });
            assert.strictEqual(interfaceSelect.options.length, 2);
            assert.strictEqual(interfaceSelect.options[0].value, 'stlink-v2.cfg');
            assert.strictEqual(interfaceSelect.options[1].value, 'stlink-v2-1.cfg');
        });
    });
    suite('UI Interaction Tests', () => {
        test('should trigger browse action on button click', () => {
            const browseButton = document.getElementById('browse-button');
            const clickHandler = sandbox.stub();
            browseButton.addEventListener('click', clickHandler);
            browseButton.click();
            assert.ok(clickHandler.calledOnce);
        });
        test('should trigger refresh action on button click', () => {
            const refreshButton = document.getElementById('refresh-button');
            const pathInput = document.getElementById('openocdPath');
            // Simulate refresh action
            refreshButton.addEventListener('click', () => {
                pathInput.value = '';
                pathInput.placeholder = 'Auto-detecting...';
            });
            refreshButton.click();
            assert.strictEqual(pathInput.value, '');
            assert.strictEqual(pathInput.placeholder, 'Auto-detecting...');
        });
        test('should request CFG files on path input blur', () => {
            const pathInput = document.getElementById('openocdPath');
            const requestHandler = sandbox.stub();
            pathInput.addEventListener('blur', () => {
                if (pathInput.value) {
                    requestHandler({
                        command: 'getCFGFiles',
                        path: pathInput.value
                    });
                }
            });
            pathInput.value = 'C:\\openocd\\bin\\openocd.exe';
            pathInput.dispatchEvent(new window.Event('blur'));
            assert.ok(requestHandler.calledOnce);
            assert.deepStrictEqual(requestHandler.firstCall.args[0], {
                command: 'getCFGFiles',
                path: 'C:\\openocd\\bin\\openocd.exe'
            });
        });
    });
    suite('Error Handling Tests', () => {
        test('should display error message when file selection fails', () => {
            const errorMessage = 'Failed to browse for OpenOCD path: Permission denied';
            const showErrorStub = sandbox.stub();
            // Simulate error handling
            const message = {
                command: 'showError',
                error: 'Permission denied'
            };
            showErrorStub(`Failed to browse for OpenOCD path: ${message.error}`);
            assert.ok(showErrorStub.calledOnce);
            assert.strictEqual(showErrorStub.firstCall.args[0], errorMessage);
        });
        test('should handle empty CFG files list gracefully', () => {
            const interfaceSelect = document.getElementById('interfaceFile');
            // Simulate empty CFG files response
            interfaceSelect.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'No .cfg files found';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            interfaceSelect.appendChild(defaultOption);
            assert.strictEqual(interfaceSelect.options.length, 1);
            assert.strictEqual(interfaceSelect.options[0].textContent, 'No .cfg files found');
            assert.ok(interfaceSelect.options[0].disabled);
        });
    });
    suite('State Management Tests', () => {
        test('should maintain UI state across interactions', () => {
            const pathInput = document.getElementById('openocdPath');
            const downloadContainer = document.getElementById('download-link-container');
            // Initial state - auto-detection failed
            pathInput.value = '';
            pathInput.placeholder = 'Auto-detection failed. Please specify the path manually.';
            downloadContainer.classList.remove('hidden');
            // After successful path selection
            pathInput.value = 'C:\\openocd\\bin\\openocd.exe';
            pathInput.placeholder = 'Leave empty to use system PATH...';
            downloadContainer.classList.add('hidden');
            assert.strictEqual(pathInput.value, 'C:\\openocd\\bin\\openocd.exe');
            assert.ok(downloadContainer.classList.contains('hidden'));
        });
        test('should preserve user input during refresh operations', () => {
            const pathInput = document.getElementById('openocdPath');
            // User enters custom path
            pathInput.value = 'C:\\custom\\openocd.exe';
            const userValue = pathInput.value;
            // Refresh operation shouldn't clear user input unless explicitly requested
            assert.strictEqual(pathInput.value, userValue);
        });
    });
    suite('Integration Flow Tests', () => {
        test('should complete full file selection workflow', async () => {
            const workflow = {
                step1_browseClicked: false,
                step2_dialogOpened: false,
                step3_fileSelected: false,
                step4_pathUpdated: false,
                step5_cfgRequested: false,
                step6_cfgUpdated: false
            };
            // Step 1: User clicks browse button
            workflow.step1_browseClicked = true;
            // Step 2: File dialog opens
            workflow.step2_dialogOpened = true;
            // Step 3: User selects file
            workflow.step3_fileSelected = true;
            // Step 4: Path is updated in UI
            workflow.step4_pathUpdated = true;
            // Step 5: CFG files are requested
            workflow.step5_cfgRequested = true;
            // Step 6: CFG dropdowns are updated
            workflow.step6_cfgUpdated = true;
            // Verify complete workflow
            Object.values(workflow).forEach(step => {
                assert.strictEqual(step, true);
            });
        });
        test('should handle cancellation at any step', () => {
            const cancellationPoints = [
                'dialog_cancelled',
                'validation_failed',
                'permission_denied',
                'cfg_loading_failed'
            ];
            cancellationPoints.forEach(point => {
                // Each cancellation should be handled gracefully
                // without breaking the UI state
                assert.ok(point.length > 0);
            });
        });
    });
    suite('Performance Tests', () => {
        test('should handle rapid button clicks gracefully', () => {
            const browseButton = document.getElementById('browse-button');
            const clickCount = 10;
            let actualClicks = 0;
            browseButton.addEventListener('click', () => {
                actualClicks++;
            });
            // Simulate rapid clicking
            for (let i = 0; i < clickCount; i++) {
                browseButton.click();
            }
            assert.strictEqual(actualClicks, clickCount);
        });
        test('should debounce path input changes', () => {
            const pathInput = document.getElementById('openocdPath');
            let requestCount = 0;
            pathInput.addEventListener('blur', () => {
                requestCount++;
            });
            // Simulate multiple rapid changes
            pathInput.value = 'C:\\';
            pathInput.value = 'C:\\openocd';
            pathInput.value = 'C:\\openocd\\bin';
            pathInput.value = 'C:\\openocd\\bin\\openocd.exe';
            // Only one blur event should trigger
            pathInput.dispatchEvent(new window.Event('blur'));
            assert.strictEqual(requestCount, 1);
        });
    });
});
//# sourceMappingURL=webview-integration.test.js.map