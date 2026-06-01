import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/no-explicit-any": "error", // Enforce no 'any' types
      "react-hooks/exhaustive-deps": "error", // Enforce complete dependencies in useEffect
    },
  },
]);

export default eslintConfig;