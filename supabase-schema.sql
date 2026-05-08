-- Cognitive OS Debugger - Supabase Schema

-- Create a table for System Logs
CREATE TABLE system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Optional: Link to auth.users if using Supabase Auth
    rant TEXT NOT NULL,
    scores JSONB NOT NULL,
    fault_detected TEXT,
    patch_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies (Example: Allow anonymous insert for testing)
CREATE POLICY "Allow anonymous insert" ON system_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous read" ON system_logs
    FOR SELECT
    USING (true);
