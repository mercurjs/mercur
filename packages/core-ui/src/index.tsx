import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app";

let root = null

if (!root) {
  root = ReactDOM.createRoot(document.getElementById("root") as HTMLDivElement)
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
