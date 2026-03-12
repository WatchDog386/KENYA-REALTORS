-- Create login_activity table to track all user logins
CREATE TABLE IF NOT EXISTS login_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  role VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  logout_timestamp TIMESTAMP WITH TIME ZONE,
  session_duration_minutes INTEGER,
  login_status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'session_ended'
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_timestamp ON login_activity(login_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_email ON login_activity(email);
CREATE INDEX IF NOT EXISTS idx_login_activity_role ON login_activity(role);

-- Enable RLS
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Super admins can see all login activities
CREATE POLICY "super_admin_view_all_login_activity"
  ON login_activity
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'super_admin'
    )
  );

-- RLS Policy: Users can see their own login activity
CREATE POLICY "users_view_own_login_activity"
  ON login_activity
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Service role can insert login activity
CREATE POLICY "service_role_insert_login_activity"
  ON login_activity
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON login_activity TO authenticated;
GRANT INSERT ON login_activity TO authenticated;
GRANT ALL ON login_activity TO service_role;
