/**
 * Rate Limiter - Prevent spam and abuse
 */
export declare class RateLimiter {
    private limits;
    private maxPerMinute;
    private maxPerHour;
    constructor(maxPerMinute?: number, maxPerHour?: number);
    /**
     * Check if agent is within rate limits
     */
    check(agent_id: string): boolean;
    /**
     * Get rate limit statistics
     */
    getStats(): {
        total_agents: number;
        blocked_agents: number;
    };
}
//# sourceMappingURL=rate-limiter.d.ts.map