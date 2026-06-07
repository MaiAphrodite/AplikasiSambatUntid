#!/bin/bash

set -e

REPO_URL="https://github.com/MaiAphrodite/AplikasiSambatUntid.git"
REPO_DIR="AplikasiSambatUntid"

echo "============================================="
echo "Aplikasi Sambat Untid - Server Bootstrap"
echo "============================================="

# ---------------------------------------------------------------------------
# 1. System Dependencies
# ---------------------------------------------------------------------------
echo "[1/6] Updating system and installing dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw openssl

# ---------------------------------------------------------------------------
# 2. UFW Firewall (Docker-compatible)
# ---------------------------------------------------------------------------
echo "[2/6] Configuring UFW Firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8080/tcp # Dozzle Logging Dashboard

# Docker requires ACCEPT on the FORWARD chain to route traffic into containers.
# UFW defaults FORWARD to DROP, which silently kills all Docker port mappings.
sudo sed -i 's/DEFAULT_FORWARD_POLICY="DROP"/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw

sudo ufw --force enable

# ---------------------------------------------------------------------------
# 3. Docker Engine
# ---------------------------------------------------------------------------
echo "[3/6] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker "$USER"
    rm /tmp/get-docker.sh
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

if ! docker compose version &> /dev/null; then
    echo "Docker Compose plugin not found. Installing..."
    sudo apt-get install -y docker-compose-plugin
fi

# ---------------------------------------------------------------------------
# 4. Clone Repository
# ---------------------------------------------------------------------------
echo "[4/6] Fetching Application Repository..."
if [ ! -d "$REPO_DIR" ]; then
    git clone "$REPO_URL"
fi
cd "$REPO_DIR"

# Pull latest changes in case the repo was already cloned
git pull origin main --ff-only 2>/dev/null || true

# ---------------------------------------------------------------------------
# 5. Environment Generation
# ---------------------------------------------------------------------------
echo "[5/6] Generating secure environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env

    JWT_SEC=$(openssl rand -hex 32)
    DB_PASS=$(openssl rand -hex 24)
    DOZ_PASS=$(openssl rand -hex 16)

    # Overwrite the entire .env with final production values
    cat > .env <<EOF
DB_PASSWORD=$DB_PASS
JWT_SECRET=$JWT_SEC
ESCALATION_THRESHOLD=10
DOZZLE_USERNAME=admin
DOZZLE_PASSWORD=$DOZ_PASS
EOF

    echo ".env generated with secure random passwords."
    echo ""
    echo "============================================="
    echo "SAVE THESE CREDENTIALS"
    echo "---------------------------------------------"
    echo "Database Password : $DB_PASS"
    echo "JWT Secret        : $JWT_SEC"
    echo "Dozzle Username   : admin"
    echo "Dozzle Password   : $DOZ_PASS"
    echo "============================================="
    echo ""
else
    echo ".env already exists, skipping generation."
fi

# ---------------------------------------------------------------------------
# 6. Deploy
# ---------------------------------------------------------------------------
echo "[6/6] Deploying Application Stack via Docker Compose..."
if groups | grep -wq "docker"; then
    docker compose up -d --build
else
    sudo docker compose up -d --build
fi

SERVER_IP=$(curl -4 -s --max-time 5 ifconfig.me 2>/dev/null || echo "<your-server-ip>")

echo ""
echo "============================================="
echo "Bootstrap Complete!"
echo "---------------------------------------------"
echo "Frontend    : http://$SERVER_IP"
echo "Dozzle Logs : http://$SERVER_IP:8080"
echo "============================================="
echo "Run 'cat $(pwd)/.env' to view your credentials."
echo "============================================="
