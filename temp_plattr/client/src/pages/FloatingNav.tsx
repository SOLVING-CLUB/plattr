import { Home, Grid3x3, User } from "lucide-react";

interface FloatingNavProps {
  activeTab?: "home" | "menu" | "profile";
  onTabChange?: (tab: "home" | "menu" | "profile") => void;
}

export default function FloatingNav({ 
  activeTab = "home",
  onTabChange 
}: FloatingNavProps) {
  const tabs = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "menu" as const, icon: Grid3x3, label: "Menu" },
    { id: "profile" as const, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-[10px] shadow-lg">
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-[10px] transition-all flex-1 justify-center ${
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
                <Icon className="w-5 h-5" />
                <span className="text-base font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}