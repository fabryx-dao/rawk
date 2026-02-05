#!/bin/bash
set -e

echo "🚀 Deploying Rawk API..."

# Change to rawk directory
cd /var/www/rawk

# Pull latest code
echo "📥 Pulling latest code..."
sudo -u dao git pull origin main

# Build API image
echo "🔨 Building API image..."
sudo docker-compose build api

# Stop old API container
echo "🛑 Stopping old API container..."
sudo docker stop rawk_api || true
sudo docker rm rawk_api || true

# Start new API container (built image is already updated)
echo "▶️  Starting new API container..."
sudo docker-compose up -d --no-deps api

# Wait for API to be ready
echo "⏳ Waiting for API to be ready..."
sleep 3

# Health check
echo "🏥 Health check..."
if curl -sf https://api.rawk.sh/health > /dev/null; then
  echo "✅ API deployed successfully!"
  curl -s https://api.rawk.sh/health | jq -r '.timestamp // .timestamp'
else
  echo "❌ Health check failed!"
  sudo docker logs --tail 20 rawk_api
  exit 1
fi
