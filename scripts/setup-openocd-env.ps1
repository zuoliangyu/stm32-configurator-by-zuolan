# OpenOCD Environment Setup Script for Windows
# Copyright (c) 2025 左岚. All rights reserved.
# This script helps configure OpenOCD in system PATH on Windows

param(
    [string]$OpenOCDPath = "",
    [switch]$Help
)

# Display help
if ($Help) {
    Write-Host @"
OpenOCD Environment Setup Script
================================

Usage:
    .\setup-openocd-env.ps1 [-OpenOCDPath <path>] [-Help]

Parameters:
    -OpenOCDPath    Path to OpenOCD bin directory (e.g., C:\OpenOCD\bin)
    -Help           Show this help message

Examples:
    .\setup-openocd-env.ps1 -OpenOCDPath "C:\OpenOCD\bin"
    .\setup-openocd-env.ps1  # Interactive mode

"@
    exit 0
}

Write-Host "OpenOCD Environment Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "WARNING: Not running as administrator. Changes will apply to user environment only." -ForegroundColor Yellow
    Write-Host ""
}

# Function to test OpenOCD
function Test-OpenOCD {
    param([string]$Path)
    
    $openocdExe = Join-Path $Path "openocd.exe"
    if (Test-Path $openocdExe) {
        try {
            $version = & $openocdExe --version 2>&1 | Select-String "Open On-Chip Debugger" | Select-Object -First 1
            if ($version) {
                Write-Host "✓ OpenOCD found: $version" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "✗ Failed to execute OpenOCD: $_" -ForegroundColor Red
        }
    }
    return $false
}

# Function to find OpenOCD installations
function Find-OpenOCDInstallations {
    Write-Host "Searching for OpenOCD installations..." -ForegroundColor Yellow
    
    $searchPaths = @(
        "C:\OpenOCD\bin",
        "C:\Program Files\OpenOCD\bin",
        "C:\Program Files (x86)\OpenOCD\bin",
        "C:\Tools\OpenOCD\bin",
        "$env:USERPROFILE\OpenOCD\bin",
        "$env:USERPROFILE\Tools\OpenOCD\bin",
        "$env:LOCALAPPDATA\xPacks\@xpack-dev-tools\openocd\*\bin"
    )
    
    $foundPaths = @()
    foreach ($path in $searchPaths) {
        if ($path.Contains("*")) {
            # Handle wildcard paths
            $basePath = Split-Path $path -Parent
            $pattern = Split-Path $path -Leaf
            if (Test-Path $basePath) {
                Get-ChildItem -Path $basePath -Directory | ForEach-Object {
                    $testPath = Join-Path $_.FullName "bin"
                    if (Test-Path (Join-Path $testPath "openocd.exe")) {
                        $foundPaths += $testPath
                    }
                }
            }
        } else {
            if (Test-Path (Join-Path $path "openocd.exe")) {
                $foundPaths += $path
            }
        }
    }
    
    return $foundPaths
}

# Interactive mode if no path provided
if (-not $OpenOCDPath) {
    $foundPaths = Find-OpenOCDInstallations
    
    if ($foundPaths.Count -gt 0) {
        Write-Host ""
        Write-Host "Found OpenOCD installations:" -ForegroundColor Green
        for ($i = 0; $i -lt $foundPaths.Count; $i++) {
            Write-Host "  [$($i+1)] $($foundPaths[$i])"
        }
        Write-Host "  [0] Enter custom path"
        Write-Host ""
        
        $selection = Read-Host "Select an option (0-$($foundPaths.Count))"
        if ($selection -match '^\d+$') {
            $index = [int]$selection
            if ($index -gt 0 -and $index -le $foundPaths.Count) {
                $OpenOCDPath = $foundPaths[$index - 1]
            } elseif ($index -eq 0) {
                $OpenOCDPath = Read-Host "Enter OpenOCD bin directory path"
            }
        }
    } else {
        Write-Host "No OpenOCD installations found automatically." -ForegroundColor Yellow
        $OpenOCDPath = Read-Host "Enter OpenOCD bin directory path"
    }
}

# Validate path
if (-not $OpenOCDPath) {
    Write-Host "No path provided. Exiting." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $OpenOCDPath)) {
    Write-Host "Path does not exist: $OpenOCDPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-OpenOCD -Path $OpenOCDPath)) {
    Write-Host "OpenOCD executable not found in: $OpenOCDPath" -ForegroundColor Red
    Write-Host "Make sure the path points to the 'bin' directory containing openocd.exe" -ForegroundColor Yellow
    exit 1
}

# Get current PATH
$currentPath = if ($isAdmin) {
    [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
} else {
    [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
}

# Check if already in PATH
if ($currentPath -like "*$OpenOCDPath*") {
    Write-Host ""
    Write-Host "OpenOCD is already in PATH!" -ForegroundColor Green
    Write-Host "No changes needed." -ForegroundColor Green
    exit 0
}

# Add to PATH
Write-Host ""
Write-Host "Adding OpenOCD to PATH..." -ForegroundColor Yellow

try {
    if ($isAdmin) {
        # System-wide PATH
        $newPath = "$currentPath;$OpenOCDPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
        Write-Host "✓ Added to system PATH (requires restart)" -ForegroundColor Green
    } else {
        # User PATH
        $newPath = "$currentPath;$OpenOCDPath"
        [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
        Write-Host "✓ Added to user PATH" -ForegroundColor Green
    }
    
    # Update current session
    $env:Path = "$env:Path;$OpenOCDPath"
    
    Write-Host ""
    Write-Host "Configuration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Close and reopen your terminal/VS Code"
    Write-Host "2. Run 'openocd --version' to verify"
    Write-Host "3. The STM32 Configurator extension will auto-detect OpenOCD"
    
} catch {
    Write-Host "Failed to update PATH: $_" -ForegroundColor Red
    exit 1
}