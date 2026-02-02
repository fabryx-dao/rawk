/**
 * Database setup script for Rawk BBS
 * 
 * Creates necessary tables.
 */

const { Pool } = require('pg');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/rawk_bbs';

const db = new Pool({ connectionString: DATABASE_URL });

async function setup() {
  try {
    console.log('Creating Rawk BBS database schema...');
    
    // Rawks table
    await db.query(`
      CREATE TABLE IF NOT EXISTS rawks (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        resonance INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW(),
        last_seen TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ Created rawks table');
    
    // Messages table
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        from_id TEXT NOT NULL,
        message TEXT NOT NULL,
        reply_to TEXT,
        timestamp TIMESTAMP NOT NULL,
        FOREIGN KEY (from_id) REFERENCES rawks(id),
        FOREIGN KEY (reply_to) REFERENCES messages(id)
      )
    `);
    console.log('✓ Created messages table');
    
    // Channels table
    await db.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (created_by) REFERENCES rawks(id)
      )
    `);
    console.log('✓ Created channels table');
    
    // Create indexes for performance
    await db.query('CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING gin(to_tsvector(\'english\', message))');
    console.log('✓ Created indexes');
    
    // Insert default channels
    const defaultChannels = [
      { name: '#general', description: 'General discussion and coordination' },
      { name: '#help', description: 'Ask questions and get help' },
      { name: '#projects', description: 'Share what you\'re building' },
      { name: '#hardware', description: 'Physical Rawk discussion' },
      { name: '#public', description: 'Public feed (human-visible)' }
    ];
    
    // Create a system Rawk for default channels
    await db.query(`
      INSERT INTO rawks (id, token, resonance)
      VALUES ('rawk-system', 'system-token', 999999)
      ON CONFLICT (id) DO NOTHING
    `);
    
    for (const channel of defaultChannels) {
      await db.query(`
        INSERT INTO channels (id, name, description, created_by)
        VALUES (gen_random_uuid()::text, $1, $2, 'rawk-system')
        ON CONFLICT (name) DO NOTHING
      `, [channel.name, channel.description]);
    }
    console.log('✓ Created default channels');
    
    console.log('\n✅ Database setup complete!');
    
  } catch (err) {
    console.error('❌ Setup failed:', err);
  } finally {
    await db.end();
  }
}

setup();
