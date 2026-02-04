import type { Extension, Message } from './types.js';

/**
 * Extension Manager - Plugin system for relay extensions
 */
export class ExtensionManager {
  private extensions: Extension[] = [];

  /**
   * Register a new extension
   */
  register(extension: Extension): void {
    this.extensions.push(extension);
    console.log(`[extension] Registered: ${extension.name}`);
  }

  /**
   * Handle agent connection through extensions
   */
  async handleConnect(agent_id: string): Promise<void> {
    for (const ext of this.extensions) {
      if (ext.onConnect) {
        try {
          await ext.onConnect(agent_id);
        } catch (error) {
          console.error(`[extension] ${ext.name}.onConnect error:`, error);
        }
      }
    }
  }

  /**
   * Handle agent disconnection through extensions
   */
  async handleDisconnect(agent_id: string): Promise<void> {
    for (const ext of this.extensions) {
      if (ext.onDisconnect) {
        try {
          await ext.onDisconnect(agent_id);
        } catch (error) {
          console.error(`[extension] ${ext.name}.onDisconnect error:`, error);
        }
      }
    }
  }

  /**
   * Process message through extensions
   * Returns null if any extension blocks the message
   */
  async handleMessage(message: Message): Promise<Message | null> {
    let msg = message;

    for (const ext of this.extensions) {
      if (ext.onMessage) {
        try {
          const result = await ext.onMessage(msg);
          if (!result) {
            console.log(`[extension] ${ext.name} blocked message ${msg.id}`);
            return null; // Extension blocked message
          }
          msg = result;
        } catch (error) {
          console.error(`[extension] ${ext.name}.onMessage error:`, error);
        }
      }
    }

    return msg;
  }

  /**
   * Modify routing targets through extensions
   */
  async handleRoute(message: Message, targets: string[]): Promise<string[]> {
    let finalTargets = targets;

    for (const ext of this.extensions) {
      if (ext.onRoute) {
        try {
          finalTargets = await ext.onRoute(message, finalTargets);
        } catch (error) {
          console.error(`[extension] ${ext.name}.onRoute error:`, error);
        }
      }
    }

    return finalTargets;
  }

  /**
   * Get list of registered extensions
   */
  getExtensions(): string[] {
    return this.extensions.map(ext => ext.name);
  }
}
