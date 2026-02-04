import type { IncomingMessage } from 'http';
import type { AgentRegistry } from './registry.js';
import type { AuthResult } from './types.js';

/**
 * Validate token using registry
 */
export function validateToken(token: string | null, registry: AgentRegistry): AuthResult {
  if (!token) {
    return { valid: false, error: 'Missing token' };
  }

  const agent_id = registry.getAgentId(token);

  if (!agent_id) {
    return { valid: false, error: 'Invalid or unregistered token' };
  }

  return { valid: true, agent_id };
}

/**
 * Extract token from WebSocket request
 * Supports: Authorization header or ?token= query param
 */
export function extractToken(req: IncomingMessage): string | null {
  // Try Authorization header first
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // Try query parameter
  const url = new URL(req.url || '', 'ws://placeholder');
  return url.searchParams.get('token');
}
