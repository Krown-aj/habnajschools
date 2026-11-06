/*
  Warnings:

  - You are about to drop the column `assessmentId` on the `StudentGrade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,gradingId,subjectId,classId]` on the table `StudentGrade` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "StudentGrade" DROP CONSTRAINT "StudentGrade_assessmentId_fkey";

-- DropIndex
DROP INDEX "StudentGrade_studentId_gradingId_assessmentId_subjectId_cla_idx";

-- DropIndex
DROP INDEX "StudentGrade_studentId_gradingId_assessmentId_subjectId_cla_key";

-- AlterTable
ALTER TABLE "StudentGrade" DROP COLUMN "assessmentId";

-- CreateTable
CREATE TABLE "StudentAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "gradingId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AssessmentToStudentGrade" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssessmentToStudentGrade_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "StudentAssessment_studentId_assessmentId_subjectId_classId__idx" ON "StudentAssessment"("studentId", "assessmentId", "subjectId", "classId", "gradingId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentAssessment_studentId_assessmentId_subjectId_classId__key" ON "StudentAssessment"("studentId", "assessmentId", "subjectId", "classId", "gradingId");

-- CreateIndex
CREATE INDEX "_AssessmentToStudentGrade_B_index" ON "_AssessmentToStudentGrade"("B");

-- CreateIndex
CREATE INDEX "StudentGrade_studentId_gradingId_subjectId_classId_idx" ON "StudentGrade"("studentId", "gradingId", "subjectId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGrade_studentId_gradingId_subjectId_classId_key" ON "StudentGrade"("studentId", "gradingId", "subjectId", "classId");

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentToStudentGrade" ADD CONSTRAINT "_AssessmentToStudentGrade_A_fkey" FOREIGN KEY ("A") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssessmentToStudentGrade" ADD CONSTRAINT "_AssessmentToStudentGrade_B_fkey" FOREIGN KEY ("B") REFERENCES "StudentGrade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
