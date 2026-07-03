-- AlterEnum
BEGIN;
CREATE TYPE "BillStatus_new" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'PAID', 'FAILED');
ALTER TABLE "Bill" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Bill" ALTER COLUMN "status" TYPE "BillStatus_new" USING ("status"::text::"BillStatus_new");
ALTER TYPE "BillStatus" RENAME TO "BillStatus_old";
ALTER TYPE "BillStatus_new" RENAME TO "BillStatus";
DROP TYPE "BillStatus_old";
ALTER TABLE "Bill" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
