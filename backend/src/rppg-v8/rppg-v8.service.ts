import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRppgV8SessionDto } from './dto/rppg-v8-session.dto';
import { PredictRppgV8RegressionDto } from './dto/predict-rppg-v8-regression.dto';

const REGRESSION_TARGET_COLUMNS: Record<string, string> = {
  Sleep_Quality: 'sleepQualityScore',
  Focus_Memory: 'focusMemoryScore',
  Mental_Wellness: 'mentalWellnessScore',
  Mood_Score: 'moodScoreScore',
  Metabolic_Syndrome_Risk: 'metabolicSyndromeScore',
  T2D_Metabolic_Risk_Index: 't2dScore',
  Cardiovascular_Risk_Score: 'cardiovascularScore',
  Heart_Failure_Alert_Score: 'heartFailureScore',
  Chronic_Stress_Severity: 'chronicStressScore',
  Infertility_Reproductive_Risk: 'infertilityScore',
};

@Injectable()
export class RppgV8Service {
  private readonly inferenceUrl: string;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.inferenceUrl = config.get<string>('INFERENCE_URL') ?? 'http://localhost:8000';
  }

  async recordSession(userId: string, dto: CreateRppgV8SessionDto) {
    const session = await this.prisma.rppgV8Session.create({
      data: {
        userId,
        rmssd: dto.rmssd,
        hf: dto.hf,
        lfHfRatio: dto.lf_hf_ratio,
        heartRate: dto.heart_rate,
        hrv: dto.hrv,
        estimatedSpO2: dto.estimated_spo2,
        skinTemperature: dto.skin_temperature,
        hrTrend: dto.hr_trend ?? null,
        meanEda: dto.mean_eda,
        meanTemp: dto.mean_temp,
        asi: dto.asi ?? null,
        rmssdTrend: dto.rmssd_trend ?? null,
        ac: dto.ac ?? null,
        dc: dto.dc ?? null,
        acDcRatio: dto.ac_dc_ratio ?? null,
        pulseAmplitude: dto.pulse_amplitude ?? null,
        signalQuality: dto.signal_quality ?? null,
        respiratoryRate: dto.respiratory_rate ?? null,
        sessionType: dto.session_type ?? 'checkin',
        sessionQuality: dto.session_quality ?? null,
      },
    });
    const sessionCount = await this.prisma.rppgV8Session.count({
      where: { userId },
    });

    return { session, sessionCount };
  }

  listSessions(userId: string, limit = 50) {
    return this.prisma.rppgV8Session.findMany({
      where: { userId },
      orderBy: { capturedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  async listPredictions(userId: string) {
    const predictions = await this.prisma.rppgV8PredictionResult.findMany({
      where: { userId },
      orderBy: { predictedAt: 'desc' },
      take: 20,
    });

    return predictions.map((prediction) => ({
      ...prediction,
      moodCheckProbabilities: prediction.moodCheckProbabilities
        ? JSON.parse(prediction.moodCheckProbabilities)
        : null,
    }));
  }

  async predictAll(userId: string) {
    const { vector, nSessions } = await this.getLatestVector(userId);
    const result = await this.callInference('/rppg-v8/predict', { vector });
    const data = { ...result, nSessions };

    await this.savePredictionResult(userId, data);
    return data;
  }

  async predictRegression(userId: string, dto: PredictRppgV8RegressionDto) {
    const { vector } = await this.getLatestVector(userId);
    return this.callInference('/rppg-v8/predict/regression', {
      vector,
      target: dto.target,
    });
  }

  async predictMood(userId: string) {
    const { vector } = await this.getLatestVector(userId);
    return this.callInference('/rppg-v8/predict/mood', { vector });
  }

  getMetadata() {
    return this.callInference('/rppg-v8/metadata');
  }

  private async getLatestVector(userId: string) {
    const [session, nSessions] = await Promise.all([
      this.prisma.rppgV8Session.findFirst({
        where: { userId },
        orderBy: { capturedAt: 'desc' },
      }),
      this.prisma.rppgV8Session.count({ where: { userId } }),
    ]);

    if (!session) {
      throw new UnprocessableEntityException(
        'No rPPG v8 sessions found for this user.',
      );
    }

    return { session, vector: this.buildUnifiedVector(session), nSessions };
  }

  private buildUnifiedVector(session: any): Record<string, number | null> {
    return {
      RMSSD: session.rmssd,
      HF: session.hf,
      LF_HF_Ratio: session.lfHfRatio,
      Heart_Rate: session.heartRate,
      Heart_Rate_Variability_HRV: session.hrv,
      Estimated_SpO2: session.estimatedSpO2,
      Skin_Temperature: session.skinTemperature,
      HR_Trend: session.hrTrend,
      Mean_EDA: session.meanEda,
      Mean_Temp: session.meanTemp,
      Autonomic_Stress_Index: session.asi,
      RMSSD_Trend: session.rmssdTrend,
    };
  }

  private async savePredictionResult(userId: string, result: any) {
    const regression = result.regression ?? {};
    const moodCheck = result.mood_check ?? {};
    const bestPrediction = moodCheck.best_prediction ?? null;
    const data: any = {
      userId,
      nSessionsUsed: result.nSessions ?? 0,
      moodCheckLabel: bestPrediction?.label ?? null,
      moodCheckConfidence: bestPrediction?.confidence ?? null,
      moodCheckProbabilities: bestPrediction?.probabilities
        ? JSON.stringify(bestPrediction.probabilities)
        : null,
    };

    for (const [target, column] of Object.entries(REGRESSION_TARGET_COLUMNS)) {
      data[column] = regression[target]?.ensemble ?? null;
    }

    return this.prisma.rppgV8PredictionResult.create({ data });
  }

  private async callInference(path: string, body?: any) {
    let res: Response;
    try {
      res = await fetch(`${this.inferenceUrl}${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Inference service is unreachable. Is the Python service running?',
      );
    }

    if (!res.ok) {
      throw new BadGatewayException(
        `Inference service error: ${await res.text()}`,
      );
    }

    return res.json();
  }
}
