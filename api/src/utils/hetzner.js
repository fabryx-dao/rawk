const axios = require('axios');

const HETZNER_API_URL = 'https://api.hetzner.cloud/v1';
const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;

// Mock mode when no API token is configured
const MOCK_MODE = !HETZNER_API_TOKEN;

/**
 * Create Hetzner Cloud server
 */
async function createServer(rawkName) {
  if (MOCK_MODE) {
    console.warn('Hetzner API in MOCK MODE - no real server created');
    return {
      success: true,
      serverId: `mock-${Date.now()}`,
      ipAddress: '192.0.2.1',  // TEST-NET-1 (RFC 5737)
      mock: true
    };
  }

  try {
    const response = await axios.post(
      `${HETZNER_API_URL}/servers`,
      {
        name: `${rawkName}-rawk`,
        server_type: 'cx22',  // 2 vCPU, 4GB RAM, 40GB SSD (~$5/mo)
        location: 'nbg1',     // Nuremberg, Germany
        image: 'ubuntu-24.04',
        ssh_keys: [],         // TODO: Add SSH keys
        start_after_create: true,
        labels: {
          rawk: rawkName,
          managed_by: 'rawk-console'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      serverId: response.data.server.id,
      ipAddress: response.data.server.public_net.ipv4.ip,
      serverName: response.data.server.name
    };
  } catch (error) {
    console.error('Hetzner create server error:', error.response?.data || error.message);
    throw new Error(`Failed to create server: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Delete Hetzner Cloud server
 */
async function deleteServer(serverId) {
  if (MOCK_MODE) {
    console.warn('Hetzner API in MOCK MODE - no real server deleted');
    return { success: true, mock: true };
  }

  try {
    await axios.delete(
      `${HETZNER_API_URL}/servers/${serverId}`,
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_TOKEN}`
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Hetzner delete server error:', error.response?.data || error.message);
    throw new Error(`Failed to delete server: ${error.response?.data?.error?.message || error.message}`);
  }
}

/**
 * Get server info
 */
async function getServerInfo(serverId) {
  if (MOCK_MODE) {
    return {
      id: serverId,
      name: 'mock-server',
      status: 'running',
      ipAddress: '192.0.2.1',
      mock: true
    };
  }

  try {
    const response = await axios.get(
      `${HETZNER_API_URL}/servers/${serverId}`,
      {
        headers: {
          'Authorization': `Bearer ${HETZNER_API_TOKEN}`
        }
      }
    );

    return {
      id: response.data.server.id,
      name: response.data.server.name,
      status: response.data.server.status,
      ipAddress: response.data.server.public_net.ipv4.ip
    };
  } catch (error) {
    console.error('Hetzner get server error:', error.response?.data || error.message);
    throw new Error(`Failed to get server info: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = {
  createServer,
  deleteServer,
  getServerInfo,
  isMockMode: () => MOCK_MODE
};
