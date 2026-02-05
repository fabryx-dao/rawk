const axios = require('axios');

const MAILCOW_API_URL = 'https://mail.rawk.sh/api/v1';
const MAILCOW_API_KEY = process.env.MAILCOW_API_KEY;

/**
 * Create email alias: rawkname@rawk.sh -> rawkname@rawkname.rawk.sh
 */
async function createAlias(rawkName) {
  try {
    const response = await axios.post(
      `${MAILCOW_API_URL}/add/alias`,
      {
        address: `${rawkName}@rawk.sh`,
        goto: `${rawkName}@${rawkName}.rawk.sh`,
        active: '1'
      },
      {
        headers: {
          'X-API-Key': MAILCOW_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // Mailcow returns different formats depending on success/error
    const data = response.data;
    
    if (data.type === 'success' || (Array.isArray(data.msg) && data.msg.length > 0)) {
      return {
        success: true,
        aliasId: Array.isArray(data.msg) ? data.msg[0] : null,
        address: `${rawkName}@rawk.sh`
      };
    }
    
    throw new Error(data.msg || 'Unknown error creating alias');
  } catch (error) {
    console.error('Mailcow create alias error:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.msg || error.message;
    throw new Error(`Failed to create email alias: ${errorMsg}`);
  }
}

/**
 * Delete email alias
 */
async function deleteAlias(address) {
  try {
    const response = await axios.post(
      `${MAILCOW_API_URL}/delete/alias`,
      [address],
      {
        headers: {
          'X-API-Key': MAILCOW_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Mailcow delete alias error:', error.response?.data || error.message);
    throw new Error(`Failed to delete email alias: ${error.response?.data?.msg || error.message}`);
  }
}

/**
 * Check if alias exists
 */
async function aliasExists(address) {
  try {
    const response = await axios.get(
      `${MAILCOW_API_URL}/get/alias/all`,
      {
        headers: {
          'X-API-Key': MAILCOW_API_KEY
        }
      }
    );

    // Mailcow returns array of aliases or empty array
    const aliases = Array.isArray(response.data) ? response.data : [];
    return aliases.some(alias => alias.address === address);
  } catch (error) {
    console.error('Mailcow check alias error:', error.response?.data || error.message);
    return false;
  }
}

module.exports = {
  createAlias,
  deleteAlias,
  aliasExists
};
