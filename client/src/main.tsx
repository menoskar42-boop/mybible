import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ textAlign: "center", padding: "40px", fontFamily: "Arial, sans-serif", direction: "rtl" }}>
          <h2 style={{ color: "#8B5E3C" }}>الكتاب المقدس رفيقي</h2>
          <p>عذراً، حدث خطأ في تحميل الصفحة.</p>
          <p>يرجى تحديث الصفحة أو استخدام متصفح أحدث.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: "16px", padding: "8px 24px", background: "#8B5E3C", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" }}
          >
            تحديث الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
} catch (e) {
  console.log("App initialization error:", e);
  document.body.innerHTML =
    '<div style="text-align:center;padding:40px;font-family:Arial;direction:rtl"><h2>الكتاب المقدس رفيقي</h2><p>يرجى تحديث الصفحة أو استخدام متصفح أحدث.</p></div>';
}
