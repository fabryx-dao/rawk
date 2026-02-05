const Session = require('../models/Session');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const session = await Session.findByToken(token);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = {
    id: session.user_id,
    email: session.email,
    emailVerified: session.email_verified
  };

  next();
}

function requireVerified(req, res, next) {
  if (!req.user.emailVerified) {
    return res.status(403).json({ error: 'Email not verified' });
  }
  next();
}

module.exports = { authenticate, requireVerified };
