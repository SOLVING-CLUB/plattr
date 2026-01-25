/**
 * Simple payment utility to directly open Razorpay modal
 * Replaces PaymentBottomSheet component for simpler payment flow
 */

interface OpenRazorpayModalOptions {
  razorpayKeyId: string;
  razorpayOrderId: string;
  amount: number; // in rupees
  description?: string;
  orderData?: any;
  orderType?: 'regular' | 'bulk_meal' | 'snack_box' | 'meal_box' | 'catering' | 'corporate';
  onError?: (error: string) => void;
}

export async function openRazorpayModal(options: OpenRazorpayModalOptions): Promise<void> {
  const {
    razorpayKeyId,
    razorpayOrderId,
    amount,
    description = "Order Payment",
    orderData,
    orderType,
    onError,
  } = options;

  // Check if Razorpay is loaded
  if (typeof window === 'undefined' || typeof window.Razorpay === 'undefined') {
    const error = "Payment gateway is loading. Please wait a moment and try again.";
    onError?.(error);
    throw new Error(error);
  }

  // Store order data in sessionStorage for order creation after payment
  if (orderData && razorpayOrderId) {
    const orderDataKey = `pending_order_${razorpayOrderId}`;
    sessionStorage.setItem(orderDataKey, JSON.stringify({
      orderData,
      orderType,
      orderId: razorpayOrderId,
      timestamp: Date.now(),
    }));
  }

  // Open Razorpay Checkout modal
  const razorpay = new window.Razorpay({
    key: razorpayKeyId,
    amount: Math.round(amount * 100), // Convert to paise
    currency: "INR",
    name: "Plattr",
    description: description,
    order_id: razorpayOrderId,
    handler: function (response: any) {
      // Payment successful - redirect to callback page
      const params = new URLSearchParams({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
      window.location.href = `/payment-callback?${params.toString()}`;
    },
    prefill: {
      // You can add user details here if available
    },
    theme: {
      color: "#1A9952", // Your brand color
    },
    modal: {
      ondismiss: function() {
        // User closed the modal
        onError?.("Payment cancelled");
      },
    },
  });

  // Apply comprehensive safe area styles to Razorpay modal for iOS
  // Use both 'ready' event and MutationObserver to catch all modal elements
  const applySafeAreaStyles = () => {
    // Check if style already exists
    let styleElement = document.getElementById('razorpay-safe-area-styles');
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = 'razorpay-safe-area-styles';
      styleElement.textContent = `
        /* Razorpay Modal Safe Area Fix for iOS - Comprehensive */
        @supports (padding: constant(safe-area-inset-top)) or (padding: env(safe-area-inset-top)) {
          /* Target ALL possible Razorpay containers */
          body > div[id*="razorpay"],
          body > div[class*="razorpay"],
          div[id*="razorpay-modal"],
          div[class*="razorpay-modal"],
          div[id*="razorpay-checkout"],
          div[class*="razorpay-checkout"],
          .razorpay-container,
          [id*="razorpay"],
          [class*="razorpay"] {
            padding-top: constant(safe-area-inset-top) !important; /* iOS 11.0-11.2 */
            padding-top: env(safe-area-inset-top, 0px) !important; /* iOS 11.2+ */
            padding-bottom: constant(safe-area-inset-bottom) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
            padding-left: constant(safe-area-inset-left) !important;
            padding-left: env(safe-area-inset-left, 0px) !important;
            padding-right: constant(safe-area-inset-right) !important;
            padding-right: env(safe-area-inset-right, 0px) !important;
          }
          
          /* For fixed position containers, adjust TOP instead of just padding */
          body > div[style*="position: fixed"]:has(iframe[src*="razorpay"]),
          body > div[style*="position:fixed"]:has(iframe[src*="razorpay"]),
          div[style*="position: fixed"][id*="razorpay"],
          div[style*="position:fixed"][id*="razorpay"],
          div[style*="position: fixed"][class*="razorpay"],
          div[style*="position:fixed"][class*="razorpay"],
          div[style*="position: fixed"]:has([id*="razorpay"]),
          div[style*="position:fixed"]:has([id*="razorpay"]) {
            top: constant(safe-area-inset-top) !important;
            top: env(safe-area-inset-top, 0px) !important;
            padding-top: calc(constant(safe-area-inset-top) + 12px) !important;
            padding-top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
            padding-bottom: constant(safe-area-inset-bottom) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
            max-height: calc(100vh - constant(safe-area-inset-top) - constant(safe-area-inset-bottom)) !important;
            max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
          }
          
          /* Razorpay iframe - push it down from top */
          iframe[src*="razorpay"],
          iframe[id*="razorpay"],
          iframe[class*="razorpay"] {
            margin-top: calc(constant(safe-area-inset-top) + 12px) !important;
            margin-top: calc(env(safe-area-inset-top, 0px) + 12px) !important;
            max-height: calc(100vh - constant(safe-area-inset-top) - constant(safe-area-inset-bottom)) !important;
            max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)) !important;
          }
          
          /* Target any div containing Razorpay iframe */
          div:has(> iframe[src*="razorpay"]),
          div:has(iframe[src*="razorpay"]) {
            padding-top: constant(safe-area-inset-top) !important;
            padding-top: env(safe-area-inset-top, 0px) !important;
            padding-bottom: constant(safe-area-inset-bottom) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          }
          
          /* Razorpay modal overlay/backdrop */
          div[style*="background"][id*="razorpay"],
          div[style*="background"][class*="razorpay"] {
            padding-top: constant(safe-area-inset-top) !important;
            padding-top: env(safe-area-inset-top, 0px) !important;
            padding-bottom: constant(safe-area-inset-bottom) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
          }
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    // Also apply inline styles to any existing Razorpay elements
    const applyInlineStyles = () => {
      const razorpayElements = document.querySelectorAll('[id*="razorpay"], [class*="razorpay"], iframe[src*="razorpay"]');
      razorpayElements.forEach((element: any) => {
        if (element.style) {
          const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || 
                             window.getComputedStyle(document.body).getPropertyValue('padding-top') ||
                             '0px';
          
          // Apply safe area insets
          if (element.tagName === 'IFRAME') {
            element.style.marginTop = `calc(env(safe-area-inset-top, 0px) + 12px)`;
            element.style.setProperty('margin-top', 'calc(env(safe-area-inset-top, 0px) + 12px)', 'important');
          } else {
            element.style.setProperty('padding-top', 'calc(env(safe-area-inset-top, 0px) + 12px)', 'important');
            element.style.setProperty('padding-bottom', 'env(safe-area-inset-bottom, 0px)', 'important');
            
            // If it's a fixed position element, adjust top
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.position === 'fixed' && element.id && element.id.includes('razorpay')) {
              element.style.setProperty('top', 'env(safe-area-inset-top, 0px)', 'important');
            }
          }
        }
      });
    };
    
    // Apply immediately
    applyInlineStyles();
    
    // Use MutationObserver to catch dynamically added Razorpay elements
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node: any) => {
          if (node.nodeType === 1) { // Element node
            if (node.id && node.id.includes('razorpay') ||
                node.className && node.className.includes('razorpay') ||
                node.querySelector && (node.querySelector('[id*="razorpay"]') || node.querySelector('[class*="razorpay"]') || node.querySelector('iframe[src*="razorpay"]'))) {
              shouldApply = true;
            }
          }
        });
      });
      
      if (shouldApply) {
        setTimeout(applyInlineStyles, 100); // Small delay to ensure elements are fully rendered
      }
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    
    // Clean up observer after 30 seconds (modal should be open by then)
    setTimeout(() => {
      observer.disconnect();
    }, 30000);
  };
  
  // Apply styles when Razorpay is ready
  razorpay.on("ready", function() {
    console.log('[PaymentUtils] Razorpay modal ready, applying iOS safe area styles...');
    applySafeAreaStyles();
  });
  
  // Also apply immediately (in case ready event fires before modal is fully rendered)
  setTimeout(applySafeAreaStyles, 100);

  razorpay.open();
}
