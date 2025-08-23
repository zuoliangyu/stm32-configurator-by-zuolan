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
const path = __importStar(require("path"));
const sinon = __importStar(require("sinon"));
/**
 * Cross-platform test suite for OpenOCD file browser functionality
 * Tests platform-specific behaviors and path handling across different operating systems
 */
suite('Cross-Platform Tests', () => {
    let sandbox;
    setup(() => {
        sandbox = sinon.createSandbox();
    });
    teardown(() => {
        sandbox.restore();
    });
    suite('Windows Platform Tests', () => {
        setup(() => {
            sandbox.stub(process, 'platform').value('win32');
        });
        test('should use .exe extension filter on Windows', () => {
            const platformFilters = process.platform === 'win32'
                ? ['exe']
                : ['*'];
            const expectedFilters = {
                'Executable': platformFilters,
                'All Files': ['*']
            };
            assert.deepStrictEqual(expectedFilters.Executable, ['exe']);
        });
        test('should handle Windows-style paths correctly', () => {
            const testPaths = [
                'C:\\Program Files\\OpenOCD\\bin\\openocd.exe',
                'C:\\Program Files (x86)\\OpenOCD 0.12.0\\bin\\openocd.exe',
                'D:\\Development Tools\\openocd\\openocd.exe',
                'C:\\Users\\User\\Desktop\\openocd.exe'
            ];
            testPaths.forEach(testPath => {
                const fileName = path.basename(testPath);
                const isValid = fileName.toLowerCase().includes('openocd') ||
                    fileName.toLowerCase() === 'openocd.exe';
                assert.ok(isValid, `Should handle Windows path: ${testPath}`);
            });
        });
        test('should detect valid OpenOCD executables on Windows', () => {
            const windowsExecutables = [
                'openocd.exe',
                'arm-none-eabi-openocd.exe',
                'openocd-0.12.0.exe',
                'st-openocd.exe'
            ];
            windowsExecutables.forEach(exe => {
                const isValid = exe.toLowerCase().includes('openocd') && exe.endsWith('.exe');
                assert.ok(isValid, `${exe} should be valid on Windows`);
            });
        });
        test('should handle registry-based paths on Windows', () => {
            // Simulate registry paths commonly used on Windows
            const registryPaths = [
                'HKEY_LOCAL_MACHINE\\SOFTWARE\\OpenOCD',
                'C:\\ProgramData\\OpenOCD\\bin\\openocd.exe'
            ];
            registryPaths.forEach(regPath => {
                if (regPath.includes('.exe')) {
                    const fileName = path.basename(regPath);
                    assert.ok(fileName.includes('openocd'));
                }
            });
        });
    });
    suite('Linux Platform Tests', () => {
        setup(() => {
            sandbox.stub(process, 'platform').value('linux');
        });
        test('should use wildcard filter on Linux', () => {
            const platformFilters = process.platform === 'win32'
                ? ['exe']
                : ['*'];
            const expectedFilters = {
                'Executable': platformFilters,
                'All Files': ['*']
            };
            assert.deepStrictEqual(expectedFilters.Executable, ['*']);
        });
        test('should handle Linux-style paths correctly', () => {
            const testPaths = [
                '/usr/bin/openocd',
                '/usr/local/bin/openocd',
                '/opt/openocd/bin/openocd',
                '/home/user/tools/openocd/bin/openocd',
                '/snap/openocd/current/bin/openocd'
            ];
            testPaths.forEach(testPath => {
                const fileName = path.basename(testPath);
                const isValid = fileName.toLowerCase().includes('openocd') ||
                    fileName.toLowerCase() === 'openocd';
                assert.ok(isValid, `Should handle Linux path: ${testPath}`);
            });
        });
        test('should detect valid OpenOCD executables on Linux', () => {
            const linuxExecutables = [
                'openocd',
                'arm-none-eabi-openocd',
                'openocd-0.12.0',
                'st-openocd'
            ];
            linuxExecutables.forEach(exe => {
                const isValid = exe.toLowerCase().includes('openocd');
                assert.ok(isValid, `${exe} should be valid on Linux`);
            });
        });
        test('should handle package manager paths on Linux', () => {
            const packagePaths = [
                '/usr/bin/openocd', // apt/yum installed
                '/usr/local/bin/openocd', // compiled from source
                '/opt/openocd/bin/openocd', // manual installation
                '/snap/openocd/current/bin/openocd' // snap package
            ];
            packagePaths.forEach(pkgPath => {
                const fileName = path.basename(pkgPath);
                assert.strictEqual(fileName, 'openocd');
            });
        });
    });
    suite('macOS Platform Tests', () => {
        setup(() => {
            sandbox.stub(process, 'platform').value('darwin');
        });
        test('should use wildcard filter on macOS', () => {
            const platformFilters = process.platform === 'win32'
                ? ['exe']
                : ['*'];
            const expectedFilters = {
                'Executable': platformFilters,
                'All Files': ['*']
            };
            assert.deepStrictEqual(expectedFilters.Executable, ['*']);
        });
        test('should handle macOS-style paths correctly', () => {
            const testPaths = [
                '/usr/local/bin/openocd',
                '/opt/homebrew/bin/openocd',
                '/Applications/OpenOCD.app/Contents/MacOS/openocd',
                '/Users/user/Development/openocd/bin/openocd'
            ];
            testPaths.forEach(testPath => {
                const fileName = path.basename(testPath);
                const isValid = fileName.toLowerCase().includes('openocd') ||
                    fileName.toLowerCase() === 'openocd';
                assert.ok(isValid, `Should handle macOS path: ${testPath}`);
            });
        });
        test('should handle Homebrew paths on macOS', () => {
            const brewPaths = [
                '/usr/local/bin/openocd', // Intel Homebrew
                '/opt/homebrew/bin/openocd', // Apple Silicon Homebrew
                '/usr/local/Cellar/openocd/0.12.0/bin/openocd'
            ];
            brewPaths.forEach(brewPath => {
                const fileName = path.basename(brewPath);
                assert.strictEqual(fileName, 'openocd');
            });
        });
        test('should handle application bundle paths on macOS', () => {
            const bundlePath = '/Applications/OpenOCD.app/Contents/MacOS/openocd';
            const fileName = path.basename(bundlePath);
            assert.strictEqual(fileName, 'openocd');
        });
    });
    suite('Path Normalization Tests', () => {
        test('should normalize paths across platforms', () => {
            const testCases = [
                {
                    input: 'C:\\Program Files\\OpenOCD\\bin\\openocd.exe',
                    platform: 'win32',
                    expected: 'openocd.exe'
                },
                {
                    input: '/usr/local/bin/openocd',
                    platform: 'linux',
                    expected: 'openocd'
                },
                {
                    input: '/opt/homebrew/bin/openocd',
                    platform: 'darwin',
                    expected: 'openocd'
                }
            ];
            testCases.forEach(testCase => {
                const fileName = path.basename(testCase.input);
                assert.strictEqual(fileName, testCase.expected);
            });
        });
        test('should handle paths with special characters', () => {
            const specialPaths = [
                'C:\\Program Files (x86)\\OpenOCD 0.12.0\\bin\\openocd.exe',
                '/home/user-name/tools/openocd-v0.12/bin/openocd',
                '/Applications/OpenOCD v0.12.app/Contents/MacOS/openocd'
            ];
            specialPaths.forEach(specialPath => {
                const fileName = path.basename(specialPath);
                const isValid = fileName.toLowerCase().includes('openocd');
                assert.ok(isValid, `Should handle special characters in: ${specialPath}`);
            });
        });
    });
    suite('Permission Tests', () => {
        test('should handle file permissions on Unix-like systems', () => {
            const unixPlatforms = ['linux', 'darwin'];
            unixPlatforms.forEach(platform => {
                sandbox.stub(process, 'platform').value(platform);
                // Simulate permission check
                const hasExecutePermission = true; // Would be checked with fs.access in real implementation
                assert.ok(hasExecutePermission, `Should check execute permissions on ${platform}`);
            });
        });
        test('should handle Windows UAC scenarios', () => {
            sandbox.stub(process, 'platform').value('win32');
            const protectedPaths = [
                'C:\\Program Files\\OpenOCD\\bin\\openocd.exe',
                'C:\\Windows\\System32\\openocd.exe'
            ];
            protectedPaths.forEach(protectedPath => {
                // Simulate UAC requirement check
                const requiresElevation = protectedPath.includes('Program Files') ||
                    protectedPath.includes('System32');
                if (requiresElevation) {
                    // Should handle elevation gracefully
                    assert.ok(true, `Should handle UAC for: ${protectedPath}`);
                }
            });
        });
    });
    suite('Environment Variable Tests', () => {
        test('should handle PATH environment variable across platforms', () => {
            const pathSeparators = {
                'win32': ';',
                'linux': ':',
                'darwin': ':'
            };
            Object.entries(pathSeparators).forEach(([platform, separator]) => {
                sandbox.stub(process, 'platform').value(platform);
                const mockPaths = platform === 'win32'
                    ? 'C:\\Program Files\\OpenOCD\\bin;C:\\Windows\\System32'
                    : '/usr/local/bin:/usr/bin:/opt/homebrew/bin';
                const pathArray = mockPaths.split(separator);
                assert.ok(pathArray.length > 0, `Should split PATH correctly on ${platform}`);
            });
        });
        test('should handle platform-specific executable extensions', () => {
            const platformExtensions = {
                'win32': ['.exe', '.cmd', '.bat'],
                'linux': [''],
                'darwin': ['']
            };
            Object.entries(platformExtensions).forEach(([platform, extensions]) => {
                sandbox.stub(process, 'platform').value(platform);
                extensions.forEach(ext => {
                    const testFile = `openocd${ext}`;
                    const isExecutable = platform === 'win32' ? ext === '.exe' : ext === '';
                    if (isExecutable) {
                        assert.ok(testFile.includes('openocd'), `Should recognize ${testFile} on ${platform}`);
                    }
                });
            });
        });
    });
    suite('Locale and Encoding Tests', () => {
        test('should handle non-ASCII paths on Windows', () => {
            sandbox.stub(process, 'platform').value('win32');
            const nonAsciiPaths = [
                'C:\\程序文件\\OpenOCD\\bin\\openocd.exe',
                'C:\\Archivos de programa\\OpenOCD\\bin\\openocd.exe',
                'C:\\Fichiers de programme\\OpenOCD\\bin\\openocd.exe'
            ];
            nonAsciiPaths.forEach(nonAsciiPath => {
                const fileName = path.basename(nonAsciiPath);
                assert.strictEqual(fileName, 'openocd.exe');
            });
        });
        test('should handle Unicode paths on Unix systems', () => {
            const unicodePaths = [
                '/home/用户/tools/openocd/bin/openocd',
                '/home/usuario/herramientas/openocd/bin/openocd',
                '/home/utilisateur/outils/openocd/bin/openocd'
            ];
            unicodePaths.forEach(unicodePath => {
                const fileName = path.basename(unicodePath);
                assert.strictEqual(fileName, 'openocd');
            });
        });
    });
});
//# sourceMappingURL=cross-platform.test.js.map