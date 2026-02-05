import { nanoid } from 'nanoid';
/**
 * Agent Registry - Token and Agent ID management
 */
export class AgentRegistry {
    tokens; // token → agent_id
    agent_ids; // Set of registered agent IDs
    agents; // agent_id → Agent
    constructor() {
        this.tokens = new Map();
        this.agent_ids = new Set();
        this.agents = new Map();
    }
    /**
     * Register a new agent and issue a token
     */
    register(desired_agent_id) {
        let agent_id;
        if (desired_agent_id) {
            // Validate format
            if (!this.isValidAgentId(desired_agent_id)) {
                return {
                    error: 'invalid_agent_id',
                    message: 'Agent ID must be 3-64 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens'
                };
            }
            // Check if taken
            if (this.agent_ids.has(desired_agent_id)) {
                return {
                    error: 'agent_id_taken',
                    message: `Agent ID '${desired_agent_id}' is already registered`
                };
            }
            agent_id = desired_agent_id;
        }
        else {
            // Auto-assign
            agent_id = this.generateAgentId();
        }
        // Generate token
        const token = `tok_${nanoid(16)}`;
        // Create agent record
        const agent = {
            id: agent_id,
            token,
            registered_at: Date.now()
        };
        // Store mappings
        this.tokens.set(token, agent_id);
        this.agent_ids.add(agent_id);
        this.agents.set(agent_id, agent);
        console.log(`[registry] Registered: ${agent_id} → ${token.slice(0, 12)}...`);
        return { agent_id, token };
    }
    /**
     * Look up agent ID from token
     */
    getAgentId(token) {
        return this.tokens.get(token) || null;
    }
    /**
     * Get agent by ID
     */
    getAgent(agent_id) {
        return this.agents.get(agent_id) || null;
    }
    /**
     * Validate agent ID format
     * Format: 3-64 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens
     */
    isValidAgentId(id) {
        const pattern = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;
        return pattern.test(id);
    }
    /**
     * Generate a unique agent ID
     */
    generateAgentId() {
        let id;
        let attempts = 0;
        do {
            // Format: agent-<random>
            id = `agent-${nanoid(8).toLowerCase()}`;
            attempts++;
            if (attempts > 100) {
                throw new Error('Failed to generate unique agent ID');
            }
        } while (this.agent_ids.has(id));
        return id;
    }
    /**
     * Get count of registered agents
     */
    count() {
        return this.agent_ids.size;
    }
    /**
     * Get registry statistics
     */
    getStats() {
        return {
            registered: this.agent_ids.size,
            agents: Array.from(this.agent_ids)
        };
    }
}
//# sourceMappingURL=registry.js.map