import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Für GitHub Pages (https://<user>.github.io/heizlast-web/) setzt der
  // Deploy-Workflow DEPLOY_BASE=/heizlast-web/
  base: process.env.DEPLOY_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
