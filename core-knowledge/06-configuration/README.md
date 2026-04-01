# Chapter 06 — Configuration

**Last Updated:** 2026-04-01  
**Source Path(s):** `tsconfig.json`, `tsconfig.node.json`, `.eslintrc.cjs`, `vite.config.ts`, `package.json`, `.gitignore`  
**Status:** Verified

---

## Summary

This chapter documents all project configuration files: TypeScript compiler options, ESLint rules, Vite build settings, and the package manifest. Understanding these configurations is essential for onboarding, debugging build issues, and extending the project correctly.

---

## Table of Contents

- [tsconfig.json — Application TypeScript Config](#tsconfigjson--application-typescript-config)
- [tsconfig.node.json — Build Tool TypeScript Config](#tsconfignodelson--build-tool-typescript-config)
- [.eslintrc.cjs — Linting Rules](#eslintrcjs--linting-rules)
- [vite.config.ts — Build & Dev Server](#viteconfigts--build--dev-server)
- [package.json — Scripts & Dependencies](#packagejson--scripts--dependencies)
- [.gitignore — Excluded Files](#gitignore--excluded-files)
- [Known Issues / TODOs](#known-issues--todos)

---

## tsconfig.json — Application TypeScript Config

**File:** `tsconfig.json`

This is the main TypeScript configuration for the `src/` directory.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsFiles": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Key Options Explained

| Option | Value | Effect |
|--------|-------|--------|
| `target` | `ES2020` | Output JavaScript compatible with modern browsers; enables features like optional chaining, nullish coalescing |
| `lib` | `["ES2020", "DOM", "DOM.Iterable"]` | TypeScript knows about browser APIs (`fetch`, `Headers`, `document`, etc.) |
| `module` | `ESNext` | Use ES module syntax (`import`/`export`) |
| `moduleResolution` | `bundler` | Optimized for use with Vite/esbuild; allows `.ts` imports without extensions |
| `allowImportingTsFiles` | `true` | Allows importing `.ts`/`.tsx` files directly (Vite handles resolution) |
| `noEmit` | `true` | TypeScript only type-checks; Vite handles actual transpilation and output |
| `jsx` | `react-jsx` | Uses the new JSX transform (no need to `import React` in every file) |
| `strict` | `true` | Enables all strict type checks: `strictNullChecks`, `strictFunctionTypes`, etc. |
| `noUnusedLocals` | `true` | Compile error if a local variable is declared but never used |
| `noUnusedParameters` | `true` | Compile error if a function parameter is declared but never used |
| `noFallthroughCasesInSwitch` | `true` | Compile error on switch cases that fall through without a `break`/`return` |
| `skipLibCheck` | `true` | Skips type checking of `.d.ts` files in `node_modules` (speeds up builds) |
| `isolatedModules` | `true` | Each file must be independently transpilable (required for Vite's single-file transform) |
| `useDefineForClassFields` | `true` | Uses `Object.defineProperty` for class fields (aligns with ECMAScript spec) |

### Scope

- **Includes:** `src/` directory only
- **References:** `tsconfig.node.json` for build tool files

---

## tsconfig.node.json — Build Tool TypeScript Config

**File:** `tsconfig.node.json`

Configuration for TypeScript files that run in Node.js (build tooling), specifically `vite.config.ts`.

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

| Option | Purpose |
|--------|---------|
| `composite` | Enables project references; required by the parent `tsconfig.json`'s `references` field |
| `allowSyntheticDefaultImports` | Allows `import X from 'module'` even when module has no default export (common for CommonJS interop) |
| `include` | Only includes `vite.config.ts` |

---

## .eslintrc.cjs — Linting Rules

**File:** `.eslintrc.cjs`

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
};
```

### Configuration Details

| Setting | Value | Effect |
|---------|-------|--------|
| `root` | `true` | Stops ESLint from searching parent directories for config files |
| `env.browser` | `true` | Defines browser globals (`window`, `document`, `fetch`, etc.) |
| `env.es2020` | `true` | Defines ES2020 globals (`Promise`, `globalThis`, etc.) |
| `extends: eslint:recommended` | — | Core ESLint rules (no `==`, no unused vars at JS level, etc.) |
| `extends: @typescript-eslint/recommended` | — | TypeScript-specific rules: no `any` warnings, prefer `const`, etc. |
| `extends: react-hooks/recommended` | — | Enforces React Hooks rules: hooks only at top level, dependencies arrays |
| `parser: @typescript-eslint/parser` | — | Parses TypeScript syntax |
| `plugins: react-refresh` | — | Adds react-refresh rules for HMR compatibility |
| `react-refresh/only-export-components` | warn + allowConstantExport | Warns if a module exports both components and non-component values (breaks HMR) |

### Running the Linter

```bash
pnpm lint
# Equivalent to: eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0
```

The `--max-warnings 0` flag means **zero warnings are allowed** — any warning is treated as an error. This enforces strict lint compliance.

---

## vite.config.ts — Build & Dev Server

**File:** `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

This is a minimal Vite configuration. The `@vitejs/plugin-react` plugin provides:

- **Fast Refresh (HMR):** React components update in place without full page reload during development.
- **JSX transformation:** Handles `.tsx`/`.jsx` files using Babel under the hood.
- **Automatic React import:** Works with `jsx: "react-jsx"` in tsconfig (no need for `import React`).

### Default Vite Behavior (no explicit config needed)

| Feature | Default |
|---------|---------|
| Dev server port | `5173` |
| Build output | `dist/` |
| Entry point | `index.html` |
| Asset handling | Automatic (images, fonts, etc.) |
| Code splitting | Automatic (based on dynamic `import()`) |
| TypeScript | Transpiled by esbuild (not type-checked; `tsc` does type checking) |

---

## package.json — Scripts & Dependencies

**File:** `package.json`

```json
{
  "name": "azure-login",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  }
}
```

### Scripts Reference

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start development server with HMR on `localhost:5173` |
| `build` | `tsc && vite build` | First type-check with TypeScript, then build production bundle to `dist/` |
| `lint` | `eslint . --ext ts,tsx ...` | Lint all TypeScript files with zero-warning tolerance |
| `preview` | `vite preview` | Serve the production `dist/` build locally for testing |

### Running Scripts

```bash
pnpm dev        # Start dev server
pnpm build      # Type check + production build
pnpm lint       # Run linter
pnpm preview    # Preview production build
```

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@azure/msal-browser` | ^3.14.0 | MSAL browser core — token acquisition, caching, redirect flows |
| `@azure/msal-react` | ^2.0.16 | MSAL React bindings — `MsalProvider`, `useMsal`, `MsalAuthenticationTemplate` |
| `react` | ^18.2.0 | React framework |
| `react-dom` | ^18.2.0 | React DOM renderer |
| `react-router-dom` | ^6.23.1 | Client-side routing — `BrowserRouter`, `Routes`, `Route`, `useNavigate` |
| `react-server-dom-webpack` | 19.0.0 | ⚠️ Experimental — React Server DOM for webpack; appears unused in this project |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/react` | ^18.2.66 | TypeScript types for React |
| `@types/react-dom` | ^18.2.22 | TypeScript types for React DOM |
| `@typescript-eslint/eslint-plugin` | ^7.2.0 | TypeScript ESLint rules |
| `@typescript-eslint/parser` | ^7.2.0 | TypeScript parser for ESLint |
| `@vitejs/plugin-react` | ^4.2.1 | Vite React plugin (HMR, JSX) |
| `eslint` | ^8.57.0 | Linter engine |
| `eslint-plugin-react-hooks` | ^4.6.0 | React Hooks lint rules |
| `eslint-plugin-react-refresh` | ^0.4.6 | Vite HMR lint rules |
| `typescript` | ^5.2.2 | TypeScript compiler |
| `vite` | ^5.2.0 | Build tool and dev server |

---

## .gitignore — Excluded Files

```
node_modules
dist
dist-ssr
*.local
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

| Pattern | What It Excludes |
|---------|-----------------|
| `node_modules` | All installed packages |
| `dist`, `dist-ssr` | Production build output |
| `*.local` | Local environment files (e.g., `.env.local`) |
| `.vscode/*` (except `extensions.json`) | VS Code workspace settings |
| `.idea` | JetBrains IDE settings |
| `.DS_Store` | macOS metadata files |
| `*.suo`, `*.ntvs*`, etc. | Visual Studio solution/project files |

---

## Known Issues / TODOs

- **`react-server-dom-webpack@19.0.0`** is listed as a production dependency but appears unused in the codebase. It should be removed to avoid unnecessary bundle weight and potential compatibility issues.
- **No `.env` file support:** Azure credentials (`clientId`, `tenantId`) are hardcoded in `msalConfig.ts`. A `.env.local` file with `VITE_CLIENT_ID` and `VITE_TENANT_ID` variables (and corresponding `import.meta.env.*` reads in `msalConfig.ts`) would make the app configurable across environments.
- **No `dependabot.yml` configuration:** The `.github/dependabot.yml` file exists but appears to be a placeholder without a `package-ecosystem` entry.
- **`type: "module"` in package.json:** This is correct for an ES module project but means all Node.js scripts must use `.mjs` or `import` syntax — relevant if adding Node-side tooling.
