import { useEffect, useRef } from "react"
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
  const viewportRef = useRef<HTMLDivElement>(null)
  
  // Dismiss all toasts when the page/route changes
  useEffect(() => {
    // Dismiss all active toasts on route change
    toasts.forEach((toast) => {
      dismiss(toast.id)
    })
  }, [location])
  
  // Measure toast viewport height and update CSS variable for smooth button transitions
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateToastHeight = () => {
      const height = viewport.offsetHeight
      // Set CSS custom property on document root for global access
      document.documentElement.style.setProperty('--toast-viewport-height', `${height}px`)
    }

    // Initial measurement
    updateToastHeight()

    // Use ResizeObserver to watch for height changes
    const resizeObserver = new ResizeObserver(() => {
      updateToastHeight()
    })

    resizeObserver.observe(viewport)

    // Also watch for toast changes
    const timeoutId = setTimeout(updateToastHeight, 100)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeoutId)
      // Reset height when component unmounts
      document.documentElement.style.setProperty('--toast-viewport-height', '0px')
    }
  }, [toasts])
  
  // Check if we're on the home page
  const isHomePage = location === "/";
  
  // Check if there's a floating cart button visible
  // The cart button shows when there are items in the bulk meals cart (on bulk meals pages)
  const hasCartButton = activeCategory === "bulk-meals" && cart.length > 0 && !isHomePage;
  
  // Check if there's a continue order banner visible
  // Banner shows on home page when there's an active order
  const hasContinueBanner = isHomePage && (mealBoxProgress !== null || (activeCategory && cart.length > 0));

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
      <ToastViewport 
        ref={viewportRef}
        className="toast-viewport-bottom fixed bottom-0 left-0 right-0 z-[100] flex flex-col-reverse gap-0 w-full"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)', // Account for FloatingNav (~56px) + spacing (16px)
          top: 'auto',
          position: 'fixed',
        }}
      />
    </ToastProvider>
  )
}
