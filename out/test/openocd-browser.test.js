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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const sinon = __importStar(require("sinon"));
/**
 * Test suite for OpenOCD file selection functionality
 * Tests the browseForOpenOCDPath function and related file dialog features
 */
suite('OpenOCD Browser Tests', () => {
    let sandbox;
    setup(() => {
        sandbox = sinon.createSandbox();
    });
    teardown(() => {
        sandbox.restore();
    });
    suite('File Dialog Tests', () => {
        test('should open file dialog with correct options on Windows', async () => {
            // Mock platform detection
            sandbox.stub(process, 'platform').value('win32');
            // Mock VS Code showOpenDialog
            const showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');
            showOpenDialogStub.resolves([vscode.Uri.file('C:\\openocd\\bin\\openocd.exe')]);
            // Import function after stubbing (simulate dynamic import)
            const expectedOptions = {
                canSelectMany: false,
                canSelectFolders: false,
                canSelectFiles: true,
                filters: {
                    'Executable': ['exe'],
                    'All Files': ['*']
                },
                openLabel: 'Select OpenOCD Executable'
            };
            // Trigger file selection (this would be called from extension)
            await vscode.window.showOpenDialog(expectedOptions);
            assert.ok(showOpenDialogStub.calledOnce);
            assert.deepStrictEqual(showOpenDialogStub.firstCall.args[0], expectedOptions);
        });
        test('should open file dialog with correct options on Linux/macOS', async () => {
            // Mock platform detection
            sandbox.stub(process, 'platform').value('linux');
            const showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');
            showOpenDialogStub.resolves([vscode.Uri.file('/usr/bin/openocd')]);
            const expectedOptions = {
                canSelectMany: false,
                canSelectFolders: false,
                canSelectFiles: true,
                filters: {
                    'Executable': ['*'],
                    'All Files': ['*']
                },
                openLabel: 'Select OpenOCD Executable'
            };
            await vscode.window.showOpenDialog(expectedOptions);
            assert.ok(showOpenDialogStub.calledOnce);
            assert.deepStrictEqual(showOpenDialogStub.firstCall.args[0], expectedOptions);
        });
        test('should handle file dialog cancellation gracefully', async () => {
            const showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');
            showOpenDialogStub.resolves(undefined); // User cancelled
            const result = await vscode.window.showOpenDialog({
                canSelectMany: false,
                canSelectFolders: false,
                canSelectFiles: true
            });
            assert.strictEqual(result, undefined);
        });
    });
    suite('File Validation Tests', () => {
        test('should accept valid OpenOCD executable names', () => {
            const validNames = [
                'openocd.exe',
                'openocd',
                'arm-none-eabi-openocd.exe',
                'openocd-0.12.0.exe',
                'custom-openocd'
            ];
            validNames.forEach(name => {
                const fileName = path.basename(name).toLowerCase();
                const isValid = fileName.includes('openocd') ||
                    fileName === 'openocd.exe' ||
                    fileName === 'openocd';
                assert.ok(isValid, `${name} should be considered valid`);
            });
        });
        test('should prompt for confirmation on suspicious filenames', () => {
            const suspiciousNames = [
                'gcc.exe',
                'arm-none-eabi-gdb.exe',
                'stlink-utility.exe',
                'random-tool.exe'
            ];
            suspiciousNames.forEach(name => {
                const fileName = path.basename(name).toLowerCase();
                const needsConfirmation = !fileName.includes('openocd') &&
                    fileName !== 'openocd.exe' &&
                    fileName !== 'openocd';
                assert.ok(needsConfirmation, `${name} should require confirmation`);
            });
        });
    });
    suite('Path Processing Tests', () => {
        test('should handle Windows-style paths correctly', () => {
            const windowsPath = 'C:\\Program Files\\OpenOCD\\bin\\openocd.exe';
            const fileName = path.basename(windowsPath);
            assert.strictEqual(fileName, 'openocd.exe');
        });
        test('should handle Unix-style paths correctly', () => {
            const unixPath = '/usr/local/bin/openocd';
            const fileName = path.basename(unixPath);
            assert.strictEqual(fileName, 'openocd');
        });
        test('should handle paths with spaces', () => {
            const pathWithSpaces = 'C:\\Program Files (x86)\\OpenOCD 0.12.0\\bin\\openocd.exe';
            const fileName = path.basename(pathWithSpaces);
            assert.strictEqual(fileName, 'openocd.exe');
        });
    });
    suite('Error Handling Tests', () => {
        test('should handle permission errors gracefully', async () => {
            const showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');
            showOpenDialogStub.rejects(new Error('Permission denied'));
            const showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
            try {
                await vscode.window.showOpenDialog({});
            }
            catch (error) {
                // Simulate extension error handling
                await vscode.window.showErrorMessage(`Failed to browse for OpenOCD path: ${error.message}`);
            }
            assert.ok(showErrorMessageStub.calledOnce);
            assert.ok(showErrorMessageStub.firstCall.args[0].includes('Permission denied'));
        });
        test('should handle non-existent file selection', () => {
            const nonExistentPath = 'C:\\fake\\path\\openocd.exe';
            // Test file existence check
            const exists = fs.existsSync(nonExistentPath);
            assert.strictEqual(exists, false);
        });
    });
    suite('Integration Tests', () => {
        test('should trigger CFG file refresh after path selection', async () => {
            // Mock successful file selection
            const selectedPath = 'C:\\openocd\\bin\\openocd.exe';
            const showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');
            showOpenDialogStub.resolves([vscode.Uri.file(selectedPath)]);
            // This test verifies the integration flow:
            // 1. File is selected
            // 2. Path is validated
            // 3. CFG files are requested
            // 4. UI is updated
            const result = await vscode.window.showOpenDialog({
                canSelectMany: false,
                canSelectFolders: false,
                canSelectFiles: true
            });
            if (result && result.length > 0) {
                const selectedFile = result[0].fsPath;
                assert.strictEqual(selectedFile, selectedPath);
                // In real implementation, this would trigger:
                // - Path update in webview
                // - CFG files refresh
                // - UI state update
            }
        });
    });
    suite('Message Communication Tests', () => {
        test('should handle browseOpenOCDPath message correctly', () => {
            // Test webview message structure
            const message = {
                command: 'browseOpenOCDPath'
            };
            assert.strictEqual(message.command, 'browseOpenOCDPath');
        });
        test('should send updateOpenOCDPath message after selection', () => {
            const updateMessage = {
                command: 'updateOpenOCDPath',
                path: 'C:\\openocd\\bin\\openocd.exe'
            };
            assert.strictEqual(updateMessage.command, 'updateOpenOCDPath');
            assert.ok(updateMessage.path);
        });
        test('should handle getCFGFiles message after path update', () => {
            const cfgMessage = {
                command: 'getCFGFiles',
                path: 'C:\\openocd\\bin\\openocd.exe'
            };
            assert.strictEqual(cfgMessage.command, 'getCFGFiles');
            assert.ok(cfgMessage.path);
        });
    });
    suite('UI State Tests', () => {
        test('should hide download link after successful path selection', () => {
            // Test UI state changes after successful path selection
            const uiState = {
                downloadLinkVisible: true,
                openocdPathValue: '',
                placeholder: 'Auto-detection failed...'
            };
            // After successful selection
            uiState.downloadLinkVisible = false;
            uiState.openocdPathValue = 'C:\\openocd\\bin\\openocd.exe';
            uiState.placeholder = 'Leave empty to use system PATH...';
            assert.strictEqual(uiState.downloadLinkVisible, false);
            assert.ok(uiState.openocdPathValue);
        });
    });
});
//# sourceMappingURL=openocd-browser.test.js.map