ALTER TYPE "PromotionStatus" ADD VALUE 'TRANSFERRED';

ALTER TABLE "StudentPromotion" ADD COLUMN "actorId" TEXT;
