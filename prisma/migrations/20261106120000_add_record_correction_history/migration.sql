CREATE TABLE "RecordCorrection" (
    "id" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "studentId" TEXT,
    "reason" VARCHAR(1000) NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordCorrection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecordCorrection_recordType_recordId_createdAt_idx"
ON "RecordCorrection"("recordType", "recordId", "createdAt");

CREATE INDEX "RecordCorrection_studentId_createdAt_idx"
ON "RecordCorrection"("studentId", "createdAt");
