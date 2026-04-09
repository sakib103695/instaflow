#!/usr/bin/env bash
#
# Run this ONCE on the VPS as the deploy user before the first GitHub Actions
# deploy:
#
#   ssh deploy@<vps-ip>
#   curl -fsSL https://raw.githubusercontent.com/sakib103695/instaflow/main/deploy/setup-vps.sh | bash
#
# (Or scp this file up and run `bash setup-vps.sh`.)
#
# What it does:
#   - Creates /opt/instaflow owned by the deploy user
#   - Verifies docker + docker compose are reachable
#   - Sets up the nightly mongo backup cron
#   - Does NOT touch nginx, ufw, or anything that could break other projects

set -euo pipefail

PROJECT_DIR=/opt/instaflow

echo "==> Verifying docker access"
docker version >/dev/null
docker compose version >/dev/null

echo "==> Creating $PROJECT_DIR"
sudo mkdir -p "$PROJECT_DIR/backups"
sudo chown -R "$USER":"$USER" "$PROJECT_DIR"

echo "==> Installing nightly mongo backup cron"
# Backup script content lives in deploy/backup-mongo.sh in the repo, but the
# GitHub Actions deploy doesn't ship it (only docker-compose.yml + .env get
# scp'd). So we install it inline here as a one-time setup step.
cat > "$PROJECT_DIR/backup-mongo.sh" <<'BACKUP'
#!/usr/bin/env bash
# Nightly Mongo backup. Keeps the last 7 days.
set -euo pipefail
BACKUP_DIR=/opt/instaflow/backups
TS=$(date +%Y-%m-%d_%H%M%S)
mkdir -p "$BACKUP_DIR"
cd /opt/instaflow
docker compose exec -T mongo mongodump \
  --username instaflow \
  --password "$(grep '^MONGO_APP_PASSWORD=' .env | cut -d= -f2-)" \
  --authenticationDatabase admin \
  --db instaflow_db \
  --archive --gzip > "$BACKUP_DIR/instaflow_${TS}.archive.gz"
# Prune anything older than 7 days.
find "$BACKUP_DIR" -name 'instaflow_*.archive.gz' -mtime +7 -delete
BACKUP
chmod +x "$PROJECT_DIR/backup-mongo.sh"

# Add the cron entry if it's not already there.
CRON_LINE="0 3 * * * /opt/instaflow/backup-mongo.sh >> /opt/instaflow/backups/cron.log 2>&1"
( crontab -l 2>/dev/null | grep -v '/opt/instaflow/backup-mongo.sh' ; echo "$CRON_LINE" ) | crontab -

echo "==> Fetching nginx vhost template into $PROJECT_DIR"
curl -fsSL https://raw.githubusercontent.com/sakib103695/instaflow/main/deploy/nginx-instaflow.conf \
  -o "$PROJECT_DIR/nginx-instaflow.conf"

echo
echo "==> Done. Next steps:"
echo "  1. Set the GitHub secrets and push to main to trigger the first deploy."
echo "  2. After the first successful deploy, install the nginx vhost:"
echo "       sudo cp $PROJECT_DIR/nginx-instaflow.conf /etc/nginx/sites-available/instaflow"
echo "       sudo nano /etc/nginx/sites-available/instaflow   # set your real domain"
echo "       sudo ln -s /etc/nginx/sites-available/instaflow /etc/nginx/sites-enabled/"
echo "       sudo nginx -t && sudo systemctl reload nginx"
echo "       sudo certbot --nginx -d instaflow.YOUR-DOMAIN"
