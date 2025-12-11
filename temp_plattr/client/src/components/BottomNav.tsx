import { Home, Grid3x3, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartItemCount?: number;
}

export default function BottomNav({ activeTab, onTabChange, cartItemCount = 0 }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Menu', icon: Grid3x3 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden" data-testid="nav-bottom">
      <div 
        className="flex items-center justify-around px-4 py-3 gap-2"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all",
                isActive 
                  ? "bg-[#1A9952]" 
                  : "bg-white"
              )}
              style={{
                boxShadow: isActive ? "none" : "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
              data-testid={`button-nav-${tab.id}`}
            >
              <Icon 
                className={cn(
                  "w-5 h-5",
                  isActive ? "text-white" : "text-[#1A9952]"
                )} 
              />
              <span 
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-white" : "text-[#1A9952]"
                )}
                style={{
                  fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
                }}
                data-testid={`text-nav-${tab.id}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}