#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "============================================="
echo "🚀 Aplikasi Sambat Untid Server Bootstrap"
echo "============================================="

# 1. Update and install basic dependencies
echo "[1/5] Updating system and installing dependencies..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw openssl

# 2. Configure UFW Firewall
echo "[2/5] Configuring UFW Firewall..."
# Reset UFW to default deny incoming, allow outgoing
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow standard ports
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw allow 8080/tcp # Dozzle Logging

# Enable firewall without prompting
sudo ufw --force enable

# 3. Install Docker if it is not installed
echo "[3/5] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

# Ensure docker-compose plugin is available
if ! docker compose version &> /dev/null; then
    echo "Docker Compose plugin not found. Installing..."
    sudo apt-get install -y docker-compose-plugin
fi

# 3.5. Clone Repository
echo "[4/6] Fetching Application Repository..."
if [ ! -d "AplikasiSambatUntid" ]; then
    git clone https://github.com/MaiAphrodite/AplikasiSambatUntid.git
fi
cd AplikasiSambatUntid

# 4. Environment Generation
echo "[5/6] Generating secure environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    
    # Generate cryptographically secure 64-character hex strings
    JWT_SEC=$(openssl rand -hex 32)
    DB_PASS=$(openssl rand -hex 32)
    DOZ_PASS=$(openssl rand -hex 16)
    
    # Replace dummy values in the new .env file
    sed -i "s/your_super_secret_jwt_key_here/$JWT_SEC/g" .env
    sed -i "s/your_secure_db_password_here/$DB_PASS/g" .env
    sed -i "s/dozzle_password_here/$DOZ_PASS/g" .env
    
    echo ".env generated with secure random passwords."
    echo "============================================="
    echo "🔐 DOZZLE LOGGING CREDENTIALS"
    echo "Username: admin_dozzle"
    echo "Password: $DOZ_PASS"
    echo "Save this password! It is stored in your .env file."
    echo "============================================="
else
    echo ".env already exists, skipping generation."
fi

# 5. Deploy the Stack
echo "[6/6] Deploying Application Stack via Docker Compose..."
# If not run as root but docker requires root, we prefix with sudo
if groups | grep -wq "docker"; then
    docker compose up -d --build
else
    sudo docker compose up -d --build
fi

echo "============================================="
echo "✅ Bootstrap Complete!"
echo "Your server is locked down and the application is starting."
echo "Please wait a few moments for the database to initialize."
echo "Access the frontend at: http://$(curl -4 -s ifconfig.me)"
echo "============================================="
