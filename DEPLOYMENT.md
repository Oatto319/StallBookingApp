# Vercel Deployment Guide

## Prerequisites
- Node.js 18+ installed
- Git repository
- Vercel account

## Setup Steps

### 1. Local Development
```bash
npm install
npm run dev
```

### 2. Environment Variables
Create `.env.local` for development:
```
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_API_URL="http://localhost:3000"
JWT_SECRET="your-secret-key-for-local-dev"
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel
```

#### Option B: Using GitHub
1. Push to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/)
3. Click "Add New" → "Project"
4. Import your GitHub repository

### 4. Set Environment Variables in Vercel Dashboard
Go to **Project Settings** → **Environment Variables**:

```
DATABASE_URL = file:./prisma/dev.db
JWT_SECRET = (generate a secure random string)
NEXT_PUBLIC_API_URL = https://your-vercel-url.vercel.app
```

### 5. Trigger Deploy
```bash
git add .
git commit -m "Deploy to Vercel"
git push
```

## Troubleshooting

### Build Fails with Prisma Error
- Ensure `postinstall` script runs: `prisma generate`
- Check that `.env.production` exists
- Verify DATABASE_URL is set in Vercel Dashboard

### Database Connection Issues
- For now, using SQLite (file-based)
- Future: Migrate to PostgreSQL/MongoDB for production

### API Errors
Check Vercel logs:
```bash
vercel logs
```

## Notes
- SQLite database will be stored in `/prisma/dev.db`
- All auth users are stored in-memory (see `lib/users.ts`)
- Queue system uses in-memory storage (see `api/queue/`)
- Future improvements: Migrate to cloud database
