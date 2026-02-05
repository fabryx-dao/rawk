-- Add deployment state tracking to rawks table
-- This enables resumable deployment with detailed step tracking

-- Add deployment_state JSONB column to track individual steps
ALTER TABLE rawks ADD COLUMN IF NOT EXISTS deployment_state JSONB DEFAULT '{
  "steps": {
    "config_saved": {"status": "pending", "timestamp": null, "error": null},
    "email_created": {"status": "pending", "timestamp": null, "error": null, "data": {}},
    "dns_created": {"status": "pending", "timestamp": null, "error": null, "data": {}},
    "server_provisioned": {"status": "pending", "timestamp": null, "error": null, "data": {}},
    "software_installed": {"status": "pending", "timestamp": null, "error": null, "data": {}}
  },
  "current_step": null,
  "can_retry": false,
  "retry_from_step": null
}'::jsonb;

-- Add deployment error message field
ALTER TABLE rawks ADD COLUMN IF NOT EXISTS deployment_error TEXT;

-- Update existing rawks to have proper deployment_state
UPDATE rawks 
SET deployment_state = jsonb_set(
  deployment_state,
  '{steps,config_saved,status}',
  '"completed"'
)
WHERE deployment_state IS NOT NULL;

-- Create index for faster deployment status queries
CREATE INDEX IF NOT EXISTS idx_rawks_status ON rawks(status);
CREATE INDEX IF NOT EXISTS idx_rawks_user_status ON rawks(user_id, status);
