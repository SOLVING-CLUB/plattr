import { ChevronRight, MapPin, Phone } from "lucide-react";
import { useLocation } from "wouter";
import { useFestiveSettings } from "@/hooks/useFestiveSettings";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import sankranthiVideo from "@assets/stock_images/IMG_9929.MP4"; // Fallback video

const LOCATION_STORAGE_KEY = "activeLocation";

interface FestiveBannerProps {
  onAction?: () => void;
  onLocationClick?: () => void;
  onServiceAvailabilityChange?: (isUnavailable: boolean, locationLabel: string) => void;
}

export default function FestiveBanner({ 
  onAction,
  onLocationClick,
  onServiceAvailabilityChange
}: FestiveBannerProps) {
  const [, setLocation] = useLocation();
  const { data: festiveSetting, isLoading } = useFestiveSettings();
  const [locationLabel, setLocationLabel] = useState("Select Address");

  // Load location label from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocationLabel(parsed.label || parsed.addressLine || parsed.address || "Select Address");
      } catch (error) {
        console.error("Error parsing location:", error);
      }
    }
  }, []);

  // Listen for location changes
  useEffect(() => {
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.label) {
        setLocationLabel(customEvent.detail.label);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCATION_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLocationLabel(parsed.label || "Select Address");
        } catch (error) {
          console.error("Error parsing location from storage event:", error);
        }
      }
    };

    window.addEventListener("locationchange", handleLocationChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("locationchange", handleLocationChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLocationButtonClick = () => {
    if (onLocationClick) {
      onLocationClick();
    } else {
      setLocation("/location");
    }
  };

  // Don't render if no active festive setting - AFTER all hooks
  if (isLoading) {
    return null; // Or a loading skeleton
  }

  if (!festiveSetting) {
    return null; // No active festive, don't show banner
  }

  const handleClick = () => {
    if (onAction) {
      onAction();
      return;
    }

    // Get action method (default to 1 for backward compatibility)
    const actionMethod = festiveSetting.cta_action_method ?? 1;

    if (actionMethod === 1) {
      // Method 1: Filter method (existing behavior)
      // Set a flag in localStorage to filter by the festive tag
      localStorage.setItem('festiveFilter', festiveSetting.filter_tag);
      // Redirect to bulk-meals page
      setLocation("/bulk-meals");
    } else if (actionMethod === 2) {
      // Method 2: Direct redirect method
      // Clear any existing festive filter to ensure clean state
      localStorage.removeItem('festiveFilter');
      const targetPage = festiveSetting.cta_target_page || 'bulk-meals';
      // Map target page to route
      const routeMap: Record<string, string> = {
        'bulk-meals': '/bulk-meals',
        'mealbox': '/mealbox',
        'snack-box': '/snack-box',
        'corporate': '/corporate',
        'catering': '/catering'
      };
      const route = routeMap[targetPage] || '/bulk-meals';
      setLocation(route);
    }
  };

  // Determine media source - use banner_media_url (or banner_video_url for backward compatibility)
  // Supports: Supabase Storage URLs, absolute URLs, relative paths
  const mediaUrl = (festiveSetting as any).banner_media_url || (festiveSetting as any).banner_video_url;
  const mediaType = (festiveSetting as any).banner_media_type || 'video'; // Default to video for backward compatibility

  const mediaSrc = mediaUrl
    ? (mediaUrl.startsWith('http')
      ? mediaUrl // Full URL (Supabase Storage or external)
      : mediaUrl.startsWith('/')
        ? mediaUrl // Relative path from app root
        : `/${mediaUrl}`) // Add leading slash if missing
    : sankranthiVideo; // Fallback to local asset

  // Get colors from settings or use defaults
  const bgColor = festiveSetting.banner_bg_color || "#06352A";
  const textColor = festiveSetting.banner_text_color || "#F5E9DB";
  const buttonText = festiveSetting.button_text || `${festiveSetting.festive_name} Special`;

  return (
    <section className="w-full overflow-hidden" style={{ marginTop: 0, paddingTop: 0 }}>
      {/* Banner media (image or video) */}
      <div
        className="relative w-full cursor-pointer overflow-hidden bg-white"
        style={{ 
          width: '100%',
          height: 'auto',
          minHeight: '200px',
        }}
        onClick={handleClick}
      >
        {/* Overlay: Location, AI Menu Planner, and Call buttons */}
        <div
          className="absolute left-0 right-0 px-4 flex items-center justify-between z-30"
          style={{
            top: `calc(env(safe-area-inset-top, 0px) + 60px)`,
            paddingTop: '12px',
            paddingBottom: '12px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            className="gap-2 font-medium hover:bg-black/20 max-w-[180px]"
            onClick={handleLocationButtonClick}
            style={{
              color: '#FFFFFF',
              backgroundColor: 'transparent',
            }}
          >
            <MapPin className="w-5 h-5 flex-shrink-0" />
            <span
              className="text-left font-semibold text-[18px] truncate max-w-[120px]"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              {locationLabel}
            </span>
          </Button>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocation("/concierge");
              }}
              className="flex items-center justify-center px-3 py-2 rounded-[10px] shadow-md hover:opacity-90 transition-opacity backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, #06352A 0%, #1A9952 100%)",
                fontFamily: "Sweet Sans Pro",
                fontSize: "12px",
                fontWeight: 500,
                color: "#F5E9DB",
                height: "40px",
              }}
            >
              AI Menu Planner
            </button>
            <a
              href="tel:+917026644556"
              className="flex items-center justify-center w-10 h-10 bg-[#1A9952] rounded-[10px] shadow-md hover:bg-[#158043] transition-colors backdrop-blur-sm"
              data-testid="button-call"
              aria-label="Call us"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>
        {mediaType === 'image' ? (
          <img
            src={mediaSrc}
            alt={`${festiveSetting.festive_name} Special Banner`}
            className="w-full h-auto"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
            loading="eager"
          />
        ) : (
          <video
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        )}

        {/* CTA Button - only show if show_cta_button is true */}
        {festiveSetting.show_cta_button !== false && (() => {
          // Get position settings (default to 'center' for backward compatibility)
          const position = festiveSetting.cta_position || 'center';
          const positionX = festiveSetting.cta_position_x?.trim();
          const positionY = festiveSetting.cta_position_y?.trim();

          // Calculate position styles
          let positionStyles: CSSProperties = {};

          if (position === 'custom' && positionX && positionY) {
            // Custom positioning with x and y values
            const xStr = String(positionX).trim();
            const yStr = String(positionY).trim();

            const hasUnit = (val: string) => {
              return /^[\d.]+(%|px|rem|em|vh|vw|pt|cm|mm|in|ch|ex|fr)$/i.test(val);
            };

            const formatValue = (val: string): string => {
              if (hasUnit(val)) {
                return val;
              }
              const numVal = parseFloat(val);
              if (!isNaN(numVal)) {
                return `${numVal}px`;
              }
              return val;
            };

            const xValue = formatValue(xStr);
            const yValue = formatValue(yStr);

            positionStyles = {
              position: 'absolute',
              left: xValue,
              top: yValue,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            };
          } else {
            // Predefined positions
            const positionMap: Record<string, CSSProperties> = {
              'top-left': {
                position: 'absolute',
                top: '20%',
                left: '10%',
                transform: 'translate(0, 0)',
              },
              'top-center': {
                position: 'absolute',
                top: '20%',
                left: '50%',
                transform: 'translate(-50%, 0)',
              },
              'top-right': {
                position: 'absolute',
                top: '20%',
                right: '10%',
                transform: 'translate(0, 0)',
              },
              'center-left': {
                position: 'absolute',
                top: '50%',
                left: '10%',
                transform: 'translate(0, -50%)',
              },
              'center': {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              },
              'center-right': {
                position: 'absolute',
                top: '50%',
                right: '10%',
                transform: 'translate(0, -50%)',
              },
              'bottom-left': {
                position: 'absolute',
                bottom: '20%',
                left: '10%',
                transform: 'translate(0, 0)',
              },
              'bottom-center': {
                position: 'absolute',
                bottom: '20%',
                left: '50%',
                transform: 'translate(-50%, 0)',
              },
              'bottom-right': {
                position: 'absolute',
                bottom: '20%',
                right: '10%',
                transform: 'translate(0, 0)',
              },
            };
            positionStyles = positionMap[position] || positionMap['center'];
          }

          return (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{
                ...positionStyles,
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="group flex items-center gap-1.5 px-4 py-2 shadow-xl hover-elevate active-elevate-2 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                style={{
                  backgroundColor: bgColor,
                  color: textColor,
                  fontFamily: "Sweet Sans Pro",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "16px",
                }}
              >
                {buttonText}
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
