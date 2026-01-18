import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Copy, Check, Trash2, Filter, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logCapture, LogEntry } from "@/lib/logCapture";
import { useToast } from "@/hooks/use-toast";
import FloatingNav from "@/pages/FloatingNav";

type LogLevel = 'all' | 'log' | 'info' | 'warn' | 'error' | 'debug';

export default function DebugLogsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Update logs periodically
  useEffect(() => {
    const updateLogs = () => {
      const allLogs = logCapture.getLogs();
      setLogs(allLogs);
    };

    // Update immediately
    updateLogs();

    // Update every 500ms
    const interval = setInterval(updateLogs, 500);

    return () => clearInterval(interval);
  }, []);

  // Filter logs based on level and search term
  useEffect(() => {
    let filtered = logs;

    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(lowerSearch) ||
        log.level.toLowerCase().includes(lowerSearch) ||
        log.timestamp.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedLevel, searchTerm]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  // Handle scroll to detect user scrolling up
  const handleScroll = () => {
    if (!logsContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  const handleCopyAll = async () => {
    try {
      const logText = logCapture.getLogsAsDetailedString();
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "All logs copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy logs. Please try again.",
      });
    }
  };

  const handleCopyFiltered = async () => {
    try {
      const filter = (log: LogEntry) => {
        if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
        if (searchTerm.trim()) {
          const lowerSearch = searchTerm.toLowerCase();
          return (
            log.message.toLowerCase().includes(lowerSearch) ||
            log.level.toLowerCase().includes(lowerSearch)
          );
        }
        return true;
      };
      const logText = logCapture.getLogsAsDetailedString(filter);
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Filtered logs copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy logs. Please try again.",
      });
    }
  };

  const handleClear = () => {
    logCapture.clearLogs();
    setLogs([]);
    setFilteredLogs([]);
    toast({
      title: "Cleared",
      description: "All logs cleared",
    });
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warn':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'debug':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-800 bg-gray-50';
    }
  };

  const getLevelBadgeColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'bg-red-500';
      case 'warn':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      case 'debug':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const levelCounts = {
    all: logs.length,
    log: logs.filter(l => l.level === 'log').length,
    info: logs.filter(l => l.level === 'info').length,
    warn: logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
    debug: logs.filter(l => l.level === 'debug').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/notification-settings")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: "Sweet Sans Pro" }}>
                Debug Logs
              </h1>
              <p className="text-xs text-gray-500">
                {filteredLogs.length} of {logs.length} logs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFiltered}
              className="h-8 px-3"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Filtered
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="h-8 px-3"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="h-8 px-3 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Level filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'error', 'warn', 'info', 'log', 'debug'] as LogLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedLevel === level
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level.toUpperCase()} ({levelCounts[level]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs Container */}
      <div
        ref={logsContainerRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-200px)] overflow-y-auto px-4 py-4"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Filter className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No logs match your filters</p>
            {(selectedLevel !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedLevel('all');
                  setSearchTerm('');
                }}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, index) => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              return (
                <div
                  key={`${log.timestamp}-${index}`}
                  className={`p-3 rounded-lg border ${getLevelColor(log.level)} border-gray-200`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getLevelBadgeColor(log.level)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-gray-500">{time}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${getLevelBadgeColor(log.level)} text-white`}>
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto">
                        {log.message}
                      </pre>
                      {log.args && log.args.length > 0 && (
                        <div className="mt-2 pl-4 border-l-2 border-gray-300">
                          {log.args.map((arg, argIndex) => (
                            <pre
                              key={argIndex}
                              className="text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto text-gray-600"
                            >
                              {typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)}
                            </pre>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => {
              setAutoScroll(true);
              logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm shadow-lg"
          >
            Scroll to bottom
          </button>
        </div>
      )}

      <FloatingNav activeTab="profile" />
    </div>
  );
}
