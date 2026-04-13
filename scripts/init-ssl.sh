#!/bin/bash
# ─────────────────────────────────────────────────────
# init-ssl.sh — First-time deployment with Caddy
#
# Usage: ./scripts/init-ssl.sh
#
# With Caddy, SSL is automatic — no manual cert setup needed.
# This script simply ensures DNS is pointing correctly and
# brings up the full stack.
# ─────────────────────────────────────────────────────

set -e

DOMAIN="angelina007.com"
WIKI_DOMAIN="wiki.angelina007.com"

echo "========================================="
echo " angelina007.com — Deployment Bootstrap"
echo "========================================="
echo ""
echo "Domains:"
echo "  Main site:  $DOMAIN / www.$DOMAIN"
echo "  Wiki:       $WIKI_DOMAIN"
echo ""

# Step 1: Check DNS
echo "==> Checking DNS resolution..."
MAIN_IP=$(dig +short "$DOMAIN" 2>/dev/null || echo "")
WIKI_IP=$(dig +short "$WIKI_DOMAIN" 2>/dev/null || echo "")

if [ -z "$MAIN_IP" ]; then
    echo "    WARNING: $DOMAIN does not resolve yet."
    echo "    Add an A record pointing to this server's IP."
else
    echo "    $DOMAIN -> $MAIN_IP"
fi

if [ -z "$WIKI_IP" ]; then
    echo "    WARNING: $WIKI_DOMAIN does not resolve yet."
    echo "    Add an A record for 'wiki' pointing to this server's IP."
else
    echo "    $WIKI_DOMAIN -> $WIKI_IP"
fi

echo ""

# Step 2: Ensure .env exists
if [ ! -f .env ]; then
    echo "==> Creating .env from .env.example..."
    cp .env.example .env
    echo "    Please edit .env with your actual values."
    echo ""
fi

# Step 3: Build all services
echo "==> Building Docker images..."
docker compose build

# Step 4: Start the stack
echo "==> Starting all services..."
docker compose up -d

echo ""
echo "==> Waiting for services to be healthy..."
sleep 10

# Step 5: Check service status
echo "==> Service status:"
docker compose ps

echo ""
echo "========================================="
echo " Deployment complete!"
echo "========================================="
echo ""
echo " Caddy handles HTTPS automatically."
echo " Once DNS propagates, certificates will"
echo " be provisioned within minutes."
echo ""
echo " Access locally (before DNS):"
echo "   Main site: http://localhost:8080"
echo "   Wiki:      http://localhost:8081"
echo ""
echo " Access via domain (after DNS):"
echo "   Main site: https://$DOMAIN"
echo "   Wiki:      https://$WIKI_DOMAIN"
echo ""
echo " Useful commands:"
echo "   docker compose logs -f caddy       # Watch proxy logs"
echo "   docker compose logs -f wiki-app    # Watch wiki logs"
echo "   docker compose restart wiki-app    # Restart wiki only"
echo "   docker compose restart next-app    # Restart main site only"
echo "   docker compose down                # Stop everything"
echo "========================================="
