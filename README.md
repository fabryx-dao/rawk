# Rawk™

A plug-and-play home for Clawdbot (OpenClaw).

Rawk is a sealed Linux computer that runs OpenClaw headlessly over Wi-Fi. It has no screen, no keyboard, and no cloud dependencies aside from AI inference. Users interact with their OpenClaw agent through messaging channels (WhatsApp, Telegram) or the web interface.

---

## What Rawk is

- A Linux-based device
- Preconfigured with OpenClaw installed
- A web-based setup wizard served at `http://rawk.local`
- Local-first: all data stays on the device

---

## Initial setup

1. **Power on** - Plug in the USB-C cable
2. **Connect to setup network** - Rawk broadcasts a WiFi network named `RAWK-XXXX`
3. **Join the network** - Your device will detect the captive portal and open it automatically
4. **Enter WiFi credentials** - Provide your home WiFi network name and password
5. **Switch networks** - Rawk joins your home network; your device reconnects to home WiFi
6. **Access setup wizard** - Navigate to `http://rawk.local` to complete OpenClaw configuration
7. **Configure OpenClaw** - Set agent name, AI provider (Claude/OpenAI/local LLM), messaging channel, and permissions

After setup, OpenClaw runs continuously and can be accessed at `http://rawk.local:18789`.

---

## Repository contents

This repository contains:
- Setup wizard web interface (`app/v1/index.html`)
- OpenClaw extension for setup RPC methods (`app/v1/index.ts`)
- Nginx configuration for serving at `rawk.local`
- Documentation for provisioning and deployment

This repository does not contain:
- SD card image build scripts
- Manufacturing specifications
- Credentials or API keys
- E-commerce or fulfillment logic

---

## Technical details

- **Hardware**: ARM-based Linux computer
- **OS**: Linux (custom image)
- **Runtime**: OpenClaw gateway with custom extensions
- **Network**: WiFi AP mode for initial setup, then WiFi client mode
- **Web server**: Nginx serving setup wizard at port 80
- **Gateway**: OpenClaw gateway at port 18789
- **mDNS**: `rawk.local` hostname resolution via Avahi

---

## Development

The setup wizard can be tested locally by serving `app/v1/index.html` and pointing it at a running OpenClaw gateway instance with the Rawk setup extension loaded.

See `app/v1/README.md` for detailed development instructions.

---

## Open source + trademark

The software and documentation in this repository are open source.

**Rawk™** is a registered trademark. This repository does not grant permission to use the Rawk name or logo to market or sell hardware devices.

You may build your own device for personal use. Commercial use of the Rawk name requires written permission from FABRYX DAO LLC.

---

## License

MIT License (software)
Trademark restrictions apply to the Rawk name and branding.

---

**Rawk™** is developed and distributed by FABRYX DAO LLC.
Website: [rawk.sh](https://rawk.sh)