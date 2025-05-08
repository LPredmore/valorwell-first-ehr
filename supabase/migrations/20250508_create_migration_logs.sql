
-- Create a migration_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.migration_logs (
  id SERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Log this action
INSERT INTO public.migration_logs (migration_name, description, details)
VALUES (
  '20250508_create_migration_logs',
  'Created or verified migration_logs table',
  jsonb_build_object('action', 'create_table')
);
