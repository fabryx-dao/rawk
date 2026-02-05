const express = require('express');
const { body, validationResult } = require('express-validator');
const Rawk = require('../models/Rawk');
const { authenticate, requireVerified } = require('../middleware/auth');
const deployment = require('../utils/deployment');
const pool = require('../utils/db');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's rawk
router.get('/status', async (req, res) => {
  try {
    const rawk = await Rawk.findByUserId(req.user.id);
    
    if (!rawk) {
      return res.json({ deployed: false });
    }

    res.json({
      deployed: true,
      rawk: {
        id: rawk.id,
        name: rawk.name,
        status: rawk.status,
        ipAddress: rawk.ip_address,
        deployedAt: rawk.deployed_at,
        email: `${rawk.name}@rawk.sh`,
        hostname: `${rawk.name}.rawk.sh`,
        arcId: `r:${rawk.name}`,
        config: rawk.config,
        deploymentState: rawk.deployment_state,
        deploymentError: rawk.deployment_error
      }
    });
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Deploy new rawk
router.post('/deploy', requireVerified, [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 32 }).withMessage('Name must be 2-32 characters')
    .matches(/^[a-z0-9]+$/).withMessage('Name must be lowercase letters and numbers only')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name } = req.body;

    // Check if user already has a rawk
    const existing = await Rawk.findByUserId(req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'You already have a Rawk deployed' });
    }

    // Check if name is already taken
    const nameTaken = await Rawk.checkNameExists(name);
    if (nameTaken) {
      return res.status(400).json({ error: 'That name is already taken' });
    }

    // Create database record with initial deployment state
    const rawk = await Rawk.create(req.user.id, name, {});
    await Rawk.updateStatus(rawk.id, 'deploying');
    
    // Start async deployment
    await deployment.initializeDeployment(rawk.id, name);

    res.status(202).json({
      message: 'Deployment started',
      rawk: {
        id: rawk.id,
        name: name,
        email: `${name}@rawk.sh`,
        hostname: `${name}.rawk.sh`,
        arcId: `r:${name}`,
        status: 'deploying'
      }
    });

  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ 
      error: 'Deployment failed',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

// Retry deployment from failed step
router.post('/retry-deployment', requireVerified, async (req, res) => {
  try {
    const rawk = await Rawk.findByUserId(req.user.id);
    
    if (!rawk) {
      return res.status(404).json({ error: 'No Rawk found' });
    }

    if (rawk.status !== 'deployment_failed') {
      return res.status(400).json({ error: 'Deployment has not failed' });
    }

    const result = await deployment.retryDeployment(rawk.id);
    
    res.json({ 
      message: 'Retrying deployment',
      from: result.from
    });
  } catch (err) {
    console.error('Retry error:', err);
    res.status(500).json({ error: err.message || 'Retry failed' });
  }
});

// Start fresh - delete everything and allow re-deploy
router.post('/start-fresh', requireVerified, async (req, res) => {
  try {
    const rawk = await Rawk.findByUserId(req.user.id);
    
    if (!rawk) {
      return res.status(404).json({ error: 'No Rawk found' });
    }

    await deployment.startFresh(rawk.id);
    
    res.json({ message: 'Rawk deleted, you can deploy a new one' });
  } catch (err) {
    console.error('Start fresh error:', err);
    res.status(500).json({ error: err.message || 'Start fresh failed' });
  }
});

// Restart rawk
router.post('/restart', requireVerified, async (req, res) => {
  try {
    const rawk = await Rawk.findByUserId(req.user.id);
    
    if (!rawk) {
      return res.status(404).json({ error: 'No Rawk found' });
    }

    // TODO: Trigger restart via SSH or Hetzner API
    console.log(`Restart initiated for ${rawk.name}`);
    
    res.json({ message: 'Restart initiated' });
  } catch (err) {
    console.error('Restart error:', err);
    res.status(500).json({ error: 'Restart failed' });
  }
});

// Factory reset
router.post('/reset', requireVerified, async (req, res) => {
  try {
    const rawk = await Rawk.findByUserId(req.user.id);
    
    if (!rawk) {
      return res.status(404).json({ error: 'No Rawk found' });
    }

    // TODO: Implement full reset
    // 1. Delete Hetzner server
    // 2. Delete DNS record
    // 3. Delete email alias
    // 4. Redeploy from scratch
    
    console.log(`Reset initiated for ${rawk.name}`);
    
    res.json({ message: 'Reset initiated' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Get server stats
router.get('/stats', requireVerified, async (req, res) => {
  try {
    const rawk = await Rawk.findByUserId(req.user.id);
    
    if (!rawk) {
      return res.status(404).json({ error: 'No Rawk found' });
    }

    // TODO: Fetch from Hetzner API
    // For now, return mock data
    res.json({
      cpu: 12,
      memory: { used: 847, total: 4096 },
      disk: { used: 3200, total: 40960 },
      uptime: '7d 14h 23m',
      cost: 4.99
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
