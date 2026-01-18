/**
 * Log Capture Utility
 * Intercepts console logs and stores them for debugging
 */

export interface LogEntry {
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args?: any[];
}

class LogCapture {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private originalConsole: {
    log: typeof console.log;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };
  private isCapturing = false;

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console),
    };
  }

  /**
   * Start capturing console logs
   */
  startCapture(): void {
    if (this.isCapturing) return;
    this.isCapturing = true;

    // Intercept console.log
    console.log = (...args: any[]) => {
      this.addLog('log', args);
      this.originalConsole.log(...args);
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      this.addLog('info', args);
      this.originalConsole.info(...args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.addLog('warn', args);
      this.originalConsole.warn(...args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      this.addLog('error', args);
      this.originalConsole.error(...args);
    };

    // Intercept console.debug
    console.debug = (...args: any[]) => {
      this.addLog('debug', args);
      this.originalConsole.debug(...args);
    };

    this.addLog('info', ['[LogCapture] Started capturing logs']);
  }

  /**
   * Stop capturing console logs
   */
  stopCapture(): void {
    if (!this.isCapturing) return;
    this.isCapturing = false;

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;

    this.originalConsole.log('[LogCapture] Stopped capturing logs');
  }

  /**
   * Add a log entry
   */
  private addLog(level: LogEntry['level'], args: any[]): void {
    const timestamp = new Date().toISOString();
    const message = args
      .map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    this.logs.push({
      timestamp,
      level,
      message,
      args: args.length > 1 ? args.slice(1) : undefined,
    });

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Get all captured logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by search term
   */
  getLogsBySearch(searchTerm: string): LogEntry[] {
    const lowerSearch = searchTerm.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerSearch) ||
      log.level.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    this.originalConsole.log('[LogCapture] Logs cleared');
  }

  /**
   * Get logs as formatted string
   */
  getLogsAsString(filter?: (log: LogEntry) => boolean): string {
    const logsToExport = filter ? this.logs.filter(filter) : this.logs;
    return logsToExport
      .map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const level = log.level.toUpperCase().padEnd(5);
        return `[${time}] ${level} ${log.message}`;
      })
      .join('\n');
  }

  /**
   * Get logs as formatted string with full details
   */
  getLogsAsDetailedString(filter?: (log: LogEntry) => boolean): string {
    const logsToExport = filter ? this.logs.filter(filter) : this.logs;
    return logsToExport
      .map(log => {
        const time = new Date(log.timestamp).toISOString();
        const level = log.level.toUpperCase();
        let output = `[${time}] [${level}] ${log.message}`;
        if (log.args && log.args.length > 0) {
          output += '\n' + log.args
            .map(arg => {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            })
            .join('\n');
        }
        return output;
      })
      .join('\n\n');
  }
}

// Singleton instance
export const logCapture = new LogCapture();

// Auto-start capture when module loads
if (typeof window !== 'undefined') {
  logCapture.startCapture();
}
