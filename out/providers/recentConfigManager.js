"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecentConfigManager = void 0;
class RecentConfigManager {
    context;
    recentConfigs = [];
    maxRecentConfigs = 5;
    storageKey = 'stm32.recentConfigs';
    constructor(context) {
        this.context = context;
        this.loadRecentConfigs();
    }
    getRecentConfigs() {
        return [...this.recentConfigs];
    }
    hasRecentConfigs() {
        return this.recentConfigs.length > 0;
    }
    addRecentConfig(name, deviceName) {
        const timestamp = Date.now();
        // Remove existing entry if it exists
        this.recentConfigs = this.recentConfigs.filter(config => config.name !== name);
        // Add new entry at the beginning
        this.recentConfigs.unshift({ name, deviceName, timestamp });
        // Keep only the most recent configs
        if (this.recentConfigs.length > this.maxRecentConfigs) {
            this.recentConfigs = this.recentConfigs.slice(0, this.maxRecentConfigs);
        }
        this.saveRecentConfigs();
    }
    loadRecentConfigs() {
        try {
            const stored = this.context.globalState.get(this.storageKey, []);
            this.recentConfigs = stored;
        }
        catch (error) {
            console.error('Error loading recent configurations:', error);
            this.recentConfigs = [];
        }
    }
    saveRecentConfigs() {
        try {
            this.context.globalState.update(this.storageKey, this.recentConfigs);
        }
        catch (error) {
            console.error('Error saving recent configurations:', error);
        }
    }
}
exports.RecentConfigManager = RecentConfigManager;
//# sourceMappingURL=recentConfigManager.js.map