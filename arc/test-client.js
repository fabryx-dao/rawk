import WebSocket from 'ws';

// Test WebSocket connection
const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error('Usage: node test-client.js <token>');
  process.exit(1);
}

const ws = new WebSocket(`ws://localhost:8080/arc?token=${TOKEN}`);

ws.on('open', () => {
  console.log('✅ Connected to relay');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log('📨 Received:', JSON.stringify(msg, null, 2));

  // After receiving welcome, send a broadcast message
  if (msg.type === 'welcome') {
    console.log('\n📤 Sending broadcast message...');
    ws.send(JSON.stringify({
      to: ['*'],
      payload: 'Hello from test client!',
      type: 'message'
    }));
  }
});

ws.on('close', (code, reason) => {
  console.log(`❌ Disconnected: ${code} ${reason}`);
});

ws.on('error', (err) => {
  console.error('💥 Error:', err.message);
});

// Keep alive
setTimeout(() => {
  console.log('\n⏹️  Closing connection...');
  ws.close();
}, 5000);
