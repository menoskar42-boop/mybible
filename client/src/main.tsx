import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  }
} catch (e) {
  console.log("App initialization error:", e);
}
