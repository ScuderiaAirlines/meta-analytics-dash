import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_FILE = path.join(LOG_DIR, `app-${new Date().toISOString().split('T')[0]}.log`);

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

class Logger {
  private static formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}\n`;
  }

  private static writeToFile(message: string): void {
    try {
      fs.appendFileSync(LOG_FILE, message);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  static info(message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(LogLevel.INFO, message, meta);
    console.log(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  static warn(message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(LogLevel.WARN, message, meta);
    console.warn(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  static error(message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, meta);
    console.error(formattedMessage);
    this.writeToFile(formattedMessage);
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, meta);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }
}

export default Logger;
