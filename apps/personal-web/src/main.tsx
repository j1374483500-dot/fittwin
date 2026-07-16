import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./styles.css";
import { App } from "./app";

registerSW({ immediate: true });
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
