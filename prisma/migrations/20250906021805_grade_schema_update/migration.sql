/*
  Warnings:

  - You are about to drop the column `classId` on the `GradingPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `session` on the `GradingPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `GradingPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `term` on the `GradingPolicy` table. All the data in the column will be lost.
  - You are about to drop the column `session` on the `ReportCard` table. All the data in the column will be lost.
  - You are about to drop the column `term` on the `ReportCard` table. All the data in the column will be lost.
  - You are about to drop the `StudentAssessment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[gradingPolicyId,name]` on the table `Assessment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gradingId` to the `ReportCard` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GradingPolicy" DROP CONSTRAINT "GradingPolicy_classId_fkey";

-- DropForeignKey
ALTER TABLE "GradingPolicy" DROP CONSTRAINT "GradingPolicy_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAssessment" DROP CONSTRAINT "StudentAssessment_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAssessment" DROP CONSTRAINT "StudentAssessment_reportCardId_fkey";

-- DropForeignKey
ALTER TABLE "StudentAssessment" DROP CONSTRAINT "StudentAssessment_studentId_fkey";

-- AlterTable
ALTER TABLE "GradingPolicy" DROP COLUMN "classId",
DROP COLUMN "session",
DROP COLUMN "subjectId",
DROP COLUMN "term";

-- AlterTable
ALTER TABLE "ReportCard" DROP COLUMN "session",
DROP COLUMN "term",
ADD COLUMN     "formmasterRemark" TEXT,
ADD COLUMN     "gradingId" TEXT NOT NULL,
ALTER COLUMN "classPosition" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "StudentAssessment";

-- CreateTable
CREATE TABLE "Grading" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "term" "Terms" NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "gradingPolicyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGrade" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "remark" TEXT,
    "subjectPosition" TEXT,
    "assessmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "gradingId" TEXT NOT NULL,
    "reportcardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Grading_session_term_gradingPolicyId_idx" ON "Grading"("session", "term", "gradingPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "Grading_gradingPolicyId_session_term_key" ON "Grading"("gradingPolicyId", "session", "term");

-- CreateIndex
CREATE INDEX "StudentGrade_studentId_gradingId_assessmentId_subjectId_cla_idx" ON "StudentGrade"("studentId", "gradingId", "assessmentId", "subjectId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGrade_studentId_gradingId_assessmentId_subjectId_cla_key" ON "StudentGrade"("studentId", "gradingId", "assessmentId", "subjectId", "classId");

-- CreateIndex
CREATE INDEX "Assessment_gradingPolicyId_idx" ON "Assessment"("gradingPolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_gradingPolicyId_name_key" ON "Assessment"("gradingPolicyId", "name");

-- CreateIndex
CREATE INDEX "GradingPolicy_createdAt_idx" ON "GradingPolicy"("createdAt");

-- CreateIndex
CREATE INDEX "ReportCard_studentId_gradingId_classId_idx" ON "ReportCard"("studentId", "gradingId", "classId");

-- CreateIndex
CREATE INDEX "StudentTrait_studentId_reportCardId_idx" ON "StudentTrait"("studentId", "reportCardId");

-- AddForeignKey
ALTER TABLE "Grading" ADD CONSTRAINT "Grading_gradingPolicyId_fkey" FOREIGN KEY ("gradingPolicyId") REFERENCES "GradingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_reportcardId_fkey" FOREIGN KEY ("reportcardId") REFERENCES "ReportCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
