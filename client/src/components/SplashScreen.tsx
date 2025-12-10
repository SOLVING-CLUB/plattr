import { useEffect } from "react";
import Lottie from "lottie-react";
import splashAnimation from "@assets/Motion---Green-BG-(Yellow)_1765330282641.json";

export default function SplashScreen() {
  const isDev = import.meta.env.DEV;

  // Hide status bar on mobile devices
  useEffect(() => {
    // Add CSS to hide status bar
    const style = document.createElement('style');
    style.textContent = `
      /* Hide status bar area on splash screen */
      html, body {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
      }
      /* For iOS Safari - hide status bar */
      @supports (-webkit-touch-callout: none) {
        body {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
      }
      /* For Android WebView */
      @media screen and (max-width: 768px) {
        body {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
      }
    `;
    document.head.appendChild(style);

    // Try to hide status bar via JavaScript (for WebView)
    if ((window as any).Android && typeof (window as any).Android.hideStatusBar === 'function') {
      (window as any).Android.hideStatusBar();
    }

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundColor: "#1A9952",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        margin: 0,
        padding: 0,
        zIndex: 9999,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      data-testid="splash-screen"
    >
      {/* Dev mode indicator */}
      {isDev && (
        <div
          className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm"
          style={{ zIndex: 1000 }}
        >
          Click or press ESC to dismiss
        </div>
      )}

      {/* Lottie Animation - Full Screen */}
      <Lottie
        animationData={splashAnimation}
        loop={false}
        autoplay={true}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
        }}
        data-testid="splash-animation"
      />
    </div>
  );
}
