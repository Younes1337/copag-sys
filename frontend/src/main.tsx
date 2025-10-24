import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress TensorFlow.js warnings globally
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && (
    message.includes('kernel') && message.includes('already registered') ||
    message.includes('backend') && message.includes('webgl') ||
    message.includes('TensorFlow') ||
    message.includes('updateFilling Resume is called')
  )) {
    return; // Suppress TensorFlow warnings
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
