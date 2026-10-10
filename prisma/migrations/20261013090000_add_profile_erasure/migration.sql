-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "retainUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ClientProject" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledBy" TEXT;

