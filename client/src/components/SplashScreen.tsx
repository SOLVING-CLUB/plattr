import { useEffect, useRef, useState } from "react";
import splashVideo from "@assets/The_background_which_202512111311_m25iy (1).mp4";
import splashFallback from "@assets/splash_background.png";

interface SplashScreenProps {
  onVideoEnd?: () => void;
}

export default function SplashScreen({ onVideoEnd }: SplashScreenProps) {
  const isDev = import.meta.env.DEV;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      html, body {
        overflow: hidden !important;
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
      }
      @supports (-webkit-touch-callout: none) {
        body {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
      }
      @media screen and (max-width: 768px) {
        body {
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
      }
    `;
    document.head.appendChild(style);

    if (
      (window as any).Android &&
      typeof (window as any).Android.hideStatusBar === "function"
    ) {
      (window as any).Android.hideStatusBar();
    }

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    };

    const handleCanPlay = () => {
      setVideoLoaded(true);
      video.play().catch(() => {
        setShowFallback(true);
        setTimeout(() => {
          if (onVideoEnd) onVideoEnd();
        }, 3000);
      });
    };

    const handleError = () => {
      setShowFallback(true);
      setTimeout(() => {
        if (onVideoEnd) onVideoEnd();
      }, 3000);
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    // Fallback timeout - if video doesn't load within 5 seconds, show fallback
    const fallbackTimeout = setTimeout(() => {
      if (!videoLoaded) {
        setShowFallback(true);
        setTimeout(() => {
          if (onVideoEnd) onVideoEnd();
        }, 3000);
      }
    }, 5000);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
      clearTimeout(fallbackTimeout);
    };
  }, [onVideoEnd, videoLoaded]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
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
        backgroundColor: "#000",
      }}
      data-testid="splash-screen"
    >
      {/* Fallback image - shown immediately, video overlays when loaded */}
      <img
        src={splashFallback}
        alt="Plattr"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
      />

      {/* Video overlay - hidden controls, non-interactive, autoplay like animation */}
      {!showFallback && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop={false}
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
          webkit-playsinline="true"
          x-webkit-airplay="deny"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 2,
            pointerEvents: "none",
          }}
          data-testid="video-splash-background"
        >
          <source src={splashVideo} type="video/mp4" />
        </video>
      )}

      {/* CSS to hide any native video controls */}
      <style>{`
        video::-webkit-media-controls,
        video::-webkit-media-controls-panel,
        video::-webkit-media-controls-play-button,
        video::-webkit-media-controls-start-playback-button,
        video::-webkit-media-controls-overlay-play-button {
          display: none !important;
          -webkit-appearance: none;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        video::--webkit-media-controls {
          display: none !important;
        }
        video::-moz-controls,
        video::-moz-range-track {
          display: none !important;
        }
      `}</style>

      {isDev && (
        <div
          className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm"
          style={{ zIndex: 1000 }}
        >
        </div>
      )}
    </div>
  );
}
