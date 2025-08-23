/*---------------------------------------------------------------------------------------------
 * Copyright (c) 2025 左岚. All rights reserved.
 * Licensed under the MIT License. See LICENSE file in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface DebugConfiguration {
    name: string;
    type: string;
    servertype?: string;
    device?: string;
    executable?: string;
}

export interface RecentConfig {
    name: string;
    deviceName: string;
    timestamp: number;
}