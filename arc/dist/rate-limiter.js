/**
 * Rate Limiter - Prevent spam and abuse
 */
export class RateLimiter {
    limits = new Map();
    maxPerMinute;
    maxPerHour;
    constructor(maxPerMinute = 1000, maxPerHour = 10000) {
        this.maxPerMinute = maxPerMinute;
        this.maxPerHour = maxPerHour;
    }
    /**
     * Check if agent is within rate limits
     */
    check(agent_id) {
        const now = Date.now();
        const limit = this.limits.get(agent_id) || { requests: [] };
        // Check if currently blocked
        if (limit.blocked_until && now < limit.blocked_until) {
            return false;
        }
        // Remove requests older than 1 hour
        limit.requests = limit.requests.filter(ts => now - ts < 3600000);
        // Check hourly limit
        if (limit.requests.length >= this.maxPerHour) {
            limit.blocked_until = now + 3600000; // Block for 1 hour
            this.limits.set(agent_id, limit);
            console.warn(`[rate-limit] ${agent_id} blocked for 1 hour (exceeded ${this.maxPerHour}/hour)`);
            return false;
        }
        // Check per-minute limit
        const recentRequests = limit.requests.filter(ts => now - ts < 60000);
        if (recentRequests.length >= this.maxPerMinute) {
            console.warn(`[rate-limit] ${agent_id} throttled (exceeded ${this.maxPerMinute}/min)`);
            return false;
        }
        // Record request
        limit.requests.push(now);
        this.limits.set(agent_id, limit);
        return true;
    }
    /**
     * Get rate limit statistics
     */
    getStats() {
        const now = Date.now();
        let blocked = 0;
        for (const limit of this.limits.values()) {
            if (limit.blocked_until && now < limit.blocked_until) {
                blocked++;
            }
        }
        return {
            total_agents: this.limits.size,
            blocked_agents: blocked
        };
    }
}
//# sourceMappingURL=rate-limiter.js.map