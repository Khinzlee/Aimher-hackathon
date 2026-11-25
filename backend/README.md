# Aimher Backend

NestJS API with JWT authentication and a Python (FastAPI) inference service that serves the XGBoost model bundle for six conditions (**Infertility, Dysmenorrhea, PMDD, T2D, CVD, Endometrial**) plus the rPPG v8 passive-sensing ONNX models.

## Architecture

```
Frontend → NestJS API (:3001) → Python inference service (:8000) → all_models_bundle.joblib + rPPG v8 ONNX models
                │
                └── Prisma + SQLite (users, prediction history)
```

## Setup

### 1. NestJS API

```bash
cd backend
npm install
cp .env.example .env        # then edit JWT_SECRET
npx prisma migrate dev      # creates dev.db
npm run start:dev
```

API is available at `http://localhost:3002/api` (port configurable via `PORT` in `.env`).

### 2. Python inference service

Requires Python 3.12 (xgboost wheels):

```bash
cd backend
python3.12 -m venv inference/.venv   # or: py -3.12 -m venv inference/.venv
inference/.venv/Scripts/pip install -r inference/requirements.txt   # Windows
# inference/.venv/bin/pip install -r inference/requirements.txt     # macOS/Linux
inference/.venv/Scripts/uvicorn app.main:app --app-dir inference --port 8000   # Windows
# inference/.venv/bin/uvicorn app.main:app --app-dir inference --port 8000     # macOS/Linux
```

The rPPG v8 ONNX models and metadata live under `backend/inference/models/rppg_v8/`. `onnxruntime` is included in `inference/requirements.txt`.

## API endpoints

| Method | Path                  | Auth | Description                              |
|--------|-----------------------|------|------------------------------------------|
| POST   | /api/auth/register    | No   | `{ email, password, name? }` → tokens    |
| POST   | /api/auth/login       | No   | `{ email, password }` → tokens           |
| GET    | /api/users/me         | JWT  | Current user                             |
| POST   | /api/symptoms         | JWT  | Log symptom intensity entry              |
| GET    | /api/symptoms/history | JWT  | Symptom log history (limit/offset)       |
| POST   | /api/predictions      | JWT  | Run model on disease features, store it  |
| POST   | /api/predictions/from-symptoms | JWT | Daily symptom entry → trained symptom model → 6 diseases |
| GET    | /api/predictions/history | JWT | List past predictions                  |
| POST   | /api/rppg-v8/session     | JWT  | Store one passive-sensing rPPG v8 session |
| POST   | /api/rppg-v8/predict     | JWT  | Run all v8 regression targets + mood check |
| POST   | /api/rppg-v8/predict/regression | JWT | Run one v8 regression target (`{ "target": "Sleep_Quality" }`) |
| POST   | /api/rppg-v8/predict/mood | JWT | Run the v8 mood-check classifier |
| GET    | /api/rppg-v8/sessions    | JWT  | List recent passive-sensing sessions (`?limit=`) |
| GET    | /api/rppg-v8/predictions | JWT  | List recent v8 prediction results |
| GET    | /api/rppg-v8/metadata    | JWT  | List v8 model features/targets/scalers metadata |
| PATCH  | /api/onboarding/step/1   | JWT  | Onboarding step 1 – personal info (`direct/step/1` alias) |
| PATCH  | /api/onboarding/step/2   | JWT  | Onboarding step 2 – physical measurements |
| PATCH  | /api/onboarding/step/3   | JWT  | Onboarding step 3 – skin changes |
| PATCH  | /api/onboarding/step/4   | JWT  | Onboarding step 4 – menstrual history (skipped for males) |
| PATCH  | /api/onboarding/step/5   | JWT  | Onboarding step 5 – wearable setup |
| POST   | /api/onboarding/step/6/rppg | JWT | Onboarding step 6 – mark rPPG baseline captured |
| POST   | /api/onboarding/complete | JWT  | Mark onboarding complete (`direct/complete` alias) |
| GET    | /api/onboarding/profile  | JWT  | Full onboarding profile |
| PATCH  | /api/onboarding/profile/update | JWT | Update profile fields without advancing steps |

> Onboarding step 7 (LGA / PHC / emergency-hospital selection) is intentionally not implemented.

See `docs/API_SPECIFICATION.md` for the full API contract.

### Prediction request body

```json
{
  "pcos_label": 1,
  "features": {
    "Infertility":  { "PredFlag": 1, "PredScore": 0.64, "RiskProb": 0.99 },
    "Dysmenorrhea": { "PredFlag": 1, "PredScore": 0.17, "RiskProb": 0.63 },
    "PMDD":         { "PredFlag": 0, "PredScore": 0.13, "RiskProb": 0.004 },
    "T2D":          { "PredFlag": 0, "PredScore": 0.35, "RiskProb": 0.007 },
    "CVD":          { "PredFlag": 0, "PredScore": 0.25, "RiskProb": 0.003 },
    "Endometrial":  { "PredFlag": 0, "PredScore": 0.28, "RiskProb": 0.0 }
  }
}
```

### Prediction response

```json
{
  "diseases": {
    "Infertility": {
      "probability": 0.998,
      "predicted": 1,
      "severity": "High",
      "riskScore": 0.613,
      "riskSeverity": "Severe"
    }
  }
}
```

Two model bundles are served:

- `docs/all_models_bundle.joblib` — stage-2 models (`POST /predict`): `pcos_label` + per-disease `PredFlag/PredScore/RiskProb`.
- `docs/all_models_symptom_bundle.joblib` — symptom-log models (`POST /predict/from-symptoms`): aggregates daily symptom entries (mean/std/max, per-cycle-phase means, luteal/menstrual−follicular deltas) into the 63 features from `train_model_symptom_log.ipynb`. Works with a **single entry** — missing phases/stats are `NaN`, which XGBoost handles natively; the Nest endpoint automatically folds in the user's logged symptom history when available.

The inference service also exposes rPPG v8 ONNX endpoints (`/rppg-v8/*`, models in `inference/models/rppg_v8/`).

Severity bands match the training notebook:
- Classification: Low < 0.33 ≤ Moderate < 0.66 ≤ High
- Regression risk score: Minimal < 0.2 ≤ Mild < 0.4 ≤ Moderate < 0.6 ≤ Severe

### rPPG v8 passive sensing

`POST /api/rppg-v8/session` accepts the camera/passive-sensing payload:

```json
{
  "rmssd": 61.7,
  "hf": 340.1,
  "lf_hf_ratio": 0.94,
  "heart_rate": 80.5,
  "hrv": 35.4,
  "estimated_spo2": 97.3,
  "skin_temperature": 34.1,
  "mean_eda": 1.88,
  "mean_temp": 34.3,
  "session_type": "checkin",
  "session_quality": "good"
}
```

Optional fields include `hr_trend`, `asi`, `rmssd_trend`, `ac`, `dc`, `ac_dc_ratio`, `pulse_amplitude`, `signal_quality`, and `respiratory_rate`.

`POST /api/rppg-v8/predict` uses the latest stored session to return:

- `regression`: 10 target scores (`Sleep_Quality`, `Focus_Memory`, `Mental_Wellness`, `Mood_Score`, `Metabolic_Syndrome_Risk`, `T2D_Metabolic_Risk_Index`, `Cardiovascular_Risk_Score`, `Heart_Failure_Alert_Score`, `Chronic_Stress_Severity`, `Infertility_Reproductive_Risk`)
- `mood_check`: `Low` / `Neutral` / `Positive` classification with confidence/probabilities
- `feature_vector` and `nSessions`

The rPPG v8 endpoints return the AIMHER-style envelope `{ success, status, message, data, meta }`.

### Inference service docs

Once running: `http://localhost:8000/docs` (FastAPI Swagger UI).
