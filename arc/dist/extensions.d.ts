import type { Extension, Message } from './types.js';
/**
 * Extension Manager - Plugin system for relay extensions
 */
export declare class ExtensionManager {
    private extensions;
    /**
     * Register a new extension
     */
    register(extension: Extension): void;
    /**
     * Handle agent connection through extensions
     */
    handleConnect(agent_id: string): Promise<void>;
    /**
     * Handle agent disconnection through extensions
     */
    handleDisconnect(agent_id: string): Promise<void>;
    /**
     * Process message through extensions
     * Returns null if any extension blocks the message
     */
    handleMessage(message: Message): Promise<Message | null>;
    /**
     * Modify routing targets through extensions
     */
    handleRoute(message: Message, targets: string[]): Promise<string[]>;
    /**
     * Get list of registered extensions
     */
    getExtensions(): string[];
}
//# sourceMappingURL=extensions.d.ts.map