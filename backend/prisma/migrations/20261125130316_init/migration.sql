-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "features" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SymptomLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day_of_cycle" INTEGER NOT NULL,
    "cycle_phase" TEXT NOT NULL,
    "breast_soreness_vas" DOUBLE PRECISION NOT NULL,
    "painful_touch_vas" DOUBLE PRECISION NOT NULL,
    "pelvic_pressure_vas" DOUBLE PRECISION NOT NULL,
    "bloating_delta_cm" DOUBLE PRECISION NOT NULL,
    "fatigue_mfi5_vas" DOUBLE PRECISION NOT NULL,
    "acne_severity_likert" INTEGER NOT NULL,
    "hirsutism_mfg_score" INTEGER NOT NULL,
    "symptom_burden_score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SymptomLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RppgV8Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rmssd" DOUBLE PRECISION NOT NULL,
    "hf" DOUBLE PRECISION NOT NULL,
    "lfHfRatio" DOUBLE PRECISION NOT NULL,
    "heartRate" DOUBLE PRECISION NOT NULL,
    "hrv" DOUBLE PRECISION NOT NULL,
    "estimatedSpO2" DOUBLE PRECISION NOT NULL,
    "skinTemperature" DOUBLE PRECISION NOT NULL,
    "hrTrend" DOUBLE PRECISION,
    "meanEda" DOUBLE PRECISION NOT NULL,
    "meanTemp" DOUBLE PRECISION NOT NULL,
    "asi" DOUBLE PRECISION,
    "rmssdTrend" DOUBLE PRECISION,
    "ac" DOUBLE PRECISION,
    "dc" DOUBLE PRECISION,
    "acDcRatio" DOUBLE PRECISION,
    "pulseAmplitude" DOUBLE PRECISION,
    "signalQuality" DOUBLE PRECISION,
    "respiratoryRate" DOUBLE PRECISION,
    "sessionType" TEXT NOT NULL DEFAULT 'checkin',
    "sessionQuality" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RppgV8Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RppgV8PredictionResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nSessionsUsed" INTEGER NOT NULL,
    "sleepQualityScore" DOUBLE PRECISION,
    "focusMemoryScore" DOUBLE PRECISION,
    "mentalWellnessScore" DOUBLE PRECISION,
    "moodScoreScore" DOUBLE PRECISION,
    "metabolicSyndromeScore" DOUBLE PRECISION,
    "t2dScore" DOUBLE PRECISION,
    "cardiovascularScore" DOUBLE PRECISION,
    "heartFailureScore" DOUBLE PRECISION,
    "chronicStressScore" DOUBLE PRECISION,
    "infertilityScore" DOUBLE PRECISION,
    "moodCheckLabel" TEXT,
    "moodCheckConfidence" DOUBLE PRECISION,
    "moodCheckProbabilities" TEXT,

    CONSTRAINT "RppgV8PredictionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");

-- CreateIndex
CREATE INDEX "SymptomLog_userId_idx" ON "SymptomLog"("userId");

-- CreateIndex
CREATE INDEX "RppgV8Session_userId_idx" ON "RppgV8Session"("userId");

-- CreateIndex
CREATE INDEX "RppgV8PredictionResult_userId_idx" ON "RppgV8PredictionResult"("userId");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SymptomLog" ADD CONSTRAINT "SymptomLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RppgV8Session" ADD CONSTRAINT "RppgV8Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RppgV8PredictionResult" ADD CONSTRAINT "RppgV8PredictionResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
