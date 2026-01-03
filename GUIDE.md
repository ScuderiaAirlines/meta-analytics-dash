# Meta Ads Analytics Suite - VPS Deployment Guide

Complete step-by-step guide for deploying the Meta Ads Analytics Suite on a VPS.

---

## Prerequisites

### Required Accounts & Keys
- Meta Business Account with Ads API access
- Meta Access Token with permissions: `ads_read`, `ads_management`
- OpenRouter API account and API key
- VPS with Ubuntu 22.04 LTS (minimum 2GB RAM, 2 vCPU)
- Domain name (optional, for SSL)

### Local Requirements
- SSH client
- Git
- Basic command line knowledge

---

## Step 1: VPS Initial Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### 1.2 Update System Packages

```bash
apt update && apt upgrade -y
```

### 1.3 Create a Non-Root User (Recommended)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

### 1.4 Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 1111/tcp
sudo ufw enable
sudo ufw status
```

---

## Step 2: Install Docker & Docker Compose

### 2.1 Install Docker

```bash
# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker ${USER}

# Verify installation
docker --version
```

### 2.2 Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 2.3 Log Out and Back In

```bash
exit
ssh deploy@your-vps-ip
```

---

## Step 3: Clone and Configure the Application

### 3.1 Clone Repository

```bash
cd ~
git clone <your-repository-url> meta-analytics-dash
cd meta-analytics-dash
```

### 3.2 Create Environment File

```bash
cp .env.example .env
nano .env
```

### 3.3 Configure Environment Variables

Edit `.env` with your actual values:

```bash
# Database
DATABASE_URL="postgresql://postgres:your_secure_password@postgres:5432/metaads"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=metaads

# Meta API
META_ACCESS_TOKEN=your_meta_access_token_here
META_AD_ACCOUNT_ID=act_1234567890

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Backend
PORT=3000
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=http://backend:3000

# Email (for OTP authentication)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Session Secret
SESSION_SECRET=your_random_secret_key_min_32_chars
```

**Important Security Notes:**
- Generate strong passwords for POSTGRES_PASSWORD
- Keep your Meta token secure and never commit it
- Generate a random SESSION_SECRET: `openssl rand -hex 32`
- For Gmail SMTP, use App Passwords, not your regular password

### 3.4 Get Meta Access Token

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to your App ’ Tools ’ Access Token Tool
3. Generate a User Access Token with `ads_read` and `ads_management` permissions
4. For production, use a System User Token that doesn't expire

**Verify your token:**
```bash
curl -X GET "https://graph.facebook.com/v18.0/me/adaccounts?access_token=YOUR_TOKEN"
```

### 3.5 Get OpenRouter API Key

1. Sign up at [OpenRouter.ai](https://openrouter.ai/)
2. Go to Keys section
3. Create a new API key
4. Add credits to your account

---

## Step 4: Build and Start the Application

### 4.1 Build Docker Images

```bash
docker-compose build
```

This may take 5-10 minutes on first build.

### 4.2 Start Services

```bash
docker-compose up -d
```

### 4.3 Check Service Status

```bash
docker-compose ps
```

All services should show "Up" status.

### 4.4 View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## Step 5: Database Setup

### 5.1 Run Prisma Migrations

```bash
docker-compose exec backend npx prisma migrate deploy
```

### 5.2 Verify Database

```bash
docker-compose exec backend npx prisma studio
```

This opens Prisma Studio - close it with Ctrl+C after verification.

### 5.3 (Optional) Seed Initial Data

```bash
docker-compose exec backend npm run seed
```

---

## Step 6: Initial Data Sync

### 6.1 Trigger Manual Sync

```bash
curl -X POST http://localhost:1111/api/sync
```

Expected response:
```json
{
  "success": true,
  "message": "Sync completed",
  "data": {
    "campaigns": 5,
    "adsets": 12,
    "ads": 45
  }
}
```

### 6.2 Verify Data

```bash
curl http://localhost:1111/api/campaigns
```

---

## Step 7: Access the Application

### 7.1 Via IP Address

Open your browser:
```
http://your-vps-ip:1111
```

### 7.2 Test All Features

- Dashboard loads with metrics
- Navigate to each page (Creatives, Anomalies, Insights, Query)
- Test creative upload
- Try natural language query

---

## Step 8: Setup Reverse Proxy with SSL (Recommended)

### 8.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 8.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/meta-analytics
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:1111;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8.3 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/meta-analytics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8.4 Install SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts to complete SSL setup.

### 8.5 Update Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 1111/tcp
```

### 8.6 Access via HTTPS

```
https://your-domain.com
```

---

## Step 9: Automated Backups

### 9.1 Create Backup Script

```bash
mkdir -p ~/backups
nano ~/backup.sh
```

Add the following:

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="meta-analytics-dash-postgres-1"

# Create backup
docker exec $CONTAINER_NAME pg_dump -U postgres metaads > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Make executable:
```bash
chmod +x ~/backup.sh
```

### 9.2 Schedule Daily Backups

```bash
crontab -e
```

Add this line for daily backups at 2 AM:
```
0 2 * * * /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1
```

### 9.3 Test Backup

```bash
~/backup.sh
ls -lh ~/backups/
```

---

## Step 10: Monitoring and Maintenance

### 10.1 Monitor Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service errors
docker-compose logs --tail=50 backend | grep ERROR
```

### 10.2 Monitor Resource Usage

```bash
# Docker stats
docker stats

# System resources
htop
```

Install htop if needed:
```bash
sudo apt install -y htop
```

### 10.3 Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### 10.4 Update Application

```bash
cd ~/meta-analytics-dash
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

### 10.5 Check Disk Space

```bash
df -h
docker system df
```

### 10.6 Clean Up Old Docker Data

```bash
docker system prune -a
```

---

## Step 11: Troubleshooting

### Application Won't Start

```bash
# Check logs
docker-compose logs

# Verify environment variables
docker-compose config

# Restart fresh
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d metaads

# Verify DATABASE_URL in .env
grep DATABASE_URL .env
```

### Meta API Errors

```bash
# Check token validity
curl -X GET "https://graph.facebook.com/v18.0/debug_token?input_token=YOUR_TOKEN&access_token=YOUR_TOKEN"

# Check permissions
docker-compose logs backend | grep "Meta API"
```

### Frontend Not Loading

```bash
# Check if frontend is running
curl http://localhost:1111

# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Port 1111 Already in Use

```bash
# Find what's using the port
sudo lsof -i :1111

# Or change the port in docker-compose.yml
nano docker-compose.yml
# Change: "1111:3000" to "8080:3000"
docker-compose up -d
```

### Out of Memory

```bash
# Check memory usage
free -h

# Add swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 12: Security Best Practices

### 12.1 Regular Updates

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Docker updates
sudo apt install --only-upgrade docker-ce docker-ce-cli containerd.io
```

### 12.2 Firewall Configuration

```bash
# Review rules
sudo ufw status verbose

# Only allow necessary ports
sudo ufw deny 3000/tcp  # Block direct backend access
```

### 12.3 Secure SSH

Edit SSH config:
```bash
sudo nano /etc/ssh/sshd_config
```

Recommended changes:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 12.4 Rotate Secrets

Regularly rotate:
- Database passwords
- Meta access tokens
- OpenRouter API keys
- SESSION_SECRET

### 12.5 Monitor for Intrusions

```bash
# Check auth logs
sudo tail -f /var/log/auth.log

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## Step 13: Performance Optimization

### 13.1 Enable Docker Logging Limits

Edit `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 13.2 Database Optimization

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d metaads

# Add indexes (if not in migrations)
CREATE INDEX idx_metrics_date ON "DailyMetric"(date);
CREATE INDEX idx_metrics_entity ON "DailyMetric"("entityId", "entityType");
```

### 13.3 Enable Caching

Consider adding Redis for caching:
```yaml
redis:
  image: redis:7-alpine
  volumes:
    - redis_data:/data
```

---

## Step 14: Scaling Considerations

### For High Traffic:

1. **Horizontal Scaling**: Deploy multiple frontend instances behind a load balancer
2. **Database**: Consider managed PostgreSQL (AWS RDS, DigitalOcean Managed Databases)
3. **Caching**: Add Redis for session and API response caching
4. **CDN**: Use Cloudflare or similar for static assets
5. **Monitoring**: Add Grafana + Prometheus for metrics

---

## Quick Reference Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart backend

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U postgres -d metaads

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Manual sync
curl -X POST http://localhost:1111/api/sync

# Backup database
docker exec meta-analytics-dash-postgres-1 pg_dump -U postgres metaads > backup.sql

# Restore database
docker exec -i meta-analytics-dash-postgres-1 psql -U postgres metaads < backup.sql

# Update application
git pull && docker-compose up -d --build
```

---

## Support Resources

- **Meta Marketing API**: https://developers.facebook.com/docs/marketing-apis
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Docker Docs**: https://docs.docker.com
- **OpenRouter**: https://openrouter.ai/docs

---

## Success Checklist

- [ ] VPS accessible via SSH
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] .env configured with all required keys
- [ ] Docker services running (postgres, backend, frontend)
- [ ] Database migrations completed
- [ ] Initial data sync successful
- [ ] Application accessible at http://vps-ip:1111
- [ ] All pages load correctly
- [ ] SSL configured (if using domain)
- [ ] Automated backups scheduled
- [ ] Firewall configured
- [ ] Monitoring set up

---

**Deployment Complete!** <‰

Your Meta Ads Analytics Suite is now running in production.
