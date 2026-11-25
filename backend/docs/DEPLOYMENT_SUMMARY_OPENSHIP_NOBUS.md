# Aimher Deployment Summary (OpenShip + Nobus)

## What You're Deploying

You need to deploy **4 services**:

1. **Frontend** - Next.js web application
2. **Backend API** - NestJS REST API
3. **Inference Service** - Python FastAPI ML service
4. **Database** - Neon PostgreSQL (already set up)

## Deployment Stack

| Service | Platform | Cost | Notes |
|---------|----------|------|-------|
| Frontend | OpenShip | Free tier | Deploy Next.js |
| Backend API | OpenShip | Free tier | Deploy NestJS |
| Inference Service | OpenShip | Free tier | Deploy FastAPI |
| Database | Neon | Free tier | Serverless PostgreSQL |
| Infrastructure | Nobus | Pay-as-you-go | Cloud servers/containers |

## Deployment Order

1. ✅ **Neon Database** - Already set up
2. ⬜ **Inference Service** - Deploy first (backend depends on it)
3. ⬜ **Backend API** - Deploy second (needs inference URL)
4. ⬜ **Frontend** - Deploy last (needs backend URL)

## Environment Variables Summary

### Backend (.env or OpenShip dashboard)
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.openship.io
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
DATABASE_URL="postgresql://...neon.tech/..."
INFERENCE_URL=https://your-inference.openship.io
```

### Frontend (OpenShip dashboard)
```env
NEXT_PUBLIC_API_URL=https://your-backend.openship.io
NEXT_PUBLIC_INFERENCE_URL=https://your-inference.openship.io
```

### Inference Service (OpenShip dashboard)
```env
PORT=8000
```

## Quick Commands

### Database Migration
```bash
cd backend
DATABASE_URL="your-neon-url" npm run prisma:migrate
```

### Build Backend
```bash
cd backend
npm run build
```

### Build Frontend
```bash
cd frontend
npm run build
```

### Install OpenShip CLI
```bash
npm install -g @openship/cli
```

### Login to OpenShip
```bash
openship login
```

### Deploy Frontend
```bash
cd frontend
openship deploy
```

### Deploy Backend
```bash
cd backend
openship deploy
```

### Deploy Inference Service
```bash
cd backend/inference
openship deploy
```

### Deploy to Nobus Server
```bash
openship deploy --server your-nobus-server
```

## URLs After Deployment

- **Frontend:** `https://your-frontend.openship.io`
- **Backend API:** `https://your-backend.openship.io`
- **Inference Service:** `https://your-inference.openship.io`
- **Database:** Neon console (https://console.neon.tech)

## API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /users/me` - Get current user

### Symptoms
- `POST /symptoms` - Log symptom data
- `GET /symptoms/history` - Get symptom history

### Predictions
- `POST /predictions/from-symptoms` - Predict disease risk
- `POST /predictions` - Predict from disease features
- `GET /predictions/history` - Get prediction history

### rPPG v8
- `POST /rppg-v8/session` - Submit physiological data
- `POST /rppg-v8/predict` - Run all predictions
- `POST /rppg-v8/predict/regression` - Run specific regression
- `POST /rppg-v8/predict/mood` - Run mood check
- `GET /rppg-v8/sessions` - List sessions
- `GET /rppg-v8/predictions` - List predictions
- `GET /rppg-v8/metadata` - Get metadata

## Files to Deploy

### Frontend
- Entire `frontend/` directory
- `package.json`
- `next.config.js` (if exists)
- Environment variables in OpenShip dashboard

### Backend
- Entire `backend/` directory (except node_modules)
- `package.json`
- `prisma/schema.prisma`
- Environment variables in OpenShip dashboard
- `dist/` folder (after build)

### Inference Service
- Entire `backend/inference/` directory
- `requirements.txt`
- `app/` folder
- Model files in `backend/docs/`:
  - `all_models_bundle.joblib`
  - `all_models_symptom_bundle.joblib`

## Pre-Deployment Checklist

- [ ] Neon database created and connection string saved
- [ ] Prisma schema updated for PostgreSQL
- [ ] Database migrations run successfully
- [ ] Backend builds without errors
- [ ] Inference service dependencies installed
- [ ] Model files present in docs folder
- [ ] OpenShip account created
- [ ] Nobus server provisioned (if using own infrastructure)
- [ ] Environment variables configured in OpenShip
- [ ] CORS origin set to frontend URL
- [ ] JWT secret is strong and unique
- [ ] All secrets in environment variables (not in code)

## Post-Deployment Verification

- [ ] Frontend loads without errors
- [ ] Can register and login
- [ ] Can log symptoms
- [ ] Can get disease predictions
- [ ] Can submit rPPG v8 sessions
- [ ] Can get rPPG v8 predictions
- [ ] Database tables created correctly
- [ ] Logs show no errors

## OpenShip Features to Use

- **Push to Deploy:** Connect GitHub repository for automatic deployments
- **Preview Environments:** Test changes before production
- **Compose & Multi-Service:** Deploy all services as one project
- **Domains & SSL:** Automatic SSL certificates
- **Logs & Metrics:** Monitor service health
- **Actions & CI:** Automated deployment pipelines

## Nobus Features to Use

- **Flexible Compute Service:** Provision servers for OpenShip
- **Container Services:** Run Docker containers
- **Kubernetes Engine:** For advanced orchestration (optional)
- **Flexible IP:** Static IP addresses for services
- **Security Groups:** Firewall rules for services

## Cost Breakdown

| Service | Free Tier Limits | Sufficient For |
|---------|------------------|----------------|
| Neon | 0.5 GB storage, 190 hrs/month | Yes |
| OpenShip Cloud | Limited deployments | Yes (for demo) |
| Nobus | Pay-as-you-go | Depends on usage |

## Support Resources

- **OpenShip:** https://openship.io/docs
- **Nobus:** https://nobus.io/documentation
- **Neon:** https://neon.tech/docs
- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **FastAPI:** https://fastapi.tiangolo.com

## Next Steps

1. Follow the detailed guide in `DEPLOYMENT_GUIDE_OPENSHIP_NOBUS.md`
2. Test each service locally before deploying
3. Deploy in order: Inference → Backend → Frontend
4. Update environment variables with production URLs
5. Test all API endpoints
6. Monitor logs and fix any issues
7. Set up custom domain (optional)
8. Configure CI/CD with OpenShip Actions (optional)
