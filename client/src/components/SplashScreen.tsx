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
  const [videoReady, setVideoReady] = useState(false);

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
      /* Immediately hide all video controls globally */
      video {
        -webkit-appearance: none !important;
        appearance: none !important;
      }
      video::-webkit-media-controls,
      video::-webkit-media-controls-panel,
      video::-webkit-media-controls-play-button,
      video::-webkit-media-controls-start-playback-button,
      video::-webkit-media-controls-overlay-play-button,
      video::-webkit-media-controls-enclosure {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
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

    // Ensure controls are disabled
    video.controls = false;

    const handleEnded = () => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    };

    const handleCanPlay = () => {
      setVideoLoaded(true);
      // Start playing the video - it will be hidden by the container div
      video.play().catch((error) => {
        console.error("Video play failed:", error);
        setShowFallback(true);
        setTimeout(() => {
          if (onVideoEnd) onVideoEnd();
        }, 3000);
      });
    };

    const handlePlaying = () => {
      // Video has started playing, now it's safe to show
      // Small delay to ensure video is fully playing and controls are gone
      setTimeout(() => {
        if (!video.paused && video.readyState >= 3) {
          setVideoReady(true);
        }
      }, 200);
    };

    const handleLoadedData = () => {
      // Video data is loaded, try to play if not already playing
      if (video.paused && video.readyState >= 3) {
        video.play().catch(() => {});
      }
    };

    const handleError = (e: Event) => {
      console.error("Video error:", e);
      setShowFallback(true);
      setTimeout(() => {
        if (onVideoEnd) onVideoEnd();
      }, 3000);
    };

    video.addEventListener("ended", handleEnded);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);

    // Fallback timeout - if video doesn't load within 5 seconds, show fallback
    const fallbackTimeout = setTimeout(() => {
      if (!videoLoaded) {
        console.warn("Video load timeout, showing fallback");
        setShowFallback(true);
        setTimeout(() => {
          if (onVideoEnd) onVideoEnd();
        }, 3000);
      }
    }, 5000);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("loadeddata", handleLoadedData);
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

      {/* Video overlay - hidden off-screen until ready to play to prevent play icon flash */}
      {!showFallback && (
        <div
          style={{
            position: "absolute",
            top: videoReady ? 0 : "-200vh",
            left: videoReady ? 0 : "-200vw",
            width: videoReady ? "100%" : "1px",
            height: videoReady ? "100%" : "1px",
            overflow: "hidden",
            zIndex: videoReady ? 2 : -9999,
            opacity: videoReady ? 1 : 0,
            visibility: videoReady ? "visible" : "hidden",
            pointerEvents: "none",
            clipPath: videoReady ? "none" : "inset(100%)",
            transition: videoReady ? "opacity 0.3s ease-in" : "none",
          }}
        >
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
              pointerEvents: "none",
            }}
            data-testid="video-splash-background"
          >
            <source src={splashVideo} type="video/mp4" />
          </video>
        </div>
      )}

      {/* CSS to hide any native video controls - applied globally and immediately */}
      <style>{`
        /* Global video control hiding - applied immediately on page load */
        video {
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        video::-webkit-media-controls {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
        }
        video::-webkit-media-controls-play-button {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          -webkit-appearance: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        video::-webkit-media-controls-start-playback-button {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          -webkit-appearance: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        video::-webkit-media-controls-overlay-play-button {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          -webkit-appearance: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        video::-webkit-media-controls-enclosure {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
        }
        video::--webkit-media-controls {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
        }
        video::-moz-controls,
        video::-moz-range-track {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
        }
        /* Additional mobile-specific hiding */
        video[controls] {
          -webkit-appearance: none !important;
          appearance: none !important;
        }
        video::-webkit-media-controls-timeline {
          display: none !important;
        }
        video::-webkit-media-controls-current-time-display {
          display: none !important;
        }
        video::-webkit-media-controls-time-remaining-display {
          display: none !important;
        }
        video::-webkit-media-controls-mute-button {
          display: none !important;
        }
        video::-webkit-media-controls-volume-slider {
          display: none !important;
        }
        video::-webkit-media-controls-fullscreen-button {
          display: none !important;
        }
        /* Prevent any overlay from appearing */
        video::before,
        video::after {
          display: none !important;
          content: none !important;
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
