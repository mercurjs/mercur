import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mercurjs/admin/index.css";
import App from "@mercurjs/admin";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
