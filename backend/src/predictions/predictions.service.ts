import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PredictDto } from './dto/predict.dto';
import { PredictFromSymptomsDto } from './dto/predict-from-symptoms.dto';

const SYMPTOM_FIELDS = [
  'day_of_cycle',
  'cycle_phase',
  'breast_soreness_vas',
  'painful_touch_vas',
  'pelvic_pressure_vas',
  'bloating_delta_cm',
  'fatigue_mfi5_vas',
  'acne_severity_likert',
  'hirsutism_mfg_score',
] as const;

@Injectable()
export class PredictionsService {
  private readonly inferenceUrl: string;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    this.inferenceUrl = config.get<string>('INFERENCE_URL') ?? 'http://localhost:8000';
  }

  async predict(userId: string, dto: PredictDto) {
    const result = await this.callInference('/predict', dto);
    await this.save(userId, dto, result);
    return result;
  }

  async predictFromSymptoms(userId: string, dto: PredictFromSymptomsDto) {
    // Combine the submitted entry with the user's logged history so the
    // aggregate features (mean/std/max, phase means, deltas) are richer
    // when data exists — a single entry still works.
    const history = await this.prisma.symptomLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 60,
    });

    const entries = [
      this.toEntry(dto),
      ...history.map((h) => this.toEntry(h)),
    ];

    const result = await this.callInference('/predict/from-symptoms', {
      entries,
    });

    const symptomBurdenScore = this.calculateSymptomBurdenScore(dto);

    await this.save(userId, { ...dto, symptomBurdenScore }, result);

    return { ...result, symptomBurdenScore };
  }

  listForUser(userId: string) {
    return this.prisma.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private toEntry(src: object) {
    const entry: Record<string, unknown> = {};
    for (const f of SYMPTOM_FIELDS) {
      const v = (src as Record<string, unknown>)[f];
      if (v !== undefined && v !== null) entry[f] = v;
    }
    return entry;
  }

  private async save(userId: string, features: unknown, result: unknown) {
    await this.prisma.prediction.create({
      data: {
        userId,
        features: JSON.stringify(features),
        result: JSON.stringify(result),
      },
    });
  }

  private async callInference(path: string, body: unknown) {
    let res: Response;
    try {
      res = await fetch(`${this.inferenceUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  private calculateSymptomBurdenScore(dto: PredictFromSymptomsDto): number {
    const sum =
      dto.breast_soreness_vas +
      dto.painful_touch_vas +
      dto.pelvic_pressure_vas +
      dto.fatigue_mfi5_vas +
      (dto.acne_severity_likert / 4) * 10 +
      (dto.hirsutism_mfg_score / 36) * 10 +
      Math.min(dto.bloating_delta_cm, 10);

    return Math.round((sum / 7) * 100) / 100;
  }
}
