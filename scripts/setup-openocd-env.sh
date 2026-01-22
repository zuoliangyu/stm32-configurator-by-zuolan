#!/bin/bash
# OpenOCD Environment Setup Script for Linux/macOS
# Copyright (c) 2025 左岚. All rights reserved.
# This script helps configure OpenOCD in system PATH on Unix-like systems

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Display header
echo -e "${CYAN}OpenOCD Environment Setup Script${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Function to display help
show_help() {
    cat << EOF
Usage: $0 [OPTIONS] [OPENOCD_PATH]

Options:
    -h, --help          Show this help message
    -s, --system        Install system-wide (requires sudo)
    -u, --user          Install for current user only (default)

Arguments:
    OPENOCD_PATH        Path to OpenOCD bin directory

Examples:
    $0 /usr/local/openocd/bin
    $0 --system /opt/openocd/bin
    $0  # Interactive mode

EOF
    exit 0
}

# Parse arguments
SYSTEM_INSTALL=false
OPENOCD_PATH=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -s|--system)
            SYSTEM_INSTALL=true
            shift
            ;;
        -u|--user)
            SYSTEM_INSTALL=false
            shift
            ;;
        *)
            OPENOCD_PATH="$1"
            shift
            ;;
    esac
done

# Function to test OpenOCD
test_openocd() {
    local path="$1"
    local openocd_exe="$path/openocd"
    
    if [ -f "$openocd_exe" ]; then
        if version=$("$openocd_exe" --version 2>&1 | grep "Open On-Chip Debugger" | head -1); then
            echo -e "${GREEN}✓ OpenOCD found: $version${NC}"
            return 0
        fi
    fi
    return 1
}

# Function to find OpenOCD installations
find_openocd_installations() {
    echo -e "${YELLOW}Searching for OpenOCD installations...${NC}"
    
    local search_paths=(
        "/usr/local/openocd/bin"
        "/usr/local/bin"
        "/opt/openocd/bin"
        "/usr/bin"
        "$HOME/.local/openocd/bin"
        "$HOME/tools/openocd/bin"
        "$HOME/openocd/bin"
    )
    
    local found_paths=()
    for path in "${search_paths[@]}"; do
        if [ -f "$path/openocd" ]; then
            found_paths+=("$path")
        fi
    done
    
    # Check if OpenOCD is already in PATH
    if command -v openocd &> /dev/null; then
        local current_path=$(which openocd)
        local bin_dir=$(dirname "$current_path")
        echo -e "${GREEN}OpenOCD is already in PATH at: $bin_dir${NC}"
        found_paths+=("$bin_dir")
    fi
    
    printf '%s\n' "${found_paths[@]}"
}

# Interactive mode if no path provided
if [ -z "$OPENOCD_PATH" ]; then
    mapfile -t found_paths < <(find_openocd_installations | tail -n +2)  # Skip the "Searching..." message
    
    if [ ${#found_paths[@]} -gt 0 ]; then
        echo ""
        echo -e "${GREEN}Found OpenOCD installations:${NC}"
        for i in "${!found_paths[@]}"; do
            echo "  [$((i+1))] ${found_paths[$i]}"
        done
        echo "  [0] Enter custom path"
        echo ""
        
        read -p "Select an option (0-${#found_paths[@]}): " selection
        
        if [[ "$selection" =~ ^[0-9]+$ ]]; then
            if [ "$selection" -gt 0 ] && [ "$selection" -le ${#found_paths[@]} ]; then
                OPENOCD_PATH="${found_paths[$((selection-1))]}"
            elif [ "$selection" -eq 0 ]; then
                read -p "Enter OpenOCD bin directory path: " OPENOCD_PATH
            fi
        fi
    else
        echo -e "${YELLOW}No OpenOCD installations found automatically.${NC}"
        read -p "Enter OpenOCD bin directory path: " OPENOCD_PATH
    fi
fi

# Validate path
if [ -z "$OPENOCD_PATH" ]; then
    echo -e "${RED}No path provided. Exiting.${NC}"
    exit 1
fi

if [ ! -d "$OPENOCD_PATH" ]; then
    echo -e "${RED}Path does not exist: $OPENOCD_PATH${NC}"
    exit 1
fi

if ! test_openocd "$OPENOCD_PATH"; then
    echo -e "${RED}OpenOCD executable not found in: $OPENOCD_PATH${NC}"
    echo -e "${YELLOW}Make sure the path points to the 'bin' directory containing openocd${NC}"
    exit 1
fi

# Determine shell configuration file
if [ "$SYSTEM_INSTALL" = true ]; then
    CONFIG_FILE="/etc/environment"
    echo -e "${YELLOW}System-wide installation selected (requires sudo)${NC}"
else
    # Detect shell and configuration file
    SHELL_NAME=$(basename "$SHELL")
    case "$SHELL_NAME" in
        zsh)
            CONFIG_FILE="$HOME/.zshrc"
            ;;
        bash)
            if [ -f "$HOME/.bash_profile" ]; then
                CONFIG_FILE="$HOME/.bash_profile"
            else
                CONFIG_FILE="$HOME/.bashrc"
            fi
            ;;
        fish)
            CONFIG_FILE="$HOME/.config/fish/config.fish"
            ;;
        *)
            CONFIG_FILE="$HOME/.profile"
            ;;
    esac
    echo -e "${CYAN}Configuring for shell: $SHELL_NAME${NC}"
fi

# Check if already in PATH
if echo "$PATH" | grep -q "$OPENOCD_PATH"; then
    echo ""
    echo -e "${GREEN}OpenOCD is already in PATH!${NC}"
    echo -e "${GREEN}No changes needed.${NC}"
    exit 0
fi

# Add to PATH
echo ""
echo -e "${YELLOW}Adding OpenOCD to PATH...${NC}"

if [ "$SYSTEM_INSTALL" = true ]; then
    # System-wide installation
    if [ -w "$CONFIG_FILE" ] || [ "$EUID" -eq 0 ]; then
        # Update /etc/environment
        if grep -q "^PATH=" "$CONFIG_FILE"; then
            sudo sed -i "s|^PATH=\"\(.*\)\"|PATH=\"\1:$OPENOCD_PATH\"|" "$CONFIG_FILE"
        else
            echo "PATH=\"$PATH:$OPENOCD_PATH\"" | sudo tee -a "$CONFIG_FILE" > /dev/null
        fi
        echo -e "${GREEN}✓ Added to system PATH (requires re-login)${NC}"
    else
        echo -e "${RED}Cannot write to $CONFIG_FILE. Please run with sudo.${NC}"
        exit 1
    fi
else
    # User installation
    if [ "$SHELL_NAME" = "fish" ]; then
        echo "set -gx PATH \$PATH $OPENOCD_PATH" >> "$CONFIG_FILE"
    else
        echo "" >> "$CONFIG_FILE"
        echo "# OpenOCD path added by setup script" >> "$CONFIG_FILE"
        echo "export PATH=\"\$PATH:$OPENOCD_PATH\"" >> "$CONFIG_FILE"
    fi
    echo -e "${GREEN}✓ Added to $CONFIG_FILE${NC}"
fi

echo ""
echo -e "${GREEN}Configuration completed successfully!${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo "1. Reload your shell configuration:"
if [ "$SYSTEM_INSTALL" = true ]; then
    echo "   Log out and log back in"
else
    echo "   source $CONFIG_FILE"
fi
echo "2. Run 'openocd --version' to verify"
echo "3. The STM32 Configurator extension will auto-detect OpenOCD"

# Offer to reload configuration now (user install only)
if [ "$SYSTEM_INSTALL" = false ]; then
    echo ""
    read -p "Would you like to reload the configuration now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        export PATH="$PATH:$OPENOCD_PATH"
        echo -e "${GREEN}Configuration reloaded for this session.${NC}"
        echo "Run 'openocd --version' to test."
    fi
fi