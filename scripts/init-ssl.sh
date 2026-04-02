#!/bin/bash
# ─────────────────────────────────────────────────────
# init-ssl.sh — Bootstrap SSL certificates for first-time setup
#
# Usage: ./scripts/init-ssl.sh [your-email@example.com]
#
# This script:
# 1. Creates temporary self-signed certs so nginx can start
# 2. Starts nginx + next-app containers
# 3. Requests real Let's Encrypt certs via certbot
# 4. Reloads nginx with the real certs
# ─────────────────────────────────────────────────────

set -e

DOMAIN="angelina007.com"
EMAIL="${1:-admin@angelina007.com}"
CERT_PATH="./certbot/conf/live/$DOMAIN"

echo "==> SSL Bootstrap for $DOMAIN"
echo "    Email: $EMAIL"
echo ""

# Step 1: Create directories
mkdir -p ./certbot/conf ./certbot/www

# Step 2: Check if real certs already exist
if [ -f "$CERT_PATH/fullchain.pem" ] && [ ! -f "$CERT_PATH/.selfsigned" ]; then
    echo "==> Real SSL certificates already exist. Skipping."
    echo "    To force renewal: docker compose run --rm certbot renew --force-renewal"
    exit 0
fi

# Step 3: Create temporary self-signed cert (so nginx can start with SSL)
echo "==> Creating temporary self-signed certificate..."
mkdir -p "$CERT_PATH"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CERT_PATH/privkey.pem" \
    -out "$CERT_PATH/fullchain.pem" \
    -subj "/CN=$DOMAIN" 2>/dev/null
cp "$CERT_PATH/fullchain.pem" "$CERT_PATH/chain.pem"
touch "$CERT_PATH/.selfsigned"
echo "    Done."

# Step 4: Start containers (nginx will use the self-signed cert)
echo "==> Starting containers..."
docker compose up -d nginx next-app
echo "    Waiting for nginx to be ready..."
sleep 5

# Step 5: Request real certificate from Let's Encrypt
echo "==> Requesting Let's Encrypt certificate..."
rm -f "$CERT_PATH/.selfsigned"
docker compose run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --force-renewal

# Step 6: Reload nginx with real certs
echo "==> Reloading nginx..."
docker compose exec nginx nginx -s reload

# Step 7: Start certbot auto-renewal container
echo "==> Starting certbot auto-renewal..."
docker compose up -d certbot

echo ""
echo "==> SSL setup complete!"
echo "    https://$DOMAIN should now be live."
echo "    Certbot will auto-renew certificates every 12 hours."
