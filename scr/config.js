import { program } from 'commander';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env') });

program
  .name('sub-v1')
  .description('Simple HTTP/HTTPS forward proxy - SUB v1')
  .option('-p, --port <number>', 'listening port', Number, 8080)
  .option('-H, --host <host>', 'bind address', '0.0.0.0')
  .parse();

const opts = program.opts();

export const loadConfig = () => ({
  port: opts.port || Number(process.env.PORT) || 8080,
  host: opts.host || process.env.HOST || '0.0.0.0',
});
