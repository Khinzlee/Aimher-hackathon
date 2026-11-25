# Aimher Deployment Guide

Complete deployment guide for the Aimher hackathon application using Neon PostgreSQL.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│  Inference      │
│   (Next.js)     │     │   (NestJS)      │     │  (FastAPI)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │   Neon          │
                        │  PostgreSQL     │
                        └─────────────────┘
```

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- Neon account (https://neon.tech)
- Vercel account (for frontend)
- Railway or Render account (for backend/inference)

## Step 1: Set Up Neon Database

### 1.1 Create Neon Project

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up or log in
3. Click "New Project"
4. Configure:
   - **Project Name:** `aimher-db`
   - **Region:** Choose closest to your users (e.g., `us-east-2`)
   - **PostgreSQL Version:** 15 or latest
5. Click "Create Project"

### 1.2 Get Connection String

1. In your Neon project dashboard, click "Connection Details"
2. Copy the connection string (format: `postgresql://username:password@host/database?sslmode=require`)
3. Save this for later

## Step 2: Configure Backend

### 2.1 Update Environment Variables

Create `backend/.env` file:

```env
# Server
PORT=3001
NODE_ENV=production

# CORS (update with your frontend URL)
CORS_ORIGIN=https://your-frontend.vercel.app

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-xxx.us-east-2.aws.neon.tech/aimher?sslmode=require"

# Python inference service
INFERENCE_URL=https://your-inference-service.onrender.com
```

### 2.2 Install Dependencies

```bash
cd backend
npm install
```

### 2.3 Generate Prisma Client

```bash
npm run prisma:generate
```

### 2.4 Run Database Migrations

```bash
npm run prisma:migrate
```

This will create all tables in your Neon database.

### 2.5 Build Backend

```bash
npm run build
```

## Step 3: Configure Inference Service

### 3.1 Install Python Dependencies

```bash
cd backend/inference
pip install -r requirements.txt
```

### 3.2 Verify Model Files

Ensure these files exist in `backend/docs/`:
- `all_models_bundle.joblib`
- `all_models_symptom_bundle.joblib`

### 3.3 Test Inference Service Locally

```bash
uvicorn app.main:app --reload --port 8000
```

Test with:
```bash
curl http://localhost:8000/health
```

## Step 4: Deploy Frontend to Vercel

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Deploy Frontend

```bash
cd frontend
vercel
```

### 4.3 Configure Environment Variables

In Vercel dashboard:
1. Go to your project settings
2. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://your-backend.onrender.com`)
   - `NEXT_PUBLIC_INFERENCE_URL`: Your inference service URL

### 4.4 Redeploy

After adding environment variables, redeploy:
```bash
vercel --prod
```

## Step 5: Deploy Backend to Railway

### 5.1 Install Railway CLI

```bash
npm install -g @railway/cli
```

### 5.2 Login to Railway

```bash
railway login
```

### 5.3 Initialize Project

```bash
cd backend
railway init
```

### 5.4 Add Environment Variables

```bash
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://your-frontend.vercel.app
railway variables set JWT_SECRET=your-super-secret-jwt-key
railway variables set JWT_EXPIRES_IN=7d
railway variables set DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
railway variables set INFERENCE_URL=https://your-inference-service.onrender.com
```

### 5.5 Deploy Backend

```bash
railway up
```

### 5.6 Get Backend URL

Railway will provide a URL like: `https://your-backend.up.railway.app`

## Step 6: Deploy Inference Service to Railway

### 6.1 Create New Railway Project

```bash
cd backend/inference
railway init
```

### 6.2 Add Environment Variables

```bash
railway variables set PORT=8000
```

### 6.3 Deploy Inference Service

```bash
railway up
```

### 6.4 Get Inference URL

Railway will provide a URL like: `https://your-inference.up.railway.app`

## Step 7: Update Backend with Inference URL

Go back to your backend Railway project and update the `INFERENCE_URL`:

```bash
railway variables set INFERENCE_URL=https://your-inference.up.railway.app
railway up
```

## Step 8: Update Frontend with Backend URL

Go to Vercel dashboard and update `NEXT_PUBLIC_API_URL`:

```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```

Redeploy frontend:
```bash
cd frontend
vercel --prod
```

## Alternative: Deploy to Render

If you prefer Render over Railway:

### Backend Deployment

1. Go to [https://render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `aimher-backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
   - **Environment Variables:** Add all required variables

### Inference Service Deployment

1. Click "New +" → "Web Service"
2. Configure:
   - **Name:** `aimher-inference`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Database Migrations for Production

### Run Migrations on Neon

When deploying to production, run migrations:

```bash
cd backend
DATABASE_URL="your-neon-connection-string" npm run prisma:migrate
```

Or use `prisma db push` for quick setup:

```bash
DATABASE_URL="your-neon-connection-string" npx prisma db push
```

## Testing Deployment

### Test Backend Health

```bash
curl https://your-backend.up.railway.app/health
```

### Test Inference Service Health

```bash
curl https://your-inference.up.railway.app/health
```

### Test Frontend

Visit your Vercel URL and test the application.

## Monitoring and Logs

### Railway Logs

```bash
railway logs
```

### Vercel Logs

Check Vercel dashboard → Deployments → View Function Logs

### Neon Dashboard

Monitor database usage at [https://console.neon.tech](https://console.neon.tech)

## Troubleshooting

### Backend Cannot Connect to Database

1. Verify `DATABASE_URL` is correct
2. Check Neon project is active
3. Ensure SSL mode is enabled (`?sslmode=require`)

### Inference Service Not Loading Models

1. Verify model files exist in `backend/docs/`
2. Check Python dependencies are installed
3. Review Railway/Render logs for errors

### CORS Errors

1. Update `CORS_ORIGIN` in backend environment variables
2. Ensure it matches your frontend URL exactly
3. Redeploy backend after updating

### Frontend Cannot Reach Backend

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is running and accessible
3. Ensure environment variables are set before deployment

## Cost Estimates

### Neon (Free Tier)
- 0.5 GB storage
- 190 compute hours/month
- Sufficient for hackathon demo

### Vercel (Free Tier)
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless functions

### Railway (Free Tier)
- $5 credit/month
- Enough for small demo

### Render (Free Tier)
- 750 hours/month
- 512 MB RAM
- Suitable for hackathon

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use HTTPS for all services
- [ ] Set proper CORS origins
- [ ] Enable database SSL
- [ ] Don't commit .env files to Git
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting (if needed)
- [ ] Set up monitoring and alerts

## Next Steps

1. Test all endpoints with the API documentation
2. Set up error tracking (Sentry, etc.)
3. Configure custom domain (optional)
4. Set up CI/CD pipeline (optional)
5. Add analytics (optional)

## Support

- Neon Docs: https://neon.tech/docs
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- NestJS Docs: https://docs.nestjs.com
- Next.js Docs: https://nextjs.org/docs
- FastAPI Docs: https://fastapi.tiangolo.com
