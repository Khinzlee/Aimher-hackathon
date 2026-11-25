-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "OnboardingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "nationality" TEXT,
    "ethnicity" TEXT,
    "gender" TEXT,
    "phoneNumber" TEXT,
    "bloodGroup" TEXT,
    "genotype" TEXT,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "acanthosisNigricans" TEXT,
    "hasSkinChanges" BOOLEAN,
    "skinTags" TEXT,
    "scalpHairThinning" TEXT,
    "cycleLengthDays" INTEGER,
    "periodsPerYear" INTEGER,
    "lastPeriodDate" TIMESTAMP(3),
    "cycleRegularity" TEXT,
    "bleedingIntensity" TEXT,
    "waistCm" DOUBLE PRECISION,
    "hipCm" DOUBLE PRECISION,
    "nightSweats" TEXT,
    "fatigueLevel" TEXT,
    "familyHistory" JSONB,
    "highBloodPressure" TEXT,
    "selectedWearable" TEXT,
    "rppgBaselineCaptured" BOOLEAN NOT NULL DEFAULT false,
    "rppgCapturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProfile_userId_key" ON "OnboardingProfile"("userId");

-- AddForeignKey
ALTER TABLE "OnboardingProfile" ADD CONSTRAINT "OnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
