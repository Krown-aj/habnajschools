/*
  Warnings:

  - You are about to drop the column `reportcardId` on the `StudentGrade` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `StudentTrait` table. All the data in the column will be lost.
  - You are about to drop the column `reportCardId` on the `StudentTrait` table. All the data in the column will be lost.
  - You are about to drop the column `traitName` on the `StudentTrait` table. All the data in the column will be lost.
  - Added the required column `gradingId` to the `StudentTrait` table without a default value. This is not possible if the table is not empty.
  - Added the required column `traitId` to the `StudentTrait` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudentGrade" DROP CONSTRAINT "StudentGrade_reportcardId_fkey";

-- DropForeignKey
ALTER TABLE "StudentTrait" DROP CONSTRAINT "StudentTrait_reportCardId_fkey";

-- DropIndex
DROP INDEX "StudentTrait_studentId_reportCardId_idx";

-- AlterTable
ALTER TABLE "StudentGrade" DROP COLUMN "reportcardId";

-- AlterTable
ALTER TABLE "StudentTrait" DROP COLUMN "category",
DROP COLUMN "reportCardId",
DROP COLUMN "traitName",
ADD COLUMN     "gradingId" TEXT NOT NULL,
ADD COLUMN     "traitId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TraitCategory" NOT NULL,
    "gradingpolicyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Trait" ADD CONSTRAINT "Trait_gradingpolicyId_fkey" FOREIGN KEY ("gradingpolicyId") REFERENCES "GradingPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTrait" ADD CONSTRAINT "StudentTrait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "Trait"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTrait" ADD CONSTRAINT "StudentTrait_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
