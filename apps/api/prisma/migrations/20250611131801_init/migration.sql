-- CreateEnum
CREATE TYPE "Seniority" AS ENUM ('junior', 'senior');

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "seniority" "Seniority" NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "availability" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Candidate_name_surname_idx" ON "Candidate"("name", "surname");

-- CreateIndex
CREATE INDEX "Candidate_seniority_idx" ON "Candidate"("seniority");

-- CreateIndex
CREATE INDEX "Candidate_availability_idx" ON "Candidate"("availability");
