-- O plano Basic foi removido: quem estiver nele passa para o Pro antes de trocar o enum.
UPDATE "Subscription" SET "plan" = 'PRO' WHERE "plan" = 'BASIC';

-- AlterEnum
BEGIN;
CREATE TYPE "Plan_new" AS ENUM ('PRO', 'PREMIUM');
ALTER TABLE "public"."Subscription" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "plan" TYPE "Plan_new" USING ("plan"::text::"Plan_new");
ALTER TYPE "Plan" RENAME TO "Plan_old";
ALTER TYPE "Plan_new" RENAME TO "Plan";
DROP TYPE "public"."Plan_old";
ALTER TABLE "Subscription" ALTER COLUMN "plan" SET DEFAULT 'PRO';
COMMIT;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "stripeCustomerId" TEXT,
ALTER COLUMN "plan" SET DEFAULT 'PRO';

