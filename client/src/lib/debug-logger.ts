// Simple dependency-free store pattern
export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    message: string;
    data?: any;
}

class LoggerStore {
    private logs: LogEntry[] = [];
    private listeners: Set<() => void> = new Set();
    public isOpen = false;

    getLogs() {
        return this.logs;
    }

    addLog(level: LogLevel, message: string, data?: any) {
        const entry: LogEntry = {
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            level,
            message,
            data,
        };

        // Log to console as well for traditional debugging
        const consoleMsg = `[${level.toUpperCase()}] ${message}`;
        if (level === 'error') console.error(consoleMsg, data || '');
        else if (level === 'warn') console.warn(consoleMsg, data || '');
        else console.log(consoleMsg, data || '');

        this.logs = [entry, ...this.logs].slice(0, 100);
        this.notify();
    }

    clearLogs() {
        this.logs = [];
        this.notify();
    }

    toggleOpen() {
        this.isOpen = !this.isOpen;
        this.notify();
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(l => l());
    }
}

export const loggerStore = new LoggerStore();

// React hook for consuming the store
import { useState, useEffect } from 'react';

export function useDebugLogger() {
    const [state, setState] = useState({
        logs: loggerStore.getLogs(),
        isOpen: loggerStore.isOpen
    });

    useEffect(() => {
        return loggerStore.subscribe(() => {
            setState({
                logs: loggerStore.getLogs(),
                isOpen: loggerStore.isOpen
            });
        });
    }, []);

    return {
        ...state,
        addLog: loggerStore.addLog.bind(loggerStore),
        clearLogs: loggerStore.clearLogs.bind(loggerStore),
        toggleOpen: loggerStore.toggleOpen.bind(loggerStore),
    };
}

export const logger = {
    info: (message: string, data?: any) => loggerStore.addLog('info', message, data),
    warn: (message: string, data?: any) => loggerStore.addLog('warn', message, data),
    error: (message: string, data?: any) => loggerStore.addLog('error', message, data),
    success: (message: string, data?: any) => loggerStore.addLog('success', message, data),
};
