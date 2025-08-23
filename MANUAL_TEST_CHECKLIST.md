# Manual Test Checklist for OpenOCD File Selection Feature

## Overview
This checklist provides a comprehensive manual testing strategy for the OpenOCD file selection functionality in the STM32 Debug Configurator extension.

## Pre-Test Setup

### Environment Preparation
- [ ] **VS Code Version**: Ensure VS Code version 1.80.0 or higher
- [ ] **Extension Installation**: Install STM32 Debug Configurator extension
- [ ] **Dependencies**: Verify Cortex-Debug extension is available
- [ ] **Test Platforms**: Prepare Windows, macOS, and Linux test environments
- [ ] **OpenOCD Installations**: Have multiple OpenOCD versions available for testing

### Test Data Preparation
- [ ] **Valid OpenOCD Executables**:
  - Windows: `openocd.exe`, `arm-none-eabi-openocd.exe`
  - Linux/macOS: `openocd`, `arm-none-eabi-openocd`
- [ ] **Invalid Executables**: `gcc.exe`, `gdb`, `random-tool.exe`
- [ ] **Test Directories**: Create directories with/without OpenOCD installations
- [ ] **Permission Scenarios**: Prepare files with different permission levels

## Core Functionality Tests

### 1. Browse Button Interaction
- [ ] **Button Visibility**: Browse button appears when OpenOCD server type is selected
- [ ] **Button Click Response**: Button responds to click events without delay
- [ ] **Multiple Clicks**: Rapid multiple clicks don't break the functionality
- [ ] **Button State**: Button remains enabled during file selection process

### 2. File Dialog Behavior
- [ ] **Dialog Opens**: File dialog opens successfully on all platforms
- [ ] **Dialog Title**: "Select OpenOCD Executable" title is displayed
- [ ] **File Filters**:
  - Windows: Shows `.exe` files and "All Files" options
  - Linux/macOS: Shows all files and "All Files" options
- [ ] **Navigation**: Can navigate through different directories
- [ ] **Cancellation**: Dialog can be cancelled without issues

### 3. File Selection and Validation
- [ ] **Valid Selection**: 
  - Select `openocd.exe` (Windows) or `openocd` (Linux/macOS)
  - Path appears correctly in input field
  - No confirmation dialogs appear
- [ ] **Suspicious Files**:
  - Select non-OpenOCD executable (e.g., `gcc.exe`)
  - Confirmation dialog appears asking "Use it anyway?"
  - Selecting "Yes" accepts the file
  - Selecting "No" cancels the selection
- [ ] **Path Display**: Full path is displayed correctly in the input field

### 4. CFG Files Refresh
- [ ] **Automatic Refresh**: After valid OpenOCD path selection:
  - Interface dropdown updates with available `.cfg` files
  - Target dropdown updates with available `.cfg` files
  - Files are correctly categorized
- [ ] **Empty Results**: If no CFG files found:
  - Dropdowns show "No .cfg files found" message
  - Options are disabled
- [ ] **Error Handling**: Invalid paths don't crash the extension

## Integration Tests

### 5. Webview Communication
- [ ] **Message Passing**: 
  - Browse button click sends `browseOpenOCDPath` message
  - Extension responds with `updateOpenOCDPath` message
  - Path updates correctly in webview
- [ ] **State Synchronization**:
  - UI state remains consistent during operations
  - Error states are properly communicated
  - Success states update all relevant UI elements

### 6. Compatibility with Existing Features
- [ ] **Scan Function**: Existing "Scan" functionality still works
- [ ] **Manual Path Entry**: Can still manually enter paths
- [ ] **Refresh Button**: Refresh button still triggers auto-detection
- [ ] **Configuration Generation**: Selected path is used in generated configuration

### 7. Multi-language Support
- [ ] **Language Switching**:
  - Browse button text updates when language changes
  - Confirmation dialogs appear in selected language
  - Error messages display in correct language
- [ ] **Text Encoding**: Non-ASCII characters in paths display correctly

## Cross-Platform Tests

### 8. Windows-Specific Tests
- [ ] **File Extensions**: Only `.exe` files shown by default in file filter
- [ ] **Path Formats**: Windows paths (e.g., `C:\Program Files\OpenOCD\bin\openocd.exe`) work correctly
- [ ] **Program Files**: Can select files from `Program Files` directories
- [ ] **UAC Scenarios**: Handles User Account Control prompts gracefully
- [ ] **Registry Paths**: Works with registry-installed OpenOCD

### 9. Linux-Specific Tests
- [ ] **No Extension Filter**: All files shown in file dialog
- [ ] **Common Paths**: Works with common Linux paths:
  - `/usr/bin/openocd`
  - `/usr/local/bin/openocd`
  - `/opt/openocd/bin/openocd`
- [ ] **Permissions**: Handles executable permission checks
- [ ] **Package Manager Installs**: Works with apt/yum installed OpenOCD

### 10. macOS-Specific Tests
- [ ] **Homebrew Paths**: Works with Homebrew installations:
  - `/usr/local/bin/openocd` (Intel)
  - `/opt/homebrew/bin/openocd` (Apple Silicon)
- [ ] **Application Bundles**: Can select from `.app` bundles
- [ ] **Permissions**: Handles macOS permission prompts

## Error Handling Tests

### 11. File System Errors
- [ ] **Permission Denied**: 
  - Error message displayed clearly
  - Extension doesn't crash
  - User can retry or select different file
- [ ] **File Not Found**: Handles selection of non-existent files
- [ ] **Network Paths**: Handles network drive paths appropriately
- [ ] **Invalid Characters**: Handles paths with special characters

### 12. User Experience Errors
- [ ] **Cancellation**: All cancellation scenarios handled gracefully
- [ ] **Invalid Selection**: Clear feedback for invalid selections
- [ ] **Missing Dependencies**: Handles missing OpenOCD installations
- [ ] **Timeout Scenarios**: Long operations don't hang the UI

## Performance Tests

### 13. Response Times
- [ ] **Dialog Opening**: File dialog opens within 2 seconds
- [ ] **Path Validation**: Path validation completes within 1 second
- [ ] **CFG Loading**: CFG files load within 3 seconds for typical installations
- [ ] **UI Updates**: UI updates are immediate and responsive

### 14. Resource Usage
- [ ] **Memory**: No significant memory leaks during repeated operations
- [ ] **CPU**: No excessive CPU usage during file operations
- [ ] **File Handles**: Proper cleanup of file handles

## Edge Cases and Boundary Tests

### 15. Unusual Scenarios
- [ ] **Very Long Paths**: Handles paths approaching OS limits
- [ ] **Unicode Paths**: Handles paths with Unicode characters
- [ ] **Spaces in Paths**: Handles paths with spaces correctly
- [ ] **Multiple OpenOCD**: Handles systems with multiple OpenOCD installations
- [ ] **Symlinks**: Handles symbolic links appropriately (Linux/macOS)

### 16. Rapid Operations
- [ ] **Quick Successive Selections**: Multiple rapid file selections
- [ ] **Browse + Refresh**: Browse operation during refresh
- [ ] **Language Switch**: Browse operation during language change

## Regression Tests

### 17. Previous Functionality
- [ ] **Existing Workflows**: All existing workflows still function
- [ ] **Configuration Format**: Generated configurations remain compatible
- [ ] **Settings Persistence**: User settings are preserved
- [ ] **Extension Lifecycle**: Extension activation/deactivation works

### 18. Version Compatibility
- [ ] **VS Code Versions**: Works with supported VS Code versions
- [ ] **Extension Updates**: Upgrade path maintains functionality
- [ ] **Cortex-Debug Versions**: Compatible with different Cortex-Debug versions

## User Acceptance Tests

### 19. Usability
- [ ] **Intuitive Flow**: File selection process feels natural
- [ ] **Clear Feedback**: User always knows what's happening
- [ ] **Error Recovery**: Easy to recover from errors
- [ ] **Documentation**: Help text and tooltips are helpful

### 20. Accessibility
- [ ] **Keyboard Navigation**: Can operate without mouse
- [ ] **Screen Reader**: Compatible with screen readers
- [ ] **High Contrast**: Visible in high contrast modes
- [ ] **Large Fonts**: Scales appropriately with font size changes

## Test Result Documentation

### Completion Checklist
- [ ] **Pass Criteria**: Document what constitutes a "pass" for each test
- [ ] **Failure Documentation**: Record any failures with reproduction steps
- [ ] **Performance Baselines**: Document performance measurements
- [ ] **Screenshots**: Capture key UI states for documentation
- [ ] **Platform Notes**: Document any platform-specific observations

### Sign-off
- [ ] **Windows Testing**: Completed by: __________ Date: __________
- [ ] **Linux Testing**: Completed by: __________ Date: __________
- [ ] **macOS Testing**: Completed by: __________ Date: __________
- [ ] **Integration Testing**: Completed by: __________ Date: __________
- [ ] **Final Approval**: Approved by: __________ Date: __________

## Notes
- Each checkbox should be marked as complete only after thorough testing
- Document any deviations or issues discovered during testing
- Maintain test environment consistency for reliable results
- Consider automating frequently repeated test scenarios