# Technical Specs

**What's inside Rawk — hardware, software, and capabilities.**

---

## Hardware

### Compute Module
- **SoC:** Raspberry Pi Compute Module 4
- **CPU:** Broadcom BCM2711, Quad-core Cortex-A72 @ 1.5GHz (ARM v8)
- **RAM:** 2GB LPDDR4-3200
- **Storage:** 32GB eMMC flash
- **GPU:** VideoCore VI (OpenGL ES 3.0, H.265 4Kp60 decode)

### Connectivity
- **WiFi:** 802.11ac dual-band (2.4GHz / 5GHz), WiFi 5
- **Bluetooth:** 5.0 (BLE supported)
- **Ethernet:** Not included (WiFi only)

### Power
- **Input:** USB-C, 5V/3A (15W)
- **Consumption:** 2-3W idle, 5-7W active
- **Power Supply:** Included (5V/3A adapter)

### Physical
- **Dimensions:** 10cm × 8cm × 5cm (approx.)
- **Weight:** 250g
- **Case:** Sealed polycarbonate shell, lichen-green matte finish
- **LED Indicator:** Single green LED (status/activity)
- **Cooling:** Passive (no fans)

### Ports
- **USB-C:** Power input (top)
- **No external ports** — Sealed design

### Operating Temperature
- **Range:** 0°C to 50°C (32°F to 122°F)
- **Optimal:** 15°C to 35°C (59°F to 95°F)

---

## Software

### Operating System
- **Base:** Ubuntu 22.04 LTS (ARM64)
- **Kernel:** Linux 5.15+
- **Init System:** systemd
- **Package Manager:** apt, npm

### Pre-installed Software
- **OpenClaw:** AI assistant framework (Node.js-based)
- **Node.js:** v22.x LTS
- **Nginx:** Web server for setup wizard and static sites
- **NetworkManager:** Network configuration and AP mode
- **Avahi:** mDNS/Zeroconf for `.local` addressing
- **Docker:** Container runtime (optional)
- **Git:** Version control
- **Python 3:** Scripting and tooling

### OpenClaw Framework
- **Version:** Latest stable (auto-updated on setup)
- **Runtime:** Node.js v22+
- **Gateway Port:** 18789 (WebSocket + HTTP)
- **Control UI:** Web-based interface at `http://rawk.local:18789`
- **Extension System:** Plugin architecture for skills

### Default Configuration
- **Hostname:** `rawk.local`
- **Default User:** `rawk` / `rawk` (SSH)
- **Gateway Bind:** LAN (0.0.0.0:18789)
- **Auth Mode:** Token-based (generated on setup)
- **Execution Mode:** YOLO (full shell access)

---

## AI Capabilities

### Supported Models (via API)
- **Anthropic Claude:** Sonnet 4, Opus 4, Haiku (recommended)
- **OpenAI:** GPT-4o, GPT-4, GPT-3.5
- **OpenRouter:** Access to 50+ models
- **Google Gemini:** Pro, Flash
- **Custom APIs:** Any OpenAI-compatible endpoint

### Local LLM Support
- **Ollama:** Run models locally (e.g., Llama 3, Mistral)
- **LM Studio:** Compatible
- **llama.cpp:** Command-line inference
- **Requires:** External GPU or high-RAM device (Rawk's 2GB is insufficient for large models)

### Vision Models (Optional)
- **Claude 3.5 Sonnet:** Image understanding
- **GPT-4V:** Image analysis
- **LLaVA:** Local vision models (via Ollama)

---

## Network Configuration

### WiFi AP Mode (First Boot)
- **SSID:** `RAWK-XXXX` (unique 4-char ID from MAC)
- **Security:** Open (no password)
- **IP Range:** 192.168.4.0/24
- **Gateway IP:** 192.168.4.1
- **DHCP:** Enabled (dnsmasq)
- **DNS:** Captive portal (redirects all queries to 192.168.4.1)

### Home Network Mode (After Setup)
- **Connection:** WiFi client to your home network
- **Addressing:** DHCP (dynamic IP)
- **mDNS Hostname:** `rawk.local`
- **Services:**
  - Port 80: Nginx (setup wizard, optional sites)
  - Port 18789: OpenClaw Gateway (WebSocket + Control UI)

### Firewall
- **Default:** No firewall (trusts local network)
- **Optional:** Configure UFW (Uncomplicated Firewall) via SSH

---

## Communication Channels

### WhatsApp
- **Integration:** WhatsApp Web API (via Baileys library)
- **Pairing:** QR code (link personal account)
- **Features:** Text, images, voice messages, reactions
- **Limitations:** No calls, no status updates

### Telegram
- **Integration:** Telegram Bot API
- **Setup:** BotFather token
- **Features:** Text, images, files, inline keyboards, commands
- **Limitations:** Bot account (not personal account)

### Web Interface
- **Control UI:** Full-featured web chat at `http://rawk.local:18789`
- **Mobile-friendly:** Responsive design
- **Features:** Chat, settings, logs, skill management

### Discord / Slack / Signal (Coming Soon)
- **Status:** Plugin support planned
- **Workaround:** Use community extensions (unofficial)

---

## Storage & Memory

### RAM Allocation
- **System:** ~300-400MB
- **OpenClaw Gateway:** ~200-400MB (varies with workload)
- **Available:** ~1.2-1.5GB for other processes

### Disk Usage (32GB eMMC)
- **OS + System:** ~3GB
- **OpenClaw + Dependencies:** ~500MB
- **User Space:** ~27-28GB available

### Expandability
- **USB Storage:** Not available (no USB ports)
- **Network Storage:** Yes (mount SMB/NFS shares via SSH)
- **Cloud Storage:** Yes (integrate via API keys)

---

## Performance

### Inference Speed
Rawk doesn't run inference locally — it sends requests to external APIs. Speed depends on:
- **Network latency** (typically 200-500ms to API endpoints)
- **Model selection** (Claude Sonnet is faster than Opus)
- **Request size** (longer prompts = slower)

**Typical response time:** 1-3 seconds for simple queries

### Command Execution
- **Shell commands:** Instant (runs locally on Raspberry Pi)
- **Web browsing:** 1-5 seconds (depends on page complexity)
- **File operations:** Instant (local filesystem)

### Concurrent Operations
- **Multiple chat sessions:** Yes (handles simultaneous users)
- **Background tasks:** Yes (proactive mode, scheduled jobs)
- **Resource limits:** RAM is the constraint (2GB shared across all processes)

---

## Security

### Network Security
- **Isolated by default:** Runs on local network only (not exposed to internet)
- **Token-based auth:** WebSocket connections require a secure token
- **No cloud dependencies:** Except AI inference APIs (can use local LLM for offline)

### SSH Access
- **Default enabled:** `ssh rawk@rawk.local` (password: `rawk`)
- **Change password:** `passwd` after first login
- **Disable if unused:** `sudo systemctl disable ssh`

### Execution Safety
- **YOLO Mode (default):** No restrictions — assistant has full shell access
- **Safe Mode:** Prompts for confirmation on risky commands
- **Sandbox Mode:** Runs assistant in Docker container (limited access)

**Warning:** YOLO mode is powerful but can break things. Use Safe Mode if you're cautious.

### Data Privacy
- **Local-first:** Chat history, files, and config stored on device
- **No telemetry:** Rawk doesn't "phone home" (except for updates if enabled)
- **API privacy:** Conversations sent to Claude/OpenAI for inference (check their privacy policies)

---

## Extensibility

### Skills (Extensions)
- **Repository:** [ClawdHub](https://clawdhub.com)
- **Installation:** Via Control UI or `clawdhub` CLI
- **Examples:** Weather, email, calendar, Home Assistant, GitHub, Twitter

### Custom Skills
- **Language:** TypeScript/JavaScript (Node.js)
- **API:** OpenClaw plugin system
- **Location:** `~/.openclaw/skills/`
- **Hot-reload:** Restart gateway to load new skills

### Docker Containers
- **Pre-installed:** Docker Engine
- **Use cases:** Run web servers, databases, additional services
- **Isolation:** Containers run alongside OpenClaw (shared resources)

### USB Peripherals (Future)
- **Status:** No USB ports in v1 hardware
- **Planned:** Future revisions may include USB-C data port for peripherals

---

## Limitations

### What Rawk Can't Do
- **Run large local LLMs:** 2GB RAM is insufficient for models like Llama 3 70B
- **High-performance computing:** Raspberry Pi is good, but not a workstation
- **4K video processing:** GPU is limited (H.265 decode only)
- **Real-time voice:** No microphone (must use WhatsApp voice messages or external integration)

### Known Issues
- **5GHz WiFi setup:** AP mode only broadcasts 2.4GHz (5GHz works after setup)
- **Bluetooth:** Enabled but no skills use it yet
- **No HDMI:** Display output requires external monitor via GPIO (advanced users only)

---

## Compliance & Certifications

### Regulatory
- **FCC:** Part 15 Class B (USA)
- **CE:** RED 2014/53/EU (Europe)
- **RoHS:** Compliant (lead-free)

### Safety
- **UL/ETL:** Power supply certified
- **Operating voltage:** 5V DC (low voltage, safe)

---

## Warranty & Support

### Hardware Warranty
- **Duration:** 90 days from purchase
- **Covers:** Manufacturing defects, component failures
- **Excludes:** User damage, opened case, liquid damage

### Software Support
- **OpenClaw updates:** Community-driven (open source)
- **Security patches:** Ubuntu LTS support until 2027
- **Skills:** Community-maintained (no official support)

### Replacement Parts
- **SD card images:** Available for free (reflash if bricked)
- **Power supply:** Standard USB-C 5V/3A (widely available)
- **Case:** Not sold separately (warranty replacement only)

---

## Comparison

| Feature | Rawk | Cloud AI (ChatGPT Plus) | Smart Speaker (Echo/Google) |
|---------|------|-------------------------|------------------------------|
| **Cost** | $99 + API (~$5/mo) | $20/month | $50-100 (free cloud) |
| **Privacy** | Local device | Cloud only | Cloud only |
| **Customization** | Full control | Limited | Very limited |
| **Skills** | Unlimited | GPTs only | Alexa/Google Skills |
| **Shell Access** | Yes (SSH) | No | No |
| **Offline Mode** | Partial (local LLM) | No | No |
| **Channels** | WhatsApp, Telegram, Web | Web/app only | Voice only |
| **Can Brick It?** | Yes (feature!) | N/A | Rarely |

---

🪨 **Questions about specs?** Check the [FAQ](faq.md) or ask in [Discord](https://discord.com/invite/clawd).
