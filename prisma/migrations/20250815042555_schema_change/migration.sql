/*
  Warnings:

  - You are about to drop the column `updateAt` on the `Administration` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `fees` on the `PaymentSetup` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `PaymentSetup` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Teacher` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Term` table. All the data in the column will be lost.
  - You are about to drop the column `updateAt` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the `ClassGrade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EffectiveDomain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Grade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PsychomotiveDomain` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudentGrade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectGrade` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Administration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classid` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Class` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseFees` to the `PaymentSetup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `PaymentSetup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PaymentSetup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Teacher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Term` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classid` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Test` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_DUE', 'PAYMENT_CONFIRMED', 'NEW_USER', 'NEW_EVENT', 'NEW_ANNOUNCEMENT', 'ASSIGNMENT_DUE', 'TEST_SCHEDULED', 'GENERAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "TraitCategory" AS ENUM ('AFFECTIVE', 'PSYCHOMOTOR');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('PROMOTED', 'REPEATED', 'GRADUATED', 'WITHDRAWN');

-- DropForeignKey
ALTER TABLE "ClassGrade" DROP CONSTRAINT "ClassGrade_classid_fkey";

-- DropForeignKey
ALTER TABLE "ClassGrade" DROP CONSTRAINT "ClassGrade_gradeid_fkey";

-- DropForeignKey
ALTER TABLE "EffectiveDomain" DROP CONSTRAINT "EffectiveDomain_gradeid_fkey";

-- DropForeignKey
ALTER TABLE "EffectiveDomain" DROP CONSTRAINT "EffectiveDomain_studentid_fkey";

-- DropForeignKey
ALTER TABLE "PsychomotiveDomain" DROP CONSTRAINT "PsychomotiveDomain_gradeid_fkey";

-- DropForeignKey
ALTER TABLE "PsychomotiveDomain" DROP CONSTRAINT "PsychomotiveDomain_studentid_fkey";

-- DropForeignKey
ALTER TABLE "StudentGrade" DROP CONSTRAINT "StudentGrade_studentid_fkey";

-- DropForeignKey
ALTER TABLE "StudentGrade" DROP CONSTRAINT "StudentGrade_subjectgradeid_fkey";

-- DropForeignKey
ALTER TABLE "SubjectGrade" DROP CONSTRAINT "SubjectGrade_classid_fkey";

-- DropForeignKey
ALTER TABLE "SubjectGrade" DROP CONSTRAINT "SubjectGrade_subjectid_fkey";

-- AlterTable
ALTER TABLE "Administration" DROP COLUMN "updateAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "updateAt",
ADD COLUMN     "classid" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "level",
DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Parent" DROP COLUMN "updateAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "updateAt",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PaymentSetup" DROP COLUMN "fees",
DROP COLUMN "updateAt",
ADD COLUMN     "baseFees" INTEGER NOT NULL,
ADD COLUMN     "level" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "updateAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "updateAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Term" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "updateAt",
ADD COLUMN     "classid" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ClassGrade";

-- DropTable
DROP TABLE "EffectiveDomain";

-- DropTable
DROP TABLE "Grade";

-- DropTable
DROP TABLE "PsychomotiveDomain";

-- DropTable
DROP TABLE "StudentGrade";

-- DropTable
DROP TABLE "SubjectGrade";

-- CreateTable
CREATE TABLE "GradingPolicy" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT,
    "classId" TEXT,
    "session" TEXT NOT NULL,
    "term" "Terms" NOT NULL,
    "passMark" INTEGER NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "maxScore" INTEGER NOT NULL,
    "gradingPolicyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "term" "Terms" NOT NULL,
    "totalScore" DOUBLE PRECISION,
    "averageScore" DOUBLE PRECISION,
    "classPosition" INTEGER,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAssessment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTrait" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "category" "TraitCategory" NOT NULL,
    "traitName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPromotion" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromClassId" TEXT NOT NULL,
    "toClassId" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "promotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PromotionStatus" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "broadcast" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT,
    "teacherId" TEXT,
    "parentId" TEXT,
    "adminId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classid_fkey" FOREIGN KEY ("classid") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_classid_fkey" FOREIGN KEY ("classid") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingPolicy" ADD CONSTRAINT "GradingPolicy_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingPolicy" ADD CONSTRAINT "GradingPolicy_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_gradingPolicyId_fkey" FOREIGN KEY ("gradingPolicyId") REFERENCES "GradingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAssessment" ADD CONSTRAINT "StudentAssessment_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTrait" ADD CONSTRAINT "StudentTrait_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTrait" ADD CONSTRAINT "StudentTrait_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "ReportCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotion" ADD CONSTRAINT "StudentPromotion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotion" ADD CONSTRAINT "StudentPromotion_fromClassId_fkey" FOREIGN KEY ("fromClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotion" ADD CONSTRAINT "StudentPromotion_toClassId_fkey" FOREIGN KEY ("toClassId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Administration"("id") ON DELETE SET NULL ON UPDATE CASCADE;
