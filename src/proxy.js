#!/usr/bin/env node

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import url from 'node:url';
import { program } from 'commander';
import { loadConfig } from './config.js';
import { logger } from './logger.js';

const config = loadConfig();

logger.info(`SUB v1 starting on port ${config.port} ...`);

const server = http.createServer((clientReq, clientRes) => {
  const parsed = url.parse(clientReq.url);
  if (!parsed.hostname) {
    clientRes.writeHead(400);
    clientRes.end('Bad Request');
    return;
  }

  const targetProtocol = parsed.protocol === 'https:' ? https : http;
  const targetPort = parsed.port || (parsed.protocol === 'https:' ? 443 : 80);

  logger.request(`${clientReq.method} ${clientReq.url}`);

  const options = {
    hostname: parsed.hostname,
    port: targetPort,
    path: parsed.path,
    method: clientReq.method,
    headers: { ...clientReq.headers },
  };

  // Clean proxy headers
  delete options.headers['proxy-connection'];
  delete options.headers['proxy-authorization'];

  const proxyReq = targetProtocol.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    logger.error(`upstream error: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502);
      clientRes.end('Bad Gateway');
    }
  });

  clientReq.pipe(proxyReq);
});

// HTTPS CONNECT tunnel
server.on('connect', (req, clientSocket, head) => {
  const [host, portStr] = req.url.split(':');
  const port = Number(portStr) || 443;

  logger.connect(`${host}:${port}`);

  const serverSocket = net.connect(port, host, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });

  serverSocket.on('error', (err) => {
    logger.error(`tunnel error: ${err.message}`);
    clientSocket.destroy();
  });

  clientSocket.on('error', (err) => {
    logger.error(`client socket error: ${err.message}`);
  });
});

server.listen(config.port, config.host, () => {
  logger.ready(`SUB v1 listening at http://${config.host}:${config.port}`);
});
