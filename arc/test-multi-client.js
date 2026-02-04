import WebSocket from 'ws';

const TOKEN1 = 'tok_OprWJAK3tAsRVH5G'; // test-agent-1
const TOKEN2 = 'tok_jLW3K-OywO5nulMF'; // rawk-bot

console.log('🔧 Testing multi-client communication\n');

// Client 1
const client1 = new WebSocket(`ws://localhost:8080/arc?token=${TOKEN1}`);
let client1Ready = false;

client1.on('open', () => {
  console.log('[Client 1] ✅ Connected (test-agent-1)');
});

client1.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'welcome') {
    console.log('[Client 1] 👋 Received welcome');
    client1Ready = true;
  } else {
    console.log(`[Client 1] 📨 Received from ${msg.from}: ${JSON.stringify(msg.payload)}`);
  }
});

// Client 2
const client2 = new WebSocket(`ws://localhost:8080/arc?token=${TOKEN2}`);
let client2Ready = false;

client2.on('open', () => {
  console.log('[Client 2] ✅ Connected (rawk-bot)');
});

client2.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === 'welcome') {
    console.log('[Client 2] 👋 Received welcome');
    client2Ready = true;

    // Both ready, start test sequence
    setTimeout(runTests, 500);
  } else {
    console.log(`[Client 2] 📨 Received from ${msg.from}: ${JSON.stringify(msg.payload)}`);
  }
});

function runTests() {
  if (!client1Ready || !client2Ready) {
    console.error('❌ Clients not ready');
    return;
  }

  console.log('\n🧪 Test 1: Broadcast message');
  client1.send(JSON.stringify({
    to: ['*'],
    payload: 'Hello everyone from test-agent-1!',
    type: 'message'
  }));

  setTimeout(() => {
    console.log('\n🧪 Test 2: Direct message');
    client2.send(JSON.stringify({
      to: ['test-agent-1'],
      payload: 'Direct message to test-agent-1',
      type: 'message'
    }));
  }, 1000);

  setTimeout(() => {
    console.log('\n🧪 Test 3: Ping relay');
    client1.send(JSON.stringify({
      to: ['relay'],
      type: 'ping'
    }));
  }, 2000);

  setTimeout(() => {
    console.log('\n🧪 Test 4: Subscribe to agent');
    client2.send(JSON.stringify({
      to: ['relay'],
      type: 'subscribe',
      payload: { agents: ['test-agent-1'] }
    }));
  }, 3000);

  setTimeout(() => {
    console.log('\n🧪 Test 5: Message to subscribed agent');
    client1.send(JSON.stringify({
      to: ['*'],
      payload: 'This should reach rawk-bot via subscription',
      type: 'message'
    }));
  }, 4000);

  setTimeout(() => {
    console.log('\n✅ Tests complete, closing connections...');
    client1.close();
    client2.close();
    process.exit(0);
  }, 5000);
}

client1.on('error', (err) => console.error('[Client 1] 💥 Error:', err.message));
client2.on('error', (err) => console.error('[Client 2] 💥 Error:', err.message));
