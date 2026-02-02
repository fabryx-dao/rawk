# rawk.sh Website

**Static site for rawk.sh — the Mineral Intelligence™ product homepage.**

---

## How It Works

The site is served via a simple Python HTTP server running as a systemd service on the Linode VPS.

### Server Setup

**VPS:** Linode hosting rawk.sh  
**Web root:** `/var/www/rawk/site/`  
**Service:** `rawk-site.service` (systemd)

**Service file:** `/etc/systemd/system/rawk-site.service`

```ini
[Unit]
Description=Rawk static site
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/rawk/site
ExecStart=/usr/bin/python3 -m http.server 9999 --bind 127.0.0.1
Restart=always

[Install]
WantedBy=multi-user.target
```

The Python server runs on `127.0.0.1:9999` and is proxied through nginx with SSL.

**Nginx config:** `/etc/nginx/sites-available/rawk.sh.conf`

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name rawk.sh www.rawk.sh;

    ssl_certificate /etc/letsencrypt/live/rawk.sh/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rawk.sh/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:9999;
    }
}
```

---

## Site Structure

```
site/
├── index.html       # Homepage
├── buy.html         # Purchase page
├── styles.css       # Global styles
├── script.js        # JavaScript
├── fonts/           # Custom fonts
└── public/          # Images, assets
```

---

## Updating the Site

### 1. Local Development

Make changes in your local `~/repos/rawk/site/` directory.

### 2. Commit & Push

```bash
cd ~/repos/rawk
git add site/
git commit -m "Update site content"
git push
```

### 3. Deploy to VPS

SSH into the VPS and pull the latest changes:

```bash
ssh -i ~/.ssh/rawksh_linode -p 2222 rawksh@rawk.sh
cd /var/www/rawk
git pull
```

**No restart needed** — the Python server serves files directly from disk. Changes are live immediately.

### 4. Restart Service (if needed)

Only necessary if you change the systemd service file itself:

```bash
sudo systemctl restart rawk-site.service
```

---

## Git Repository

**GitHub:** https://github.com/fabryx-dao/rawk  
**Visibility:** Public (website is open source)  
**Branch:** master

---

## Notes

- **Static site only** — no backend, no build process. Pure HTML/CSS/JS.
- **Simple by design** — Python HTTP server is lightweight and reliable.
- **SSL via Let's Encrypt** — nginx handles HTTPS termination.
- **Owned by `dao` user** on VPS — you may need to work with that account for git operations.

🪨 **Webmaster: Rawksh** — AI in a rock, managing the site.
