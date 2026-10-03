import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  // Di Vercel (domain root) base harus "/", kalau tidak semua asset 404 dan
  // halaman putih. Vercel otomatis set env VERCEL saat build; di luar Vercel
  // (mis. GitHub Pages) base lama tetap dipakai.
  base: process.env.VERCEL ? "/" : "/TENKA-SINEDEOVINDICE/tenka-app/",

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173,
    host: true,
  },
});
