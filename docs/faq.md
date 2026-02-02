# FAQ

**Common questions and troubleshooting for Rawk.**

---

## General Questions

### What is Rawk?

Rawk is a physical AI assistant — a sealed Linux computer in a rock-like shell. It runs OpenClaw, a powerful AI framework, and connects via WhatsApp, Telegram, or web chat. It's designed for people who want their AI on their own hardware, not someone else's cloud.

### Who makes Rawk?

Rawk is built by **FABRYX DAO LLC**, a Mineral Arts Guild. We believe AI should be tangible, local, and under your control.

### How much does it cost?

- **Hardware:** $99 (one-time)
- **AI Inference:** ~$3-15/month (Claude API) or free (local LLM)
- **No subscriptions, no hidden fees**

### Is my data private?

**Yes.** Rawk runs on your local network. Your conversations and files stay on your device. The only external connection is to the AI inference API (Claude, OpenAI, etc.) for generating responses. You can use a local LLM for 100% offline operation.

### What can Rawk do?

- **Chat** via WhatsApp, Telegram, or web
- **Execute commands** on the device (file operations, scripts, etc.)
- **Browse the web** (search, fetch content)
- **Manage files** (read, write, organize)
- **Proactive reminders** (check calendar, email, weather)
- **Run custom skills** (extend functionality)

### What can't it do?

- Control your main computer (it's a separate device)
- Access cloud services without API keys (Gmail, Dropbox, etc. require setup)
- Make phone calls (unless you connect telephony APIs)

### Can I use it without internet?

**Partially.** Rawk needs internet for AI inference (Claude, OpenAI). If you use a local LLM (Ollama, LM Studio), you can run it fully offline — but it won't be able to browse the web or check external APIs.

---

## Setup & Configuration

### I can't find the RAWK-XXXX WiFi network

**Try this:**
1. Wait 60 seconds after plugging in — the device is still booting
2. Power cycle: unplug, wait 10 seconds, plug back in
3. Check if your device is in AP mode: the green LED should blink steadily
4. Move closer to the Rawk (WiFi range is limited)

**Still not working?**
- Your Rawk may have already been set up. Try connecting to your home WiFi and visiting `http://rawk.local`
- If that fails, you may need to perform a factory reset (see below)

### I can't connect to rawk.local

**Troubleshooting:**
1. **Make sure you're on the same WiFi network** as Rawk
2. **Wait 1-2 minutes** after connecting — mDNS (.local addresses) take time to propagate
3. **Try without .local:** `http://rawk`
4. **Find the IP address:** Check your router's DHCP client list for "rawk" and use that IP directly (e.g., `http://192.168.1.150`)
5. **Check if Rawk is online:** Ping it: `ping rawk.local`

**Still not working?**
- Your network may block mDNS (common in enterprise/public WiFi)
- Try connecting via SSH: `ssh rawk@rawk.local` (password: `rawk`)

### WiFi setup keeps failing

**Common issues:**
1. **Wrong password** — Double-check your WiFi password (case-sensitive)
2. **5GHz vs 2.4GHz** — Rawk only supports 2.4GHz networks. Make sure your WiFi is broadcasting on 2.4GHz
3. **Hidden SSID** — Rawk can't see hidden networks. Unhide your SSID temporarily
4. **MAC filtering** — Check if your router has MAC address filtering enabled

**Workaround:**
- Use a mobile hotspot (2.4GHz) to get Rawk online
- Then configure it to connect to your main WiFi via SSH

### How do I change WiFi networks?

**Via SSH:**
```bash
ssh rawk@rawk.local
# Password: rawk

# List saved networks
nmcli connection show

# Connect to a new network
sudo nmcli device wifi connect "YourSSID" password "YourPassword"
```

**Or factory reset** and run through setup again.

### Can I use Rawk on Ethernet?

**Not yet.** The current version only supports WiFi. Ethernet support is planned for future hardware revisions.

---

## Usage

### How do I talk to my Rawk?

**Three ways:**
1. **WhatsApp** — Message your linked account (like texting a friend)
2. **Telegram** — Message your bot
3. **Web** — Visit `http://rawk.local:18789` and use the chat interface

### WhatsApp QR code won't scan

**Try this:**
1. Make sure you're using the **WhatsApp app** (not WhatsApp Web)
2. Go to **Settings** → **Linked Devices** → **Link a Device**
3. Point your camera at the QR code (it should focus automatically)
4. If the QR code expired, refresh the page to generate a new one

**Still not working?**
- Check that your Rawk has internet access (test by pinging `google.com` via SSH)
- Restart the gateway: `openclaw gateway restart` (via SSH)

### My assistant isn't responding

**Check these:**
1. **API key** — Make sure your Claude/OpenAI key is valid
2. **Gateway status** — Visit `http://rawk.local:18789` and check if it's online
3. **Channel connection** — Check Settings → Channels to see if WhatsApp/Telegram is connected
4. **Logs** — Visit `http://rawk.local:18789/logs` for error messages

**Quick fix:**
```bash
ssh rawk@rawk.local
openclaw gateway restart
```

### How do I install new skills?

**Via Control UI:**
1. Visit `http://rawk.local:18789`
2. Go to **Skills**
3. Browse or search for skills
4. Click **Install**

**Via SSH:**
```bash
ssh rawk@rawk.local
clawdhub search <skill-name>
clawdhub install <skill-name>
```

Skills are community-contributed extensions that add new capabilities (weather, email, automation, etc.).

### Can I change the assistant's name?

**Yes.** Edit the config:

1. Visit `http://rawk.local:18789`
2. Go to **Settings** → **Identity**
3. Change the name and emoji
4. Save

Or via SSH:
```bash
nano ~/.openclaw/openclaw.json
# Edit the "identity" section
openclaw gateway restart
```

### How do I add more AI models?

**Via config:**
```bash
ssh rawk@rawk.local
nano ~/.openclaw/openclaw.json
```

Add model configs under `models` section. See [OpenClaw docs](https://docs.openclaw.ai) for details.

---

## Troubleshooting

### Rawk isn't responding to commands

**Try this:**
1. Check if the gateway is running:
   ```bash
   ssh rawk@rawk.local
   openclaw gateway status
   ```
2. Restart the gateway:
   ```bash
   openclaw gateway restart
   ```
3. Check logs for errors:
   ```bash
   openclaw logs --follow
   ```

### Green LED is solid (not blinking)

This usually means the device is **powered on but not booting**. Common causes:
- **Corrupted SD card** — Try reflashing the image
- **Power supply issue** — Use a 5V/3A adapter (phone chargers may not provide enough power)
- **Hardware failure** — Contact support

### I forgot my SSH password

**Default credentials:**
- Username: `rawk`
- Password: `rawk`

If you changed it and forgot, you'll need to:
1. Remove the SD card
2. Mount it on another computer
3. Edit `/etc/shadow` to reset the password
4. Or reflash the SD card with a factory image

### How do I factory reset?

**Via SSH:**
```bash
ssh rawk@rawk.local
sudo rawk-reset
sudo reboot
```

This will:
- Remove setup completion flag
- Back up your config (saved to `~/.openclaw/openclaw.json.backup`)
- Re-enable AP mode
- Allow you to run through setup again

**Can't SSH?**
- Remove the SD card
- Mount it on another computer
- Delete `~/.openclaw/.setup_complete`
- Reinsert the SD card and power on

### Rawk stopped working after an update

**Rollback:**
```bash
ssh rawk@rawk.local
openclaw gateway stop
npm install -g openclaw@<previous-version>
openclaw gateway start
```

**Or restore config:**
```bash
cp ~/.openclaw/openclaw.json.backup ~/.openclaw/openclaw.json
openclaw gateway restart
```

### Can I brick my Rawk?

**Yes.** That's part of the design. Rawk is meant to be experimented with. If you break it, you can:
1. **Factory reset** (if SSH still works)
2. **Reflash the SD card** (if completely bricked)
3. **Contact support** for a replacement SD image

A bricked rock is just a fresh start away. 🪨

---

## Hardware

### What are the specs?

See [Technical Specs](technical-specs.md) for full details.

**TL;DR:**
- Raspberry Pi Compute Module 4 (2GB RAM, 32GB eMMC)
- WiFi 5 (802.11ac, 2.4GHz + 5GHz, but only 2.4GHz used for setup)
- Bluetooth 5.0
- USB-C power
- Lichen-green sealed case

### Can I open the case?

**No.** Rawk is sealed to protect the components and maintain the aesthetic. Opening it voids the warranty and may damage internal parts.

**But I want to hack it:**
- You have full SSH access — hack via software
- Add external USB peripherals (cameras, sensors, etc.)
- If you *really* need hardware access, contact support

### Can I upgrade the RAM or storage?

**No.** Rawk uses a Raspberry Pi Compute Module with soldered components. RAM and eMMC storage are not user-upgradeable.

**Workarounds:**
- Attach USB storage for additional space
- Use network storage (NAS, etc.)

### Does it get hot?

**Slightly warm, but safe.** The case is designed to dissipate heat passively. Under heavy load (long inference calls, continuous operation), it may feel warm to the touch (~40-50°C). This is normal.

**Don't:**
- Cover the device with fabric
- Place it in direct sunlight
- Stack multiple Rawks on top of each other

### What's the power consumption?

**Idle:** ~2-3W  
**Active:** ~5-7W  
**Cost:** <$1/month in electricity (depends on your rates)

---

## Advanced

### Can I run Docker on Rawk?

**Yes.** Docker is pre-installed. You can run containers via SSH:
```bash
ssh rawk@rawk.local
docker run -d --name myapp myimage
```

**Sandbox mode** (optional execution mode) uses Docker to isolate the assistant.

### Can I connect Rawk to Home Assistant?

**Yes.** Install the Home Assistant skill:
```bash
clawdhub install homeassistant
```

Configure it with your Home Assistant URL and token. Then you can control lights, thermostats, etc. via your assistant.

### Can I run multiple assistants on one Rawk?

**Yes.** OpenClaw supports multiple agents. Edit the config:
```bash
nano ~/.openclaw/openclaw.json
```

Add multiple entries under `agents.list`. Each can have different names, models, and channels.

### Can I use Rawk as a server for other projects?

**Yes.** It's a full Linux device. You can:
- Run web servers (nginx, Apache)
- Host databases (SQLite, PostgreSQL)
- Run automation scripts
- Use it as a development box

Just SSH in and install what you need.

### How do I back up my Rawk?

**Config only:**
```bash
ssh rawk@rawk.local
cp ~/.openclaw/openclaw.json ~/backup.json
scp rawk@rawk.local:~/backup.json ./
```

**Full system image:**
1. Power off Rawk
2. Remove SD card
3. Insert into your computer
4. Clone with `dd`:
   ```bash
   sudo dd if=/dev/sdX of=rawk-backup.img bs=4M status=progress
   ```

Store the image safely. You can restore it later with `dd` in reverse.

---

## Support

### How do I get help?

1. **Check this FAQ** — Most issues are covered here
2. **Community Discord** — [discord.com/invite/clawd](https://discord.com/invite/clawd)
3. **GitHub Issues** — [github.com/fabryx-dao/rawk/issues](https://github.com/fabryx-dao/rawk/issues)
4. **Email Support** — support@rawk.sh

### Is there a warranty?

**Yes.** 90-day warranty covers hardware defects. Does not cover:
- User-caused damage (opened case, liquid damage, etc.)
- Software issues (you can factory reset or reflash)
- Normal wear and tear

### Can I return my Rawk?

**Yes.** 30-day money-back guarantee. Contact support@rawk.sh for a return authorization.

---

🪨 **Still have questions?** Ask in [Discord](https://discord.com/invite/clawd) or email support@rawk.sh
