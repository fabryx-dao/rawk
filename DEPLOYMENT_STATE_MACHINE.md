# Deployment State Machine Implementation

**Status:** ✅ Deployed to production  
**Date:** 2026-02-05

## Overview

The deployment system now uses a granular state machine that tracks individual deployment steps, enabling:
- **Resumable deployments** — retry from the exact failed step
- **Clear error reporting** — users see exactly what failed and why
- **Start fresh option** — clean up all resources and redeploy with a new name
- **Live progress tracking** — frontend polls and shows real-time deployment status

## Database Schema

Added to `rawks` table:
- `deployment_state` JSONB — tracks status of each deployment step
- `deployment_error` TEXT — stores error message when a step fails

### Deployment Steps

1. **config_saved** — Initial database record created
2. **email_created** — Mailcow alias created (`name@rawk.sh`)
3. **dns_created** — Linode DNS A record created (`name.rawk.sh`)
4. **server_provisioned** — Hetzner server created
5. **software_installed** — Ansible deployment (TODO)

Each step tracks:
- `status`: `pending` | `completed` | `failed`
- `timestamp`: ISO 8601 when step completed/failed
- `error`: Error message if failed
- `data`: Step-specific metadata (IDs, addresses, etc.)

## Backend Architecture

### New Module: `api/src/utils/deployment.js`

**Functions:**
- `initializeDeployment(rawkId, name)` — Start async deployment
- `retryDeployment(rawkId)` — Retry from failed step
- `startFresh(rawkId)` — Delete all resources and DB record
- `executeDeployment(rawkId, name, startFromStep)` — Step executor

**Flow:**
1. User submits wizard → creates DB record with `status=deploying`
2. `initializeDeployment()` marks config_saved complete, starts async execution
3. Each step executes sequentially:
   - Sets `current_step`
   - Executes step logic
   - Marks step `completed` or `failed`
   - On failure: sets `can_retry=true`, `retry_from_step=<failed_step>`
4. On complete: sets `status=online`, clears `current_step`

### API Routes

**New endpoints:**
- `POST /rawk/retry-deployment` — Retry from failed step
- `POST /rawk/start-fresh` — Clean up and delete

**Updated:**
- `GET /rawk/status` — Now includes `deploymentState` and `deploymentError`
- `POST /rawk/deploy` — Uses new deployment orchestrator

## Frontend (console/script.js)

**New functions:**
- `showDeploymentProgress(rawk)` — Live progress display
- `showDeploymentError(rawk)` — Error screen with Retry/Start Over buttons
- `renderDeploymentSteps(deploymentState)` — Render step status with icons
- `startDeploymentPolling()` — Poll `/rawk/status` every 2 seconds
- `retryDeployment()` — Call retry endpoint
- `startFresh()` — Call start fresh endpoint

**User Experience:**

### Success Flow
1. User submits wizard → sees "Starting deployment..."
2. Progress screen shows live updates:
   - ✓ Configuration saved (green)
   - ⏳ Creating email & DNS records... (yellow, animated)
   - ⏳ Configuring DNS... (pending)
   - ⏳ Provisioning server... (pending)
   - ⏳ Installing Rawk software... (pending)
3. Each step turns green with ✓ as it completes
4. Final: "✓ Deployment complete!" → redirects to "My Rawk"

### Failure Flow
1. User sees which step failed with ✗ icon (red)
2. Error message displayed below failed step
3. Two clear buttons:
   - **🔄 Retry from Here** — continues from failed step
   - **🗑️ Start Over** — deletes everything, lets user redeploy with new name

### On Login After Failure
- If `status=deployment_failed`, immediately show error screen
- User can retry or start fresh without re-entering wizard

## Migration

Applied to production:
```sql
-- 003_deployment_states.sql
ALTER TABLE rawks ADD COLUMN deployment_state JSONB;
ALTER TABLE rawks ADD COLUMN deployment_error TEXT;
CREATE INDEX idx_rawks_status ON rawks(status);
```

## Testing Checklist

- [ ] Deploy fresh Rawk → verify all steps complete
- [ ] Simulate email creation failure → verify retry works
- [ ] Simulate DNS failure → verify retry works
- [ ] Simulate server provisioning failure → verify retry works
- [ ] Test "Start Fresh" → verify all resources deleted
- [ ] Close browser mid-deployment → reopen → verify shows progress
- [ ] Close browser after failure → reopen → verify shows error with retry option

## Future Enhancements

1. **Ansible integration** — Complete `software_installed` step
2. **Rollback on failure** — Auto-cleanup partially created resources
3. **Deployment logs** — Store detailed logs for debugging
4. **Email notifications** — Alert user when deployment completes/fails
5. **Wizard UI** — Replace prompt() with proper form
6. **Progress percentage** — Show "3 of 5 steps complete"
7. **Time estimates** — "Server provisioning: ~2-3 minutes remaining"

## Code Locations

- **Database migration:** `api/migrations/003_deployment_states.sql`
- **Deployment orchestrator:** `api/src/utils/deployment.js`
- **Model methods:** `api/src/models/Rawk.js` (updateDeploymentStep, setCurrentStep, setRetryable)
- **API routes:** `api/src/routes/rawk.js`
- **Frontend:** `console/script.js`

## Deployment

```bash
# Applied migration
cat api/migrations/003_deployment_states.sql | ssh rawksh@rawk.sh \
  "sudo docker exec -i rawk_postgres psql -U rawk_admin -d rawk_console"

# Deployed code
cd /var/www/rawk
sudo -u dao git pull origin main
sudo docker-compose restart api
```

**Status:** ✅ Live at https://console.rawk.sh
