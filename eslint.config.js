import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist", "dist-ssr", "node_modules"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      "no-unused-vars": "off",
      // ✅ Ignora bindings que empiezan con "_" (convención de "intencionalmente no usado")
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",              // parámetros de función:    (_event) => ...
          varsIgnorePattern: "^_",              // variables:                const { genre_ids: _omit, ...rest }
          caughtErrorsIgnorePattern: "^_",      // errores en catch:         catch (_error) { ... }
          destructuredArrayIgnorePattern: "^_", // elementos de array:       const [_first, second] = arr
        },
      ],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",
    },
  },
);
