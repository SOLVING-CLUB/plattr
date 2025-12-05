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
  const { toasts } = useToast()
  const { cart, mealBoxProgress, activeCategory } = useCart()
  
  // Check if there's a floating cart button visible
  // The cart button shows when there are items in the bulk meals cart
  const hasCartButton = activeCategory === "bulk-meals" && cart.length > 0;
  
  // Check if there's a continue order banner visible
  // Banner shows on home page when there's an active order
  const hasContinueBanner = mealBoxProgress !== null || (activeCategory && cart.length > 0);
  
  // Position toast above buttons/banners if present, otherwise at their position
  // FloatingCartButton is at bottom-[102px], ContinueOrderBanner is at bottom-20
  // If cart button exists: toast at bottom-[150px]
  // If only banner exists: toast at bottom-[102px] 
  // If nothing exists: toast at bottom-20 (where banner would be)
  const getPositionClass = () => {
    if (hasCartButton) {
      return "bottom-[150px]"; // Above cart button
    } else if (hasContinueBanner) {
      return "bottom-[102px]"; // Above continue banner (at cart button position)
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
