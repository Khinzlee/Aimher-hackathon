-- CreateTable
CREATE TABLE "RppgV8Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rmssd" REAL NOT NULL,
    "hf" REAL NOT NULL,
    "lfHfRatio" REAL NOT NULL,
    "heartRate" REAL NOT NULL,
    "hrv" REAL NOT NULL,
    "estimatedSpO2" REAL NOT NULL,
    "skinTemperature" REAL NOT NULL,
    "hrTrend" REAL,
    "meanEda" REAL NOT NULL,
    "meanTemp" REAL NOT NULL,
    "asi" REAL,
    "rmssdTrend" REAL,
    "ac" REAL,
    "dc" REAL,
    "acDcRatio" REAL,
    "pulseAmplitude" REAL,
    "signalQuality" REAL,
    "respiratoryRate" REAL,
    "sessionType" TEXT NOT NULL DEFAULT 'checkin',
    "sessionQuality" TEXT,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RppgV8Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RppgV8PredictionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "predictedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nSessionsUsed" INTEGER NOT NULL,
    "sleepQualityScore" REAL,
    "focusMemoryScore" REAL,
    "mentalWellnessScore" REAL,
    "moodScoreScore" REAL,
    "metabolicSyndromeScore" REAL,
    "t2dScore" REAL,
    "cardiovascularScore" REAL,
    "heartFailureScore" REAL,
    "chronicStressScore" REAL,
    "infertilityScore" REAL,
    "moodCheckLabel" TEXT,
    "moodCheckConfidence" REAL,
    "moodCheckProbabilities" TEXT,
    CONSTRAINT "RppgV8PredictionResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RppgV8Session_userId_idx" ON "RppgV8Session"("userId");

-- CreateIndex
CREATE INDEX "RppgV8PredictionResult_userId_idx" ON "RppgV8PredictionResult"("userId");
