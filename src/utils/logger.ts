import { config } from '../config/environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  error?: Error;
  userAgent?: string;
  url?: string;
}
class Logger {
  private logQueue: LogEntry[] = [];
  private maxQueueSize = 100;

  private shouldLog(level: LogLevel): boolean {
    if (!config.features.enableLogging) return false;
    
    // In production, only log warnings and errors
    if (config.app.environment === 'production') {
      return level === 'warn' || level === 'error';
    }
    
    return true;
  }

  private createLogEntry(level: LogLevel, message: string, error?: Error, ...args: any[]): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data: args.length > 0 ? args : undefined,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as any : undefined,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  private addToQueue(entry: LogEntry): void {
    this.logQueue.push(entry);
    if (this.logQueue.length > this.maxQueueSize) {
      this.logQueue.shift();
    }
  }
  debug(message: string, ...args: any[]): void {
    const entry = this.createLogEntry('debug', message, undefined, ...args);
    this.addToQueue(entry);
    
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    const entry = this.createLogEntry('info', message, undefined, ...args);
    this.addToQueue(entry);
    
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    const entry = this.createLogEntry('warn', message, undefined, ...args);
    this.addToQueue(entry);
    
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: any[]): void {
    const entry = this.createLogEntry('error', message, error, ...args);
    this.addToQueue(entry);
    
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error, ...args);
    }
    
    // In production, send errors to monitoring service
    if (config.app.environment === 'production' && config.features.enableErrorReporting) {
      this.reportError(entry);
    }
  }

  private reportError(entry: LogEntry): void {
    // Here you would integrate with error reporting services like Sentry, LogRocket, etc.
    try {
      // Send to error reporting service in production
      if (config.app.environment === 'production') {
        // Example: Sentry.captureException(entry.error, { extra: entry });
        // Example: LogRocket.captureException(entry.error);
        
        // For now, store in localStorage for later transmission
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
        errors.push(entry);
        if (errors.length > 50) errors.shift(); // Keep only last 50 errors
        localStorage.setItem('app_errors', JSON.stringify(errors));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Get logs for debugging or support
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logQueue.filter(entry => entry.level === level);
    }
    return [...this.logQueue];
  }

  // Clear logs
  clearLogs(): void {
    this.logQueue = [];
  }

  // Export logs for support
  exportLogs(): string {
    return JSON.stringify(this.logQueue, null, 2);
  }
}

export const logger = new Logger();