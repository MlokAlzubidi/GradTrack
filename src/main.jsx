import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import { ensureDemoDataInitialized } from "./data/mockData";
import { AuthProvider } from "./context/AuthContext.jsx";

// Initialize browser demo data once before the first React render.
ensureDemoDataInitialized();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
