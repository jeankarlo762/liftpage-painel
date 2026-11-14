-- CreateEnum
CREATE TYPE "Billing" AS ENUM ('MONTHLY', 'LIFETIME');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billing" "Billing" NOT NULL DEFAULT 'MONTHLY';
