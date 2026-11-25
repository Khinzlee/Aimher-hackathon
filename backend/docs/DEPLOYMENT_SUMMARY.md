# Aimher Deployment Summary

## What You're Deploying

You need to deploy **4 services**:

1. **Frontend** - Next.js web application
2. **Backend API** - NestJS REST API
3. **Inference Service** - Python FastAPI ML service
4. **Database** - Neon PostgreSQL (already set up)

## Recommended Deployment Stack

| Service | Platform | Cost | Notes |
|---------|----------|------|-------|
| Frontend | Vercel | Free | Optimized for Next.js |
| Backend API | Railway or Render | Free tier | Node.js support |
| Inference Service | Railway or Render | Free tier | Python support |
| Database | Neon | Free tier | Serverless PostgreSQL |

## Deployment Order

1. ✅ **Neon Database** - Already set up
2. ⬜ **Inference Service** - Deploy first (backend depends on it)
3. ⬜ **Backend API** - Deploy second (needs inference URL)
4. ⬜ **Frontend** - Deploy last (needs backend URL)

## Environment Variables Summary

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
DATABASE_URL="postgresql://...neon.tech/..."
INFERENCE_URL=https://your-inference.up.railway.app
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_INFERENCE_URL=https://your-inference.up.railway.app
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

### Deploy Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Deploy Backend (Railway)
```bash
cd backend
railway up
```

### Deploy Inference (Railway)
```bash
cd backend/inference
railway up
```

## URLs After Deployment

- **Frontend:** `https://your-app.vercel.app`
- **Backend API:** `https://your-backend.up.railway.app`
- **Inference Service:** `https://your-inference.up.railway.app`
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
- `.env.local` (with production URLs)

### Backend
- Entire `backend/` directory (except node_modules)
- `package.json`
- `prisma/schema.prisma`
- `.env` (with production values)
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
- [ ] Environment variables configured
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

## Cost Breakdown (Free Tiers)

| Service | Free Tier Limits | Sufficient For |
|---------|------------------|----------------|
| Neon | 0.5 GB storage, 190 hrs/month | Yes |
| Vercel | Unlimited deployments, 100 GB bandwidth | Yes |
| Railway | $5 credit/month | Yes |
| Render | 750 hours/month, 512 MB RAM | Yes |

## Support Resources

- **Neon:** https://neon.tech/docs
- **Vercel:** https://vercel.com/docs
- **Railway:** https://docs.railway.app
- **Render:** https://render.com/docs
- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **FastAPI:** https://fastapi.tiangolo.com

## Next Steps

1. Follow the detailed guide in `DEPLOYMENT_GUIDE.md`
2. Test each service locally before deploying
3. Deploy in order: Inference → Backend → Frontend
4. Update environment variables with production URLs
5. Test all API endpoints
6. Monitor logs and fix any issues
