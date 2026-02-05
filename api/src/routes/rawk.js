const express = require('express');
const { body, validationResult } = require('express-validator');
const Rawk = require('../models/Rawk');
const { authenticate, requireVerified } = require('../middleware/auth');
const mailcow = require('../utils/mailcow');
const linode = require('../utils/linode');
const hetzner = require('../utils/hetzner');
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

    // Check if email alias already exists
    const aliasExists = await mailcow.aliasExists(`${name}@rawk.sh`);
    if (aliasExists) {
      return res.status(400).json({ error: 'Email address already in use' });
    }

    // Check if DNS record already exists
    const dnsExists = await linode.recordExists(name);
    if (dnsExists) {
      return res.status(400).json({ error: 'DNS record already exists' });
    }

    // Create database record
    const rawk = await Rawk.create(req.user.id, name, {});
    
    // Track what we've created for rollback
    let createdServer = null;
    let createdDNS = null;
    let createdAlias = null;
    
    try {
      // 1. Provision Hetzner server
      console.log(`Provisioning Hetzner server for ${name}...`);
      createdServer = await hetzner.createServer(name);
      
      if (createdServer.mock) {
        console.warn('⚠️  Using MOCK Hetzner server - no real server created');
      }

      await Rawk.updateStatus(rawk.id, 'provisioning', {
        serverId: createdServer.serverId,
        ipAddress: createdServer.ipAddress
      });

      // 2. Create DNS A record
      console.log(`Creating DNS record for ${name}.rawk.sh -> ${createdServer.ipAddress}...`);
      createdDNS = await linode.createDNSRecord(name, createdServer.ipAddress);
      
      await Rawk.updateStatus(rawk.id, 'configuring', {
        dnsRecordId: createdDNS.recordId
      });

      // 3. Create email alias
      console.log(`Creating email alias ${name}@rawk.sh...`);
      createdAlias = await mailcow.createAlias(name);

      await Rawk.updateStatus(rawk.id, 'deploying', {
        emailAlias: createdAlias.address,
        deployedAt: new Date()
      });

      // 4. TODO: Trigger Ansible deployment
      console.log(`Ansible deployment for ${name} would be triggered here`);
      
      // For now, mark as online after brief delay
      setTimeout(async () => {
        try {
          await Rawk.updateStatus(rawk.id, 'online');
          console.log(`✅ Rawk ${name} deployment complete`);
        } catch (err) {
          console.error('Failed to update final status:', err);
        }
      }, 5000);

      res.status(202).json({
        message: 'Deployment started',
        rawk: {
          id: rawk.id,
          name: name,
          email: `${name}@rawk.sh`,
          hostname: `${name}.rawk.sh`,
          arcId: `r:${name}`,
          ipAddress: createdServer.ipAddress,
          status: 'deploying',
          mock: createdServer.mock || false
        }
      });

    } catch (deployError) {
      // Rollback on failure
      console.error('Deployment error, rolling back:', deployError);
      
      // Clean up created resources (in reverse order)
      try {
        if (createdAlias) {
          console.log(`Cleaning up email alias: ${createdAlias.address}`);
          await mailcow.deleteAlias(createdAlias.address);
        }
        if (createdDNS) {
          console.log(`Cleaning up DNS record: ${createdDNS.recordId}`);
          await linode.deleteDNSRecord(createdDNS.recordId);
        }
        if (createdServer && !createdServer.mock) {
          console.log(`Cleaning up server: ${createdServer.serverId}`);
          await hetzner.deleteServer(createdServer.serverId);
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }

      // DELETE the database record (don't just mark as error)
      try {
        console.log(`Deleting database record for failed deployment: ${rawk.id}`);
        await pool.query('DELETE FROM rawks WHERE id = $1', [rawk.id]);
      } catch (deleteError) {
        console.error('Failed to delete database record:', deleteError);
      }
      
      throw deployError;
    }

  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ 
      error: 'Deployment failed',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
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
