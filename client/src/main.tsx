import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Initialize log capture early - this will start capturing console logs automatically
import "@/lib/logCapture";

// Force light theme only - remove any dark mode classes
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
}

createRoot(document.getElementById("root")!).render(<App />);
