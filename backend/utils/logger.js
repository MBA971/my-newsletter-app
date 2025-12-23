import fs from 'fs';
import path from 'path';

const logDir = path.resolve('backend/logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'app.log');

const log = (level, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

export const logger = {
  info: (message) => log('info', message),
  error: (message) => log('error', message),
};
