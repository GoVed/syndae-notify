import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { LocalNotificationDispatcher } from '../src/dispatcher.js';
import { handleJsonRpc } from '../src/mcp/server.js';
import { createHttpApp } from '../src/mcp/http.js';

test('Local Notification Dispatcher', async (t) => {
  await t.test('dispatches locally and reports delivery channels', async () => {
    const dispatcher = new LocalNotificationDispatcher();
    const res = await dispatcher.send({
      title: 'Unit Test Notification',
      message: 'Testing local delivery',
      urgency: 'info'
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.delivered_to.length > 0);
  });

  await t.test('dispatches to mock local ntfy server over HTTP', async () => {
    let capturedReq = null;
    const mockNtfyServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        capturedReq = {
          title: req.headers['title'],
          priority: req.headers['priority'],
          body
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
    });

    await new Promise(resolve => mockNtfyServer.listen(0, '127.0.0.1', resolve));
    const port = mockNtfyServer.address().port;
    const ntfyUrl = `http://127.0.0.1:${port}/styx-alerts`;

    try {
      const dispatcher = new LocalNotificationDispatcher({ ntfyUrl });
      const res = await dispatcher.send({
        title: 'High Priority Alert',
        message: 'Action is required by the operator',
        urgency: 'action_required'
      });

      assert.strictEqual(res.success, true);
      assert.ok(res.delivered_to.some(d => d.includes('ntfy')));
      assert.ok(capturedReq);
      assert.strictEqual(capturedReq.title, 'High Priority Alert');
      assert.strictEqual(capturedReq.priority, '4');
      assert.strictEqual(capturedReq.body, 'Action is required by the operator');
    } finally {
      await new Promise(resolve => mockNtfyServer.close(resolve));
    }
  });
});

test('MCP Protocol JSON-RPC 2.0 Handler', async (t) => {
  await t.test('handles initialize handshake', async () => {
    const req = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05' }
    };
    const res = await handleJsonRpc(req);
    assert.strictEqual(res.id, 1);
    assert.strictEqual(res.result.protocolVersion, '2024-11-05');
    assert.strictEqual(res.result.serverInfo.name, 'styx-notify-server');
  });

  await t.test('handles tools/list returning send_notification', async () => {
    const req = { jsonrpc: '2.0', id: 2, method: 'tools/list' };
    const res = await handleJsonRpc(req);
    assert.strictEqual(res.result.tools.length, 1);
    assert.strictEqual(res.result.tools[0].name, 'send_notification');
  });

  await t.test('handles tools/call for send_notification', async () => {
    const req = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'send_notification',
        arguments: {
          title: 'MCP Alert',
          message: 'Local notification via MCP call',
          urgency: 'info'
        }
      }
    };
    const res = await handleJsonRpc(req);
    assert.strictEqual(res.result.isError, false);
    assert.ok(res.result.content[0].text.includes('Notification dispatched successfully'));
  });
});

test('HTTP Server & REST Endpoints', async (t) => {
  const app = createHttpApp();
  const server = http.createServer(app);

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const health = await fetch(`${baseUrl}/health`).then(r => r.json());
    assert.strictEqual(health.status, 'healthy');

    const status = await fetch(`${baseUrl}/status`).then(r => r.json());
    assert.strictEqual(status.server.name, 'styx-notify-server');

    const mcpRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'tools/list' })
    }).then(r => r.json());
    assert.strictEqual(mcpRes.result.tools.length, 1);

    const directRes = await fetch(`${baseUrl}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Direct REST Alert',
        message: 'Sent via HTTP POST /notify'
      })
    }).then(r => r.json());
    assert.strictEqual(directRes.success, true);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
