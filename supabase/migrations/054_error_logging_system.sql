-- ============================================================================
-- ERROR LOGGING SYSTEM FOR EVEMASTER
-- ============================================================================
-- This migration creates a comprehensive error logging system that captures
-- all database errors, API errors, and application errors.
-- ============================================================================

-- ============================================================================
-- 1. CREATE ERROR LOG TABLE
-- ============================================================================
-- Stores all application errors with detailed information

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Error Classification
  error_type TEXT NOT NULL DEFAULT 'unknown',  -- database, api, auth, payment, registration, etc.
  error_code TEXT,                              -- PostgreSQL error code (e.g., 23505, 42703)
  error_severity TEXT DEFAULT 'error',          -- debug, info, warning, error, critical
  
  -- Error Details
  error_title TEXT NOT NULL,                    -- Human-readable title (e.g., "Foreign Key Violation")
  error_message TEXT NOT NULL,                  -- The actual error message
  error_detail TEXT,                            -- Additional details (SQLSTATE detail)
  error_hint TEXT,                              -- Suggestion to fix (SQLSTATE hint)
  
  -- Context Information
  schema_name TEXT,                             -- Schema where error occurred
  table_name TEXT,                              -- Table involved
  column_name TEXT,                             -- Column involved (if applicable)
  constraint_name TEXT,                         -- Constraint that failed (if applicable)
  
  -- Query Information
  query_text TEXT,                              -- The SQL query that caused the error
  query_params JSONB,                           -- Parameters passed to the query
  
  -- User & Session Context
  user_id UUID,                                 -- User who triggered the error
  user_email TEXT,                              -- User email for quick reference
  session_id TEXT,                              -- Session identifier
  ip_address INET,                              -- Client IP address
  user_agent TEXT,                              -- Browser/client info
  
  -- Request Context
  request_method TEXT,                          -- GET, POST, PUT, DELETE
  request_path TEXT,                            -- API endpoint path
  request_body JSONB,                           -- Request payload (sanitized)
  
  -- Stack Trace
  stack_trace TEXT,                             -- Full stack trace if available
  
  -- Additional Metadata
  metadata JSONB DEFAULT '{}',                  -- Any additional context
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Resolution Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT
);

-- ============================================================================
-- 2. CREATE INDEXES FOR FAST QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_severity ON error_logs(error_severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_table_name ON error_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_is_resolved ON error_logs(is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_request_path ON error_logs(request_path);

-- ============================================================================
-- 3. ERROR CODE REFERENCE TABLE
-- ============================================================================
-- Maps PostgreSQL error codes to human-readable titles and descriptions

CREATE TABLE IF NOT EXISTS error_code_reference (
  error_code TEXT PRIMARY KEY,
  error_class TEXT NOT NULL,              -- Class of error (e.g., "Integrity Constraint Violation")
  error_title TEXT NOT NULL,              -- Human-readable title
  error_description TEXT,                 -- Detailed description
  common_causes TEXT[],                   -- Array of common causes
  suggested_fixes TEXT[],                 -- Array of suggested fixes
  documentation_url TEXT                  -- Link to documentation
);

-- Insert common PostgreSQL error codes with explanations
INSERT INTO error_code_reference (error_code, error_class, error_title, error_description, common_causes, suggested_fixes) VALUES

-- Class 00 - Successful Completion
('00000', 'Successful Completion', 'Success', 'The operation completed successfully', ARRAY['N/A'], ARRAY['N/A']),

-- Class 23 - Integrity Constraint Violation
('23000', 'Integrity Constraint Violation', 'Generic Constraint Violation', 'A constraint was violated but the specific type is unknown', 
  ARRAY['Invalid data', 'Missing required relationship'], 
  ARRAY['Check the data being inserted', 'Verify foreign key references exist']),

('23001', 'Integrity Constraint Violation', 'Restrict Violation', 'Cannot delete/update due to RESTRICT constraint', 
  ARRAY['Trying to delete a record that has dependent records', 'Foreign key with RESTRICT action'], 
  ARRAY['Delete dependent records first', 'Use CASCADE or handle dependencies']),

('23502', 'Integrity Constraint Violation', 'NOT NULL Violation', 'A required field was left empty (NULL)', 
  ARRAY['Missing required field in INSERT', 'NULL value in UPDATE', 'Application not sending required data'], 
  ARRAY['Ensure all required fields are provided', 'Check frontend form validation', 'Add default value to column']),

('23503', 'Integrity Constraint Violation', 'Foreign Key Violation', 'Referenced record does not exist', 
  ARRAY['Inserting with non-existent foreign key', 'Referenced record was deleted', 'Wrong ID being passed'], 
  ARRAY['Create the referenced record first', 'Verify the ID exists before insert', 'Check the relationship logic']),

('23505', 'Integrity Constraint Violation', 'Unique Violation (Duplicate)', 'A duplicate value was inserted in a unique column', 
  ARRAY['Email already registered', 'Duplicate primary key', 'Unique constraint on column'], 
  ARRAY['Check if record exists before insert', 'Use UPSERT (ON CONFLICT)', 'Show user-friendly "already exists" message']),

('23514', 'Integrity Constraint Violation', 'Check Constraint Violation', 'Value failed a CHECK constraint', 
  ARRAY['Value out of allowed range', 'Invalid enum value', 'Business rule violation'], 
  ARRAY['Verify the allowed values', 'Check the constraint definition', 'Validate data before sending']),

-- Class 22 - Data Exception
('22001', 'Data Exception', 'String Too Long', 'The string value is too long for the column', 
  ARRAY['Text exceeds VARCHAR limit', 'User input too long'], 
  ARRAY['Truncate the string', 'Increase column size', 'Add frontend validation']),

('22003', 'Data Exception', 'Numeric Value Out of Range', 'Number is too large or too small for the column type', 
  ARRAY['Integer overflow', 'Decimal precision exceeded'], 
  ARRAY['Use appropriate numeric type', 'Validate number range before insert']),

('22007', 'Data Exception', 'Invalid Date/Time Format', 'The date/time value is not in a valid format', 
  ARRAY['Wrong date format (e.g., MM/DD/YYYY vs YYYY-MM-DD)', 'Invalid date string'], 
  ARRAY['Use ISO 8601 format (YYYY-MM-DD)', 'Parse date on frontend before sending']),

('22008', 'Data Exception', 'Date/Time Overflow', 'Date/time value is out of valid range', 
  ARRAY['Year too far in future/past', 'Invalid timestamp'], 
  ARRAY['Check the date range', 'Use valid timestamps']),

('22012', 'Data Exception', 'Division by Zero', 'Attempted to divide by zero', 
  ARRAY['Division calculation with zero denominator'], 
  ARRAY['Add check for zero before division', 'Use NULLIF to handle zero']),

('22P02', 'Data Exception', 'Invalid Text Representation', 'Cannot convert text to required type', 
  ARRAY['Passing string where number expected', 'Invalid UUID format', 'Invalid boolean value'], 
  ARRAY['Validate data types before sending', 'Use proper type casting']),

-- Class 42 - Syntax Error or Access Rule Violation
('42501', 'Insufficient Privilege', 'Permission Denied', 'User does not have permission for this operation', 
  ARRAY['RLS policy blocking access', 'Missing role permissions', 'User not authenticated'], 
  ARRAY['Check RLS policies', 'Verify user authentication', 'Grant necessary permissions']),

('42601', 'Syntax Error', 'SQL Syntax Error', 'The SQL query has a syntax error', 
  ARRAY['Typo in SQL', 'Missing keyword', 'Invalid SQL structure'], 
  ARRAY['Review the SQL query', 'Check for missing commas, quotes, or keywords']),

('42703', 'Undefined Column', 'Column Does Not Exist', 'The specified column was not found in the table', 
  ARRAY['Typo in column name', 'Column was renamed or deleted', 'Wrong table being queried'], 
  ARRAY['Verify column name spelling', 'Check the table schema', 'Run migration if needed']),

('42704', 'Undefined Object', 'Object Does Not Exist', 'The database object (table, function, etc.) was not found', 
  ARRAY['Table not created', 'Function not defined', 'Wrong schema'], 
  ARRAY['Run pending migrations', 'Create the object', 'Check schema name']),

('42710', 'Duplicate Object', 'Object Already Exists', 'Trying to create something that already exists', 
  ARRAY['Table already exists', 'Policy already exists', 'Index already exists'], 
  ARRAY['Use IF NOT EXISTS clause', 'Drop existing object first']),

('42P01', 'Undefined Table', 'Table Does Not Exist', 'The table referenced does not exist', 
  ARRAY['Table not created', 'Typo in table name', 'Wrong schema'], 
  ARRAY['Run migrations', 'Check table name spelling', 'Verify schema']),

('42P07', 'Duplicate Table', 'Table Already Exists', 'Trying to create a table that already exists', 
  ARRAY['Migration ran twice', 'Table already created'], 
  ARRAY['Use CREATE TABLE IF NOT EXISTS', 'Check existing tables']),

-- Class 28 - Invalid Authorization
('28000', 'Invalid Authorization', 'Invalid Authorization Specification', 'Authentication failed', 
  ARRAY['Wrong password', 'User does not exist', 'Connection string error'], 
  ARRAY['Check credentials', 'Verify user exists', 'Check connection configuration']),

('28P01', 'Invalid Authorization', 'Invalid Password', 'The password provided is incorrect', 
  ARRAY['Wrong password', 'Password changed'], 
  ARRAY['Reset password', 'Check credentials']),

-- Class 40 - Transaction Rollback
('40001', 'Transaction Rollback', 'Serialization Failure', 'Transaction was rolled back due to serialization failure', 
  ARRAY['Concurrent updates to same row', 'Deadlock'], 
  ARRAY['Retry the transaction', 'Use appropriate isolation level']),

('40P01', 'Transaction Rollback', 'Deadlock Detected', 'Two or more transactions are waiting for each other', 
  ARRAY['Concurrent operations on related tables', 'Lock ordering issue'], 
  ARRAY['Retry the operation', 'Review transaction logic']),

-- Class 53 - Insufficient Resources
('53000', 'Insufficient Resources', 'Insufficient Resources', 'Server ran out of resources', 
  ARRAY['Out of memory', 'Too many connections', 'Disk full'], 
  ARRAY['Increase server resources', 'Optimize queries', 'Clean up old data']),

('53100', 'Insufficient Resources', 'Disk Full', 'No more disk space available', 
  ARRAY['Database storage full', 'Log files too large'], 
  ARRAY['Increase storage', 'Clean up old data', 'Archive old logs']),

('53200', 'Insufficient Resources', 'Out of Memory', 'Server ran out of memory', 
  ARRAY['Query too complex', 'Too much data loaded', 'Memory leak'], 
  ARRAY['Optimize query', 'Increase memory', 'Paginate results']),

('53300', 'Insufficient Resources', 'Too Many Connections', 'Maximum connections reached', 
  ARRAY['Connection pool exhausted', 'Connections not being released'], 
  ARRAY['Increase max_connections', 'Use connection pooling', 'Close unused connections']),

-- Class 57 - Operator Intervention
('57014', 'Operator Intervention', 'Query Cancelled', 'Query was cancelled by user or timeout', 
  ARRAY['Statement timeout', 'User cancelled query', 'Connection dropped'], 
  ARRAY['Increase timeout', 'Optimize slow query', 'Check network stability']),

-- Class P0 - PL/pgSQL Error
('P0001', 'PL/pgSQL Error', 'Raise Exception', 'A custom error was raised in a function', 
  ARRAY['Business rule violation in function', 'Custom validation failed'], 
  ARRAY['Check the function logic', 'Review the raised error message']),

-- Class XX - Internal Error
('XX000', 'Internal Error', 'Internal Error', 'An unexpected internal error occurred', 
  ARRAY['Database corruption', 'Bug in PostgreSQL', 'Hardware failure'], 
  ARRAY['Check server logs', 'Contact support', 'Restore from backup']),

-- PGRST Errors (PostgREST/Supabase specific)
('PGRST000', 'PostgREST Error', 'Connection Error', 'Could not connect to the database', 
  ARRAY['Database server down', 'Network issue', 'Wrong connection string'], 
  ARRAY['Check database status', 'Verify connection settings']),

('PGRST100', 'PostgREST Error', 'Parsing Error', 'Could not parse the request', 
  ARRAY['Invalid JSON', 'Malformed request'], 
  ARRAY['Verify request format', 'Check JSON syntax']),

('PGRST102', 'PostgREST Error', 'Invalid Range Header', 'Invalid pagination range', 
  ARRAY['Invalid Range header', 'Out of bounds pagination'], 
  ARRAY['Check Range header format', 'Verify pagination parameters']),

('PGRST116', 'PostgREST Error', 'Not Found (Single Row)', 'Expected one row but found none', 
  ARRAY['Record does not exist', '.single() on empty result'], 
  ARRAY['Use .maybeSingle() instead', 'Check if record exists first']),

('PGRST200', 'PostgREST Error', 'Schema Not Found', 'The schema does not exist', 
  ARRAY['Wrong schema name', 'Schema not created'], 
  ARRAY['Verify schema name', 'Create the schema']),

('PGRST204', 'PostgREST Error', 'Column Not Found in Schema Cache', 'Column not found in cached schema', 
  ARRAY['Column does not exist', 'Schema cache outdated', 'Typo in column name'], 
  ARRAY['Check column name', 'Reload schema cache', 'Run migrations'])

ON CONFLICT (error_code) DO NOTHING;

-- ============================================================================
-- 4. FUNCTION TO LOG ERRORS
-- ============================================================================
-- Call this function to log an error with full context

CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT DEFAULT 'unknown',
  p_error_code TEXT DEFAULT NULL,
  p_error_severity TEXT DEFAULT 'error',
  p_error_title TEXT DEFAULT 'Unknown Error',
  p_error_message TEXT DEFAULT '',
  p_error_detail TEXT DEFAULT NULL,
  p_error_hint TEXT DEFAULT NULL,
  p_schema_name TEXT DEFAULT NULL,
  p_table_name TEXT DEFAULT NULL,
  p_column_name TEXT DEFAULT NULL,
  p_constraint_name TEXT DEFAULT NULL,
  p_query_text TEXT DEFAULT NULL,
  p_query_params JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_method TEXT DEFAULT NULL,
  p_request_path TEXT DEFAULT NULL,
  p_request_body JSONB DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
  v_error_title TEXT;
BEGIN
  -- Try to get a better title from the reference table
  IF p_error_code IS NOT NULL THEN
    SELECT error_title INTO v_error_title 
    FROM error_code_reference 
    WHERE error_code = p_error_code;
  END IF;
  
  -- Use provided title or the one from reference
  v_error_title := COALESCE(v_error_title, p_error_title);
  
  INSERT INTO error_logs (
    error_type, error_code, error_severity,
    error_title, error_message, error_detail, error_hint,
    schema_name, table_name, column_name, constraint_name,
    query_text, query_params,
    user_id, user_email, session_id, ip_address, user_agent,
    request_method, request_path, request_body,
    stack_trace, metadata
  ) VALUES (
    p_error_type, p_error_code, p_error_severity,
    v_error_title, p_error_message, p_error_detail, p_error_hint,
    p_schema_name, p_table_name, p_column_name, p_constraint_name,
    p_query_text, p_query_params,
    p_user_id, p_user_email, p_session_id, p_ip_address, p_user_agent,
    p_request_method, p_request_path, p_request_body,
    p_stack_trace, p_metadata
  ) RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. USEFUL VIEWS FOR ERROR ANALYSIS
-- ============================================================================

-- View: Recent errors (last 24 hours)
CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  el.id,
  el.created_at,
  el.error_severity,
  el.error_type,
  el.error_code,
  COALESCE(ecr.error_title, el.error_title) as error_title,
  el.error_message,
  el.table_name,
  el.user_email,
  el.request_path,
  el.is_resolved
FROM error_logs el
LEFT JOIN error_code_reference ecr ON el.error_code = ecr.error_code
WHERE el.created_at > NOW() - INTERVAL '24 hours'
ORDER BY el.created_at DESC;

-- View: Error summary by type
CREATE OR REPLACE VIEW error_summary_by_type AS
SELECT 
  error_type,
  error_code,
  COALESCE(ecr.error_title, el.error_title) as error_title,
  COUNT(*) as error_count,
  COUNT(*) FILTER (WHERE el.is_resolved = false) as unresolved_count,
  MAX(el.created_at) as last_occurrence
FROM error_logs el
LEFT JOIN error_code_reference ecr ON el.error_code = ecr.error_code
GROUP BY error_type, error_code, COALESCE(ecr.error_title, el.error_title)
ORDER BY error_count DESC;

-- View: Errors by table
CREATE OR REPLACE VIEW error_summary_by_table AS
SELECT 
  table_name,
  error_code,
  COALESCE(ecr.error_title, el.error_title) as error_title,
  COUNT(*) as error_count,
  MAX(el.created_at) as last_occurrence
FROM error_logs el
LEFT JOIN error_code_reference ecr ON el.error_code = ecr.error_code
WHERE table_name IS NOT NULL
GROUP BY table_name, error_code, COALESCE(ecr.error_title, el.error_title)
ORDER BY error_count DESC;

-- View: Critical errors (unresolved)
CREATE OR REPLACE VIEW critical_unresolved_errors AS
SELECT 
  el.*,
  ecr.error_description,
  ecr.common_causes,
  ecr.suggested_fixes
FROM error_logs el
LEFT JOIN error_code_reference ecr ON el.error_code = ecr.error_code
WHERE el.is_resolved = false
  AND el.error_severity IN ('error', 'critical')
ORDER BY el.created_at DESC;

-- ============================================================================
-- 6. USEFUL QUERIES FOR ERROR ANALYSIS
-- ============================================================================

-- You can run these queries directly in pgAdmin:

-- Query 1: See all errors in the last 24 hours with explanations
-- SELECT * FROM recent_errors;

-- Query 2: See error counts grouped by type
-- SELECT * FROM error_summary_by_type;

-- Query 3: See critical unresolved errors with fix suggestions
-- SELECT * FROM critical_unresolved_errors;

-- Query 4: Search for specific error type
-- SELECT * FROM error_logs WHERE error_type = 'registration' ORDER BY created_at DESC LIMIT 50;

-- Query 5: Get errors for a specific user
-- SELECT * FROM error_logs WHERE user_email = 'user@example.com' ORDER BY created_at DESC;

-- Query 6: Most common errors in the last week
/*
SELECT 
  error_code,
  error_title,
  COUNT(*) as occurrences,
  array_agg(DISTINCT error_message) as messages
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY error_code, error_title
ORDER BY occurrences DESC
LIMIT 20;
*/

-- Query 7: Errors by hour (for finding patterns)
/*
SELECT 
  date_trunc('hour', created_at) as hour,
  COUNT(*) as error_count,
  COUNT(DISTINCT error_code) as unique_errors
FROM error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY date_trunc('hour', created_at)
ORDER BY hour DESC;
*/

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_code_reference ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Admins can view error logs" ON error_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- Service role can insert error logs
CREATE POLICY "Service role can insert error logs" ON error_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Everyone can read error code reference
CREATE POLICY "Public can read error codes" ON error_code_reference
  FOR SELECT TO authenticated, anon
  USING (true);

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE error_logs IS 'Stores all application errors with detailed context';
COMMENT ON TABLE error_code_reference IS 'Reference table mapping PostgreSQL error codes to human-readable explanations';
COMMENT ON VIEW recent_errors IS 'Shows errors from the last 24 hours';
COMMENT ON VIEW error_summary_by_type IS 'Aggregates errors by type for analysis';
COMMENT ON VIEW critical_unresolved_errors IS 'Shows unresolved critical/error severity issues';
COMMENT ON FUNCTION log_error IS 'Function to log errors with full context. Call from API routes.';

