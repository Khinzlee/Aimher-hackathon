# Aimher API Specification

Complete API documentation for the Aimher hackathon application.

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** Set via `BACKEND_URL` environment variable

## Authentication

All endpoints except `/auth/register` and `/auth/login` require JWT authentication.

Include the token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

## Response Envelope

Most endpoints return responses in this format:

```json
{
  "success": true,
  "status": 200,
  "message": "Operation successful",
  "data": {},
  "meta": {
    "timestamp": "2026-11-25T00:00:00.000Z"
  }
}
```

## Authentication Endpoints

### 1. Register User

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "7d"
}
```

### 2. Login User

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "7d"
}
```

## User Endpoints

### 3. Get Current User Profile

**Endpoint:** `GET /users/me`

**Authentication:** Required (JWT)

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-11-25T00:00:00.000Z"
}
```

## Symptom Intensity Logging API

### 4. Log Symptom Intensity

Logs daily symptom intensity data. These are the 7 input variables from the research diagram.

**Endpoint:** `POST /symptoms`

**Authentication:** Required (JWT)

**Request Body:**
```json
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
```

**Field Descriptions:**
- `day_of_cycle` (number, 1-28): Day in the menstrual cycle
- `cycle_phase` (enum): "Menstrual", "Follicular", "Ovulatory", "Luteal"
- `breast_soreness_vas` (number, 0-10): Visual Analog Scale for breast soreness
- `painful_touch_vas` (number, 0-10): VAS for painful touch sensitivity
- `pelvic_pressure_vas` (number, 0-10): VAS for pelvic pressure
- `bloating_delta_cm` (number): Bloating measurement in cm delta
- `fatigue_mfi5_vas` (number, 0-10): MFI-5 fatigue VAS score
- `acne_severity_likert` (number, 0-4): Acne severity on Likert scale
- `hirsutism_mfg_score` (number, 0-36): Modified Ferriman-Gallwey score for hirsutism

**Response:**
```json
{
  "id": "symptom_log_id",
  "userId": "user_id",
  "day_of_cycle": 14,
  "cycle_phase": "Follicular",
  "breast_soreness_vas": 2.5,
  "painful_touch_vas": 1.8,
  "pelvic_pressure_vas": 3.2,
  "bloating_delta_cm": 1.5,
  "fatigue_mfi5_vas": 4.0,
  "acne_severity_likert": 2,
  "hirsutism_mfg_score": 12,
  "symptom_burden_score": 5.2,
  "createdAt": "2026-11-25T10:30:00.000Z"
}
```

### 5. Get Symptom History

Retrieves historical symptom logs for the authenticated user.

**Endpoint:** `GET /symptoms/history`

**Authentication:** Required (JWT)

**Query Parameters:**
- `limit` (optional, number): Maximum number of records to return (default: 50, max: 100)
- `offset` (optional, number): Number of records to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "symptom_log_id",
      "userId": "user_id",
      "day_of_cycle": 14,
      "cycle_phase": "Follicular",
      "breast_soreness_vas": 2.5,
      "painful_touch_vas": 1.8,
      "pelvic_pressure_vas": 3.2,
      "bloating_delta_cm": 1.5,
      "fatigue_mfi5_vas": 4.0,
      "acne_severity_likert": 2,
      "hirsutism_mfg_score": 12,
      "symptom_burden_score": 5.2,
      "createdAt": "2026-11-25T10:30:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

## Disease Prediction API

### 6. Predict Disease Risk from Symptoms

Takes the 7 symptom inputs (current day + historical data) and predicts disease risk for the 6 downstream diseases.

**Endpoint:** `POST /predictions/from-symptoms`

**Authentication:** Required (JWT)

**Request Body:**
```json
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
```

**Note:** The system automatically combines the submitted entry with the user's historical symptom logs (up to 60 entries) to compute aggregate features for better predictions.

**Response:**
```json
{
  "diseases": {
    "Infertility": {
      "probability": 0.8456,
      "predicted": 1,
      "severity": "High",
      "riskScore": 0.7234,
      "riskSeverity": "Moderate"
    },
    "Dysmenorrhea": {
      "probability": 0.3456,
      "predicted": 0,
      "severity": "Moderate",
      "riskScore": 0.5123,
      "riskSeverity": "Mild"
    },
    "PMDD": {
      "probability": 0.1234,
      "predicted": 0,
      "severity": "Low",
      "riskScore": 0.2890,
      "riskSeverity": "Minimal"
    },
    "T2D": {
      "probability": 0.4567,
      "predicted": 0,
      "severity": "Moderate",
      "riskScore": 0.3456,
      "riskSeverity": "Mild"
    },
    "CVD": {
      "probability": 0.2345,
      "predicted": 0,
      "severity": "Low",
      "riskScore": 0.2567,
      "riskSeverity": "Minimal"
    },
    "Endometrial": {
      "probability": 0.5678,
      "predicted": 1,
      "severity": "Moderate",
      "riskScore": 0.4123,
      "riskSeverity": "Mild"
    }
  },
  "symptomBurdenScore": 5.2
}
```

### 7. Predict from Disease Features (Advanced)

For research/advanced use - takes pre-calculated disease features.

**Endpoint:** `POST /predictions`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "pcos_label": 1,
  "features": {
    "Infertility": {
      "PredFlag": 1,
      "PredScore": 0.6458,
      "RiskProb": 0.9946
    },
    "Dysmenorrhea": {
      "PredFlag": 1,
      "PredScore": 0.1704,
      "RiskProb": 0.63
    },
    "PMDD": {
      "PredFlag": 0,
      "PredScore": 0.1295,
      "RiskProb": 0.0038
    },
    "T2D": {
      "PredFlag": 0,
      "PredScore": 0.3511,
      "RiskProb": 0.0073
    },
    "CVD": {
      "PredFlag": 0,
      "PredScore": 0.2548,
      "RiskProb": 0.0034
    },
    "Endometrial": {
      "PredFlag": 0,
      "PredScore": 0.2828,
      "RiskProb": 0.0
    }
  }
}
```

**Response:** Same format as `/predictions/from-symptoms` but without `symptomBurdenScore`.

### 8. Get Prediction History

Retrieves prediction history for the authenticated user.

**Endpoint:** `GET /predictions/history`

**Authentication:** Required (JWT)

**Response:**
```json
[
  {
    "id": "prediction_id",
    "userId": "user_id",
    "features": "{...json string...}",
    "result": "{...json string...}",
    "createdAt": "2026-11-25T10:30:00.000Z"
  }
]
```

## rPPG v8 Passive Sensing API

The rPPG v8 endpoints provide physiological data analysis using remote photoplethysmography (rPPG) technology. These endpoints use the AIMHER-style response envelope.

### 9. Submit rPPG v8 Session

Records a passive sensing session with physiological measurements.

**Endpoint:** `POST /rppg-v8/session`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "rmssd": 61.7,
  "hf": 340.1,
  "lf_hf_ratio": 0.94,
  "heart_rate": 80.5,
  "hrv": 35.4,
  "estimated_spo2": 97.3,
  "skin_temperature": 34.1,
  "hr_trend": null,
  "mean_eda": 1.88,
  "mean_temp": 34.3,
  "asi": 0.04,
  "rmssd_trend": null,
  "ac": null,
  "dc": null,
  "ac_dc_ratio": null,
  "pulse_amplitude": null,
  "signal_quality": 82,
  "respiratory_rate": 16,
  "session_type": "checkin",
  "session_quality": "good"
}
```

**Field Descriptions:**
- `rmssd` (number, 0-1000): Root Mean Square of Successive Differences (ms)
- `hf` (number, 0-5000): High Frequency HRV power
- `lf_hf_ratio` (number, 0-20): LF/HF ratio
- `heart_rate` (number, 30-200): Heart rate (bpm)
- `hrv` (number, 0-1000): Heart Rate Variability
- `estimated_spo2` (number, 80-100): Estimated blood oxygen saturation (%)
- `skin_temperature` (number, 25-42): Skin temperature (°C)
- `hr_trend` (optional, number, -10 to 10): Heart rate trend
- `mean_eda` (number, 0-20): Mean Electrodermal Activity
- `mean_temp` (number, 25-42): Mean temperature (°C)
- `asi` (optional, number, 0-5): Autonomic Stress Index
- `rmssd_trend` (optional, number, -50 to 50): RMSSD trend
- `ac`, `dc`, `ac_dc_ratio`, `pulse_amplitude` (optional): Advanced rPPG features
- `signal_quality` (optional, number, 0-100): Signal quality score
- `respiratory_rate` (optional, number, 5-40): Respiratory rate (breaths/min)
- `session_type` (optional, enum): "morning", "evening", "baseline", "checkin"
- `session_quality` (optional, enum): "good", "poor", "motion_artifact"

**Response:**
```json
{
  "success": true,
  "status": 201,
  "message": "rPPG v8 session recorded",
  "data": {
    "session": {
      "id": "session_id",
      "userId": "user_id",
      "rmssd": 61.7,
      "hf": 340.1,
      "lfHfRatio": 0.94,
      "heartRate": 80.5,
      "hrv": 35.4,
      "estimatedSpO2": 97.3,
      "skinTemperature": 34.1,
      "hrTrend": null,
      "meanEda": 1.88,
      "meanTemp": 34.3,
      "asi": 0.04,
      "rmssdTrend": null,
      "ac": null,
      "dc": null,
      "acDcRatio": null,
      "pulseAmplitude": null,
      "signalQuality": 82,
      "respiratoryRate": 16,
      "sessionType": "checkin",
      "sessionQuality": "good",
      "capturedAt": "2026-11-25T10:30:00.000Z"
    },
    "sessionCount": 5
  },
  "meta": {
    "timestamp": "2026-11-25T10:30:00.000Z"
  }
}
```

### 10. Run All rPPG v8 Predictions

Runs all regression models and mood check on the latest stored session.

**Endpoint:** `POST /rppg-v8/predict`

**Authentication:** Required (JWT)

**Request Body:** None (uses latest stored session)

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "rPPG v8 predictions computed",
  "data": {
    "regression": {
      "Sleep_Quality": {
        "target": "Sleep_Quality",
        "predictions": { "LinearRegression": 60.48 },
        "ensemble": 60.48
      },
      "Focus_Memory": {
        "target": "Focus_Memory",
        "predictions": { "LinearRegression": 55.23 },
        "ensemble": 55.23
      },
      "Mental_Wellness": {
        "target": "Mental_Wellness",
        "predictions": { "LinearRegression": 58.91 },
        "ensemble": 58.91
      },
      "Mood_Score": {
        "target": "Mood_Score",
        "predictions": { "LinearRegression": 62.34 },
        "ensemble": 62.34
      },
      "Metabolic_Syndrome_Risk": {
        "target": "Metabolic_Syndrome_Risk",
        "predictions": { "LinearRegression": 45.67 },
        "ensemble": 45.67
      },
      "T2D_Metabolic_Risk_Index": {
        "target": "T2D_Metabolic_Risk_Index",
        "predictions": { "LinearRegression": 38.12 },
        "ensemble": 38.12
      },
      "Cardiovascular_Risk_Score": {
        "target": "Cardiovascular_Risk_Score",
        "predictions": { "LinearRegression": 42.89 },
        "ensemble": 42.89
      },
      "Heart_Failure_Alert_Score": {
        "target": "Heart_Failure_Alert_Score",
        "predictions": { "LinearRegression": 35.45 },
        "ensemble": 35.45
      },
      "Chronic_Stress_Severity": {
        "target": "Chronic_Stress_Severity",
        "predictions": { "LinearRegression": 48.23 },
        "ensemble": 48.23
      },
      "Infertility_Reproductive_Risk": {
        "target": "Infertility_Reproductive_Risk",
        "predictions": { "LinearRegression": 51.78 },
        "ensemble": 51.78
      }
    },
    "mood_check": {
      "best_prediction": {
        "label": "Neutral",
        "confidence": 0.9813,
        "probabilities": [0.0075, 0.9813, 0.0112]
      },
      "best_algorithm": "MLP",
      "all_predictions": {},
      "classes": ["Low", "Neutral", "Positive"]
    },
    "feature_vector": {},
    "nSessions": 5
  },
  "meta": {
    "timestamp": "2026-11-25T10:30:00.000Z"
  }
}
```

**Regression Targets:**
- `Sleep_Quality`: Sleep quality score (0-100)
- `Focus_Memory`: Focus and memory score (0-100)
- `Mental_Wellness`: Mental wellness score (0-100)
- `Mood_Score`: Mood score (0-100)
- `Metabolic_Syndrome_Risk`: Metabolic syndrome risk (0-100)
- `T2D_Metabolic_Risk_Index`: Type 2 Diabetes metabolic risk (0-100)
- `Cardiovascular_Risk_Score`: Cardiovascular risk score (0-100)
- `Heart_Failure_Alert_Score`: Heart failure alert score (0-100)
- `Chronic_Stress_Severity`: Chronic stress severity (0-100)
- `Infertility_Reproductive_Risk`: Infertility reproductive risk (0-100)

### 11. Run One Regression Target

Runs a specific regression model on the latest stored session.

**Endpoint:** `POST /rppg-v8/predict/regression`

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "target": "Sleep_Quality"
}
```

**Valid Targets:** Any of the regression targets listed above.

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "rPPG v8 regression prediction computed",
  "data": {
    "target": "Sleep_Quality",
    "predictions": { "LinearRegression": 60.48 },
    "ensemble": 60.48
  },
  "meta": {
    "timestamp": "2026-11-25T10:30:00.000Z"
  }
}
```

### 12. Run Mood Check

Runs mood classification on the latest stored session.

**Endpoint:** `POST /rppg-v8/predict/mood`

**Authentication:** Required (JWT)

**Request Body:** None (uses latest stored session)

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "rPPG v8 mood check computed",
  "data": {
    "best_prediction": {
      "label": "Neutral",
      "confidence": 0.9813,
      "probabilities": [0.0075, 0.9813, 0.0112]
    },
    "best_algorithm": "MLP",
    "all_predictions": {},
    "classes": ["Low", "Neutral", "Positive"]
  },
  "meta": {
    "timestamp": "2026-11-25T10:30:00.000Z"
  }
}
```

### 13. List rPPG v8 Sessions

Retrieves recent rPPG v8 sessions for the authenticated user.

**Endpoint:** `GET /rppg-v8/sessions`

**Authentication:** Required (JWT)

**Query Parameters:**
- `limit` (optional, number): Maximum number of sessions to return (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "rPPG v8 sessions retrieved",
  "data": {
    "sessions": [
      {
        "id": "session_id",
        "userId": "user_id",
        "rmssd": 61.7,
        "hf": 340.1,
        "lfHfRatio": 0.94,
        "heartRate": 80.5,
        "hrv": 35.4,
        "estimatedSpO2": 97.3,
        "skinTemperature": 34.1,
        "hrTrend": null,
        "meanEda": 1.88,
        "meanTemp": 34.3,
        "asi": 0.04,
        "rmssdTrend": null,
        "ac": null,
        "dc": null,
        "acDcRatio": null,
        "pulseAmplitude": null,
        "signalQuality": 82,
        "respiratoryRate": 16,
        "sessionType": "checkin",
        "sessionQuality": "good",
        "capturedAt": "2026-11-25T10:30:00.000Z"
      }
    ],
    "count": 5
  },
  "meta": {
    "timestamp": "2026-11-25T10:30:00.000Z"
  }
}
```

### 14. List rPPG v8 Predictions

Retrieves prediction history for rPPG v8.

**Endpoint:** `GET /rppg-v8/predictions`

**Authentication:** Required (JWT)

**Response:**
```json
{
  "success": true,
  "status": 200,
  "message": "rPPG v8 prediction history fetched",
  "data": {
    "predictions": [
      {
        "id": "prediction_id",
        "userId": "user_id",
        "predictedAt": "2026-11-25T10:30:00.000Z",
        "nSessionsUsed": 5,
        "sleepQualityScore": 60.48,
        "focusMemoryScore": 55.23,
        "mentalWellnessScore": 58.91,
        "moodScoreScore": 62.34,
        "metabolicSyndromeScore": 45.67,
        "t2dScore": 38.12,
        "cardiovascularScore": 42.89,
        "heartFailureScore": 35.45,
        "chronicStressScore": 48.23,
        "infertilityScore": 51.78,
        "moodCheckLabel": "Neutral",
        "moodCheckConfidence": 0.9813,
        "moodCheckProbabilities": [0.0075, 0.9813, 0.0112]
      }
    ],
    "count": 10
  },
  "meta": {
    "timestamp": "2026-11-25T10:30:00.000Z"
  }
}
```

### 15. Get rPPG v8 Metadata

Retrieves metadata about rPPG v8 features and targets.

**Endpoint:** `GET /rppg-v8/metadata`

**Authentication:** Required (JWT)

**Response:** Metadata about available features and prediction targets.

## Onboarding API

Step-based onboarding flow ported from AIMHER. Steps 1–5 are required,
step 6 (rPPG baseline) is optional-but-recommended, and
`POST /onboarding/complete` finalises the flow.

> **Note:** Step 7 (PHC / LGA / emergency-hospital selection) is intentionally
> **not** implemented in this backend. `PATCH /onboarding/step/7` and
> `PATCH /onboarding/direct/step/7` return `404`.

All endpoints require JWT auth and return the standard envelope.
All step payloads are partial (`PATCH`-style): send only the fields for that step.

### 16. Step 1 – Personal Info

**Endpoint:** `PATCH /onboarding/step/1` (alias: `PATCH /onboarding/direct/step/1`)

**Request Body:**
```json
{
  "full_name": "Jane Doe",
  "date_of_birth": "1995-06-15",
  "age": 31,
  "nationality": "Nigerian",
  "ethnicity": "nigerian",
  "gender": "female",
  "phone_number": "08012345678",
  "blood_group": "O+",
  "genotype": "AA"
}
```

All fields optional. `age` must be 10–120; `date_of_birth` must resolve to
age 10–120 (`age` is recomputed from `date_of_birth` on save).

**Response `data`:** the submitted step-1 fields (snake_case).

### 17. Step 2 – Physical Measurements

**Endpoint:** `PATCH /onboarding/step/2` (alias: `PATCH /onboarding/direct/step/2`)

**Request Body:**
```json
{ "height_cm": 165, "weight_kg": 60 }
```

`height_cm` 50–300, `weight_kg` 20–500. `bmi` is computed automatically.

**Response `data`:**
```json
{
  "height_cm": 165,
  "weight_kg": 60,
  "bmi": 22,
  "onboarding_completed": false,
  "onboarding_step": 2
}
```

### 18. Step 3 – Skin Changes

**Endpoint:** `PATCH /onboarding/step/3` (alias: `PATCH /onboarding/direct/step/3`)

**Request Body:**
```json
{
  "has_skin_changes": false,
  "acanthosis_nigricans": "no",
  "skin_tags": "no",
  "scalp_hair_thinning": "no"
}
```

`acanthosis_nigricans`: `yes` | `no` | `not_sure`
`skin_tags`: `yes` | `no`
`scalp_hair_thinning`: `yes` | `no` | `unsure`

`has_skin_changes` is recomputed from `acanthosis_nigricans === "yes"` on save.

### 19. Step 4 – Menstrual History

**Endpoint:** `PATCH /onboarding/step/4` (alias: `PATCH /onboarding/direct/step/4`)

**Request Body:**
```json
{
  "cycle_length_days": 28,
  "periods_per_year": 12,
  "cycle_regularity": "regular",
  "bleeding_intensity": "medium",
  "last_period_date": "2026-11-01"
}
```

`cycle_length_days` 1–90, `periods_per_year` 0–14.
`cycle_regularity`: `regular` | `irregular` | `not_sure`
`bleeding_intensity`: `spotting` | `light` | `medium` | `heavy` | `very_heavy`

**Skipped for male users:** if `gender === "male"`, the step is bypassed,
`onboarding_step` still advances, and `data` is `{}`.

### 20. Step 5 – Wearable Setup

**Endpoint:** `PATCH /onboarding/step/5` (alias: `PATCH /onboarding/direct/step/5`)

**Request Body:**
```json
{ "selected_wearable": "apple_watch" }
```

`selected_wearable`: `apple_watch` | `fitbit` | `garmin` | `oura_ring` | `none`

### 21. Step 6 – rPPG Baseline

**Endpoint:** `POST /onboarding/step/6/rppg`

**Request Body:**
```json
{ "baseline_captured": true }
```

`baseline_captured` must be `true` (otherwise `400`). Sets
`rppg_baseline_captured` and `rppg_captured_at`, advances the step.

### 22. Complete Onboarding

**Endpoint:** `POST /onboarding/complete` (alias: `POST /onboarding/direct/complete`)

No body. Sets `onboarding_completed = true` and
`onboarding_step = max(current, 6)`.

**Response `data`:**
```json
{
  "redirect": "/dashboard",
  "onboarding_completed": true,
  "onboarding_step": 6,
  "profile": { }
}
```

### 23. Get Onboarding Profile

**Endpoint:** `GET /onboarding/profile`

Returns the full profile (all step fields, computed `bmi`/`age`,
`onboarding_completed`, `onboarding_step`, `completion_percentage`,
`created_at`, `updated_at`). Creates an empty profile if none exists.

### 24. Update Onboarding Profile

**Endpoint:** `PATCH /onboarding/profile/update`

Partially updates any profile field **without** advancing
`onboarding_step`. Accepts the union of all step fields plus the
additional clinical fields:

- `waist_cm`, `hip_cm` (numbers)
- `night_sweats`: `none` | `occasional` | `frequent` | `every_night`
- `fatigue_level`: `none` | `mild` | `moderate` | `severe`
- `family_history`: array
- `high_blood_pressure`: `yes` | `no` | `not_sure`
- `rppg_baseline_captured`, `rppg_captured_at`

**Response `data`:** the full serialized profile.

## Enums

### Cycle Phase
- `Menstrual`: Days 1-5
- `Follicular`: Days 6-13
- `Ovulatory`: Days 14-16
- `Luteal`: Days 17-28

### Severity Categories
- `Low`: probability < 0.33
- `Moderate`: 0.33 ≤ probability < 0.66
- `High`: probability ≥ 0.66

### Risk Severity Categories
- `Minimal`: score < 0.2
- `Mild`: 0.2 ≤ score < 0.4
- `Moderate`: 0.4 ≤ score < 0.6
- `Severe`: score ≥ 0.6

### rPPG v8 Session Type
- `morning`: Morning session
- `evening`: Evening session
- `baseline`: Baseline session
- `checkin`: Check-in session

### rPPG v8 Session Quality
- `good`: Good signal quality
- `poor`: Poor signal quality
- `motion_artifact`: Motion artifacts detected

### Mood Check Classes
- `Low`: Low mood
- `Neutral`: Neutral mood
- `Positive`: Positive mood

## Error Responses

### 400 Bad Request
Invalid request body or parameters.

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
Missing or invalid JWT token.

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 409 Conflict
Resource already exists (e.g., email already registered).

```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "error": "Conflict"
}
```

### 422 Unprocessable Entity
No data available for prediction (e.g., no rPPG v8 sessions).

```json
{
  "statusCode": 422,
  "message": "No rPPG v8 sessions found for this user.",
  "error": "Unprocessable Entity"
}
```

### 503 Service Unavailable
Inference service is unreachable.

```json
{
  "statusCode": 503,
  "message": "Inference service is unreachable. Is the Python service running?",
  "error": "Service Unavailable"
}
```

## Environment Variables

Backend requires these environment variables:

- `DATABASE_URL`: SQLite database URL (e.g., `file:./dev.db`)
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRES_IN`: JWT token expiration (default: `7d`)
- `INFERENCE_URL`: Python inference service URL (default: `http://localhost:8000`)
- `PORT`: Backend server port (default: `3000`)

## Running the Backend

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

## Running the Inference Service

```bash
# Navigate to inference directory
cd backend/inference

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```

## API Flow Example

1. **Register/Login** → Get JWT token
2. **Log Symptoms Daily** → `POST /symptoms`
3. **Get Disease Predictions** → `POST /predictions/from-symptoms`
4. **Submit rPPG Data** → `POST /rppg-v8/session`
5. **Get rPPG Predictions** → `POST /rppg-v8/predict`
6. **View History** → `GET /symptoms/history`, `GET /predictions/history`, `GET /rppg-v8/predictions`
