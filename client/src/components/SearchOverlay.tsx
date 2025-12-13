import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const SEARCH_HISTORY_KEY = "plattr_search_history";
const MAX_HISTORY_ITEMS = 10;

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  liveSearch?: boolean; // When true, updates filter in real-time while typing
}

export function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onSearch,
  placeholder = "Search for dishes...",
  liveSearch = true,
}: SearchOverlayProps) {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch {
        setSearchHistory([]);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    const trimmedQuery = query.trim();
    const newHistory = [
      trimmedQuery,
      ...searchHistory.filter((item) => item.toLowerCase() !== trimmedQuery.toLowerCase()),
    ].slice(0, MAX_HISTORY_ITEMS);
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      saveToHistory(searchQuery);
      onSearch?.(searchQuery);
    }
    onClose();
  };

  const handleHistoryClick = (query: string) => {
    onSearchChange(query);
    saveToHistory(query);
    onSearch?.(query);
    onClose();
  };
  
  const handleInputChange = (value: string) => {
    onSearchChange(value);
    // In live search mode, don't need explicit submit - filtering happens in real-time
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const removeHistoryItem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter((_, i) => i !== index);
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute top-0 left-0 right-0 bg-white shadow-lg transform transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "-translate-y-full"
        )}
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div className="p-4 pt-2">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={onClose}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                data-testid="button-close-search"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-xl text-base outline-none focus:ring-2 focus:ring-primary/30"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-search-overlay"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </form>

          {searchHistory.length > 0 && !searchQuery && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-sm font-semibold text-gray-700"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                >
                  Recent Searches
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-primary font-medium hover:underline"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="button-clear-history"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-1">
                {searchHistory.map((item, index) => (
                  <button
                    key={`${item}-${index}`}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                    data-testid={`button-history-item-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span
                        className="text-sm text-gray-700"
                        style={{ fontFamily: "Sweet Sans Pro" }}
                      >
                        {item}
                      </span>
                    </div>
                    <button
                      onClick={(e) => removeHistoryItem(index, e)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded-full transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchQuery && (
            <div className="mt-2">
              <button
                onClick={handleSearchSubmit}
                className="w-full flex items-center gap-3 px-3 py-3 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                data-testid="button-search-submit"
              >
                <Search className="w-4 h-4 text-primary" />
                <span
                  className="text-sm text-primary font-medium"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                >
                  Search for "{searchQuery}"
                </span>
              </button>
            </div>
          )}

          {!searchQuery && searchHistory.length === 0 && (
            <div className="py-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p
                className="text-sm text-gray-500"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >
                Search for your favorite dishes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
