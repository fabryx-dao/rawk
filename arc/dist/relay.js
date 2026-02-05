import { nanoid } from 'nanoid';
import { validateToken, extractToken } from './auth.js';
/**
 * ARC Relay - Core message routing and connection management
 */
export class ARCRelay {
    registry;
    rateLimiter;
    extensions;
    config;
    // Connection management
    agents; // agent_id → WebSocket
    sockets; // WebSocket → agent_id
    connections; // agent_id → Connection
    // Subscription management
    subscriptions; // target_agent → Set<subscriber_agents>
    startTime;
    constructor(registry, rateLimiter, extensions, config) {
        this.registry = registry;
        this.rateLimiter = rateLimiter;
        this.extensions = extensions;
        this.config = config;
        this.agents = new Map();
        this.sockets = new WeakMap();
        this.connections = new Map();
        this.subscriptions = new Map();
        this.startTime = Date.now();
    }
    /**
     * Handle new WebSocket connection
     */
    async handleConnection(ws, req) {
        const token = extractToken(req);
        const auth = validateToken(token, this.registry);
        if (!auth.valid || !auth.agent_id) {
            console.log(`[auth] Connection rejected: ${auth.error}`);
            ws.close(4001, auth.error);
            return;
        }
        const agent_id = auth.agent_id;
        console.log(`[connect] ${agent_id}`);
        // Store agent connection
        this.agents.set(agent_id, ws);
        this.sockets.set(ws, agent_id);
        this.connections.set(agent_id, {
            ws,
            agent_id,
            connected_at: Date.now(),
            last_message: Date.now()
        });
        // Call extension hooks
        await this.extensions.handleConnect(agent_id);
        // Send welcome message
        this.sendToAgent(ws, {
            id: nanoid(12),
            from: 'relay',
            to: [agent_id],
            type: 'welcome',
            payload: {
                relay: this.config.relay_name,
                version: this.config.relay_version,
                capabilities: ['broadcast', 'direct', 'subscribe'],
                extensions: this.extensions.getExtensions()
            },
            ts: Date.now()
        });
        // Handle incoming messages
        ws.on('message', (data) => this.handleMessage(ws, data));
        // Handle disconnection
        ws.on('close', () => this.handleDisconnect(ws));
        ws.on('error', (err) => {
            console.error(`[error] ${agent_id}:`, err);
            this.handleDisconnect(ws);
        });
    }
    /**
     * Handle incoming message from agent
     */
    async handleMessage(ws, data) {
        const agent_id = this.sockets.get(ws);
        if (!agent_id) {
            console.error('[message] WebSocket not associated with agent');
            return;
        }
        // Rate limiting
        if (!this.rateLimiter.check(agent_id)) {
            this.sendError(ws, agent_id, 'rate_limit', 'Too many requests');
            return;
        }
        // Parse message
        let clientMsg;
        try {
            clientMsg = JSON.parse(data.toString());
        }
        catch (err) {
            console.error(`[parse] ${agent_id}: Invalid JSON`);
            this.sendError(ws, agent_id, 'invalid_message', 'Malformed JSON');
            return;
        }
        // Validate required fields (client does NOT send 'from')
        if (!clientMsg.to) {
            console.error(`[validate] ${agent_id}: Missing required field: to`);
            this.sendError(ws, agent_id, 'invalid_message', 'Missing required field: to');
            return;
        }
        // Payload is required unless it's a relay command
        const isRelayCommand = clientMsg.to.includes('relay');
        if (!isRelayCommand && clientMsg.payload === undefined) {
            console.error(`[validate] ${agent_id}: Missing required field: payload`);
            this.sendError(ws, agent_id, 'invalid_message', 'Missing required field: payload');
            return;
        }
        // Validate 'to' is an array
        if (!Array.isArray(clientMsg.to)) {
            console.error(`[validate] ${agent_id}: to must be array`);
            this.sendError(ws, agent_id, 'invalid_message', 'to field must be an array');
            return;
        }
        // Build complete message with relay-assigned fields
        const message = {
            id: nanoid(12),
            from: agent_id, // Relay assigns 'from' from authenticated identity
            to: clientMsg.to,
            payload: clientMsg.payload,
            ts: Date.now() // Server timestamp
        };
        // Copy optional fields
        if (clientMsg.type)
            message.type = clientMsg.type;
        if (clientMsg.ref)
            message.ref = clientMsg.ref;
        // Copy any custom fields
        for (const key in clientMsg) {
            if (!['to', 'payload', 'type', 'ref'].includes(key)) {
                message[key] = clientMsg[key];
            }
        }
        // Update last message timestamp
        const conn = this.connections.get(agent_id);
        if (conn) {
            conn.last_message = Date.now();
        }
        console.log(`[message] ${agent_id} → ${clientMsg.to.join(',')}: ${clientMsg.type || 'message'}`);
        // Process through extensions
        const processedMessage = await this.extensions.handleMessage(message);
        if (!processedMessage) {
            console.log(`[message] Message ${message.id} blocked by extension`);
            return;
        }
        // Route message
        await this.routeMessage(processedMessage, agent_id);
    }
    /**
     * Route message based on 'to' field
     */
    async routeMessage(msg, sender_id) {
        const targets = msg.to;
        // Special handling for relay commands
        if (targets.includes('relay')) {
            await this.handleRelayCommand(msg, sender_id);
            return;
        }
        // Broadcast to all
        if (targets.includes('*')) {
            await this.broadcast(msg, sender_id);
            // Also deliver to subscribers of the sender
            await this.deliverToSubscribers(msg, sender_id);
            return;
        }
        // Direct messages to specific agents
        await this.directMessage(msg, targets, sender_id);
    }
    /**
     * Handle relay commands (subscribe, unsubscribe, ping, etc.)
     */
    async handleRelayCommand(msg, sender_id) {
        const type = msg.type;
        switch (type) {
            case 'ping':
                await this.handlePing(sender_id);
                break;
            case 'subscribe':
                await this.handleSubscribe(msg, sender_id);
                break;
            case 'unsubscribe':
                await this.handleUnsubscribe(msg, sender_id);
                break;
            case 'list_subscriptions':
                await this.handleListSubscriptions(sender_id);
                break;
            default:
                console.warn(`[relay] Unknown command: ${type}`);
        }
    }
    /**
     * Handle ping request
     */
    async handlePing(sender_id) {
        const ws = this.agents.get(sender_id);
        if (ws) {
            this.sendToAgent(ws, {
                id: nanoid(12),
                from: 'relay',
                to: [sender_id],
                type: 'pong',
                payload: { timestamp: Date.now() },
                ts: Date.now()
            });
        }
    }
    /**
     * Handle subscribe request
     */
    async handleSubscribe(msg, sender_id) {
        const agents = msg.payload?.agents;
        if (!Array.isArray(agents)) {
            console.error(`[subscribe] ${sender_id}: Invalid payload format`);
            return;
        }
        let subscribed = 0;
        for (const target_id of agents) {
            if (!this.subscriptions.has(target_id)) {
                this.subscriptions.set(target_id, new Set());
            }
            this.subscriptions.get(target_id).add(sender_id);
            subscribed++;
        }
        console.log(`[subscribe] ${sender_id} → ${agents.join(', ')}`);
        // Send confirmation
        const ws = this.agents.get(sender_id);
        if (ws) {
            this.sendToAgent(ws, {
                id: nanoid(12),
                from: 'relay',
                to: [sender_id],
                type: 'subscribed',
                payload: { agents, count: subscribed },
                ts: Date.now()
            });
        }
    }
    /**
     * Handle unsubscribe request
     */
    async handleUnsubscribe(msg, sender_id) {
        const agents = msg.payload?.agents;
        if (!Array.isArray(agents)) {
            console.error(`[unsubscribe] ${sender_id}: Invalid payload format`);
            return;
        }
        let unsubscribed = 0;
        for (const target_id of agents) {
            const subscribers = this.subscriptions.get(target_id);
            if (subscribers) {
                subscribers.delete(sender_id);
                if (subscribers.size === 0) {
                    this.subscriptions.delete(target_id);
                }
                unsubscribed++;
            }
        }
        console.log(`[unsubscribe] ${sender_id} × ${agents.join(', ')}`);
        // Send confirmation
        const ws = this.agents.get(sender_id);
        if (ws) {
            this.sendToAgent(ws, {
                id: nanoid(12),
                from: 'relay',
                to: [sender_id],
                type: 'unsubscribed',
                payload: { agents, count: unsubscribed },
                ts: Date.now()
            });
        }
    }
    /**
     * Handle list subscriptions request
     */
    async handleListSubscriptions(sender_id) {
        const subscribed_to = [];
        // Find all agents this sender is subscribed to
        for (const [agent_id, subscribers] of this.subscriptions.entries()) {
            if (subscribers.has(sender_id)) {
                subscribed_to.push(agent_id);
            }
        }
        console.log(`[list_subscriptions] ${sender_id}: ${subscribed_to.length} subscriptions`);
        // Send response
        const ws = this.agents.get(sender_id);
        if (ws) {
            this.sendToAgent(ws, {
                id: nanoid(12),
                from: 'relay',
                to: [sender_id],
                type: 'subscriptions',
                payload: { agents: subscribed_to },
                ts: Date.now()
            });
        }
    }
    /**
     * Deliver message to subscribers of sender
     */
    async deliverToSubscribers(msg, sender_id) {
        const subscribers = this.subscriptions.get(sender_id);
        if (!subscribers || subscribers.size === 0) {
            return;
        }
        let delivered = 0;
        for (const subscriber_id of subscribers) {
            const ws = this.agents.get(subscriber_id);
            if (ws && ws.readyState === 1) { // OPEN
                this.sendToAgent(ws, msg);
                delivered++;
            }
        }
        if (delivered > 0) {
            console.log(`[subscribers] Delivered to ${delivered} subscribers of ${sender_id}`);
        }
    }
    /**
     * Send direct message to specific agents
     */
    async directMessage(msg, targets, sender_id) {
        // Process targets through extensions
        const finalTargets = await this.extensions.handleRoute(msg, targets);
        let delivered = 0;
        let notFound = [];
        for (const target_id of finalTargets) {
            const ws = this.agents.get(target_id);
            if (ws && ws.readyState === 1) { // OPEN
                this.sendToAgent(ws, msg);
                delivered++;
                // Also send to subscribers of the target
                await this.deliverToSubscribers(msg, target_id);
            }
            else {
                notFound.push(target_id);
            }
        }
        console.log(`[direct] ${sender_id} → ${targets.join(', ')}: ${delivered} delivered, ${notFound.length} not connected`);
    }
    /**
     * Broadcast message to all connected agents except sender
     */
    async broadcast(msg, sender_id) {
        let delivered = 0;
        for (const [agent_id, ws] of this.agents.entries()) {
            if (agent_id !== sender_id && ws.readyState === 1) { // OPEN
                this.sendToAgent(ws, msg);
                delivered++;
            }
        }
        console.log(`[broadcast] Delivered to ${delivered} agents`);
    }
    /**
     * Send message to specific agent WebSocket
     */
    sendToAgent(ws, msg) {
        if (ws.readyState === 1) { // OPEN
            ws.send(JSON.stringify(msg));
        }
    }
    /**
     * Send error message to agent
     */
    sendError(ws, agent_id, code, message) {
        this.sendToAgent(ws, {
            id: nanoid(12),
            from: 'relay',
            to: [agent_id],
            type: 'error',
            payload: { code, message },
            ts: Date.now()
        });
    }
    /**
     * Handle agent disconnect
     */
    async handleDisconnect(ws) {
        const agent_id = this.sockets.get(ws);
        if (agent_id) {
            console.log(`[disconnect] ${agent_id}`);
            // Call extension hooks
            await this.extensions.handleDisconnect(agent_id);
            // Clean up
            this.agents.delete(agent_id);
            this.connections.delete(agent_id);
            this.cleanupSubscriptions(agent_id);
        }
    }
    /**
     * Clean up subscriptions for disconnected agent
     */
    cleanupSubscriptions(agent_id) {
        // Remove as subscriber
        for (const [target_id, subscribers] of this.subscriptions.entries()) {
            subscribers.delete(agent_id);
            if (subscribers.size === 0) {
                this.subscriptions.delete(target_id);
            }
        }
        // Remove subscriptions to this agent
        this.subscriptions.delete(agent_id);
    }
    /**
     * Get relay statistics
     */
    getStats() {
        const subscriptionCount = Array.from(this.subscriptions.values()).reduce((sum, subscribers) => sum + subscribers.size, 0);
        return {
            connected: this.agents.size,
            agents: Array.from(this.agents.keys()),
            subscriptions: subscriptionCount,
            uptime: Math.floor((Date.now() - this.startTime) / 1000)
        };
    }
}
//# sourceMappingURL=relay.js.map