#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# VPS Setup Script — ELMostafa ERP
# Run ONCE on a fresh Ubuntu 22.04+ / Debian 12+ VPS
# ============================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Prerequisites ---
if [ "$EUID" -ne 0 ]; then
  error "Please run as root (sudo)"
fi

# --- Install Docker ---
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | bash
  systemctl enable docker
  systemctl start docker
else
  info "Docker already installed: $(docker --version)"
fi

# --- Install Docker Compose ---
if ! command -v docker compose &>/dev/null; then
  info "Installing Docker Compose..."
  DOCKER_CONFIG=/usr/local/lib/docker/cli-plugins
  mkdir -p "$DOCKER_CONFIG"
  curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
    -o "$DOCKER_CONFIG/docker-compose"
  chmod +x "$DOCKER_CONFIG/docker-compose"
else
  info "Docker Compose already installed: $(docker compose version)"
fi

# --- Create project directory ---
mkdir -p /opt/elmostafa
cd /opt/elmostafa

info "Downloading production files from GitHub..."
REPO="${GITHUB_REPOSITORY:-your-org/el-mostafa}"
curl -sL "https://raw.githubusercontent.com/$REPO/main/docker-compose.prod.yml" -o docker-compose.yml
curl -sL "https://raw.githubusercontent.com/$REPO/main/Caddyfile" -o Caddyfile

# --- Create .env file ---
if [ ! -f .env ]; then
  info "Creating .env file with secure random secrets..."
  cat > .env <<EOF
DOMAIN=your-domain.com
GHCR_NAMESPACE=your-org/el-mostafa

DATABASE_USERNAME=postgres
DATABASE_PASSWORD=$(openssl rand -base64 32)
DATABASE_NAME=elmostafa

AUTH_JWT_SECRET=$(openssl rand -base64 64)
AUTH_JWT_TOKEN_EXPIRES_IN=1d
AUTH_REFRESH_SECRET=$(openssl rand -base64 64)
AUTH_REFRESH_TOKEN_EXPIRES_IN=7d
AUTH_FORGOT_SECRET=$(openssl rand -base64 64)
AUTH_FORGOT_TOKEN_EXPIRES_IN=30m
AUTH_CONFIRM_EMAIL_SECRET=$(openssl rand -base64 64)
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d

MAIL_HOST=mail.example.com
MAIL_PORT=587
MAIL_DEFAULT_EMAIL=noreply@your-domain.com
MAIL_DEFAULT_NAME=ELMostafa

FILE_DRIVER=local
EOF
  warn ">>> EDIT /opt/elmostafa/.env: set DOMAIN, MAIL_HOST, and any overrides"
else
  info ".env already exists, skipping"
fi

# --- Set up firewall ---
if command -v ufw &>/dev/null; then
  info "Configuring UFW firewall..."
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
fi

# --- Start services ---
info "Starting services with docker compose..."
docker compose pull
docker compose up -d

info ""
info "========================================"
info "  VPS setup complete!"
info "  Next steps:"
info "    1. Edit /opt/elmostafa/.env with your domain"
info "    2. Set DOMAIN=your-domain.com"
info "    3. Run: docker compose up -d"
info "    4. Caddy will auto-provision SSL via Let's Encrypt"
info "========================================"
