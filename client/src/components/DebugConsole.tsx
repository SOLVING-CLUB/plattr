import React, { useEffect, useState } from 'react';
import { useDebugLogger, LogEntry } from '@/lib/debug-logger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Trash2, ChevronUp, ChevronDown, Copy, Terminal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

export function DebugConsole() {
    const { logs, isOpen, toggleOpen, clearLogs } = useDebugLogger();
    const [isExpanded, setIsExpanded] = useState(false);

    // Auto-open on error if not explicitly closed? Maybe annoying.
    // Let's just keep it manual for now.

    const copyLogs = () => {
        const text = logs.map(l =>
            `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.level.toUpperCase()}: ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`
        ).join('\n');
        navigator.clipboard.writeText(text);
        toast({ title: 'Logs copied to clipboard' });
    };

    if (!isOpen) {
        return (
            <Button
                variant="secondary"
                size="icon"
                className="fixed bottom-4 right-4 z-[9999] rounded-full shadow-lg h-12 w-12 bg-black text-white border-2 border-primary/50 debug-console-button"
                style={{
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
                    top: 'auto',
                }}
                onClick={toggleOpen}
            >
                <Terminal className="h-6 w-6" />
            </Button>
        );
    }

    return (
        <Card 
            className={`fixed left-0 right-0 bottom-0 z-[9999] shadow-2xl border-t-2 border-primary transition-all duration-300 bg-black/95 text-white debug-console-card ${isExpanded ? 'h-[80vh]' : 'h-[40vh]'}`}
            style={{
                bottom: 'env(safe-area-inset-bottom, 0px)',
                top: 'auto',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                maxHeight: isExpanded ? 'calc(80vh - env(safe-area-inset-bottom, 0px))' : 'calc(40vh - env(safe-area-inset-bottom, 0px))',
            }}
        >
            <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
                <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <span className="font-mono text-xs font-bold text-primary">DEBUG CONSOLE ({logs.length})</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={copyLogs}>
                        <Copy className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={clearLogs}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={toggleOpen}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100%-40px)] w-full p-2 font-mono text-xs">
                <div className="flex flex-col gap-1 pb-4">
                    {logs.map((log) => (
                        <LogItem key={log.id} log={log} />
                    ))}
                    {logs.length === 0 && (
                        <div className="text-gray-500 text-center py-8 italic">No logs yet...</div>
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}

function LogItem({ log }: { log: LogEntry }) {
    const [expanded, setExpanded] = useState(false);

    const color = {
        info: 'text-blue-300 border-blue-900/30 bg-blue-900/10',
        warn: 'text-yellow-300 border-yellow-900/30 bg-yellow-900/10',
        error: 'text-red-300 border-red-900/30 bg-red-900/10',
        success: 'text-green-300 border-green-900/30 bg-green-900/10',
    }[log.level];

    return (
        <div className={`border rounded p-1.5 ${color} mb-1 break-all`}>
            <div className="flex gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <span className="text-gray-500 shrink-0 select-none">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="font-semibold">{log.message}</span>
            </div>
            {(log.data || expanded) && log.data && (
                <pre className="mt-1 p-1 bg-black/30 rounded overflow-x-auto text-[10px] text-gray-300">
                    {JSON.stringify(log.data, null, 2)}
                </pre>
            )}
        </div>
    );
}
