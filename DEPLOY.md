# Deploying Instaflow to the Contabo VPS

End-to-end guide for the first deploy. Run the steps in order; after that,
every push to `main` deploys automatically via GitHub Actions.

---

## What you're standing up

```
GitHub push → main
    ↓
GitHub Actions (Ubuntu runner)
    1. Build Docker image (multi-stage, Next.js standalone)
    2. Push to ghcr.io/sakib103695/instaflow:latest
    3. SSH into VPS as `deploy`
    4. scp docker-compose.yml + .env
    5. docker compose pull && up -d
    ↓
Contabo VPS (185.252.232.184)
    ├── nginx (host)  ──── reverse-proxies instaflow.<domain> → 127.0.0.1:3010
    └── /opt/instaflow/
          ├── docker-compose.yml   (managed by CI)
          ├── .env                 (managed by CI, 0600, never in git)
          ├── backup-mongo.sh      (installed by deploy/setup-vps.sh)
          └── backups/             (nightly mongodump archives, last 7 days)
                ↓
          ┌────────────────────────────────┐
          │ Docker network: instaflow_*    │
          │  instaflow-app   127.0.0.1:3010│
          │  instaflow-mongo (no host port)│
          └────────────────────────────────┘
```

---

## 1. Set the GitHub secrets

Open https://github.com/sakib103695/instaflow/settings/secrets/actions and add:

| Secret | Value |
|---|---|
| `VPS_HOST` | `185.252.232.184` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Paste the **private** key (the file *without* `.pub`) for the deploy user. Same key you use for persona-ai works fine. |
| `MONGO_APP_PASSWORD` | A strong random string. `openssl rand -base64 32` |
| `ADMIN_PASSWORD` | Whatever you want for the `/admin` gate |
| `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | From https://vapi.ai/account → API Keys (Public Key) |
| `GEMINI_API_KEY` | From https://aistudio.google.com/apikey |
| `VPS_SSH_KNOWN_HOSTS` | *(optional but recommended)* Run `ssh-keyscan -H 185.252.232.184` and paste the output |

> **GHCR_TOKEN** is **not** needed — GitHub Actions auto-provides `GITHUB_TOKEN`
> with permission to push to your own GHCR namespace.

---

## 2. One-time VPS bootstrap

SSH in as `deploy` and run the setup script (creates `/opt/instaflow`, installs
the nightly backup cron). It does **not** touch nginx, ufw, or anything else.

```bash
ssh deploy@185.252.232.184
curl -fsSL https://raw.githubusercontent.com/sakib103695/instaflow/main/deploy/setup-vps.sh | bash
exit
```

---

## 3. Trigger the first deploy

Either push a commit to `main`, or trigger the workflow manually:

- https://github.com/sakib103695/instaflow/actions/workflows/deploy.yml
- Click **Run workflow** → **main** → Run

The first build will take ~3-5 min (no cache yet). Watch the logs. When it
turns green, both containers are running on the VPS:

```bash
ssh deploy@185.252.232.184
cd /opt/instaflow
docker compose ps
docker compose logs -f app
```

The app is now serving on `127.0.0.1:3010` — not yet reachable from the
internet because nginx doesn't know about it.

---

## 4. Hook up nginx + TLS

Replace `instaflow.YOUR-DOMAIN` everywhere with your real hostname (e.g.
`instaflow.example.com`). The DNS A record must already point to
`185.252.232.184` before running certbot — verify with `dig instaflow.YOUR-DOMAIN`.

```bash
# As root or with sudo:
sudo cp /home/deploy/instaflow-nginx.conf /etc/nginx/sites-available/instaflow
# (Or scp deploy/nginx-instaflow.conf from your laptop directly there.)

sudo nano /etc/nginx/sites-available/instaflow
# Replace `instaflow.YOUR-DOMAIN` with your real hostname, save.

sudo ln -s /etc/nginx/sites-available/instaflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue + auto-renew TLS:
sudo certbot --nginx -d instaflow.YOUR-DOMAIN
# Pick "redirect HTTP to HTTPS" when prompted.
```

You're live. Open `https://instaflow.YOUR-DOMAIN` in a browser.

---

## 5. Smoke test

```bash
# 1. Public homepage loads
curl -I https://instaflow.YOUR-DOMAIN

# 2. Admin gate works (should return 401 without password)
curl -I https://instaflow.YOUR-DOMAIN/admin/clients
curl -I -u "anything:$ADMIN_PASSWORD" https://instaflow.YOUR-DOMAIN/admin/clients

# 3. Mongo is alive (no host port → exec into the container)
ssh deploy@185.252.232.184
cd /opt/instaflow
docker compose exec mongo mongosh -u instaflow -p "$(grep MONGO_APP_PASSWORD .env | cut -d= -f2-)" --authenticationDatabase admin --eval 'db.adminCommand("ping")'
```

Then in the browser:
1. Open `https://instaflow.YOUR-DOMAIN/admin/clients`, log in, click **+ New Client**
2. Drop a real domain, wait for the scrape
3. Open `https://instaflow.YOUR-DOMAIN/?client=<slug>` and click **Talk**

---

## Day-to-day operations

| Task | Command |
|---|---|
| Ship a code change | `git push origin main` (CI handles the rest) |
| View live app logs | `ssh deploy@VPS && cd /opt/instaflow && docker compose logs -f app` |
| Restart just the app | `docker compose restart app` |
| Roll back to a previous build | Edit `docker-compose.yml` to pin `:SHORT_SHA` instead of `:latest`, then `docker compose up -d` |
| List backups | `ls -lh /opt/instaflow/backups/` |
| Restore from backup | `gunzip -c backup.archive.gz \| docker compose exec -T mongo mongorestore --archive --username instaflow --password ... --authenticationDatabase admin` |
| Rotate Mongo password | Update `MONGO_APP_PASSWORD` secret on GitHub → re-run deploy. **Note:** existing Mongo data is locked to the old password — you must `docker compose down -v` (DESTROYS DATA) or manually update the user inside Mongo |

---

## Troubleshooting

**Workflow fails at SSH step**
- Check that `VPS_SSH_KEY` is the *private* key (with `-----BEGIN OPENSSH PRIVATE KEY-----` header)
- Verify the public counterpart is in `/home/deploy/.ssh/authorized_keys` on the VPS
- Try locally: `ssh -i ~/.ssh/ai-persona-deploy deploy@185.252.232.184 'echo ok'`

**App container restarts in a loop**
- `docker compose logs app` — usually a missing env var
- Check `/opt/instaflow/.env` exists and has all 4 lines

**Mongo health check failing**
- First start takes ~30s for Mongo to initialize. Wait, then `docker compose ps`
- If it's still failing: `docker compose logs mongo`

**502 Bad Gateway from nginx**
- App container isn't running, or nginx is pointing at the wrong port
- `docker compose ps` and confirm app is `Up`
- `curl -I http://127.0.0.1:3010` from the VPS — should return 200

**"Meeting ended due to ejection" in browser console**
- Benign Daily.co teardown noise from Vapi. Safe to ignore.

---

## Cost summary

| Item | Cost |
|---|---|
| Contabo VPS (already paid) | $0 marginal |
| Domain | ~$10/year |
| MongoDB | $0 (self-hosted on VPS) |
| GitHub Actions | $0 (within free tier for personal repos) |
| GHCR | $0 (free for public + your own private images) |
| Vapi | Pay-per-minute call usage only |
| ElevenLabs / Cartesia | Bundled in Vapi pricing |
