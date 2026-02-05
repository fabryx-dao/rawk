const pool = require('../utils/db');

class Rawk {
  static async create(userId, name, config) {
    const result = await pool.query(
      'INSERT INTO rawks (user_id, name, config) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, JSON.stringify(config)]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM rawks WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, data = {}) {
    const fields = ['status = $1', 'updated_at = NOW()'];
    const values = [status];
    let paramCount = 2;

    if (data.serverId) {
      fields.push(`server_id = $${paramCount++}`);
      values.push(data.serverId);
    }
    if (data.ipAddress) {
      fields.push(`ip_address = $${paramCount++}`);
      values.push(data.ipAddress);
    }
    if (data.deployedAt) {
      fields.push(`deployed_at = $${paramCount++}`);
      values.push(data.deployedAt);
    }

    values.push(id);
    const query = `UPDATE rawks SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Rawk;
