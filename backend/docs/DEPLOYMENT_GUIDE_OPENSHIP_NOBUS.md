# Aimher Deployment Guide (OpenShip + Nobus)

Complete deployment guide for the Aimher hackathon application using OpenShip and Nobus cloud infrastructure.

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
- OpenShip account (https://openship.io)
- Nobus account (https://nobus.io)

## Step 1: Set Up Neon Database

### 1.1 Create Neon Project

1. Go to [https://console.neon.tech](https://console.neon.tech)
2. Sign up or log in
3. Click "New Project"
4. Configure:
   - **Project Name:** `aimher-db`
   - **Region:** Choose closest to your users
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
CORS_ORIGIN=https://your-frontend.openship.io

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-xxx-xxx-xxx.us-east-2.aws.neon.tech/aimher?sslmode=require"

# Python inference service
INFERENCE_URL=https://your-inference.openship.io
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

## Step 4: Deploy to OpenShip

### 4.1 Install OpenShip CLI

```bash
npm install -g @openship/cli
```

Or download from [https://openship.io/download](https://openship.io/download)

### 4.2 Login to OpenShip

```bash
openship login
```

### 4.3 Deploy Frontend

```bash
cd frontend
openship deploy
```

OpenShip will:
- Detect Next.js framework
- Build the application
- Deploy to OpenShip Cloud or your connected Nobus server
- Provide a URL like `https://your-frontend.openship.io`

### 4.4 Deploy Backend API

```bash
cd backend
openship deploy
```

Configure environment variables in OpenShip dashboard:
- `PORT=3001`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://your-frontend.openship.io`
- `JWT_SECRET=your-secret-key`
- `JWT_EXPIRES_IN=7d`
- `DATABASE_URL="postgresql://...neon.tech/..."
- `INFERENCE_URL=https://your-inference.openship.io`

### 4.5 Deploy Inference Service

```bash
cd backend/inference
openship deploy
```

Configure environment variables:
- `PORT=8000`

### 4.6 Get Deployment URLs

After deployment, OpenShip will provide URLs:
- Frontend: `https://your-frontend.openship.io`
- Backend: `https://your-backend.openship.io`
- Inference: `https://your-inference.openship.io`

## Step 5: Connect OpenShip to Nobus

### 5.1 Set Up Nobus Server

1. Go to [https://nobus.io](https://nobus.io)
2. Sign up or log in
3. Create a new project
4. Provision a server (Flexible Compute Service)

### 5.2 Connect Nobus to OpenShip

1. In OpenShip dashboard, go to "Servers"
2. Click "Add Server"
3. Enter Nobus server details:
   - **Host:** Your Nobus server IP
   - **Port:** 22 (SSH)
   - **Username:** Your SSH username
   - **Authentication:** SSH key or password
4. Test connection
5. Save server

### 5.3 Deploy to Nobus Server

When deploying with OpenShip, choose your Nobus server as the deployment target:

```bash
openship deploy --server your-nobus-server
```

Or select the server in the OpenShip dashboard.

## Step 6: Configure Domains and SSL

### 6.1 Custom Domain (Optional)

If you have a custom domain:

1. In OpenShip dashboard, go to your project
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records as instructed
5. OpenShip will automatically provision SSL certificate

### 6.2 SSL Certificate

OpenShip automatically handles SSL certificates for:
- `*.openship.io` subdomains
- Custom domains (Let's Encrypt)

## Step 7: Database Migrations for Production

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

## Step 8: Update Environment Variables

After getting deployment URLs, update environment variables:

### Backend (.env or OpenShip dashboard)
```env
CORS_ORIGIN=https://your-frontend.openship.io
INFERENCE_URL=https://your-inference.openship.io
```

### Frontend (OpenShip dashboard)
```env
NEXT_PUBLIC_API_URL=https://your-backend.openship.io
NEXT_PUBLIC_INFERENCE_URL=https://your-inference.openship.io
```

Redeploy after updating environment variables.

## Alternative: Docker Compose Deployment

If you prefer Docker Compose on Nobus:

### 8.1 Create docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://your-backend.openship.io
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - CORS_ORIGIN=https://your-frontend.openship.io
      - JWT_SECRET=your-secret-key
      - JWT_EXPIRES_IN=7d
      - DATABASE_URL=postgresql://username:password@host/database?sslmode=require
      - INFERENCE_URL=http://inference:8000
    depends_on:
      - inference

  inference:
    build: ./backend/inference
    ports:
      - "8000:8000"
    environment:
      - PORT=8000

  # Database is external (Neon)
```

### 8.2 Deploy to Nobus

1. Upload code to Nobus server
2. Run Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Monitoring and Logs

### OpenShip Dashboard

- View deployment logs
- Monitor service health
- Check resource usage
- View error logs

### Nobus Dashboard

- Monitor server resources
- View container logs
- Check network traffic

### Neon Dashboard

- Monitor database usage
- View query performance
- Check connection pool

## Troubleshooting

### Backend Cannot Connect to Database

1. Verify `DATABASE_URL` is correct
2. Check Neon project is active
3. Ensure SSL mode is enabled (`?sslmode=require`)

### Inference Service Not Loading Models

1. Verify model files exist in `backend/docs/`
2. Check Python dependencies are installed
3. Review OpenShip logs for errors

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

### OpenShip Cloud (Free Tier)
- Limited deployments
- Community support

### Nobus (Pay-as-you-go)
- Flexible Compute Service pricing
- Container services
- Kubernetes engine (if needed)

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
4. Set up CI/CD pipeline with OpenShip Actions
5. Add analytics (optional)

## Support

- OpenShip Docs: https://openship.io/docs
- Nobus Docs: https://nobus.io/documentation
- Neon Docs: https://neon.tech/docs
- NestJS Docs: https://docs.nestjs.com
- Next.js Docs: https://nextjs.org/docs
- FastAPI Docs: https://fastapi.tiangolo.com
