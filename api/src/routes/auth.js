const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const { sendVerificationEmail } = require('../utils/email');
const { generateToken } = require('../utils/crypto');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Check if user exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create(email, password);

    // Generate verification token
    const token = generateToken();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await User.setVerificationToken(user.id, token, expires);

    // Send verification email
    await sendVerificationEmail(email, token);

    res.status(201).json({
      message: 'Account created. Please check your email to verify.',
      userId: user.id
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const valid = await User.comparePassword(user, password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const token = await Session.create(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify email
router.get('/verify/:token', async (req, res) => {
  try {
    const result = await User.verifyEmail(req.params.token);
    
    if (!result) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization.substring(7);
    await Session.delete(token);
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
