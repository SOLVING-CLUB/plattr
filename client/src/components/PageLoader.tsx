import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface PageLoaderContextType {
  isLoading: boolean;
  showLoader: () => void;
  hideLoader: () => void;
}

const PageLoaderContext = createContext<PageLoaderContextType>({
  isLoading: false,
  showLoader: () => {},
  hideLoader: () => {},
});

export function usePageLoader() {
  return useContext(PageLoaderContext);
}

interface PageLoaderProviderProps {
  children: ReactNode;
}

export function PageLoaderProvider({ children }: PageLoaderProviderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = useCallback(() => setIsLoading(true), []);
  const hideLoader = useCallback(() => setIsLoading(false), []);

  return (
    <PageLoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
      {children}
      {isLoading && <PageLoaderOverlay />}
    </PageLoaderContext.Provider>
  );
}

function PageLoaderOverlay() {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm"
      style={{ fontFamily: "Sweet Sans Pro" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div 
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ 
            borderColor: "#1A9952",
            borderTopColor: "transparent",
            borderWidth: "3px"
          }}
        />
        <span 
          className="text-sm font-medium"
          style={{ color: "#1A9952" }}
        >
          Loading...
        </span>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm"
      style={{ fontFamily: "Sweet Sans Pro" }}
    >
      <div className="flex flex-col items-center gap-3">
        <div 
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ 
            borderColor: "#1A9952",
            borderTopColor: "transparent",
            borderWidth: "3px"
          }}
        />
        <span 
          className="text-sm font-medium"
          style={{ color: "#1A9952" }}
        >
          Loading...
        </span>
      </div>
    </div>
  );
}
