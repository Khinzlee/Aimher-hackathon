import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogSymptomDto } from './dto/log-symptom.dto';

@Injectable()
export class SymptomsService {
  constructor(private prisma: PrismaService) {}

  async logSymptom(userId: string, dto: LogSymptomDto) {
    const symptomBurdenScore = this.calculateSymptomBurdenScore(dto);

    return this.prisma.symptomLog.create({
      data: {
        userId,
        day_of_cycle: dto.day_of_cycle,
        cycle_phase: dto.cycle_phase,
        breast_soreness_vas: dto.breast_soreness_vas,
        painful_touch_vas: dto.painful_touch_vas,
        pelvic_pressure_vas: dto.pelvic_pressure_vas,
        bloating_delta_cm: dto.bloating_delta_cm,
        fatigue_mfi5_vas: dto.fatigue_mfi5_vas,
        acne_severity_likert: dto.acne_severity_likert,
        hirsutism_mfg_score: dto.hirsutism_mfg_score,
        symptom_burden_score: symptomBurdenScore,
      },
    });
  }

  listForUser(userId: string, limit: number = 50, offset: number = 0) {
    return this.prisma.symptomLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async countForUser(userId: string) {
    return this.prisma.symptomLog.count({ where: { userId } });
  }

  private calculateSymptomBurdenScore(dto: LogSymptomDto): number {
    // Composite score based on the 7 symptom variables
    // Normalized to 0-10 scale
    const sum =
      dto.breast_soreness_vas +
      dto.painful_touch_vas +
      dto.pelvic_pressure_vas +
      dto.fatigue_mfi5_vas +
      (dto.acne_severity_likert / 4) * 10 + // Normalize Likert 0-4 to 0-10
      (dto.hirsutism_mfg_score / 36) * 10 + // Normalize mFG 0-36 to 0-10
      Math.min(dto.bloating_delta_cm, 10); // Cap bloating at 10

    return Math.round((sum / 7) * 100) / 100; // Average and round to 2 decimals
  }
}
