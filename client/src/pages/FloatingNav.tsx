import { useState, useEffect } from "react";
import { Home, Grid3x3, User } from "lucide-react";

interface FloatingNavProps {
  activeTab?: "home" | "menu" | "profile";
  onTabChange?: (tab: "home" | "menu" | "profile") => void;
}

export default function FloatingNav({ 
  activeTab = "home",
  onTabChange 
}: FloatingNavProps) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Detect keyboard visibility using visualViewport API
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        // Keyboard is likely open if viewport is significantly smaller (>150px diff)
        setIsKeyboardOpen(heightDiff > 150);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      handleResize(); // Initial check
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);
  const tabs = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "menu" as const, icon: Grid3x3, label: "Menu" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ];

  // Hide nav when keyboard is open
  if (isKeyboardOpen) {
    return null;
  }

  return (
    <nav 
      className="floating-nav-bottom fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        top: 'auto',
        position: 'fixed',
      }}
    >
      <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-[10px] shadow-lg overflow-hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] transition-all justify-center whitespace-nowrap ${
                  isActive 
                    ? "shadow-md" 
                    : "hover:bg-white/20"
                }`}
                style={isActive ? {
                  backgroundColor: '#06352A',
                  color: '#F5E9DB'
                } : {
                  color: '#06352A'
                }}
                onClick={() => onTabChange?.(tab.id)}
                data-testid={`button-nav-${tab.id}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}