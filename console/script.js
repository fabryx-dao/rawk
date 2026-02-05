// API Configuration
const API_BASE = 'https://api.rawk.sh';

// Auth state
let authToken = localStorage.getItem('rawk_token');
let currentUser = null;

// Check auth on load
window.addEventListener('load', async () => {
  if (authToken) {
    await checkAuth();
  } else {
    showLoginForm();
  }
});

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      document.getElementById('user-email').textContent = currentUser.email;
      await loadRawkStatus();
    } else {
      // Token invalid
      logout();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    logout();
  }
}

// Load Rawk status
async function loadRawkStatus() {
  try {
    const response = await fetch(`${API_BASE}/rawk/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();

    if (data.deployed) {
      showDeployedState(data.rawk);
    } else {
      showNotDeployedState();
    }
  } catch (error) {
    console.error('Failed to load Rawk status:', error);
  }
}

// Show deployed state
function showDeployedState(rawk) {
  const statusIndicator = document.getElementById('status');
  const statusTitle = document.querySelector('.status-title');
  const statusDesc = document.querySelector('.status-desc');
  const sshCommand = document.getElementById('ssh-command');

  // Update status
  if (rawk.status === 'online') {
    statusIndicator.textContent = '● online';
    statusIndicator.classList.add('online');
    statusTitle.textContent = `${rawk.name} is Online`;
  } else {
    statusIndicator.textContent = `● ${rawk.status}`;
    statusTitle.textContent = `${rawk.name} - ${rawk.status}`;
  }

  statusDesc.textContent = `Running at ${rawk.hostname}`;
  
  if (rawk.ipAddress) {
    sshCommand.textContent = `ssh dao@${rawk.ipAddress}`;
  }

  // Show My Rawk panel
  document.getElementById('panel-start').style.display = 'block';
  document.getElementById('panel-deploy').style.display = 'none';
}

// Show not deployed state
function showNotDeployedState() {
  const statusIndicator = document.getElementById('status');
  statusIndicator.textContent = '● not deployed';
  statusIndicator.classList.remove('online');

  // Hide My Rawk, show Deploy
  document.getElementById('panel-start').style.display = 'none';
  showPanel('deploy');
}

// Deploy Rawk
async function deployRawk(name) {
  const logContent = document.querySelector('.log-content');
  const statusEl = document.getElementById('deploy-status');

  logContent.innerHTML = '<div class="log-line">Starting deployment...</div>';
  statusEl.textContent = 'Deploying...';

  try {
    const response = await fetch(`${API_BASE}/rawk/deploy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (response.ok) {
      logContent.innerHTML += `<div class="log-line">Creating DNS record: ${data.rawk.hostname}...</div>`;
      logContent.innerHTML += `<div class="log-line">Creating email alias: ${data.rawk.email}...</div>`;
      
      if (data.rawk.mock) {
        logContent.innerHTML += `<div class="log-line dim">Using mock server (Hetzner API not configured)</div>`;
      } else {
        logContent.innerHTML += `<div class="log-line">Provisioning Hetzner server...</div>`;
      }

      logContent.innerHTML += `<div class="log-line">Configuring ARC: ${data.rawk.arcId}...</div>`;
      logContent.innerHTML += `<div class="log-line dim">Deployment in progress...</div>`;

      // Poll for status
      pollDeploymentStatus();

    } else {
      logContent.innerHTML += `<div class="log-line" style="color: #ff6b6b;">✗ Deployment failed: ${data.error}</div>`;
      statusEl.textContent = 'Failed';
    }
  } catch (error) {
    logContent.innerHTML += `<div class="log-line" style="color: #ff6b6b;">✗ Error: ${error.message}</div>`;
    statusEl.textContent = 'Error';
  }
}

// Poll deployment status
let pollInterval;
async function pollDeploymentStatus() {
  pollInterval = setInterval(async () => {
    const response = await fetch(`${API_BASE}/rawk/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (data.deployed && data.rawk.status === 'online') {
      clearInterval(pollInterval);
      
      const logContent = document.querySelector('.log-content');
      logContent.innerHTML += `<div class="log-line" style="color: var(--lichen);">✓ Deployment complete!</div>`;
      document.getElementById('deploy-status').textContent = 'Online';

      setTimeout(() => {
        showDeployedState(data.rawk);
        showPanel('start');
      }, 2000);
    }
  }, 3000);
}

// Logout
function logout() {
  localStorage.removeItem('rawk_token');
  authToken = null;
  currentUser = null;
  showLoginForm();
}

// Show login form
function showLoginForm() {
  // TODO: Implement proper login UI
  const email = prompt('Email:');
  const password = prompt('Password:');
  
  if (email && password) {
    login(email, password);
  }
}

// Login
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('rawk_token', authToken);
      currentUser = data.user;
      document.getElementById('user-email').textContent = currentUser.email;
      await loadRawkStatus();
    } else {
      alert('Login failed: ' + data.error);
      showLoginForm();
    }
  } catch (error) {
    alert('Login error: ' + error.message);
  }
}

// Panel switching
const navItems = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');

function showPanel(panelId) {
  navItems.forEach(nav => nav.classList.remove('active'));
  const targetNav = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
  if (targetNav) {
    targetNav.classList.add('active');
  }
  
  panels.forEach(panel => panel.classList.remove('active'));
  const targetPanel = document.getElementById(`panel-${panelId}`);
  if (targetPanel) {
    targetPanel.classList.add('active');
  }
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const panelId = item.getAttribute('data-panel');
    showPanel(panelId);
  });
});

// Deploy button
document.getElementById('btn-deploy')?.addEventListener('click', () => {
  const name = prompt('Choose your Rawk name (lowercase letters and numbers only, 2-32 characters):');
  
  if (name) {
    // Validate name
    if (!/^[a-z0-9]{2,32}$/.test(name)) {
      alert('Invalid name. Must be lowercase letters and numbers only, 2-32 characters.');
      return;
    }
    
    deployRawk(name);
  }
});

// Restart Rawk
document.getElementById('btn-restart-rawk')?.addEventListener('click', async () => {
  if (confirm('Restart your Rawk? This will cause a brief interruption (about 30 seconds).')) {
    try {
      const response = await fetch(`${API_BASE}/rawk/restart`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const data = await response.json();
      alert(data.message || 'Restart initiated');
    } catch (error) {
      alert('Restart failed: ' + error.message);
    }
  }
});

// Factory Reset
document.getElementById('btn-factory-reset')?.addEventListener('click', async () => {
  const confirmation = prompt('Type "RESET" to confirm factory reset. This will DELETE ALL DATA and redeploy from scratch.');
  
  if (confirmation === 'RESET') {
    try {
      const response = await fetch(`${API_BASE}/rawk/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const data = await response.json();
      alert(data.message || 'Factory reset initiated');
    } catch (error) {
      alert('Reset failed: ' + error.message);
    }
  } else if (confirmation !== null) {
    alert('Reset cancelled - confirmation did not match.');
  }
});

// Copy SSH command
function copySshCommand() {
  const command = document.getElementById('ssh-command').textContent;
  navigator.clipboard.writeText(command).then(() => {
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = 'var(--lichen)';
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  });
}

// Sign out link
document.querySelector('.header-right .link')?.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});
