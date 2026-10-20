import { createServer } from 'node:net';
import { randomInt } from 'node:crypto';
import { once } from 'node:events';

// Fetch/browser blocked ports are below this dynamic/private range:
// https://fetch.spec.whatwg.org/#port-blocking
// Some Windows configurations assign PORT=0 from those lower ports instead.
export async function listenLoopback(server, { nextPort = () => randomInt(49152, 65536), attempts = 32 } = {}) {
  if (server.listening) throw Error('Loopback server is already listening');
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 64) throw Error('Loopback attempts must be between 1 and 64');
  for (let attempt = 0; attempt < attempts; attempt++) {
    const port = nextPort();
    if (!Number.isInteger(port) || port < 49152 || port > 65535) throw Error('Loopback port must be in 49152–65535');
    try {
      const ready = once(server, 'listening');
      server.listen(port, '127.0.0.1');
      await ready;
      return port;
    } catch (error) {
      if (!['EADDRINUSE', 'EACCES'].includes(error.code)) throw error;
      if (attempt === attempts - 1) throw Error(`No loopback port available after ${attempts} attempts`, { cause: error });
    }
  }
}

// A child must bind after the reservation is released. A different process can
// still race to that port; startup must fail if the child cannot become ready.
export async function availableLoopbackPort(options) {
  const server = createServer();
  try { return await listenLoopback(server, options); }
  finally { if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
}
