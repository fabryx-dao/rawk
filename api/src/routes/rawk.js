const express = require('express');
const { body, validationResult } = require('express-validator');
const Rawk = require('../models/Rawk');
const { authenticate, requireVerified } = require('../middleware/auth');

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
        config: rawk.config
      }
    });
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Deploy new rawk
router.post('/deploy', requireVerified, [
  body('name').notEmpty().trim(),
  body('config').isObject()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, config } = req.body;

    // Check if user already has a rawk
    const existing = await Rawk.findByUserId(req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'Rawk already deployed' });
    }

    // Create rawk record
    const rawk = await Rawk.create(req.user.id, name, config);

    // TODO: Trigger Ansible deployment
    // For now, just set status to deploying
    await Rawk.updateStatus(rawk.id, 'deploying');

    res.status(202).json({
      message: 'Deployment started',
      rawkId: rawk.id
    });
  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ error: 'Deployment failed' });
  }
});

// Restart rawk
router.post('/restart', requireVerified, async (req, res) => {
  try {
    const rawk = await Rawk.findByUserId(req.user.id);
    
    if (!rawk) {
      return res.status(404).json({ error: 'No rawk found' });
    }

    // TODO: Trigger restart via SSH or API
    
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
      return res.status(404).json({ error: 'No rawk found' });
    }

    // TODO: Destroy Hetzner server and redeploy
    
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
      return res.status(404).json({ error: 'No rawk found' });
    }

    // TODO: Fetch from Hetzner API
    // For now, return mock data
    res.json({
      cpu: 12,
      memory: { used: 847, total: 2048 },
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
