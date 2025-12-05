import { useEffect } from "react"
import { useLocation } from "wouter"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/context/CartContex"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastIcon,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()
  const { cart, mealBoxProgress, activeCategory } = useCart()
  const [location] = useLocation()
  
  // Dismiss all toasts when the page/route changes
  useEffect(() => {
    // Dismiss all active toasts on route change
    toasts.forEach((toast) => {
      dismiss(toast.id)
    })
  }, [location])
  
  // Check if we're on the home page
  const isHomePage = location === "/";
  
  // Check if there's a floating cart button visible
  // The cart button shows when there are items in the bulk meals cart (on bulk meals pages)
  const hasCartButton = activeCategory === "bulk-meals" && cart.length > 0 && !isHomePage;
  
  // Check if there's a continue order banner visible
  // Banner shows on home page when there's an active order
  const hasContinueBanner = isHomePage && (mealBoxProgress !== null || (activeCategory && cart.length > 0));
  
  // Position toast above buttons/banners if present, otherwise at their position
  // FloatingNav is at bottom-4 (~70px height)
  // ContinueOrderBanner is at bottom-20 (80px from bottom)
  // FloatingCartButton is at bottom-[102px] (102px from bottom)
  // 
  // If cart button exists: toast at bottom-[180px] (above cart button)
  // If only banner exists: toast at bottom-40 (160px - above continue banner with gap)
  // If nothing exists: toast at bottom-20 (at banner position, above footer nav)
  const getPositionClass = () => {
    if (hasCartButton) {
      return "bottom-[180px]"; // Above cart button
    } else if (hasContinueBanner) {
      return "bottom-40"; // Above continue banner with more gap
    } else {
      return "bottom-20"; // At banner position (above footer nav)
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <ToastIcon variant={variant} />
            <div className="flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className={`fixed ${getPositionClass()} left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm`} />
    </ToastProvider>
  )
}
