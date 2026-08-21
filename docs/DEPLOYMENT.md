# Deployment Guide

This guide covers deploying FinPilot AI to production.

---

## 🐳 Docker Deployment (Recommended)

The easiest way to deploy FinPilot AI is using Docker Compose.

### Prerequisites

- Docker 20.10+ and Docker Compose
- A server with at least 2GB RAM

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/FinPilot AI.git
   cd FinPilot AI
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and set:
   ```bash
   DATABASE_URL="postgresql://FinPilot AI:FinPilot AI_prod_password@postgres:5432/FinPilot AI"
   AUTH_SECRET="$(openssl rand -base64 32)"  # Generate a secure secret
   AUTH_URL="https://your-domain.com"        # Your public URL
   ANTHROPIC_API_KEY="sk-ant-..."           # Optional, for AI chat
   ```

4. Start the services:
   ```bash
   docker-compose up -d
   ```

5. Push the database schema:
   ```bash
   docker-compose exec app npm run db:push
   ```

6. (Optional) Seed with demo data:
   ```bash
   docker-compose exec app npm run db:seed
   ```

7. Access the app at `http://localhost:3000`

### Updating

```bash
git pull
docker-compose build
docker-compose up -d
```

---

## 🚀 Vercel Deployment

FinPilot AI can be deployed to Vercel with an external PostgreSQL database.

### Prerequisites

- Vercel account
- PostgreSQL database (e.g., Neon, Supabase, or Railway)

### Steps

1. Fork the repository on GitHub

2. Import the project to Vercel:
   - Go to https://vercel.com/new
   - Import your forked repository

3. Configure environment variables in Vercel:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/db
   AUTH_SECRET=<generate-with-openssl-rand-base64-32>
   AUTH_URL=https://your-app.vercel.app
   ANTHROPIC_API_KEY=sk-ant-...  # Optional
   ```

4. Deploy!

5. After first deploy, run migrations:
   ```bash
   npm run db:push
   ```

---

## 🖥️ VPS / Bare Metal Deployment

### Prerequisites

- Ubuntu 22.04+ (or similar)
- Node.js 20+
- PostgreSQL 16+
- Nginx (for reverse proxy)
- PM2 (for process management)

### Steps

1. Install dependencies:
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm postgresql nginx
   npm install -g pm2
   ```

2. Set up PostgreSQL:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE FinPilot AI;
   CREATE USER FinPilot AI WITH PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE FinPilot AI TO FinPilot AI;
   \q
   ```

3. Clone and build:
   ```bash
   git clone https://github.com/yourusername/FinPilot AI.git
   cd FinPilot AI
   npm install
   npm run build
   ```

4. Create `.env`:
   ```bash
   DATABASE_URL="postgresql://FinPilot AI:your-password@localhost:5432/FinPilot AI"
   AUTH_SECRET="$(openssl rand -base64 32)"
   AUTH_URL="https://your-domain.com"
   ANTHROPIC_API_KEY="sk-ant-..."
   NODE_ENV=production
   ```

5. Run migrations:
   ```bash
   npm run db:push
   ```

6. Start with PM2:
   ```bash
   pm2 start npm --name FinPilot AI -- start
   pm2 save
   pm2 startup
   ```

7. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

8. Enable the site and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/FinPilot AI /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   ```

9. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔒 Security Considerations

- **Always** change `AUTH_SECRET` in production
- Use strong passwords for PostgreSQL
- Enable HTTPS (SSL/TLS)
- Keep dependencies updated: `npm audit fix`
- Set up regular database backups
- Restrict PostgreSQL to localhost or internal network
- Use environment variables, never commit secrets
- Consider adding rate limiting for the API

---

## 📊 Monitoring

### Logs

**Docker:**
```bash
docker-compose logs -f app
```

**PM2:**
```bash
pm2 logs FinPilot AI
```

### Database Backups

**Docker:**
```bash
docker-compose exec postgres pg_dump -U FinPilot AI FinPilot AI > backup.sql
```

**Bare metal:**
```bash
pg_dump -U FinPilot AI FinPilot AI > backup.sql
```

### Restore from Backup

**Docker:**
```bash
cat backup.sql | docker-compose exec -T postgres psql -U FinPilot AI FinPilot AI
```

**Bare metal:**
```bash
psql -U FinPilot AI FinPilot AI < backup.sql
```

---

## 🐛 Troubleshooting

### Database Connection Issues

- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify network connectivity

### Build Failures

- Clear `.next` folder: `rm -rf .next`
- Clear `node_modules`: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20+)

### Auth Issues

- Regenerate `AUTH_SECRET`
- Clear browser cookies
- Verify `AUTH_URL` matches your domain

---

## 📞 Support

For deployment help:
- Open an issue: https://github.com/yourusername/FinPilot AI/issues
- Check docs: https://github.com/yourusername/FinPilot AI/tree/main/docs
