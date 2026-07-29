/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  test: {
    globals: true,
    // Ambiente de ejecución: "node" para funciones puras (sin DOM).
    // Si luego testeamos componentes con DOM, cambiamos a "jsdom" o "happy-dom".
    environment: "node",

    // Patrón de archivos que Vitest considera tests.
    // Convención: archivos .test.ts o .spec.ts dentro de src/.
    include: ["src/**/*.test.ts"],

    // Reporte de cobertura.
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/test/**",
        "src/vite-env.d.ts",
        "src/main.ts",
      ],
    },
  },
});
