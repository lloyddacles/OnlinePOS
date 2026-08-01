#!/usr/bin/env bash
#
# Rocks and Teas POS - one-shot server setup for Oracle Cloud Always Free (Ubuntu)
#
# Run on the VM from a fresh clone of the repo:
#   cd OnlinePOS && bash deploy/setup.sh
#
set -e

echo "==> Setting timezone to Asia/Manila (order timestamps use local time)"
sudo timedatectl set-timezone Asia/Manila || true

echo "==> Installing Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node --version

echo "==> Installing PM2 (process manager)"
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

echo "==> Installing app dependencies"
npm install --omit=dev

echo "==> Starting the POS with PM2"
pm2 start server.js --name rocks-teas-pos
pm2 save

echo "==> Enabling PM2 to start on boot"
sudo pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || pm2 startup systemd -u "$USER" --hp "$HOME"

echo ""
echo "=========================================================="
echo "  Deployment complete!"
echo ""
echo "  Open:  http://YOUR_VM_PUBLIC_IP:3000"
echo "  Login: admin / admin123   (CHANGE THE PASSWORD AFTER LOGIN)"
echo ""
echo "  Monitor logs:  pm2 logs rocks-teas-pos"
echo "  Restart app:   pm2 restart rocks-teas-pos"
echo "  Health check:  /api/health"
echo "=========================================================="
pm2 status
