import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const REQUIRED_STEPS = 5;

const STEP1_MAP = {
  full_name: 'fullName',
  date_of_birth: 'dateOfBirth',
  age: 'age',
  nationality: 'nationality',
  ethnicity: 'ethnicity',
  gender: 'gender',
  phone_number: 'phoneNumber',
  blood_group: 'bloodGroup',
  genotype: 'genotype',
};

const STEP2_MAP = {
  height_cm: 'heightCm',
  weight_kg: 'weightKg',
};

const STEP3_MAP = {
  has_skin_changes: 'hasSkinChanges',
  acanthosis_nigricans: 'acanthosisNigricans',
  skin_tags: 'skinTags',
  scalp_hair_thinning: 'scalpHairThinning',
};

const STEP4_MAP = {
  cycle_length_days: 'cycleLengthDays',
  periods_per_year: 'periodsPerYear',
  cycle_regularity: 'cycleRegularity',
  bleeding_intensity: 'bleedingIntensity',
  last_period_date: 'lastPeriodDate',
};

const STEP5_MAP = {
  selected_wearable: 'selectedWearable',
};

const PROFILE_MAP = {
  ...STEP1_MAP,
  ...STEP2_MAP,
  ...STEP3_MAP,
  ...STEP4_MAP,
  ...STEP5_MAP,
  waist_cm: 'waistCm',
  hip_cm: 'hipCm',
  night_sweats: 'nightSweats',
  fatigue_level: 'fatigueLevel',
  family_history: 'familyHistory',
  high_blood_pressure: 'highBloodPressure',
  rppg_baseline_captured: 'rppgBaselineCaptured',
  rppg_captured_at: 'rppgCapturedAt',
};

const DATE_FIELDS = new Set(['dateOfBirth', 'lastPeriodDate', 'rppgCapturedAt']);

const STEP1_KEYS = [
  'full_name',
  'date_of_birth',
  'age',
  'nationality',
  'ethnicity',
  'gender',
  'phone_number',
  'blood_group',
  'genotype',
];

const STEP2_KEYS = [
  'height_cm',
  'weight_kg',
  'bmi',
  'onboarding_completed',
  'onboarding_step',
];

const STEP3_KEYS = [
  'has_skin_changes',
  'acanthosis_nigricans',
  'skin_tags',
  'scalp_hair_thinning',
];

const STEP4_KEYS = [
  'cycle_length_days',
  'periods_per_year',
  'cycle_regularity',
  'bleeding_intensity',
  'last_period_date',
];

const STEP5_KEYS = ['selected_wearable'];
const STEP6_KEYS = ['rppg_baseline_captured', 'rppg_captured_at'];

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  completionPercentage(onboardingStep: number): number {
    const step = Math.min(onboardingStep, REQUIRED_STEPS);
    return Math.round((step / REQUIRED_STEPS) * 100);
  }

  isMinimumComplete(onboardingStep: number): boolean {
    return onboardingStep >= REQUIRED_STEPS;
  }

  async getUser(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  async getOrCreateProfile(userId: string) {
    return this.prisma.onboardingProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  async getProfile(userId: string) {
    const [profile, user] = await Promise.all([
      this.getOrCreateProfile(userId),
      this.getUser(userId),
    ]);
    return this.serializeProfile(profile, user);
  }

  async updateProfile(userId: string, dto: Record<string, any>) {
    await this.assertDobAge(dto.date_of_birth);
    const profile = await this.updateProfileFields(userId, dto, PROFILE_MAP);
    const user = await this.getUser(userId);
    return this.serializeProfile(profile, user);
  }

  async step1(userId: string, dto: Record<string, any>) {
    return this.applyStep(
      userId,
      1,
      dto,
      STEP1_MAP,
      STEP1_KEYS,
      'Step 1 (Personal Info) saved successfully.',
    );
  }

  async step2(userId: string, dto: Record<string, any>) {
    return this.applyStep(
      userId,
      2,
      dto,
      STEP2_MAP,
      STEP2_KEYS,
      'Step 2 (Physical Measurements) saved successfully.',
    );
  }

  async step3(userId: string, dto: Record<string, any>) {
    return this.applyStep(
      userId,
      3,
      dto,
      STEP3_MAP,
      STEP3_KEYS,
      'Step 3 (Skin Changes) saved successfully.',
    );
  }

  async step4(userId: string, dto: Record<string, any>) {
    const profile = await this.getOrCreateProfile(userId);
    if ((profile.gender ?? '').toLowerCase() === 'male') {
      await this.advanceStep(userId, 4);
      return {
        data: {},
        message:
          'Menstrual history step skipped for male users. Progress saved.',
      };
    }
    return this.applyStep(
      userId,
      4,
      dto,
      STEP4_MAP,
      STEP4_KEYS,
      'Step 4 (Menstrual History) saved successfully.',
    );
  }

  async step5(userId: string, dto: Record<string, any>) {
    return this.applyStep(
      userId,
      5,
      dto,
      STEP5_MAP,
      STEP5_KEYS,
      'Step 5 (Wearable Setup) saved successfully.',
    );
  }

  async step6(userId: string, dto: { baseline_captured: boolean }) {
    if (!dto.baseline_captured) {
      throw new BadRequestException(
        'baseline_captured must be true to record the scan.',
      );
    }
    const profile = await this.getOrCreateProfile(userId);
    const updated = await this.prisma.onboardingProfile.update({
      where: { id: profile.id },
      data: { rppgBaselineCaptured: true, rppgCapturedAt: new Date() },
    });
    const user = await this.advanceStep(userId, 6);
    const full = this.serializeProfile(updated, user);
    return {
      data: pick(full, STEP6_KEYS),
      message: 'rPPG baseline recorded successfully.',
    };
  }

  async complete(userId: string) {
    const user = await this.getUser(userId);
    const onboardingStep = Math.max(user.onboardingStep, REQUIRED_STEPS + 1);
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true, onboardingStep },
    });
    const profile = await this.getOrCreateProfile(userId);
    const full = this.serializeProfile(profile, updatedUser);
    return {
      data: {
        redirect: '/dashboard',
        onboarding_completed: true,
        onboarding_step: onboardingStep,
        profile: full,
      },
      message: 'Onboarding complete. Welcome to AI-MSHM!',
    };
  }

  private async applyStep(
    userId: string,
    step: number,
    dto: Record<string, any>,
    fieldMap: Record<string, string>,
    keys: string[],
    message: string,
  ) {
    await this.assertDobAge(dto.date_of_birth);
    const profile = await this.updateProfileFields(userId, dto, fieldMap);
    const user = await this.advanceStep(userId, step);
    const full = this.serializeProfile(profile, user);
    return { data: pick(full, keys), message };
  }

  private async updateProfileFields(
    userId: string,
    dto: Record<string, any>,
    fieldMap: Record<string, string>,
  ) {
    const profile = await this.getOrCreateProfile(userId);
    const mapped = this.mapDto(dto, fieldMap);
    const merged = { ...profile, ...mapped };
    const data: Record<string, any> = { ...mapped };

    data.bmi = this.computeBmi(merged.heightCm, merged.weightKg);
    data.age = this.computeAge(merged.dateOfBirth);
    if (merged.acanthosisNigricans) {
      data.hasSkinChanges = merged.acanthosisNigricans === 'yes';
    }

    return this.prisma.onboardingProfile.update({
      where: { id: profile.id },
      data,
    });
  }

  private mapDto(
    dto: Record<string, any>,
    fieldMap: Record<string, string>,
  ): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [dtoKey, prismaKey] of Object.entries(fieldMap)) {
      const value = dto[dtoKey];
      if (value === undefined) continue;
      if (DATE_FIELDS.has(prismaKey)) {
        data[prismaKey] = value === null ? null : new Date(value);
      } else {
        data[prismaKey] = value;
      }
    }
    return data;
  }

  private async advanceStep(userId: string, completedStep: number) {
    const user = await this.getUser(userId);
    if (completedStep > user.onboardingStep) {
      return this.prisma.user.update({
        where: { id: userId },
        data: { onboardingStep: completedStep },
      });
    }
    return user;
  }

  private async assertDobAge(dateOfBirth: string | null | undefined) {
    if (!dateOfBirth) return;
    const age = this.computeAge(new Date(dateOfBirth));
    if (age !== null && (age < 10 || age > 120)) {
      throw new BadRequestException(
        'Date of birth results in an age outside valid range (10-120).',
      );
    }
  }

  private computeBmi(heightCm?: number | null, weightKg?: number | null) {
    if (heightCm && weightKg && heightCm > 0) {
      return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
    }
    return null;
  }

  private computeAge(dateOfBirth?: Date | null): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age -= 1;
    }
    return age;
  }

  private serializeProfile(profile: any, user: any) {
    return {
      full_name: profile.fullName ?? '',
      date_of_birth: profile.dateOfBirth,
      age: profile.age,
      nationality: profile.nationality ?? '',
      ethnicity: profile.ethnicity ?? '',
      gender: profile.gender ?? '',
      phone_number: profile.phoneNumber ?? '',
      blood_group: profile.bloodGroup ?? '',
      genotype: profile.genotype ?? '',
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      bmi: profile.bmi,
      has_skin_changes: profile.hasSkinChanges,
      acanthosis_nigricans: profile.acanthosisNigricans ?? '',
      skin_tags: profile.skinTags ?? '',
      scalp_hair_thinning: profile.scalpHairThinning ?? '',
      cycle_length_days: profile.cycleLengthDays,
      periods_per_year: profile.periodsPerYear,
      cycle_regularity: profile.cycleRegularity ?? '',
      bleeding_intensity: profile.bleedingIntensity ?? '',
      last_period_date: profile.lastPeriodDate,
      waist_cm: profile.waistCm,
      hip_cm: profile.hipCm,
      night_sweats: profile.nightSweats ?? '',
      fatigue_level: profile.fatigueLevel ?? '',
      family_history: profile.familyHistory ?? [],
      high_blood_pressure: profile.highBloodPressure ?? '',
      selected_wearable: profile.selectedWearable ?? '',
      rppg_baseline_captured: profile.rppgBaselineCaptured,
      rppg_captured_at: profile.rppgCapturedAt,
      onboarding_completed: user?.onboardingCompleted ?? false,
      onboarding_step: user?.onboardingStep ?? 0,
      completion_percentage: this.completionPercentage(
        user?.onboardingStep ?? 0,
      ),
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    };
  }
}

function pick(obj: Record<string, any>, keys: string[]) {
  const out: Record<string, any> = {};
  for (const key of keys) out[key] = obj[key];
  return out;
}
