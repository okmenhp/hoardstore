import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // Giữ cú pháp @media (max-width:...) cũ khi minify CSS,
        // để iPhone đời cũ vẫn đọc được CSS mobile.
        cssTarget: ["chrome111", "edge111", "firefox114", "safari14", "ios14"],
    },
});