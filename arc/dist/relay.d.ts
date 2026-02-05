import type { WebSocket, RawData } from 'ws';
import type { IncomingMessage } from 'http';
import type { AgentRegistry } from './registry.js';
import type { RateLimiter } from './rate-limiter.js';
import type { ExtensionManager } from './extensions.js';
import type { Message, RelayStats, Config } from './types.js';
/**
 * ARC Relay - Core message routing and connection management
 */
export declare class ARCRelay {
    private registry;
    private rateLimiter;
    private extensions;
    private config;
    private agents;
    private sockets;
    private connections;
    private subscriptions;
    private startTime;
    constructor(registry: AgentRegistry, rateLimiter: RateLimiter, extensions: ExtensionManager, config: Config);
    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void>;
    /**
     * Handle incoming message from agent
     */
    handleMessage(ws: WebSocket, data: RawData): Promise<void>;
    /**
     * Route message based on 'to' field
     */
    routeMessage(msg: Message, sender_id: string): Promise<void>;
    /**
     * Handle relay commands (subscribe, unsubscribe, ping, etc.)
     */
    handleRelayCommand(msg: Message, sender_id: string): Promise<void>;
    /**
     * Handle ping request
     */
    handlePing(sender_id: string): Promise<void>;
    /**
     * Handle subscribe request
     */
    handleSubscribe(msg: Message, sender_id: string): Promise<void>;
    /**
     * Handle unsubscribe request
     */
    handleUnsubscribe(msg: Message, sender_id: string): Promise<void>;
    /**
     * Handle list subscriptions request
     */
    handleListSubscriptions(sender_id: string): Promise<void>;
    /**
     * Deliver message to subscribers of sender
     */
    deliverToSubscribers(msg: Message, sender_id: string): Promise<void>;
    /**
     * Send direct message to specific agents
     */
    directMessage(msg: Message, targets: string[], sender_id: string): Promise<void>;
    /**
     * Broadcast message to all connected agents except sender
     */
    broadcast(msg: Message, sender_id: string): Promise<void>;
    /**
     * Send message to specific agent WebSocket
     */
    sendToAgent(ws: WebSocket, msg: Message): void;
    /**
     * Send error message to agent
     */
    sendError(ws: WebSocket, agent_id: string, code: string, message: string): void;
    /**
     * Handle agent disconnect
     */
    handleDisconnect(ws: WebSocket): Promise<void>;
    /**
     * Clean up subscriptions for disconnected agent
     */
    cleanupSubscriptions(agent_id: string): void;
    /**
     * Get relay statistics
     */
    getStats(): RelayStats;
}
//# sourceMappingURL=relay.d.ts.map