import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 8787);

const workspaces = [
  { id: 'atlas', name: 'Atlas Lab', status: 'active', owner: 'Etherea' },
  { id: 'aurora', name: 'Aurora Runtime', status: 'idle', owner: 'Etherea' },
  { id: 'pulse', name: 'Pulse Studio', status: 'active', owner: 'Etherea' },
];

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  if (!req.url) return json(res, 404, { ok: false, error: 'not found' });

  if (req.method === 'OPTIONS') return json(res, 204, {});

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true, service: 'etherea-api', now: new Date().toISOString() });
  }

  if (req.method === 'GET' && req.url === '/api/workspaces') {
    return json(res, 200, { items: workspaces, count: workspaces.length });
  }

  if (req.method === 'POST' && req.url === '/api/workspaces') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const parsed = body ? JSON.parse(body) : {};
      const { id, name, status = 'active', owner = 'local-user' } = parsed;

      if (!id || !name) return json(res, 400, { ok: false, error: 'id and name are required' });
      if (workspaces.some((workspace) => workspace.id === id)) {
        return json(res, 409, { ok: false, error: 'workspace id already exists' });
      }

      const workspace = { id, name, status, owner };
      workspaces.push(workspace);
      return json(res, 201, { ok: true, item: workspace });
    });

    return;
  }

  return json(res, 404, { ok: false, error: 'not found' });
});

server.listen(port, () => {
  console.log(`Etherea API listening on http://localhost:${port}`);
});
