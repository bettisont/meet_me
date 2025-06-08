# MeetMe - Production Deployment README

## Quick Start Production Deployment

### Prerequisites
- Node.js 18+ installed
- Git repository set up
- Accounts on deployment platforms (Vercel, Railway)

### Step 1: Environment Setup

1. **Backend Configuration**
   ```bash
   cd backend
   cp .env.example .env.production
   # Edit .env.production with your production values
   ```

2. **Frontend Configuration**
   ```bash
   cd frontend
   cp .env.example .env.production
   # Edit .env.production with your production API URL
   ```

### Step 2: Deploy Using Script

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### Step 3: Manual Deployment (Alternative)

#### Deploy Frontend to Vercel
```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Deploy Backend to Railway
```bash
cd backend
npm install -g @railway/cli
railway login
railway init
railway up
```

## Production Checklist

### Security
- [x] Environment variables configured
- [x] HTTPS enabled
- [x] Rate limiting implemented
- [x] CORS configured for production domain
- [x] Security headers (Helmet.js)
- [x] Input validation
- [x] SQL injection protection (Prisma)
- [ ] SSL certificates configured
- [ ] Secrets rotated

### Performance
- [x] Code minification
- [x] Gzip compression
- [x] Bundle optimization
- [x] Lazy loading
- [ ] CDN configured
- [ ] Database indexes created
- [ ] Redis caching (optional)

### Monitoring
- [x] Health check endpoint
- [x] Logging configured
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring

### Database
- [x] PostgreSQL schema ready
- [ ] Production database created
- [ ] Migrations run
- [ ] Backup strategy configured

### Legal
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie Policy
- [ ] GDPR compliance

## Environment Variables Reference

### Backend (.env.production)
```bash
# Required
PORT=5001
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<generate-secure-secret>
CORS_ORIGIN=https://yourdomain.com

# Optional
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Frontend (.env.production)
```bash
# Required
VITE_API_URL=https://api.yourdomain.com

# Optional
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=...
```

## Post-Deployment Tasks

1. **Test Everything**
   - User registration/login
   - Venue search functionality
   - Profile management
   - Error handling

2. **Configure DNS**
   - Point domain to Vercel
   - Configure subdomain for API

3. **Set Up Monitoring**
   - Error tracking
   - Performance monitoring
   - Uptime checks

4. **Configure Backups**
   - Database backups
   - Backup retention policy

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN in backend .env
   - Ensure frontend URL is correct

2. **Database Connection Failed**
   - Verify DATABASE_URL
   - Check PostgreSQL is accessible
   - Run migrations: `npx prisma migrate deploy`

3. **Build Failures**
   - Check Node version (18+)
   - Clear node_modules and reinstall
   - Check for TypeScript errors

4. **Rate Limiting Too Strict**
   - Adjust RATE_LIMIT_MAX_REQUESTS
   - Consider different limits for auth endpoints

## Support

For deployment issues:
- Frontend (Vercel): https://vercel.com/docs
- Backend (Railway): https://docs.railway.app
- Database (Prisma): https://www.prisma.io/docs

## Costs

### Estimated Monthly Costs
- **Small (< 1000 users)**: ~$6/month
- **Medium (< 10,000 users)**: ~$65/month
- **Large (> 10,000 users)**: Custom pricing

### Free Tier Limits
- Vercel: 100GB bandwidth/month
- Railway: $5 credit/month
- PostgreSQL: 500MB included

---

Remember: Always test in a staging environment before deploying to production!