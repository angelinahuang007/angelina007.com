# Deployment Guide — angelina007.com

Step-by-step guide to deploy on an existing Digital Ocean droplet running Ubuntu.

## Prerequisites

- A Digital Ocean droplet with Ubuntu (20.04+)
- SSH access to the droplet
- A domain name (angelina007.com) — you'll point DNS to the droplet IP
- Your repo pushed to GitHub

## Step 1: Clean Up Old Django Setup

SSH into your droplet and stop/remove the old Django app:

```bash
ssh root@YOUR_DROPLET_IP

# Check what's running
sudo systemctl list-units --type=service | grep -i django
sudo systemctl list-units --type=service | grep -i gunicorn
docker ps  # if Django was containerized

# Stop and disable old services
sudo systemctl stop gunicorn 2>/dev/null
sudo systemctl disable gunicorn 2>/dev/null
sudo systemctl stop django 2>/dev/null
sudo systemctl disable django 2>/dev/null

# If using supervisor
sudo supervisorctl stop all 2>/dev/null

# If old nginx is running as a system service (not Docker)
sudo systemctl stop nginx 2>/dev/null
sudo systemctl disable nginx 2>/dev/null

# Free up port 80/443
sudo lsof -i :80
sudo lsof -i :443
# Kill anything still holding those ports

# Optional: remove old Django project files
# rm -rf ~/your-django-project/
```

## Step 2: Install Docker (if not already installed)

```bash
# Check if Docker is installed
docker --version

# If not, install Docker:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify
docker compose version

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

## Step 3: Install Git and Node.js (for local builds if needed)

```bash
# Git should already be installed, but just in case
sudo apt-get install -y git

# Node.js 20 (optional, only if you want to run without Docker)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Step 4: Clone Your Repo

```bash
cd ~
git clone https://github.com/angelinahuang007/angelina007.com.git
cd angelina007.com
```

## Step 5: Create Environment File

```bash
cp .env.example .env.production

# Edit with your real values
nano .env.production
```

At minimum, set:
```
NEXT_PUBLIC_SITE_URL=https://angelina007.com
```

If you've set up Sanity CMS, also fill in the Sanity variables.

## Step 6: Point Your Domain DNS

Go to your domain registrar (wherever you bought angelina007.com) and set:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_DROPLET_IP | 300 |
| A | www | YOUR_DROPLET_IP | 300 |

DNS propagation can take 5 minutes to 48 hours, but usually takes a few minutes.

Verify it's pointing correctly:
```bash
# From your local machine
dig angelina007.com +short
# Should show your droplet IP
```

## Step 7: Build and Start (First Time)

```bash
cd ~/angelina007.com

# Build the Docker image (this takes a few minutes the first time)
docker compose build

# Initialize SSL certificates
chmod +x scripts/init-ssl.sh
./scripts/init-ssl.sh your-email@example.com
```

The `init-ssl.sh` script will:
1. Create a temporary self-signed cert so nginx can start
2. Start the Next.js app + nginx
3. Request a real Let's Encrypt SSL certificate
4. Reload nginx with the real cert
5. Start automatic cert renewal

Your site should now be live at https://angelina007.com!

## Step 8: Set Up GitHub Actions (Auto-Deploy)

For automatic deployments on `git push`, you need to add secrets to your GitHub repo.

### Generate an SSH key for deployment

```bash
# On your local machine
ssh-keygen -t ed25519 -C "deploy@angelina007.com" -f ~/.ssh/angelina_deploy

# Copy the PUBLIC key to your droplet
ssh-copy-id -i ~/.ssh/angelina_deploy.pub root@YOUR_DROPLET_IP

# Copy the PRIVATE key — you'll paste this into GitHub
cat ~/.ssh/angelina_deploy
```

### Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Value |
|------------|-------|
| `DROPLET_HOST` | Your droplet IP address |
| `DROPLET_USER` | `root` (or your deploy user) |
| `DROPLET_SSH_KEY` | Contents of `~/.ssh/angelina_deploy` (private key) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID (optional) |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` (optional) |

Now every push to `main` will automatically build and deploy.

## Common Operations

### View logs
```bash
cd ~/angelina007.com
docker compose logs -f           # All services
docker compose logs -f next-app  # Just Next.js
docker compose logs -f nginx     # Just nginx
```

### Restart services
```bash
docker compose restart
```

### Rebuild after code changes (manual deploy)
```bash
cd ~/angelina007.com
git pull origin main
docker compose build
docker compose up -d
```

### Force SSL cert renewal
```bash
docker compose run --rm certbot renew --force-renewal
docker compose exec nginx nginx -s reload
```

### Check disk space
```bash
df -h
docker system df     # Docker-specific usage
docker system prune  # Clean up unused images/containers
```

## Troubleshooting

### Site not loading after DNS change
- Wait a few minutes for DNS propagation
- Check: `dig angelina007.com +short` returns your IP
- Check: `docker compose ps` — all containers should be "Up"

### Port 80/443 already in use
```bash
sudo lsof -i :80
sudo lsof -i :443
# Kill the process or stop the old service using those ports
```

### SSL certificate errors
```bash
# Check cert status
docker compose run --rm certbot certificates

# Re-run the init script
./scripts/init-ssl.sh your-email@example.com
```

### Build fails (out of memory)
Smaller droplets (1GB RAM) may run out of memory during `npm run build`. Fix:
```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Then retry the build
docker compose build
```
