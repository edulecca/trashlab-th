-- AlterEnum
-- Idempotent: a later-authored migration recreates the enum with REVIEWED and
-- sorts before this one, so guard against a duplicate label on replay.
ALTER TYPE "BillStatus" ADD VALUE IF NOT EXISTS 'REVIEWED';
