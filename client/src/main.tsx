import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Initialize log capture early - this will start capturing console logs automatically
import "@/lib/logCapture";

// Force light theme only - remove any dark mode classes
if (typeof document !== 'undefined') {
  try {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } catch (error) {
    // If localStorage is not available, just remove dark class
    console.warn('[Plattr] localStorage not available for theme:', error);
    document.documentElement.classList.remove('dark');
  }
}

// Global error handlers to catch unhandled errors
window.addEventListener('error', (event) => {
  console.error("[Plattr] ❌ Global error caught:", event.error);
  console.error("[Plattr] Error details:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error("[Plattr] ❌ Unhandled promise rejection:", event.reason);
  event.preventDefault(); // Prevent default browser error handling
});

// Function to initialize the app
function initApp() {
  try {
    const rootElement = document.getElementById("root");
    
    if (!rootElement) {
      console.error("[Plattr] ❌ Root element not found! Make sure index.html has a <div id='root'></div>");
      // Show error message to user
      document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; padding: 20px; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
          <h1 style="color: #ef4444; margin-bottom: 16px;">App Initialization Error</h1>
          <p style="color: #6b7280; margin-bottom: 8px;">Root element not found. Please check the app configuration.</p>
          <p style="color: #9ca3af; font-size: 14px;">Error: Root element 'root' is missing from the DOM</p>
        </div>
      `;
      return;
    }

    console.log("[Plattr] ✅ Root element found, initializing React app...");
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("[Plattr] ✅ React app rendered successfully");
  } catch (error) {
    console.error("[Plattr] ❌ Failed to initialize app:", error);
    // Show error message to user
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; padding: 20px; text-align: center; font-family: system-ui, -apple-system, sans-serif;">
          <h1 style="color: #ef4444; margin-bottom: 16px;">App Initialization Error</h1>
          <p style="color: #6b7280; margin-bottom: 8px;">Failed to start the application.</p>
          <p style="color: #9ca3af; font-size: 14px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready
  initApp();
}
