// API Configuration
const API_BASE = 'https://api.rawk.sh';

// Auth state
let authToken = localStorage.getItem('rawk_token');
let currentUser = null;
let currentRawk = null;

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
      currentRawk = data.rawk;
      
      // Check if deployment is in progress or failed
      if (data.rawk.status === 'deploying' || data.rawk.status === 'provisioning') {
        showDeploymentProgress(data.rawk);
      } else if (data.rawk.status === 'deployment_failed') {
        showDeploymentError(data.rawk);
      } else {
        showDeployedState(data.rawk);
      }
    } else {
      showNotDeployedState();
    }
  } catch (error) {
    console.error('Failed to load Rawk status:', error);
  }
}

// Show deployment progress screen
function showDeploymentProgress(rawk) {
  showPanel('deploy');
  
  const logContent = document.querySelector('.log-content');
  const statusEl = document.getElementById('deploy-status');
  
  logContent.innerHTML = renderDeploymentSteps(rawk.deploymentState);
  statusEl.textContent = 'Deploying...';
  
  // Poll for updates
  startDeploymentPolling();
}

// Show deployment error screen
function showDeploymentError(rawk) {
  showPanel('deploy');
  
  const logContent = document.querySelector('.log-content');
  const statusEl = document.getElementById('deploy-status');
  const deployBtn = document.getElementById('btn-deploy');
  
  logContent.innerHTML = renderDeploymentSteps(rawk.deploymentState);
  logContent.innerHTML += `
    <div class="log-line" style="color: #ff6b6b; margin-top: 1rem;">
      ✗ Deployment failed: ${rawk.deploymentError || 'Unknown error'}
    </div>
    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
      <button onclick="retryDeployment()" style="flex: 1; padding: 0.75rem; background: var(--lichen); color: var(--charcoal); border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        🔄 Retry from Here
      </button>
      <button onclick="startFresh()" style="flex: 1; padding: 0.75rem; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        🗑️ Start Over
      </button>
    </div>
  `;
  
  statusEl.textContent = 'Failed';
  deployBtn.style.display = 'none';
}

// Render deployment steps as HTML
function renderDeploymentSteps(deploymentState) {
  if (!deploymentState || !deploymentState.steps) {
    return '<div class="log-line">Preparing deployment...</div>';
  }
  
  const steps = deploymentState.steps;
  const stepLabels = {
    config_saved: '📝 Configuration saved',
    email_created: '📧 Creating email alias',
    server_provisioned: '🖥️  Provisioning server',
    dns_created: '🌐 Creating DNS record',
    software_installed: '⚙️  Installing Rawk software'
  };
  
  let html = '';
  
  for (const [stepKey, stepLabel] of Object.entries(stepLabels)) {
    const step = steps[stepKey];
    if (!step) continue;
    
    let icon = '⏳';
    let style = 'color: var(--slate);';
    
    if (step.status === 'completed') {
      icon = '✓';
      style = 'color: var(--lichen);';
    } else if (step.status === 'failed') {
      icon = '✗';
      style = 'color: #ff6b6b;';
    } else if (deploymentState.current_step === stepKey) {
      icon = '⏳';
      style = 'color: var(--lichen);';
    }
    
    html += `<div class="log-line" style="${style}">${icon} ${stepLabel}</div>`;
    
    if (step.status === 'failed' && step.error) {
      html += `<div class="log-line dim" style="margin-left: 1.5rem; color: #ff6b6b;">${step.error}</div>`;
    }
  }
  
  return html;
}

// Start polling for deployment updates
let pollInterval;
function startDeploymentPolling() {
  // Clear any existing interval
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  
  pollInterval = setInterval(async () => {
    const response = await fetch(`${API_BASE}/rawk/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (data.deployed) {
      currentRawk = data.rawk;
      
      // Update progress display
      const logContent = document.querySelector('.log-content');
      logContent.innerHTML = renderDeploymentSteps(data.rawk.deploymentState);
      
      // Check if complete or failed
      if (data.rawk.status === 'online') {
        clearInterval(pollInterval);
        logContent.innerHTML += '<div class="log-line" style="color: var(--lichen); margin-top: 1rem;">✓ Deployment complete!</div>';
        document.getElementById('deploy-status').textContent = 'Online';
        
        setTimeout(() => {
          showDeployedState(data.rawk);
          showPanel('start');
        }, 2000);
      } else if (data.rawk.status === 'deployment_failed') {
        clearInterval(pollInterval);
        showDeploymentError(data.rawk);
      }
    }
  }, 2000);
}

// Retry deployment
async function retryDeployment() {
  try {
    const response = await fetch(`${API_BASE}/rawk/retry-deployment`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (response.ok) {
      // Reload to show progress
      await loadRawkStatus();
    } else {
      alert('Retry failed: ' + data.error);
    }
  } catch (error) {
    alert('Retry error: ' + error.message);
  }
}

// Start fresh
async function startFresh() {
  const confirmation = confirm('This will delete your current Rawk and let you start over with a new name. Are you sure?');
  
  if (!confirmation) return;
  
  try {
    const response = await fetch(`${API_BASE}/rawk/start-fresh`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      // Reload to show deploy form
      await loadRawkStatus();
    } else {
      alert('Start fresh failed: ' + data.error);
    }
  } catch (error) {
    alert('Start fresh error: ' + error.message);
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
  showPanel('start');
}

// Show not deployed state
function showNotDeployedState() {
  const statusIndicator = document.getElementById('status');
  statusIndicator.textContent = '● not deployed';
  statusIndicator.classList.remove('online');

  // Show Deploy panel
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
      // Start polling for progress
      startDeploymentPolling();
    } else {
      logContent.innerHTML += `<div class="log-line" style="color: #ff6b6b;">✗ Deployment failed: ${data.error}</div>`;
      statusEl.textContent = 'Failed';
    }
  } catch (error) {
    logContent.innerHTML += `<div class="log-line" style="color: #ff6b6b;">✗ Error: ${error.message}</div>`;
    statusEl.textContent = 'Error';
  }
}

// Logout
function logout() {
  localStorage.removeItem('rawk_token');
  authToken = null;
  currentUser = null;
  // Reload page to show fresh login
  window.location.reload();
}

// Show login form
function showLoginForm() {
  // Show login prompt (better UI would be a modal)
  alert('Please login to continue.');
  const email = prompt('Email:');
  if (!email) {
    // User cancelled
    document.querySelector('.console-main').innerHTML = '<div style="padding: 2rem; text-align: center;"><h2>Please Login</h2><p>Refresh the page and enter your credentials to continue.</p></div>';
    return;
  }
  const password = prompt('Password:');
  
  if (email && password) {
    login(email, password);
  } else {
    showLoginForm();
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
