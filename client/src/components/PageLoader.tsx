import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import splashVideo from "@assets/The_background_which_202512111311_m25iy (1).mp4";

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <video
        src={splashVideo}
        autoPlay
        muted
        playsInline
        loop
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <video
        src={splashVideo}
        autoPlay
        muted
        playsInline
        loop
        className="w-full h-full object-cover"
      />
    </div>
  );
}
