import type { Server } from 'node:http';
import type { Express } from 'express';

export interface RunningServer {
  server: Server;
  baseUrl: string;
}

export function startApp(app: Express, port = 0): Promise<RunningServer> {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      const address = server.address();
      const boundPort = typeof address === 'object' && address !== null ? address.port : port;
      resolve({ server, baseUrl: `http://127.0.0.1:${boundPort}` });
    });
  });
}

export function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}
