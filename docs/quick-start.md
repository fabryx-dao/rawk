# Quick Start

**From unboxing to your first conversation in 5 minutes.**

---

## What's in the Box

- 🪨 **Rawk device** — Lichen-green sealed computer
- 🔌 **USB-C power supply** — 5V/3A recommended
- 📄 **Getting Started card** — Quick reference

---

## Step 1: Power On (30 seconds)

1. **Plug in** the USB-C power cable
2. **Wait** for the green LED to blink (booting)
3. After ~30 seconds, your Rawk will broadcast a WiFi network

---

## Step 2: Connect to Rawk WiFi (1 minute)

Your Rawk creates its own WiFi network on first boot:

1. **Open WiFi settings** on your phone or laptop
2. **Look for a network** named `RAWK-XXXX` (e.g., `RAWK-E87A`)
3. **Connect** to it (no password required)

Your device may show "No Internet" — that's expected. Stay connected.

---

## Step 3: Configure WiFi (2 minutes)

Your browser should automatically open to the setup page. If not:

1. **Open a browser** and go to: `http://192.168.4.1`
2. **Select your home WiFi network** from the list
3. **Enter your WiFi password**
4. **Click Connect**

Your Rawk will now:
- Connect to your home WiFi
- Disable its temporary network
- Show you instructions to reconnect

---

## Step 4: Reconnect to Home WiFi (30 seconds)

1. **Disconnect** from the `RAWK-XXXX` network
2. **Reconnect** to your home WiFi
3. **Open your browser** and go to: `http://rawk.local`

You'll see the OpenClaw setup wizard.

---

## Step 5: Complete Setup (2 minutes)

The setup wizard will guide you through:

### 1. Name Your Assistant
- Choose a name (default: "Rawk")
- Suggestions: Jarvis, Alfred, Friday, Claude

### 2. Connect the Brain
- **Claude API** (recommended): Enter your [Anthropic API key](https://console.anthropic.com/)
- **OpenAI**: Enter your OpenAI API key
- **Local LLM**: Connect to Ollama or LM Studio

### 3. Your Hotline (Pick One)
- **WhatsApp**: Link your personal account (QR code after setup)
- **Telegram**: Enter your bot token from [@BotFather](https://t.me/botfather)
- **Web Only**: Skip channels for now

### 4. Power-Ups
- ✅ **Web Browsing** (recommended)
- ✅ **File Access** (recommended)
- ✅ **Proactive Mode** (recommended)
- ⬜ **Smart Home** (requires Home Assistant)

### 5. Execution Mode
- **YOLO Mode** 🎰 (default) — Full system access, no training wheels
- **Safe Mode** — Ask permission for risky commands
- **Sandbox Mode** — Runs in Docker container

---

## Step 6: First Conversation (30 seconds)

After setup:
1. **Chat interface** appears at the bottom of the screen
2. **Try a message**: "Hey, who are you?"
3. Your assistant responds!

---

## What's Next?

### Connect Your Phone (WhatsApp or Telegram)

If you chose WhatsApp or Telegram during setup:

**WhatsApp:**
1. Visit `http://rawk.local:18789`
2. Click **Link WhatsApp**
3. Scan the QR code with your phone
4. Send a message: "Hey Rawk!"

**Telegram:**
1. Open Telegram and search for your bot (the username you created with @BotFather)
2. Click **Start**
3. Send a message: "Hey Rawk!"

### Explore the Control UI

Visit `http://rawk.local:18789` to:
- View chat history
- Adjust settings
- Check logs
- Install skills

---

## Troubleshooting

**Can't find RAWK-XXXX WiFi?**
- Wait 60 seconds after plugging in — the device is still booting
- Try power cycling: unplug, wait 10 seconds, plug back in

**Can't connect to rawk.local?**
- Try the IP address directly (check your router's connected devices)
- Make sure you're on the same WiFi network
- Try: `http://rawk` (without `.local`)

**Setup wizard won't load?**
- Clear your browser cache
- Try a different browser
- Visit `http://192.168.4.1` directly if still in AP mode

**WhatsApp/Telegram not working?**
- Check your API key in Settings
- Verify the channel is enabled in Control UI
- Check logs at `http://rawk.local:18789/logs`

---

## Need More Help?

See the [Full Setup Guide](setup-guide.md) or [FAQ](faq.md).

🪨 **Welcome to Mineral Intelligence™**
