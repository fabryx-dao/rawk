// Panel switching
const navItems = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');

function showPanel(panelId) {
  // Update nav active state
  navItems.forEach(nav => nav.classList.remove('active'));
  const targetNav = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
  if (targetNav) {
    targetNav.classList.add('active');
  }
  
  // Update panel visibility
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
  const log = document.querySelector('.log-content');
  const statusEl = document.getElementById('deploy-status');
  const statusIndicator = document.getElementById('status');
  
  log.innerHTML = '<div class="log-line">Starting deployment...</div>';
  statusEl.textContent = 'Deploying...';
  
  // Simulate deployment process
  setTimeout(() => {
    log.innerHTML += '<div class="log-line">Creating Hetzner server...</div>';
  }, 1000);
  
  setTimeout(() => {
    log.innerHTML += '<div class="log-line">Installing OpenClaw...</div>';
  }, 2000);
  
  setTimeout(() => {
    log.innerHTML += '<div class="log-line">Configuring Deepself plugin...</div>';
  }, 3000);
  
  setTimeout(() => {
    log.innerHTML += '<div class="log-line">Setting up Tailscale...</div>';
  }, 4000);
  
  setTimeout(() => {
    log.innerHTML += '<div class="log-line dim">Starting services...</div>';
  }, 5000);
  
  setTimeout(() => {
    log.innerHTML += '<div class="log-line" style="color: var(--lichen);">✓ Deployment complete!</div>';
    statusEl.textContent = 'Online';
    statusIndicator.textContent = '● online';
    statusIndicator.classList.add('online');
    document.getElementById('server-location').textContent = 'Hetzner (Nuremberg)';
    document.getElementById('server-url').innerHTML = '<a href="https://rawk-user.tail123.ts.net" target="_blank">rawk-user.tail123.ts.net</a>';
  }, 6000);
});

// Chat functionality
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const btnSend = document.getElementById('btn-send');

function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  
  // Add user message
  const userMsg = document.createElement('div');
  userMsg.className = 'chat-message user';
  userMsg.innerHTML = `
    <span class="chat-sender">You</span>
    <span class="chat-text">${message}</span>
  `;
  chatMessages.appendChild(userMsg);
  
  // Clear input
  chatInput.value = '';
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Simulate response
  setTimeout(() => {
    const assistantMsg = document.createElement('div');
    assistantMsg.className = 'chat-message assistant';
    assistantMsg.innerHTML = `
      <span class="chat-sender">🪨 Rawksh</span>
      <span class="chat-text">I received your message: "${message}"</span>
    `;
    chatMessages.appendChild(assistantMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 1000);
}

btnSend?.addEventListener('click', sendMessage);
chatInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// File explorer
document.querySelectorAll('.file-item').forEach(item => {
  item.addEventListener('click', () => {
    if (item.classList.contains('folder')) {
      console.log('Navigate to folder:', item.querySelector('.file-name').textContent);
    } else {
      console.log('Open file:', item.querySelector('.file-name').textContent);
    }
  });
});

// Settings save
document.querySelector('#panel-settings .btn-primary')?.addEventListener('click', () => {
  alert('Settings saved! (This is a demo - backend integration needed)');
});

// Restart button in settings
document.querySelector('#panel-settings .btn-danger')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to restart your Rawk? This will cause a brief interruption.')) {
    alert('Restart initiated! (This is a demo - backend integration needed)');
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

// Restart Rawk
document.getElementById('btn-restart-rawk')?.addEventListener('click', () => {
  if (confirm('Restart your Rawk? This will cause a brief interruption (about 30 seconds).')) {
    alert('Restarting... (This is a demo - backend integration needed)');
  }
});

// Factory Reset
document.getElementById('btn-factory-reset')?.addEventListener('click', () => {
  const confirmation = prompt('Type "RESET" to confirm factory reset. This will DELETE ALL DATA and redeploy from scratch.');
  if (confirmation === 'RESET') {
    alert('Factory reset initiated... (This is a demo - backend integration needed)');
  } else if (confirmation !== null) {
    alert('Reset cancelled - confirmation did not match.');
  }
});

// Update status indicator on page load (simulated)
window.addEventListener('load', () => {
  // In production, this would check actual server status
  setTimeout(() => {
    const statusIndicator = document.getElementById('status');
    const deployStatus = document.getElementById('deploy-status');
    
    // Simulate checking status
    const isOnline = true; // Changed to true to show My Rawk as online
    
    if (isOnline) {
      statusIndicator.textContent = '● online';
      statusIndicator.classList.add('online');
      if (deployStatus) {
        deployStatus.textContent = 'Online';
        document.getElementById('server-location').textContent = 'Hetzner (Nuremberg)';
        document.getElementById('server-url').innerHTML = '<a href="https://rawk-user.tail123.ts.net" target="_blank">rawk-user.tail123.ts.net</a>';
      }
    }
  }, 500);
});
