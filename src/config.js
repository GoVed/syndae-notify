import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const config = {
  ntfyUrl: process.env.NTFY_URL || null,
  gotifyUrl: process.env.GOTIFY_URL || null,
  gotifyToken: process.env.GOTIFY_TOKEN || null,
  httpPort: parseInt(process.env.HTTP_PORT || '8769', 10),
  httpHost: process.env.HTTP_HOST || '0.0.0.0',
  styxApiUrl: process.env.STYX_API_URL || 'http://localhost:3000',
  styxAccessKey: process.env.STYX_ACCESS_KEY || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  rootDir: path.resolve(__dirname, '..')
};

export default config;
