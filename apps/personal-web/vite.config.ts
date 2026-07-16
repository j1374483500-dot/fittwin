import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({ base: process.env.GITHUB_ACTIONS ? "/fittwin/" : "/", plugins: [react(), VitePWA({ registerType: "autoUpdate", manifest: { name: "FitTwin", short_name: "FitTwin", description: "Your private body profile and style guide.", theme_color: "#0d5f5a", background_color: "#f4f7f6", display: "standalone" } })] });
