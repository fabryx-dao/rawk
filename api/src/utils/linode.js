const axios = require('axios');

const LINODE_API_URL = 'https://api.linode.com/v4';
const LINODE_DNS_TOKEN = process.env.LINODE_DNS_TOKEN;
const LINODE_DOMAIN_ID = process.env.LINODE_DOMAIN_ID;

/**
 * Create DNS A record: rawkname.rawk.sh -> IP
 */
async function createDNSRecord(rawkName, ipAddress) {
  try {
    const response = await axios.post(
      `${LINODE_API_URL}/domains/${LINODE_DOMAIN_ID}/records`,
      {
        type: 'A',
        name: rawkName,  // Creates rawkname.rawk.sh
        target: ipAddress,
        ttl_sec: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${LINODE_DNS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      recordId: response.data.id,
      hostname: `${rawkName}.rawk.sh`
    };
  } catch (error) {
    console.error('Linode DNS create error:', error.response?.data || error.message);
    throw new Error(`Failed to create DNS record: ${error.response?.data?.errors?.[0]?.reason || error.message}`);
  }
}

/**
 * Update DNS A record IP address
 */
async function updateDNSRecord(recordId, ipAddress) {
  try {
    const response = await axios.put(
      `${LINODE_API_URL}/domains/${LINODE_DOMAIN_ID}/records/${recordId}`,
      {
        target: ipAddress,
        ttl_sec: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${LINODE_DNS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      recordId: response.data.id
    };
  } catch (error) {
    console.error('Linode DNS update error:', error.response?.data || error.message);
    throw new Error(`Failed to update DNS record: ${error.response?.data?.errors?.[0]?.reason || error.message}`);
  }
}

/**
 * Delete DNS A record
 */
async function deleteDNSRecord(recordId) {
  try {
    await axios.delete(
      `${LINODE_API_URL}/domains/${LINODE_DOMAIN_ID}/records/${recordId}`,
      {
        headers: {
          'Authorization': `Bearer ${LINODE_DNS_TOKEN}`
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Linode DNS delete error:', error.response?.data || error.message);
    throw new Error(`Failed to delete DNS record: ${error.response?.data?.errors?.[0]?.reason || error.message}`);
  }
}

/**
 * Check if DNS record exists
 */
async function recordExists(rawkName) {
  try {
    const response = await axios.get(
      `${LINODE_API_URL}/domains/${LINODE_DOMAIN_ID}/records`,
      {
        headers: {
          'Authorization': `Bearer ${LINODE_DNS_TOKEN}`
        }
      }
    );

    return response.data.data.some(record => 
      record.type === 'A' && record.name === rawkName
    );
  } catch (error) {
    console.error('Linode DNS check error:', error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  createDNSRecord,
  updateDNSRecord,
  deleteDNSRecord,
  recordExists
};
