const pool = require('../utils/db');
const bcrypt = require('bcrypt');

class User {
  static async create(email, password) {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, email, email_verified, plan, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async setVerificationToken(userId, token, expires) {
    await pool.query(
      'UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3',
      [token, expires, userId]
    );
  }

  static async verifyEmail(token) {
    const result = await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1 AND verification_expires > NOW() RETURNING id',
      [token]
    );
    return result.rows[0];
  }

  static async comparePassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
}

module.exports = User;
