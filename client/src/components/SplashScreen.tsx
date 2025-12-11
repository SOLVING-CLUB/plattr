import { useEffect, useRef } from "react";
import splashVideo from "@assets/The_background_which_202512111311_m25iy (1).mp4";

export default function SplashScreen() {
  const isDev = import.meta.env.DEV;
  const videoRef = useRef<HTMLVideoElement>(null);

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

    const handleTimeUpdate = () => {
      if (video.currentTime >= 120) {
        video.pause();
        video.currentTime = 120;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

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
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
        }}
        data-testid="video-splash-background"
      >
        <source src={splashVideo} type="video/mp4" />
      </video>

      {isDev && (
        <div
          className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm"
          style={{ zIndex: 1000 }}
        >
          Dev Mode - Click or press ESC to dismiss
        </div>
      )}
    </div>
  );
}
