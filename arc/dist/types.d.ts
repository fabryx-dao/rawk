import { WebSocket } from 'ws';
/**
 * ARC Protocol Message
 */
export interface Message {
    id: string;
    from: string;
    to: string[];
    payload: any;
    type?: string;
    ref?: string;
    ts: number;
    [key: string]: any;
}
/**
 * Client message (before relay assigns metadata)
 */
export interface ClientMessage {
    to: string[];
    payload: any;
    type?: string;
    ref?: string;
    [key: string]: any;
}
/**
 * Agent registration data
 */
export interface Agent {
    id: string;
    token: string;
    registered_at: number;
}
/**
 * Connection tracking
 */
export interface Connection {
    ws: WebSocket;
    agent_id: string;
    connected_at: number;
    last_message: number;
}
/**
 * Authentication result
 */
export interface AuthResult {
    valid: boolean;
    agent_id?: string;
    error?: string;
}
/**
 * Rate limit tracking
 */
export interface RateLimit {
    requests: number[];
    blocked_until?: number;
}
/**
 * Extension interface for plugin system
 */
export interface Extension {
    name: string;
    onConnect?(agent_id: string): void | Promise<void>;
    onDisconnect?(agent_id: string): void | Promise<void>;
    onMessage?(message: Message): Message | null | Promise<Message | null>;
    onRoute?(message: Message, targets: string[]): string[] | Promise<string[]>;
}
/**
 * Relay statistics
 */
export interface RelayStats {
    connected: number;
    agents: string[];
    subscriptions: number;
    uptime: number;
}
/**
 * Registry statistics
 */
export interface RegistryStats {
    registered: number;
    agents: string[];
}
/**
 * Configuration options
 */
export interface Config {
    port: number;
    host: string;
    relay_name: string;
    relay_version: string;
    rate_limit_per_minute: number;
    rate_limit_per_hour: number;
}
//# sourceMappingURL=types.d.ts.map