#!/bin/bash
# SSL Setup Script for FinanceTech

# Exit on error
set -e

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root" 
    exit 1
fi

# Variables
DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"
WEBROOT="/var/www/letsencrypt"

# Create webroot directory for Let's Encrypt challenges
mkdir -p $WEBROOT

# Install Certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot certonly --webroot \
  --webroot-path=$WEBROOT \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN \
  -d www.$DOMAIN

# Set up auto-renewal
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null

# Generate strong DH parameters (2048 bits)
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

# Create Nginx SSL configuration
cat > /etc/nginx/conf.d/ssl-params.conf <<EOF
# SSL parameters
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_dhparam /etc/ssl/certs/dhparam.pem;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
EOF

# Test Nginx configuration
nginx -t

# Reload Nginx to apply changes
systemctl reload nginx

echo "✅ SSL setup completed successfully!"
echo "🔒 Your site is now secured with HTTPS"
echo "🔄 Certificate will auto-renew before expiration"