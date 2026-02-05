const pool = require('../utils/db');
const jwt = require('jsonwebtoken');

class Session {
  static async create(userId) {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );
    
    return token;
  }

  static async findByToken(token) {
    const result = await pool.query(
      'SELECT s.*, u.email, u.email_verified FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = $1 AND s.expires_at > NOW()',
      [token]
    );
    return result.rows[0];
  }

  static async delete(token) {
    await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
}

module.exports = Session;
