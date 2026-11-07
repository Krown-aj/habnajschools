CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'GRADUATED', 'WITHDRAWN');

ALTER TABLE "Student"
ADD COLUMN "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED';
