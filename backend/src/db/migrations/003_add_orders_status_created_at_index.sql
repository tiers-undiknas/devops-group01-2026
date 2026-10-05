-- Migration 003: Composite index for listing orders by status, newest first
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at
  ON orders(status, created_at DESC);