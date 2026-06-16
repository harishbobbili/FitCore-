CREATE TABLE IF NOT EXISTS rate_limits (
  identifier TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, window_start)
);

-- Index for fast TTL cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- Optional: RLS policy to allow server-side inserts/updates without auth context
-- (Rate limits are written by the backend, not by users directly)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow server operations" ON rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- Stored cleanup procedure (optional — can also be called from a cron job or Edge Function)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
