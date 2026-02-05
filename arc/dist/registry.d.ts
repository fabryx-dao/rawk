import type { Agent, RegistryStats } from './types.js';
/**
 * Agent Registry - Token and Agent ID management
 */
export declare class AgentRegistry {
    private tokens;
    private agent_ids;
    private agents;
    constructor();
    /**
     * Register a new agent and issue a token
     */
    register(desired_agent_id?: string | null): {
        agent_id: string;
        token: string;
    } | {
        error: string;
        message: string;
    };
    /**
     * Look up agent ID from token
     */
    getAgentId(token: string): string | null;
    /**
     * Get agent by ID
     */
    getAgent(agent_id: string): Agent | null;
    /**
     * Validate agent ID format
     * Format: 3-64 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens
     */
    isValidAgentId(id: string): boolean;
    /**
     * Generate a unique agent ID
     */
    private generateAgentId;
    /**
     * Get count of registered agents
     */
    count(): number;
    /**
     * Get registry statistics
     */
    getStats(): RegistryStats;
}
//# sourceMappingURL=registry.d.ts.map