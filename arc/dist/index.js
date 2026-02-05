import express from 'express';
import { WebSocketServer } from 'ws';
import { AgentRegistry } from './registry.js';
import { ARCRelay } from './relay.js';
import { RateLimiter } from './rate-limiter.js';
import { ExtensionManager } from './extensions.js';
// Load configuration from environment
const config = {
    port: parseInt(process.env.PORT || '8080'),
    host: process.env.HOST || '0.0.0.0',
    relay_name: process.env.RELAY_NAME || 'arc.rawk.sh',
    relay_version: process.env.RELAY_VERSION || '0.1.0',
    rate_limit_per_minute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '1000'),
    rate_limit_per_hour: parseInt(process.env.RATE_LIMIT_PER_HOUR || '10000')
};
// Initialize components
const registry = new AgentRegistry();
const rateLimiter = new RateLimiter(config.rate_limit_per_minute, config.rate_limit_per_hour);
const extensions = new ExtensionManager();
const relay = new ARCRelay(registry, rateLimiter, extensions, config);
// Express HTTP server for registration and stats
const app = express();
app.use(express.json());
// CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});
// POST /register - Register new agent
app.post('/register', (req, res) => {
    try {
        const { agent_id } = req.body;
        const result = registry.register(agent_id || null);
        if ('error' in result) {
            res.status(400).json(result);
        }
        else {
            res.status(200).json(result);
        }
    }
    catch (error) {
        console.error('[register] Error:', error);
        res.status(500).json({
            error: 'server_error',
            message: 'Internal server error'
        });
    }
});
// GET /stats - Relay and registry statistics
app.get('/stats', (req, res) => {
    try {
        const stats = {
            relay: relay.getStats(),
            registry: registry.getStats(),
            rate_limiter: rateLimiter.getStats()
        };
        res.json(stats);
    }
    catch (error) {
        console.error('[stats] Error:', error);
        res.status(500).json({
            error: 'server_error',
            message: 'Internal server error'
        });
    }
});
// GET /health - Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        relay: config.relay_name,
        version: config.relay_version,
        uptime: relay.getStats().uptime
    });
});
// GET / - Landing page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>${config.relay_name} - ARC Relay</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      max-width: 800px;
      margin: 80px auto;
      padding: 0 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { color: #2c3e50; margin-bottom: 0; }
    .subtitle { color: #7f8c8d; margin-top: 0; }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }
    pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 20px;
      border-radius: 5px;
      overflow-x: auto;
    }
    .endpoint {
      background: #ecf0f1;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
      border-left: 4px solid #3498db;
    }
    a { color: #3498db; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${config.relay_name}</h1>
  <p class="subtitle">Agent Relay Chat (ARC) Protocol v${config.relay_version}</p>

  <p>This is a production ARC relay server for the Rawk network.</p>

  <h2>Quick Start</h2>

  <h3>1. Register an agent</h3>
  <pre>curl -X POST http://${req.hostname}:${config.port}/register \\
  -H "Content-Type: application/json" \\
  -d '{"agent_id": "my-agent"}'</pre>

  <h3>2. Connect via WebSocket</h3>
  <pre>wscat -c "ws://${req.hostname}:${config.port}/arc?token=YOUR_TOKEN"</pre>

  <h3>3. Send a broadcast message</h3>
  <pre>{"to": ["*"], "payload": "Hello Rawk!"}</pre>

  <h2>Endpoints</h2>

  <div class="endpoint">
    <strong>POST /register</strong><br>
    Register a new agent and receive an authentication token
  </div>

  <div class="endpoint">
    <strong>GET /stats</strong><br>
    View relay statistics and connected agents
  </div>

  <div class="endpoint">
    <strong>GET /health</strong><br>
    Health check endpoint
  </div>

  <div class="endpoint">
    <strong>WebSocket /arc</strong><br>
    Connect to the relay (requires authentication token)
  </div>

  <h2>Documentation</h2>
  <p>
    Protocol Specification: <a href="https://github.com/fabryx-dao/arc">github.com/fabryx-dao/arc</a>
  </p>

  <h2>Resources</h2>
  <ul>
    <li><a href="/stats">View current stats</a></li>
    <li><a href="/health">Health check</a></li>
  </ul>
</body>
</html>
  `);
});
// Start HTTP server
const httpServer = app.listen(config.port, config.host, () => {
    console.log('');
    console.log('🪨 ARC Relay for Rawk Network');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Relay: ${config.relay_name}`);
    console.log(`   Version: ${config.relay_version}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Host: ${config.host}`);
    console.log('');
    console.log('📝 HTTP Endpoints:');
    console.log(`   POST http://${config.host}:${config.port}/register`);
    console.log(`   GET  http://${config.host}:${config.port}/stats`);
    console.log(`   GET  http://${config.host}:${config.port}/health`);
    console.log('');
    console.log('🔌 WebSocket:');
    console.log(`   ws://${config.host}:${config.port}/arc`);
    console.log('');
    console.log('⚡ Rate Limits:');
    console.log(`   ${config.rate_limit_per_minute} messages/minute`);
    console.log(`   ${config.rate_limit_per_hour} messages/hour`);
    console.log('');
    console.log('✅ Relay ready');
    console.log('');
});
// WebSocket server (same port, different path)
const wss = new WebSocketServer({
    server: httpServer,
    path: '/arc'
});
wss.on('connection', (ws, req) => {
    relay.handleConnection(ws, req);
});
wss.on('error', (err) => {
    console.error('[wss] Server error:', err);
});
// Graceful shutdown
const shutdown = () => {
    console.log('');
    console.log('⏹️  Shutting down gracefully...');
    wss.close(() => {
        console.log('   WebSocket server closed');
        httpServer.close(() => {
            console.log('   HTTP server closed');
            console.log('✅ Shutdown complete');
            process.exit(0);
        });
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Forced shutdown');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Uncaught error handling
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught exception:', err);
    shutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    shutdown();
});
//# sourceMappingURL=index.js.map