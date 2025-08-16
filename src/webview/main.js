/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
(function () {
    const vscode = acquireVsCodeApi();
    const generateButton = document.getElementById('generate-button');

    generateButton.addEventListener('click', () => {
        const data = {
            executablePath: document.getElementById('executablePath').value,
            deviceName: document.getElementById('deviceName').value,
            interfaceFile: document.getElementById('interfaceFile').value,
            targetFile: document.getElementById('targetFile').value,
            svdFilePath: document.getElementById('svdFilePath').value,
            adapterSpeed: document.getElementById('adapterSpeed').value
        };

        vscode.postMessage({
            command: 'generate',
            data: data
        });
    });
}());