import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Force light theme only - remove any dark mode classes
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
}

createRoot(document.getElementById("root")!).render(<App />);
