import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PredictionsModule } from './predictions/predictions.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { RppgV8Module } from './rppg-v8/rppg-v8.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PredictionsModule,
    SymptomsModule,
    RppgV8Module,
    OnboardingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
