-- ═══════════════════════════════════════════════════════════════════════════════
-- DEAL DESK — Fix Missing Columns Migration
-- Run this in Supabase SQL Editor to fix "data not saving" bugs.
--
-- Root cause: The projects table was missing client_name, description,
-- progress, due_date columns. The contracts/proposals/invoices tables were
-- missing the client_company column. All inserts were failing silently.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── projects: add missing columns ─────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_name  TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS due_date     DATE;

-- ── contracts: add client_company column ──────────────────────────────────────
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_company TEXT;

-- ── proposals: add client_company column ──────────────────────────────────────
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_company TEXT;

-- ── invoices: add client_company column ───────────────────────────────────────
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_company TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE ✅
-- After running this, all four modules (Invoices, Contracts, Proposals,
-- Projects) will correctly persist data to Supabase.
-- ─────────────────────────────────────────────────────────────────────────────
