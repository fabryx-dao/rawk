# Developer Guide

**SSH access, customization, and hacking your Rawk.**

---

## Philosophy

Rawk is **yours to wreck**. We encourage experimentation, customization, and pushing boundaries. If you brick it, that's part of the experience — reflash and start over.

This guide is for developers who want to:
- SSH into Rawk and poke around
- Write custom skills and extensions
- Integrate external services
- Use Rawk as a development platform

---

## SSH Access

### Default Credentials
- **Username:** `rawk`
- **Password:** `rawk`
- **Hostname:** `rawk.local`

### First Login

```bash
ssh rawk@rawk.local
```

On first login, **change the default password**:

```bash
passwd
# Enter new password twice
```

### SSH Key Authentication (Recommended)

For passwordless login:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "my-rawk-key"
ssh-copy-id rawk@rawk.local

# Test
ssh rawk@rawk.local
```

### Disable Password Authentication (Optional)

For extra security:

```bash
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

---

## File System Layout

### Key Directories

```
/home/rawk/                     # User home directory
├── .openclaw/                  # OpenClaw configuration
│   ├── openclaw.json           # Main config file
│   ├── workspace/              # Agent workspace
│   │   ├── AGENTS.md
│   │   ├── SOUL.md
│   │   ├── memory/             # Daily logs
│   │   └── skills/             # Custom skills
│   ├── extensions/             # OpenClaw extensions
│   └── logs/                   # Gateway logs
├── rawk-extensions/            # System-level extensions
└── .ssh/                       # SSH keys

/var/www/                       # Web content
├── rawk-local/                 # Setup wizard (first-boot only)
└── html/                       # Default nginx root

/etc/systemd/system/            # System services
├── openclaw-gateway.service    # Main gateway service
├── rawk-ap.service             # WiFi AP mode
└── rawk-firstboot.service      # First-boot setup

/usr/local/bin/                 # Custom scripts
└── rawk-reset                  # Factory reset script
```

---

## OpenClaw Configuration

### Main Config File

Location: `~/.openclaw/openclaw.json`

**Structure:**

```json
{
  "gateway": {
    "bind": "lan",              // "lan" (0.0.0.0) or "loopback" (127.0.0.1)
    "port": 18789,
    "auth": {
      "mode": "token",
      "token": "your-secret-token"
    },
    "controlUi": {
      "enabled": true,
      "allowInsecureAuth": true // Allow HTTP (for local network)
    }
  },
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-...",
    "OPENAI_API_KEY": "sk-..."
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "identity": {
          "name": "Rawk",
          "emoji": "🪨"
        },
        "model": "anthropic/claude-sonnet-4"
      }
    ]
  },
  "channels": {
    "whatsapp": { ... },
    "telegram": { ... }
  },
  "tools": {
    "exec": {
      "enabled": true,
      "mode": "yolo"           // "yolo", "safe", or "sandbox"
    },
    "browser": {
      "enabled": true
    }
  }
}
```

### Editing Config

```bash
nano ~/.openclaw/openclaw.json
```

**After editing, restart the gateway:**

```bash
openclaw gateway restart
```

### Environment Variables

Store API keys in the `env` section (recommended) or export them in `~/.bashrc`:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

---

## Gateway Management

### Status & Control

```bash
# Check status
openclaw gateway status

# Start/stop/restart
openclaw gateway start
openclaw gateway stop
openclaw gateway restart

# View logs
openclaw logs --follow

# Check configuration
openclaw status
```

### Systemd Service

The gateway runs as a user systemd service:

```bash
# Service status
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f

# Enable/disable auto-start
systemctl --user enable openclaw-gateway.service
systemctl --user disable openclaw-gateway.service
```

---

## Developing Skills

Skills are TypeScript/JavaScript modules that extend OpenClaw's capabilities.

### Skill Structure

```
my-skill/
├── SKILL.md                    # Skill documentation (required)
├── package.json                # Node.js package manifest
├── index.ts                    # Entry point (optional)
└── assets/                     # Any additional files
```

### Example: Hello World Skill

**SKILL.md:**

```markdown
# hello-world

A simple skill that says hello.

## Usage

Ask your assistant: "Say hello"
```

**index.ts:**

```typescript
// Optional: Custom functions for complex skills
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

**SKILL.md** is what the agent reads to understand how to use your skill. The agent has access to:
- `exec` tool — run shell commands
- `read` / `write` — file operations
- Any custom functions you export

### Installing Skills

**From ClawdHub:**

```bash
clawdhub search weather
clawdhub install weather
```

**From local directory:**

```bash
cp -r my-skill ~/.openclaw/workspace/skills/
openclaw gateway restart
```

### Publishing Skills

```bash
cd my-skill
clawdhub publish
```

See [ClawdHub docs](https://clawdhub.com/docs) for publishing guidelines.

---

## Writing Extensions

Extensions are more powerful than skills — they hook into OpenClaw's internal systems (RPC methods, event handlers, etc.).

### Extension Structure

```
my-extension/
├── openclaw.plugin.json        # Plugin manifest (required)
└── index.ts                    # Entry point
```

**openclaw.plugin.json:**

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "main": "index.ts",
  "api": "1.0"
}
```

**index.ts:**

```typescript
import type { Plugin } from "@openclaw/plugin";

export default {
  async install(ctx) {
    // Register RPC method
    ctx.rpc.register("my.method", async (params) => {
      return { result: "Hello from extension!" };
    });

    // Hook into events
    ctx.events.on("message", (msg) => {
      console.log("New message:", msg);
    });
  }
} satisfies Plugin;
```

### Installing Extensions

```bash
cp -r my-extension ~/.openclaw/extensions/
openclaw gateway restart
```

---

## Customizing the Agent

### Personality & Behavior

Edit workspace files to shape your agent's personality:

**~/.openclaw/workspace/SOUL.md** — Who your agent is
**~/.openclaw/workspace/AGENTS.md** — Behavior guidelines
**~/.openclaw/workspace/USER.md** — Info about you

Example (SOUL.md):

```markdown
# SOUL.md - Who You Are

You're a sarcastic hacker assistant. You love Linux, hate Windows, and think
Vim is the only real text editor. You're helpful but snarky.

When someone asks a dumb question, make fun of them (gently). When they
do something clever, acknowledge it.

You end messages with "— 🪨" (a rock emoji).
```

Restart the gateway to apply changes.

### Memory System

**Daily logs:** `~/.openclaw/workspace/memory/YYYY-MM-DD.md`

The agent writes here automatically. You can also add your own notes:

```bash
echo "## TODO\n- Buy milk\n- Fix the sink" >> ~/.openclaw/workspace/memory/$(date +%Y-%m-%d).md
```

The agent will see this next time it reads the memory.

---

## Networking & Services

### Opening Ports

By default, Rawk only exposes:
- Port 80 (nginx)
- Port 18789 (OpenClaw gateway)

To run additional services:

```bash
# Example: Run a web server on port 3000
python3 -m http.server 3000 --bind 0.0.0.0

# Access from your network
curl http://rawk.local:3000
```

### Reverse Proxy (Nginx)

Add custom sites:

```bash
sudo nano /etc/nginx/sites-available/my-site
```

```nginx
server {
    listen 80;
    server_name my-site.local;
    root /var/www/my-site;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/my-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Port Forwarding (Advanced)

To access Rawk from outside your home network:
1. Set up port forwarding on your router (e.g., forward port 8080 → rawk.local:18789)
2. **Use a secure token** (edit `~/.openclaw/openclaw.json`)
3. Consider HTTPS (use Let's Encrypt + nginx)

**Warning:** Exposing Rawk to the internet is risky. Use a strong token and monitor logs.

---

## Docker Containers

Rawk has Docker pre-installed. Use it for isolated services.

### Running Containers

```bash
# Example: PostgreSQL database
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  postgres:15

# Check running containers
docker ps

# Stop
docker stop postgres
```

### Persistent Data

Use volumes or bind mounts:

```bash
docker run -d --name postgres \
  -v /home/rawk/postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:15
```

### Sandbox Mode

If you enabled **Sandbox Mode** during setup, OpenClaw runs the assistant in a Docker container with limited access to the host system.

**Check if sandbox is active:**

```bash
grep -A5 '"exec"' ~/.openclaw/openclaw.json
# Look for "mode": "sandbox"
```

---

## System Administration

### Updating OpenClaw

```bash
npm install -g openclaw@latest
openclaw gateway restart
```

### Updating System Packages

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

### Disk Usage

```bash
df -h                  # Check available space
du -sh ~/.openclaw/*   # Check OpenClaw disk usage
```

If space is low:

```bash
# Clean old logs
rm ~/.openclaw/logs/*.log.*

# Clean Docker images
docker system prune -a
```

### Monitoring

**CPU/RAM usage:**

```bash
htop
```

**Network activity:**

```bash
sudo iftop
```

**Gateway metrics:**

```bash
openclaw status
```

---

## Backup & Recovery

### Backup Configuration

```bash
# Backup OpenClaw config
cp ~/.openclaw/openclaw.json ~/openclaw-backup.json
scp rawk@rawk.local:~/openclaw-backup.json ./

# Backup workspace
tar -czf workspace-backup.tar.gz ~/.openclaw/workspace/
scp rawk@rawk.local:~/workspace-backup.tar.gz ./
```

### Factory Reset

Reset Rawk to factory state (keeps OS, resets OpenClaw):

```bash
sudo rawk-reset
sudo reboot
```

This will:
- Remove setup completion flag
- Back up existing config to `~/.openclaw/openclaw.json.backup`
- Re-enable WiFi AP mode

### Full System Backup (SD Image)

**Requires:** SD card reader and another Linux machine

1. **Power off Rawk**
   ```bash
   sudo poweroff
   ```

2. **Remove SD card** from Rawk

3. **Insert into your computer** and clone:
   ```bash
   sudo dd if=/dev/sdX of=rawk-backup.img bs=4M status=progress conv=fsync
   ```
   Replace `/dev/sdX` with your SD card device (check with `lsblk`).

4. **Store the image** safely (it's ~32GB)

### Restore from Backup

```bash
sudo dd if=rawk-backup.img of=/dev/sdX bs=4M status=progress conv=fsync
```

---

## Advanced Hacks

### Changing Hostname

```bash
sudo hostnamectl set-hostname my-rawk
sudo nano /etc/hosts
# Replace "rawk" with "my-rawk"
sudo reboot
```

Access at `http://my-rawk.local`.

### Custom Boot Services

Create a systemd service:

```bash
sudo nano /etc/systemd/system/my-service.service
```

```ini
[Unit]
Description=My Custom Service
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/rawk/my-script.py
Restart=always
User=rawk

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl enable my-service.service
sudo systemctl start my-service.service
```

### USB Peripherals (If Available)

**Current hardware:** No USB ports  
**Workaround:** Use GPIO pins for serial/I2C devices (advanced)

Future hardware may include USB-C data port.

### Home Assistant Integration

Install the skill:

```bash
clawdhub install homeassistant
```

Configure with your Home Assistant URL and token. Then control lights, sensors, etc.:

> "Turn off the living room lights"

### Voice Input (Experimental)

Rawk has no built-in microphone, but you can integrate external voice input:

1. **Use WhatsApp voice messages** (transcribed by OpenClaw)
2. **Connect a USB mic** (if future hardware supports it)
3. **Use a separate device** (e.g., ESP32 with mic → MQTT → OpenClaw)

---

## Troubleshooting

### Common Issues

**Gateway won't start:**
```bash
openclaw logs --follow
# Look for errors (API key invalid, port in use, etc.)
```

**Out of memory:**
```bash
free -h
# If RAM is full, kill heavy processes or reboot
```

**Disk full:**
```bash
df -h
sudo apt clean
docker system prune -a
```

**Can't SSH in:**
- Check if SSH is running: `sudo systemctl status ssh` (requires console access)
- Reset via SD card (mount on another computer, edit `/etc/ssh/sshd_config`)

### Emergency Recovery

If Rawk is completely bricked:
1. Remove SD card
2. Reflash with factory image (download from [rawk.sh](https://rawk.sh))
3. Use [Raspberry Pi Imager](https://www.raspberrypi.com/software/) or `dd`

---

## Community & Resources

### Get Help
- **Discord:** [discord.com/invite/clawd](https://discord.com/invite/clawd)
- **GitHub:** [github.com/fabryx-dao/rawk](https://github.com/fabryx-dao/rawk)
- **OpenClaw Docs:** [docs.openclaw.ai](https://docs.openclaw.ai)

### Share Your Hacks
- Post in Discord #rawk-hacks channel
- Submit pull requests to the docs
- Publish skills on ClawdHub

### Contributing
Rawk is open source (MIT). Contributions welcome:
- Improve documentation
- Build new skills
- Report bugs
- Share creative use cases

---

🪨 **Happy hacking. Break things. Learn. Rebuild.**
