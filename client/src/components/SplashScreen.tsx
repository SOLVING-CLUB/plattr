// Import images when they're available in attached_assets folder
import splashHeroImage from "@assets/splash_hero_woman.png";
import plattrLogoImage from "@assets/plattr_logo.png";
import splashBackgroundImage from "@assets/splash_background.png";

export default function SplashScreen() {
  // Set to true when you add the logo image to attached_assets folder
  const hasLogo = true;
  const hasHeroImage = true; // splash_hero_woman.png is available

  const isDev = import.meta.env.DEV;

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        backgroundImage: `url(${splashBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        margin: 0,
        padding: 0,
        zIndex: 9999,
      }}
      data-testid="splash-screen"
    >
      {/* Dev mode indicator */}
      {isDev && (
        <div
          className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm"
          style={{ zIndex: 1000 }}
        >
          🛠️ Dev Mode - Click or press ESC to dismiss
        </div>
      )}


      {/* PLATTR Logo - Centered horizontally, with space from woman illustration */}
      {hasLogo ? (
        <div
          className="absolute"
          style={{
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
          }}
        >
          <img
            src={plattrLogoImage}
            alt="Plattr Logo"
            style={{
              width: "auto",
              height: "80px",
              objectFit: "contain",
            }}
            data-testid="img-logo"
          />
        </div>
      ) : (
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "200px",
            height: "60px",
            zIndex: 10,
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center rounded-lg"
            style={{
              background: "rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(4px)",
              border: "2px dashed rgba(139, 105, 20, 0.3)",
            }}
          >
            <div className="text-center" style={{ color: "#8B6914" }}>
              <p className="text-xs font-medium">Logo Image</p>
              <p className="text-xs opacity-60 mt-1">
                Add plattr_logo.png
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Woman Illustration - Specific dimensions and positioning */}
      {hasHeroImage ? (
        <img
          src={splashHeroImage}
          alt="Plattr"
          style={{
            position: "absolute",
            top: "411px",
       
            width: "100vw",
            height: "550px",
            opacity: 1,
            zIndex: 5,
            objectFit: "contain",
          }}
          data-testid="img-splash-hero"
        />
      ) : (
        <div
          className="absolute"
          style={{
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "280px",
            height: "320px",
          }}
        >
          <div
            className="w-full h-full flex items-center justify-center rounded-2xl"
            style={{
              background: "rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(4px)",
              border: "2px dashed rgba(139, 105, 20, 0.3)",
            }}
          >
            <div className="text-center" style={{ color: "#8B6914" }}>
              <p className="text-sm font-medium mb-2">👩‍🦱 Woman Illustration</p>
              <p className="text-xs opacity-75">
                Add image to attached_assets/
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
