# Aimher API Quick Reference

## Authentication

```bash
# Register
POST /auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
→ Returns: { accessToken, tokenType, expiresIn }

# Login
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
→ Returns: { accessToken, tokenType, expiresIn }
```

## User

```bash
# Get current user
GET /users/me
Headers: Authorization: Bearer <token>
→ Returns: { id, email, name, createdAt }
```

## Symptoms

```bash
# Log symptom
POST /symptoms
Headers: Authorization: Bearer <token>
{
  "day_of_cycle": 14,
  "cycle_phase": "Follicular",
  "breast_soreness_vas": 2.5,
  "painful_touch_vas": 1.8,
  "pelvic_pressure_vas": 3.2,
  "bloating_delta_cm": 1.5,
  "fatigue_mfi5_vas": 4.0,
  "acne_severity_likert": 2,
  "hirsutism_mfg_score": 12
}
→ Returns: Symptom log with symptom_burden_score

# Get symptom history
GET /symptoms/history?limit=50&offset=0
Headers: Authorization: Bearer <token>
→ Returns: { data: [...], total, limit, offset }
```

## Disease Predictions

```bash
# Predict from symptoms
POST /predictions/from-symptoms
Headers: Authorization: Bearer <token>
{
  "day_of_cycle": 14,
  "cycle_phase": "Follicular",
  "breast_soreness_vas": 2.5,
  "painful_touch_vas": 1.8,
  "pelvic_pressure_vas": 3.2,
  "bloating_delta_cm": 1.5,
  "fatigue_mfi5_vas": 4.0,
  "acne_severity_likert": 2,
  "hirsutism_mfg_score": 12
}
→ Returns: { diseases: {...}, symptomBurdenScore }

# Get prediction history
GET /predictions/history
Headers: Authorization: Bearer <token>
→ Returns: Array of prediction records
```

## rPPG v8 Passive Sensing

```bash
# Submit session
POST /rppg-v8/session
Headers: Authorization: Bearer <token>
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
  "signal_quality": 82,
  "respiratory_rate": 16,
  "session_type": "checkin",
  "session_quality": "good"
}
→ Returns: { success, status, message, data: { session, sessionCount }, meta }

# Run all predictions
POST /rppg-v8/predict
Headers: Authorization: Bearer <token>
→ Returns: { success, status, message, data: { regression, mood_check, feature_vector, nSessions }, meta }

# Run one regression target
POST /rppg-v8/predict/regression
Headers: Authorization: Bearer <token>
{
  "target": "Sleep_Quality"
}
→ Returns: { success, status, message, data: { target, predictions, ensemble }, meta }

# Run mood check
POST /rppg-v8/predict/mood
Headers: Authorization: Bearer <token>
→ Returns: { success, status, message, data: { best_prediction, best_algorithm, all_predictions, classes }, meta }

# List sessions
GET /rppg-v8/sessions?limit=50
Headers: Authorization: Bearer <token>
→ Returns: { success, status, message, data: { sessions, count }, meta }

# List predictions
GET /rppg-v8/predictions
Headers: Authorization: Bearer <token>
→ Returns: { success, status, message, data: { predictions, count }, meta }

# Get metadata
GET /rppg-v8/metadata
Headers: Authorization: Bearer <token>
→ Returns: { success, status, message, data: {...}, meta }
```

## Data Structures

### Symptom Log
```typescript
interface SymptomLog {
  day_of_cycle: number; // 1-28
  cycle_phase: 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';
  breast_soreness_vas: number; // 0-10
  painful_touch_vas: number; // 0-10
  pelvic_pressure_vas: number; // 0-10
  bloating_delta_cm: number;
  fatigue_mfi5_vas: number; // 0-10
  acne_severity_likert: number; // 0-4
  hirsutism_mfg_score: number; // 0-36
}
```

### Disease Prediction
```typescript
interface DiseasePrediction {
  probability: number; // 0-1
  predicted: number; // 0 or 1
  severity: 'Low' | 'Moderate' | 'High';
  riskScore: number; // 0-1
  riskSeverity: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
}
```

### Disease Prediction Response
```typescript
interface SymptomPredictionResponse {
  diseases: {
    Infertility: DiseasePrediction;
    Dysmenorrhea: DiseasePrediction;
    PMDD: DiseasePrediction;
    T2D: DiseasePrediction;
    CVD: DiseasePrediction;
    Endometrial: DiseasePrediction;
  };
  symptomBurdenScore: number; // 0-10
}
```

### rPPG v8 Session
```typescript
interface RppgV8Session {
  rmssd: number;
  hf: number;
  lf_hf_ratio: number;
  heart_rate: number;
  hrv: number;
  estimated_spo2: number;
  skin_temperature: number;
  hr_trend?: number | null;
  mean_eda: number;
  mean_temp: number;
  asi?: number | null;
  rmssd_trend?: number | null;
  ac?: number | null;
  dc?: number | null;
  ac_dc_ratio?: number | null;
  pulse_amplitude?: number | null;
  signal_quality?: number | null;
  respiratory_rate?: number | null;
  session_type?: 'morning' | 'evening' | 'baseline' | 'checkin';
  session_quality?: 'good' | 'poor' | 'motion_artifact' | null;
}
```

### rPPG v8 Regression Targets
- `Sleep_Quality`
- `Focus_Memory`
- `Mental_Wellness`
- `Mood_Score`
- `Metabolic_Syndrome_Risk`
- `T2D_Metabolic_Risk_Index`
- `Cardiovascular_Risk_Score`
- `Heart_Failure_Alert_Score`
- `Chronic_Stress_Severity`
- `Infertility_Reproductive_Risk`

## Error Codes

- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Cannot process request
- `503`: Service Unavailable - Inference service down

## Headers

All authenticated requests must include:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## Environment Variables

Frontend needs:
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:3000)
- `REACT_APP_INFERENCE_URL`: Inference service URL (default: http://localhost:8000)

## Common Patterns

### Axios Setup
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Error Handling
```typescript
try {
  const result = await api.post('/symptoms', data);
} catch (error) {
  if (error.response) {
    console.error('Server error:', error.response.data);
  } else if (error.request) {
    console.error('Network error:', error.message);
  }
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.post('/symptoms', data);
  } finally {
    setLoading(false);
  }
};
```

## Testing

Use the provided curl examples in the API Specification to test endpoints.
