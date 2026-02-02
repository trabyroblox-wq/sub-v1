#!/usr/bin/env node

// SUB v1 – Simple Ultimate Browser Proxy v1

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import url from 'node:url';
import { program } from 'commander';
import { loadConfig } from './config.js';
import { logger } from './logger.js';

const config = loadConfig();

logger.info(`SUB v1 starting → listening on ${config.host}:${config.port}`);

const server = http.createServer((clientReq, clientRes) => {
  if (!clientReq.url.startsWith('http')) {
    clientRes.writeHead(400);
    clientRes.end('Bad Request - SUB v1');
    return;
  }

  const parsed = url.parse(clientReq.url);
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

  delete options.headers['proxy-connection'];
  delete options.headers['proxy-authorization'];
  delete options.headers['connection']; // let agent handle

  const proxyReq = targetProtocol.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    logger.error(`upstream → ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502);
      clientRes.end('Bad Gateway - SUB v1');
    }
  });

  clientReq.pipe(proxyReq, { end: true });
});

// HTTPS tunneling (CONNECT method)
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
    logger.error(`tunnel error → ${err.message}`);
    clientSocket.destroy();
  });

  clientSocket.on('error', (err) => {
    logger.error(`client socket error → ${err.message}`);
  });
});

server.listen(config.port, config.host, () => {
  logger.ready(`SUB v1 running at http://${config.host}:${config.port}`);
});
