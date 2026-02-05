import type { IncomingMessage } from 'http';
import type { AgentRegistry } from './registry.js';
import type { AuthResult } from './types.js';
/**
 * Validate token using registry
 */
export declare function validateToken(token: string | null, registry: AgentRegistry): AuthResult;
/**
 * Extract token from WebSocket request
 * Supports: Authorization header or ?token= query param
 */
export declare function extractToken(req: IncomingMessage): string | null;
//# sourceMappingURL=auth.d.ts.map