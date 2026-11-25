# Aimher Frontend Integration Guide

This guide helps frontend developers integrate with the Aimher backend API.

## Quick Start

### 1. Base Configuration

```typescript
// api.config.ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  INFERENCE_URL: process.env.REACT_APP_INFERENCE_URL || 'http://localhost:8000',
};
```

### 2. Authentication Flow

```typescript
// auth.service.ts
import axios from 'axios';
import { API_CONFIG } from './api.config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async register(email: string, password: string, name?: string) {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },

  async login(email: string, password: string) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
  },
};
```

## API Client Examples

### Symptoms API

```typescript
// symptoms.service.ts
import axios from 'axios';
import { API_CONFIG } from './api.config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SymptomLog {
  day_of_cycle: number;
  cycle_phase: 'Menstrual' | 'Follicular' | 'Ovulatory' | 'Luteal';
  breast_soreness_vas: number;
  painful_touch_vas: number;
  pelvic_pressure_vas: number;
  bloating_delta_cm: number;
  fatigue_mfi5_vas: number;
  acne_severity_likert: number;
  hirsutism_mfg_score: number;
}

export const symptomsService = {
  async logSymptom(data: SymptomLog) {
    const response = await api.post('/symptoms', data);
    return response.data;
  },

  async getSymptomHistory(limit = 50, offset = 0) {
    const response = await api.get('/symptoms/history', {
      params: { limit, offset },
    });
    return response.data;
  },
};
```

### Predictions API

```typescript
// predictions.service.ts
import axios from 'axios';
import { API_CONFIG } from './api.config';
import { SymptomLog } from './symptoms.service';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DiseasePrediction {
  probability: number;
  predicted: number;
  severity: 'Low' | 'Moderate' | 'High';
  riskScore: number;
  riskSeverity: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
}

export interface SymptomPredictionResponse {
  diseases: {
    Infertility: DiseasePrediction;
    Dysmenorrhea: DiseasePrediction;
    PMDD: DiseasePrediction;
    T2D: DiseasePrediction;
    CVD: DiseasePrediction;
    Endometrial: DiseasePrediction;
  };
  symptomBurdenScore: number;
}

export const predictionsService = {
  async predictFromSymptoms(data: SymptomLog) {
    const response = await api.post('/predictions/from-symptoms', data);
    return response.data as SymptomPredictionResponse;
  },

  async getPredictionHistory() {
    const response = await api.get('/predictions/history');
    return response.data;
  },
};
```

### rPPG v8 API

```typescript
// rppg-v8.service.ts
import axios from 'axios';
import { API_CONFIG } from './api.config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RppgV8Session {
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

export interface RppgV8RegressionTarget {
  target: string;
  predictions: Record<string, number>;
  ensemble: number;
}

export interface RppgV8Prediction {
  regression: Record<string, RppgV8RegressionTarget>;
  mood_check: {
    best_prediction: {
      label: 'Low' | 'Neutral' | 'Positive';
      confidence: number;
      probabilities: number[];
    };
    best_algorithm: string;
    all_predictions: Record<string, any>;
    classes: string[];
  };
  feature_vector: Record<string, any>;
  nSessions: number;
}

export const rppgV8Service = {
  async recordSession(data: RppgV8Session) {
    const response = await api.post('/rppg-v8/session', data);
    return response.data;
  },

  async predictAll() {
    const response = await api.post('/rppg-v8/predict');
    return response.data.data as RppgV8Prediction;
  },

  async predictRegression(target: string) {
    const response = await api.post('/rppg-v8/predict/regression', { target });
    return response.data;
  },

  async predictMood() {
    const response = await api.post('/rppg-v8/predict/mood');
    return response.data;
  },

  async getSessions(limit = 50) {
    const response = await api.get('/rppg-v8/sessions', {
      params: { limit },
    });
    return response.data;
  },

  async getPredictions() {
    const response = await api.get('/rppg-v8/predictions');
    return response.data;
  },

  async getMetadata() {
    const response = await api.get('/rppg-v8/metadata');
    return response.data;
  },
};
```

## React Hooks Examples

### useSymptoms Hook

```typescript
// hooks/useSymptoms.ts
import { useState, useCallback } from 'react';
import { symptomsService, SymptomLog } from '../services/symptoms.service';

export function useSymptoms() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logSymptom = useCallback(async (data: SymptomLog) => {
    setLoading(true);
    setError(null);
    try {
      const result = await symptomsService.logSymptom(data);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log symptom');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHistory = useCallback(async (limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const result = await symptomsService.getSymptomHistory(limit, offset);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get history');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    logSymptom,
    getHistory,
  };
}
```

### usePredictions Hook

```typescript
// hooks/usePredictions.ts
import { useState, useCallback } from 'react';
import {
  predictionsService,
  SymptomLog,
  SymptomPredictionResponse,
} from '../services/predictions.service';

export function usePredictions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<SymptomPredictionResponse | null>(null);

  const predictFromSymptoms = useCallback(async (data: SymptomLog) => {
    setLoading(true);
    setError(null);
    try {
      const result = await predictionsService.predictFromSymptoms(data);
      setPrediction(result);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get prediction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    prediction,
    predictFromSymptoms,
  };
}
```

### useRppgV8 Hook

```typescript
// hooks/useRppgV8.ts
import { useState, useCallback } from 'react';
import {
  rppgV8Service,
  RppgV8Session,
  RppgV8Prediction,
} from '../services/rppg-v8.service';

export function useRppgV8() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<RppgV8Prediction | null>(null);

  const recordSession = useCallback(async (data: RppgV8Session) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rppgV8Service.recordSession(data);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predictAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await rppgV8Service.predictAll();
      setPrediction(result);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get predictions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predictRegression = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rppgV8Service.predictRegression(target);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get regression prediction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const predictMood = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await rppgV8Service.predictMood();
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get mood check');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    prediction,
    recordSession,
    predictAll,
    predictRegression,
    predictMood,
  };
}
```

## Component Examples

### Symptom Logging Form

```typescript
// components/SymptomLogForm.tsx
import React, { useState } from 'react';
import { useSymptoms } from '../hooks/useSymptoms';
import { SymptomLog } from '../services/symptoms.service';

export const SymptomLogForm: React.FC = () => {
  const { loading, error, logSymptom } = useSymptoms();
  const [formData, setFormData] = useState<SymptomLog>({
    day_of_cycle: 1,
    cycle_phase: 'Menstrual',
    breast_soreness_vas: 0,
    painful_touch_vas: 0,
    pelvic_pressure_vas: 0,
    bloating_delta_cm: 0,
    fatigue_mfi5_vas: 0,
    acne_severity_likert: 0,
    hirsutism_mfg_score: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logSymptom(formData);
      alert('Symptom logged successfully!');
    } catch (err) {
      console.error('Failed to log symptom', err);
    }
  };

  const handleChange = (field: keyof SymptomLog, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Day of Cycle (1-28):</label>
        <input
          type="number"
          min="1"
          max="28"
          value={formData.day_of_cycle}
          onChange={(e) => handleChange('day_of_cycle', parseInt(e.target.value))}
        />
      </div>

      <div>
        <label>Cycle Phase:</label>
        <select
          value={formData.cycle_phase}
          onChange={(e) => handleChange('cycle_phase', e.target.value)}
        >
          <option value="Menstrual">Menstrual</option>
          <option value="Follicular">Follicular</option>
          <option value="Ovulatory">Ovulatory</option>
          <option value="Luteal">Luteal</option>
        </select>
      </div>

      {/* Add other fields similarly */}

      <button type="submit" disabled={loading}>
        {loading ? 'Logging...' : 'Log Symptom'}
      </button>

      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

### Disease Prediction Display

```typescript
// components/DiseasePredictionCard.tsx
import React from 'react';
import { DiseasePrediction } from '../services/predictions.service';

interface Props {
  diseaseName: string;
  prediction: DiseasePrediction;
}

export const DiseasePredictionCard: React.FC<Props> = ({
  diseaseName,
  prediction,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low':
        return 'green';
      case 'Moderate':
        return 'yellow';
      case 'High':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className="prediction-card">
      <h3>{diseaseName}</h3>
      <div className="probability">
        Probability: {(prediction.probability * 100).toFixed(1)}%
      </div>
      <div className={`severity ${getSeverityColor(prediction.severity)}`}>
        {prediction.severity}
      </div>
      <div className="risk-score">
        Risk Score: {(prediction.riskScore * 100).toFixed(1)}%
      </div>
      <div className={`risk-severity ${getSeverityColor(prediction.riskSeverity)}`}>
        {prediction.riskSeverity}
      </div>
    </div>
  );
};
```

### rPPG v8 Prediction Display

```typescript
// components/RppgV8PredictionDisplay.tsx
import React from 'react';
import { RppgV8Prediction } from '../services/rppg-v8.service';

interface Props {
  prediction: RppgV8Prediction;
}

export const RppgV8PredictionDisplay: React.FC<Props> = ({ prediction }) => {
  const regressionTargets = Object.entries(prediction.regression);

  return (
    <div className="rppg-v8-predictions">
      <h2>Physiological Analysis</h2>
      <p>Sessions used: {prediction.nSessions}</p>

      <div className="regression-targets">
        <h3>Regression Scores</h3>
        {regressionTargets.map(([target, data]) => (
          <div key={target} className="target-card">
            <h4>{target.replace(/_/g, ' ')}</h4>
            <div className="score">{data.ensemble.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="mood-check">
        <h3>Mood Check</h3>
        <div className="mood-label">
          {prediction.mood_check.best_prediction.label}
        </div>
        <div className="confidence">
          Confidence: {(prediction.mood_check.best_prediction.confidence * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
```

## Error Handling

```typescript
// utils/errorHandler.ts
export function handleApiError(error: any): string {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    switch (status) {
      case 400:
        return data.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'Resource not found.';
      case 409:
        return data.message || 'Resource already exists.';
      case 422:
        return data.message || 'Cannot process the request. Please check your data.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return data.message || 'An error occurred. Please try again.';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Error in request setup
    return error.message || 'An unexpected error occurred.';
  }
}
```

## Environment Setup

Create `.env.local` in your frontend project:

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_INFERENCE_URL=http://localhost:8000
```

## Testing the API

You can test the API endpoints using tools like Postman, Insomnia, or curl:

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Log symptom (with token)
curl -X POST http://localhost:3000/symptoms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "day_of_cycle": 14,
    "cycle_phase": "Follicular",
    "breast_soreness_vas": 2.5,
    "painful_touch_vas": 1.8,
    "pelvic_pressure_vas": 3.2,
    "bloating_delta_cm": 1.5,
    "fatigue_mfi5_vas": 4.0,
    "acne_severity_likert": 2,
    "hirsutism_mfg_score": 12
  }'

# Get predictions
curl -X POST http://localhost:3000/predictions/from-symptoms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "day_of_cycle": 14,
    "cycle_phase": "Follicular",
    "breast_soreness_vas": 2.5,
    "painful_touch_vas": 1.8,
    "pelvic_pressure_vas": 3.2,
    "bloating_delta_cm": 1.5,
    "fatigue_mfi5_vas": 4.0,
    "acne_severity_likert": 2,
    "hirsutism_mfg_score": 12
  }'
```

## Tips for Frontend Developers

1. **Token Management**: Store the JWT token securely (e.g., in localStorage for simplicity, or use httpOnly cookies for production).

2. **Error Handling**: Always handle API errors gracefully and show user-friendly messages.

3. **Loading States**: Show loading indicators during API calls.

4. **Form Validation**: Validate inputs on the frontend before sending to the API.

5. **Data Formatting**: Format dates, percentages, and scores for better user experience.

6. **Responsive Design**: Ensure the UI works well on mobile devices.

7. **Accessibility**: Follow accessibility guidelines for better user experience.

8. **Performance**: Implement caching where appropriate to reduce API calls.

## Support

For API-related questions or issues, contact the backend team.
