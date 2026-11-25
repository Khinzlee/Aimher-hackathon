import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';
import { Step1PersonalInfoDto } from './dto/step1-personal-info.dto';
import { Step2PhysicalMeasurementsDto } from './dto/step2-physical-measurements.dto';
import { Step3SkinChangesDto } from './dto/step3-skin-changes.dto';
import { Step4MenstrualHistoryDto } from './dto/step4-menstrual-history.dto';
import { Step5WearableDto } from './dto/step5-wearable.dto';
import { Step6RppgDto } from './dto/step6-rppg.dto';
import { UpdateOnboardingProfileDto } from './dto/update-onboarding-profile.dto';

@Controller('onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(private onboarding: OnboardingService) {}

  @Get('profile')
  async profile(@Request() req) {
    const data = await this.onboarding.getProfile(req.user.sub);
    return this.ok(data, 'Onboarding profile retrieved');
  }

  @Patch('profile/update')
  async updateProfile(
    @Request() req,
    @Body() dto: UpdateOnboardingProfileDto,
  ) {
    const data = await this.onboarding.updateProfile(req.user.sub, dto);
    return this.ok(data, 'Profile updated successfully.');
  }

  @Patch('step/1')
  async step1(@Request() req, @Body() dto: Step1PersonalInfoDto) {
    const result = await this.onboarding.step1(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('step/2')
  async step2(@Request() req, @Body() dto: Step2PhysicalMeasurementsDto) {
    const result = await this.onboarding.step2(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('step/3')
  async step3(@Request() req, @Body() dto: Step3SkinChangesDto) {
    const result = await this.onboarding.step3(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('step/4')
  async step4(@Request() req, @Body() dto: Step4MenstrualHistoryDto) {
    const result = await this.onboarding.step4(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('step/5')
  async step5(@Request() req, @Body() dto: Step5WearableDto) {
    const result = await this.onboarding.step5(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Post('step/6/rppg')
  @HttpCode(200)
  async step6(@Request() req, @Body() dto: Step6RppgDto) {
    const result = await this.onboarding.step6(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Post('complete')
  @HttpCode(200)
  async complete(@Request() req) {
    const result = await this.onboarding.complete(req.user.sub);
    return this.ok(result.data, result.message);
  }

  // ── Direct patient aliases (steps 1–5 identical; step 7 excluded) ──────────

  @Patch('direct/step/1')
  async directStep1(@Request() req, @Body() dto: Step1PersonalInfoDto) {
    const result = await this.onboarding.step1(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('direct/step/2')
  async directStep2(
    @Request() req,
    @Body() dto: Step2PhysicalMeasurementsDto,
  ) {
    const result = await this.onboarding.step2(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('direct/step/3')
  async directStep3(@Request() req, @Body() dto: Step3SkinChangesDto) {
    const result = await this.onboarding.step3(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('direct/step/4')
  async directStep4(@Request() req, @Body() dto: Step4MenstrualHistoryDto) {
    const result = await this.onboarding.step4(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Patch('direct/step/5')
  async directStep5(@Request() req, @Body() dto: Step5WearableDto) {
    const result = await this.onboarding.step5(req.user.sub, dto);
    return this.ok(result.data, result.message);
  }

  @Post('direct/complete')
  @HttpCode(200)
  async directComplete(@Request() req) {
    const result = await this.onboarding.complete(req.user.sub);
    return this.ok(result.data, result.message);
  }

  private ok(data: any, message: string) {
    return {
      success: true,
      status: 200,
      message,
      data,
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
