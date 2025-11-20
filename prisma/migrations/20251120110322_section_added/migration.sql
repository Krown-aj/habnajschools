-- AlterEnum
ALTER TYPE "NewsCategory" ADD VALUE 'HOLYDAY';

-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "section" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "section" TEXT;
