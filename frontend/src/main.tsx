import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import { UserProvider } from "./context/UserContext";
import "./index.css";

// ── Register service worker for image caching ──
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("📸 Image cache SW registered:", reg.scope);
    })
    .catch(() => {
      // Service worker registration is optional — silently ignore failures
    });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <AppProvider>
        <BrowserRouter basename="/SaradaStationary">
          <App />
        </BrowserRouter>
      </AppProvider>
    </UserProvider>
  </StrictMode>,
);
