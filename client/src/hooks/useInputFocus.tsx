import { useCallback, useEffect, useState } from "react";

// Tracks whether any input-like element is currently focused.
export function useInputFocus() {
  const [isInputFocused, setIsInputFocused] = useState(false);

  const checkFocus = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) {
      setIsInputFocused(false);
      return;
    }

    const tagName = activeElement.tagName;
    const isFocused =
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      (activeElement as HTMLElement).isContentEditable;

    setIsInputFocused(isFocused);
  }, []);

  useEffect(() => {
    const handleFocusIn = () => checkFocus();
    const handleFocusOut = () => setTimeout(checkFocus, 50);

    const handleVisualViewportResize = () => {
      if (!window.visualViewport) return;

      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const keyboardOpen = viewportHeight < windowHeight * 0.75;

      if (!keyboardOpen) {
        setTimeout(checkFocus, 100);
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    window.visualViewport?.addEventListener("resize", handleVisualViewportResize);

    const interval = setInterval(checkFocus, 500);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      window.visualViewport?.removeEventListener("resize", handleVisualViewportResize);
      clearInterval(interval);
    };
  }, [checkFocus]);

  return isInputFocused;
}

