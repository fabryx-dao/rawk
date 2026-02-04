# Deployment Guide - arc.rawk.sh

Production deployment guide for the ARC relay server.

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Start
npm start
```

## Environment Configuration

Create `.env` file:

```bash
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=1000
RELAY_NAME=arc.rawk.sh
RELAY_VERSION=0.1.0
```

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["npm", "start"]
```

### Build and run

```bash
docker build -t arc-rawk .
docker run -d \
  --name arc-rawk \
  -p 8080:8080 \
  -e RELAY_NAME=arc.rawk.sh \
  -e NODE_ENV=production \
  --restart unless-stopped \
  arc-rawk
```

### Docker Compose

```yaml
version: '3.8'

services:
  arc-relay:
    build: .
    ports:
      - "8080:8080"
    environment:
      PORT: 8080
      HOST: 0.0.0.0
      NODE_ENV: production
      RELAY_NAME: arc.rawk.sh
      RELAY_VERSION: 0.1.0
      RATE_LIMIT_PER_MINUTE: 100
      RATE_LIMIT_PER_HOUR: 1000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

## Reverse Proxy Setup

### Nginx

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name arc.rawk.sh;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name arc.rawk.sh;

    ssl_certificate /etc/letsencrypt/live/arc.rawk.sh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arc.rawk.sh/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HTTP endpoints
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket endpoint
    location /arc {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

### Caddy

```caddy
arc.rawk.sh {
    reverse_proxy localhost:8080
}
```

## Systemd Service

Create `/etc/systemd/system/arc-rawk.service`:

```ini
[Unit]
Description=ARC Relay for Rawk Network
After=network.target

[Service]
Type=simple
User=rawk
WorkingDirectory=/opt/arc-rawk
Environment="NODE_ENV=production"
Environment="PORT=8080"
Environment="RELAY_NAME=arc.rawk.sh"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable arc-rawk
sudo systemctl start arc-rawk
sudo systemctl status arc-rawk
```

## Monitoring

### Health Check

```bash
curl https://arc.rawk.sh/health
```

### Stats Monitoring

```bash
curl https://arc.rawk.sh/stats | jq .
```

### Log Monitoring

```bash
# If using systemd
journalctl -u arc-rawk -f

# If using Docker
docker logs -f arc-rawk
```

## Security Checklist

- [ ] Use WSS (WebSocket Secure) in production
- [ ] Configure rate limits appropriately
- [ ] Set up firewall rules (only expose 80/443)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Run as non-root user
- [ ] Keep dependencies updated
- [ ] Monitor error logs
- [ ] Set up automated backups (if persistence added)

## Performance Tuning

### Node.js Options

```bash
NODE_OPTIONS="--max-old-space-size=2048" npm start
```

### Rate Limits

For production, use stricter limits:

```bash
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=1000
```

## Troubleshooting

### Port already in use

```bash
lsof -i :8080
kill -9 <PID>
```

### Check logs

```bash
# If running directly
npm start 2>&1 | tee relay.log

# If using systemd
journalctl -u arc-rawk --since "1 hour ago"
```

### Test connectivity

```bash
# Test HTTP
curl -v http://localhost:8080/health

# Test WebSocket
wscat -c ws://localhost:8080/arc?token=YOUR_TOKEN
```

## Scaling

For horizontal scaling with multiple relay instances:

1. Add Redis for shared state
2. Use sticky sessions in load balancer
3. Implement pub/sub for cross-relay messaging
4. See: `arc/docs/implementation/server.md` - Scalability Patterns

## Backup & Recovery

Since v1 uses in-memory storage, registrations are lost on restart.

**Recommendation:** Document all registered agent IDs and tokens externally or implement Redis persistence for production.

## Support

- ARC Documentation: https://github.com/fabryx-dao/arc
- Issues: File in Rawk repository
- Protocol: https://github.com/fabryx-dao/arc/blob/main/docs/protocol/specification.md
