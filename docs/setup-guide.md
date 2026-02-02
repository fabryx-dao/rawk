# Setup Guide

**Detailed instructions for network configuration and OpenClaw onboarding.**

---

## Overview

Rawk setup happens in two phases:
1. **Network Setup** — Connect Rawk to your WiFi
2. **OpenClaw Configuration** — Set up your AI assistant

---

## Phase 1: Network Setup

### How It Works

On first boot, Rawk operates in **Access Point (AP) Mode**:
- It broadcasts its own WiFi network: `RAWK-XXXX` (unique 4-character ID)
- It runs a captive portal at `192.168.4.1`
- You connect to this network to configure your home WiFi

After WiFi is configured:
- Rawk connects to your home network
- The temporary `RAWK-XXXX` network disappears
- You access Rawk via `http://rawk.local` on your home network

### Step-by-Step

#### 1. Power On Your Rawk
- Plug in USB-C power (5V/3A)
- Green LED will blink during boot
- Wait ~30-60 seconds for WiFi network to appear

#### 2. Connect to RAWK-XXXX
- Open WiFi settings on your device
- Find the network: `RAWK-XXXX` (e.g., `RAWK-E87A`)
- Connect (no password required)
- Your device may say "No Internet" — this is normal

#### 3. Open the Setup Portal
Your device should automatically open a captive portal. If not:
- Open a browser
- Navigate to: `http://192.168.4.1`

#### 4. Select Your Home WiFi
- The portal will scan for available networks
- Click your home WiFi network from the list
- Enter your WiFi password
- Click **Connect**

#### 5. Wait for Connection
Rawk will:
- Attempt to connect to your WiFi
- Show a success message
- Display instructions to reconnect

This takes 10-30 seconds.

#### 6. Reconnect to Home WiFi
- Disconnect from `RAWK-XXXX`
- Reconnect to your home WiFi
- The `RAWK-XXXX` network will no longer be visible

---

## Phase 2: OpenClaw Configuration

Once connected to your home network, access the OpenClaw setup wizard.

### Access the Wizard

1. Open a browser
2. Navigate to: `http://rawk.local`

**Can't connect?**
- Check your router's DHCP client list for "rawk" and use its IP address
- Try `http://rawk` without `.local`
- Wait a minute — mDNS (for .local addresses) takes time to propagate

### Setup Screens

#### Screen 1: Welcome
Introduction to Rawk and what it can do. Click **Next**.

---

#### Screen 2: Name Your Assistant

Choose a name for your AI assistant.

**Default:** Rawk

**Suggestions:**
- Jarvis (Iron Man)
- Alfred (Batman)
- Friday (Tony Stark's second AI)
- Claude (the brain behind it)
- HAL (if you're feeling dangerous)

This name will appear in chat interfaces and logs.

---

#### Screen 3: Connect the Brain

Your Rawk needs an AI model to think. You have three options:

##### Option 1: Claude API (Recommended)
- Get an API key: [console.anthropic.com](https://console.anthropic.com/)
- Paste your key: `sk-ant-api03-...`
- Model used: `claude-sonnet-4` (best balance of speed and capability)
- **Cost:** ~$3-15/month depending on usage

##### Option 2: OpenAI
- Get an API key: [platform.openai.com](https://platform.openai.com/)
- Paste your key: `sk-proj-...`
- Model used: `gpt-4o`
- **Cost:** ~$5-20/month

##### Option 3: Local LLM
- Requires Ollama or LM Studio running on your network
- Enter the base URL (e.g., `http://192.168.1.100:11434`)
- Select a model from the dropdown
- **Cost:** Free (but needs powerful hardware)

**Privacy Note:** OpenClaw runs locally, but inference happens via API unless you use a local LLM.

---

#### Screen 4: Your Hotline (Primary Channel)

Pick **one** way to communicate with your Rawk:

##### WhatsApp (Personal Account)
- Links your personal WhatsApp account
- After setup, you'll scan a QR code to pair
- Send messages like texting a friend
- **No bot account needed**

##### Telegram (Bot)
- Create a bot with [@BotFather](https://t.me/botfather)
- Copy the bot token: `123456:ABC-DEF...`
- Paste it here
- **Requires Telegram bot setup**

##### Web Only (Skip for Now)
- Use the web interface at `http://rawk.local:18789`
- You can add WhatsApp/Telegram later

**Recommended:** WhatsApp (easiest for daily use)

---

#### Screen 5: Power-Ups

Enable optional features:

##### ✅ Web Browsing (Recommended)
- Allows your assistant to search and fetch web content
- Required for: "What's the weather?", "Find me a recipe", etc.

##### ✅ File Access (Recommended)
- Allows reading/writing files on Rawk
- Required for: "Save this to a file", "Read my notes"

##### ✅ Proactive Mode (Recommended)
- Assistant can check things periodically (email, calendar, weather)
- Sends unprompted updates when relevant
- Can be tuned or disabled later

##### ⬜ Smart Home (Optional)
- Requires [Home Assistant](https://www.home-assistant.io/)
- Control lights, thermostats, etc. via your assistant
- Skip unless you already have Home Assistant set up

---

#### Screen 6: YOLO Mode 🎰

**This is the nuclear option.** Choose how much control your assistant has:

##### 🎰 YOLO Mode (Default, Recommended)
- Full shell access
- Can run any command on Rawk
- No safety rails, no permission prompts
- **Why?** You bought a $99 rock so an AI could do things. Let it.

**Risk:** Your assistant could brick Rawk. But a bricked rock is just a fresh start away.

##### 🛡️ Safe Mode
- Assistant asks permission for risky commands
- Good for learning or cautious users
- Slows things down

##### 🐳 Sandbox Mode
- Assistant runs in a Docker container
- Can't touch the real system
- Limited functionality

**Honest take:** YOLO mode is why Rawk exists. If you want safety rails, use ChatGPT.

---

#### Screen 7: You're Live 🎉

Setup complete! You'll see:
- A success message
- An embedded chat interface
- Suggested first messages

**Try this:**
> "Hey, who are you?"

Your assistant will respond. You're now live.

---

## Post-Setup: Linking WhatsApp

If you chose WhatsApp during setup, you'll need to pair your phone.

### Steps

1. Visit the Control UI: `http://rawk.local:18789`
2. Click **Settings** → **Channels** → **WhatsApp**
3. Click **Link WhatsApp**
4. A QR code will appear
5. Open WhatsApp on your phone:
   - **Android:** Tap ⋮ (menu) → **Linked Devices** → **Link a Device**
   - **iPhone:** Settings → **Linked Devices** → **Link a Device**
6. Scan the QR code
7. Your phone is now linked!

Send a message to your assistant from WhatsApp. It should respond.

---

## Post-Setup: Testing Telegram

If you chose Telegram:

1. Open Telegram
2. Search for your bot (the username you gave to @BotFather)
3. Click **Start**
4. Send a message: "Hey Rawk!"

Your assistant should respond immediately.

---

## Changing Settings Later

All setup options can be changed later:

**Via Control UI:**
- Visit: `http://rawk.local:18789`
- Go to **Settings**
- Edit channels, models, execution mode, etc.

**Via SSH:**
- Edit `~/.openclaw/openclaw.json`
- Restart gateway: `openclaw gateway restart`

---

## Factory Reset

Need to start over? Reset your Rawk to factory state:

### Via SSH

```bash
ssh rawk@rawk.local
# Password: rawk
sudo rawk-reset
```

This will:
- Remove setup completion flag
- Back up your config (preserves it)
- Re-enable AP mode for next boot
- Allow you to run through setup again

---

## Next Steps

- [FAQ](faq.md) — Common questions and troubleshooting
- [Technical Specs](technical-specs.md) — What's inside
- [Developer Guide](developer-guide.md) — SSH access, customization

🪨 **You're ready to rock.**
