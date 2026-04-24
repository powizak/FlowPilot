-- Add project finance fields introduced after the init migration was applied.
-- Idempotent so environments that already received these columns via the
-- (now reverted) in-place edit of the init migration don't fail on deploy.

ALTER TABLE "projects"
    ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'CZK';

ALTER TABLE "projects"
    ADD COLUMN IF NOT EXISTS "default_vat_percent" DECIMAL(5,2);
