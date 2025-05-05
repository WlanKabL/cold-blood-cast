/**
 * @file plugin_support.ts
 * @description Dynamic plugin loader and interface for /plugins folder.
 */
import fs from "fs";
import path from "path";

type PluginInit = (context: PluginContext) => Promise<void> | void;

type PluginHooks = Partial<{
    /** Called once when plugin is loaded */
    onInit: PluginInit;
    /** Called on each sensor alert */
    onSensorAlert: (sensorName: string, value: any, context: PluginContext) => Promise<void> | void;
    /** Called when a device is turned on */
    onDeviceTurnOn: (deviceIp: string, context: PluginContext) => Promise<void> | void;
    /** Called when a device is turned off */
    onDeviceTurnOff: (deviceIp: string, context: PluginContext) => Promise<void> | void;
    /** Called at configured day start */
    onDayStart: (context: PluginContext) => Promise<void> | void;
    /** Called at configured night start */
    onNightStart: (context: PluginContext) => Promise<void> | void;
}>;

export interface PluginContext {
    /** Path to application config directory */
    configPath: string;
    /** Simple logger (console or custom) */
    logger: { log: (msg: string) => void; error: (err: any) => void };
    /** Broadcast function for notifications */
    broadcast: (msg: string) => void;
    /** Store of application services for plugin access */
    servicesStore?: Record<string, any>;
}

export class PluginManager {
    private plugins: PluginHooks[] = [];
    private pluginDir: string;
    private context: PluginContext;

    constructor(pluginDir: string, context: PluginContext) {
        this.pluginDir = pluginDir;
        this.context = context;
    }

    /**
     * Load all plugins from the /plugins directory.
     */
    public async loadPlugins(): Promise<void> {
        if (!fs.existsSync(this.pluginDir)) {
            fs.mkdirSync(this.pluginDir, { recursive: true });
        }
        const entries = fs.readdirSync(this.pluginDir);
        for (const entry of entries) {
            const pluginPath = path.join(this.pluginDir, entry);
            const indexFile = path.join(pluginPath, "index.js");
            if (fs.existsSync(indexFile)) {
                try {
                    const plugin: PluginHooks = require(indexFile);
                    this.plugins.push(plugin);
                    this.context.logger.log(`Loaded plugin: ${entry}`);
                    if (plugin.onInit) {
                        await plugin.onInit(this.context);
                    }
                } catch (err) {
                    this.context.logger.error(`Error loading plugin ${entry}: ${err}`);
                }
            }
        }
    }

    /**
     * Trigger a specific hook on all plugins.
     * @param hook - The hook name to call
     * @param args - Arguments for the hook (excluding context)
     */
    public async triggerHook<K extends keyof PluginHooks>(hook: K, ...args: any[]): Promise<void> {
        for (const plugin of this.plugins) {
            const fn = plugin[hook];
            if (fn) {
                try {
                    // @ts-ignore
                    await fn(...args, this.context);
                } catch (err) {
                    this.context.logger.error(`Plugin hook ${String(hook)} error: ${err}`);
                }
            }
        }
    }
}
