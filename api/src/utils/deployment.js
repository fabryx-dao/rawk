const Rawk = require('../models/Rawk');
const mailcow = require('./mailcow');
const linode = require('./linode');
const hetzner = require('./hetzner');
const pool = require('./db');

/**
 * Deployment orchestrator with state machine and retry logic
 */

const DEPLOYMENT_STEPS = [
  'config_saved',
  'email_created',
  'dns_created',
  'server_provisioned',
  'software_installed'
];

/**
 * Initialize a new deployment
 */
async function initializeDeployment(rawkId, name) {
  // Mark config_saved as completed
  await Rawk.updateDeploymentStep(rawkId, 'config_saved', 'completed', {
    data: { name }
  });
  
  await Rawk.setCurrentStep(rawkId, 'email_created');
  
  // Start the deployment async
  executeDeployment(rawkId, name, 'email_created').catch(err => {
    console.error(`Deployment failed for ${name}:`, err);
  });
  
  return { started: true };
}

/**
 * Retry deployment from a specific step
 */
async function retryDeployment(rawkId) {
  const result = await pool.query('SELECT * FROM rawks WHERE id = $1', [rawkId]);
  const rawk = result.rows[0];
  
  if (!rawk) {
    throw new Error('Rawk not found');
  }
  
  const deploymentState = rawk.deployment_state;
  const retryFromStep = deploymentState.retry_from_step;
  
  if (!retryFromStep) {
    throw new Error('No retry step available');
  }
  
  // Reset the failed step
  await Rawk.updateDeploymentStep(rawkId, retryFromStep, 'pending', {});
  await Rawk.setCurrentStep(rawkId, retryFromStep);
  await pool.query(
    'UPDATE rawks SET deployment_error = NULL WHERE id = $1',
    [rawkId]
  );
  
  // Continue deployment
  executeDeployment(rawkId, rawk.name, retryFromStep).catch(err => {
    console.error(`Retry failed for ${rawk.name}:`, err);
  });
  
  return { retrying: true, from: retryFromStep };
}

/**
 * Start fresh - delete all external resources and DB record
 */
async function startFresh(rawkId) {
  const result = await pool.query('SELECT * FROM rawks WHERE id = $1', [rawkId]);
  const rawk = result.rows[0];
  
  if (!rawk) {
    throw new Error('Rawk not found');
  }
  
  const deploymentState = rawk.deployment_state || { steps: {} };
  const steps = deploymentState.steps || {};
  
  // Clean up created resources in reverse order
  console.log(`Starting fresh for ${rawk.name} - cleaning up resources...`);
  
  try {
    // Delete email if created
    if (steps.email_created?.status === 'completed' && steps.email_created?.data?.address) {
      console.log(`Deleting email alias: ${steps.email_created.data.address}`);
      await mailcow.deleteAlias(steps.email_created.data.address).catch(err => {
        console.error('Failed to delete email alias:', err);
      });
    }
    
    // Delete DNS if created
    if (steps.dns_created?.status === 'completed' && steps.dns_created?.data?.recordId) {
      console.log(`Deleting DNS record: ${steps.dns_created.data.recordId}`);
      await linode.deleteDNSRecord(steps.dns_created.data.recordId).catch(err => {
        console.error('Failed to delete DNS record:', err);
      });
    }
    
    // Delete server if created
    if (steps.server_provisioned?.status === 'completed' && rawk.server_id && !steps.server_provisioned?.data?.mock) {
      console.log(`Deleting Hetzner server: ${rawk.server_id}`);
      await hetzner.deleteServer(rawk.server_id).catch(err => {
        console.error('Failed to delete Hetzner server:', err);
      });
    }
  } catch (cleanupError) {
    console.error('Cleanup error during start fresh:', cleanupError);
  }
  
  // Delete database record
  await pool.query('DELETE FROM rawks WHERE id = $1', [rawkId]);
  
  return { deleted: true };
}

/**
 * Execute deployment steps
 */
async function executeDeployment(rawkId, name, startFromStep = 'email_created') {
  const stepIndex = DEPLOYMENT_STEPS.indexOf(startFromStep);
  
  if (stepIndex === -1) {
    throw new Error(`Invalid start step: ${startFromStep}`);
  }
  
  const stepsToExecute = DEPLOYMENT_STEPS.slice(stepIndex);
  
  for (const step of stepsToExecute) {
    try {
      await Rawk.setCurrentStep(rawkId, step);
      
      console.log(`[${name}] Executing step: ${step}`);
      
      switch (step) {
        case 'email_created':
          await executeEmailStep(rawkId, name);
          break;
        case 'dns_created':
          await executeDNSStep(rawkId, name);
          break;
        case 'server_provisioned':
          await executeServerStep(rawkId, name);
          break;
        case 'software_installed':
          await executeSoftwareStep(rawkId, name);
          break;
      }
      
      console.log(`[${name}] Step completed: ${step}`);
      
    } catch (error) {
      console.error(`[${name}] Step failed: ${step}`, error);
      
      // Mark step as failed
      await Rawk.updateDeploymentStep(rawkId, step, 'failed', {
        error: error.message
      });
      
      // Mark as retryable
      await Rawk.setRetryable(rawkId, true, step);
      await Rawk.updateStatus(rawkId, 'deployment_failed');
      
      throw error;
    }
  }
  
  // All steps complete
  await Rawk.setCurrentStep(rawkId, null);
  await Rawk.updateStatus(rawkId, 'online', { deployedAt: new Date() });
  
  console.log(`[${name}] Deployment complete!`);
}

/**
 * Individual step executors
 */

async function executeEmailStep(rawkId, name) {
  const address = `${name}@rawk.sh`;
  
  // Check if already exists
  const aliasExists = await mailcow.aliasExists(address);
  if (aliasExists) {
    throw new Error('Email address already in use');
  }
  
  const result = await mailcow.createAlias(name);
  
  await Rawk.updateDeploymentStep(rawkId, 'email_created', 'completed', {
    data: { address: result.address }
  });
  
  await Rawk.updateStatus(rawkId, 'provisioning');
}

async function executeDNSStep(rawkId, name) {
  // Check if already exists
  const dnsExists = await linode.recordExists(name);
  if (dnsExists) {
    throw new Error('DNS record already exists');
  }
  
  // Get the IP address from server provisioning or use a placeholder
  const result = await pool.query('SELECT ip_address FROM rawks WHERE id = $1', [rawkId]);
  const ipAddress = result.rows[0]?.ip_address || '0.0.0.0'; // Will be updated after server creation
  
  const dnsResult = await linode.createDNSRecord(name, ipAddress);
  
  await Rawk.updateDeploymentStep(rawkId, 'dns_created', 'completed', {
    data: { recordId: dnsResult.recordId }
  });
}

async function executeServerStep(rawkId, name) {
  const serverResult = await hetzner.createServer(name);
  
  await Rawk.updateStatus(rawkId, 'provisioning', {
    serverId: serverResult.serverId,
    ipAddress: serverResult.ipAddress
  });
  
  await Rawk.updateDeploymentStep(rawkId, 'server_provisioned', 'completed', {
    data: {
      serverId: serverResult.serverId,
      ipAddress: serverResult.ipAddress,
      mock: serverResult.mock || false
    }
  });
  
  // Update DNS record with real IP if we got one
  if (serverResult.ipAddress && serverResult.ipAddress !== '0.0.0.0') {
    const rawkData = await pool.query('SELECT * FROM rawks WHERE id = $1', [rawkId]);
    const rawk = rawkData.rows[0];
    const dnsRecordId = rawk.deployment_state?.steps?.dns_created?.data?.recordId;
    
    if (dnsRecordId) {
      await linode.updateDNSRecord(dnsRecordId, serverResult.ipAddress);
    }
  }
}

async function executeSoftwareStep(rawkId, name) {
  // TODO: Trigger Ansible deployment
  console.log(`[${name}] Would trigger Ansible deployment here`);
  
  // Simulate deployment time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await Rawk.updateDeploymentStep(rawkId, 'software_installed', 'completed', {
    data: { method: 'ansible' }
  });
  
  await Rawk.updateStatus(rawkId, 'deploying');
}

module.exports = {
  initializeDeployment,
  retryDeployment,
  startFresh,
  DEPLOYMENT_STEPS
};
