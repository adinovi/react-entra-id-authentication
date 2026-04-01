# Chapter 07 — Build & Tooling

**Last Updated:** 2026-04-01  
**Source Path(s):** `vite.config.ts`, `package.json`, `pnpm-lock.yaml`, `index.html`  
**Status:** Verified

---

## Summary

This chapter covers the build pipeline, development workflow, and tooling setup. The project uses **Vite** as the build tool with **pnpm** as the package manager. Understanding this chapter is essential for setting up the development environment, running the app locally, and producing production builds.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Environment Setup](#development-environment-setup)
- [Development Server](#development-server)
- [Production Build](#production-build)
- [Build Pipeline Internals](#build-pipeline-internals)
- [Linting](#linting)
- [Package Manager: pnpm](#package-manager-pnpm)
- [Dependency Management](#dependency-management)
- [index.html — Vite Entry Point](#indexhtml--vite-entry-point)
- [Key Dependencies](#key-dependencies)
- [Known Issues / TODOs](#known-issues--todos)

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | ≥ 18.x recommended | Required for Vite 5 and modern tooling |
| pnpm | Any recent version | Install with `npm install -g pnpm` |
| Azure Entra ID App Registration | — | Required for authentication to work |

---

## Development Environment Setup

```bash
# 1. Clone the repository
git clone https://github.com/adinovi/react-entra-id-authentication.git
cd react-entra-id-authentication

# 2. Install dependencies (must use pnpm — lockfile is pnpm-lock.yaml)
pnpm install

# 3. Start the development server
pnpm dev

# 4. Open in browser
# http://localhost:5173
```

> **Important:** The Azure credentials in `src/msalConfig.ts` are hardcoded to a specific tenant and app registration. If forking this project, update `clientId` and `authority` (tenantId) to your own Azure App Registration values.

---

## Development Server

**Command:** `pnpm dev`  
**Underlying tool:** `vite`  
**Default URL:** `http://localhost:5173`

### Features

- **Hot Module Replacement (HMR):** React components update instantly on file save without full page reload.
- **Native ES modules:** Vite serves source files directly as ES modules (no bundling in dev mode) — startup is near-instant.
- **TypeScript transpilation:** Handled by esbuild (not `tsc`). Type errors do NOT block the dev server; they appear in the terminal/IDE but do not stop hot reload.
- **Automatic port:** If 5173 is occupied, Vite increments the port automatically.

### Dev Server Behavior with MSAL

MSAL's redirect flow redirects the browser to `https://login.microsoftonline.com`, then back to `http://localhost:5173`. For this to work:
- The Azure App Registration must have `http://localhost:5173` listed as an allowed redirect URI.
- The dev server must be running when the redirect returns.

---

## Production Build

**Command:** `pnpm build`  
**Steps executed:**
1. `tsc` — Full TypeScript type check. Build **fails** if there are type errors.
2. `vite build` — Bundles and optimizes all source files into `dist/`.

**Output directory:** `dist/`

### What's in `dist/`

```
dist/
├── index.html           ← Entry point (with asset hashes injected)
├── assets/
│   ├── index-[hash].js  ← Bundled JS (all source + dependencies)
│   └── index-[hash].css ← Bundled CSS (if any)
└── vite.svg             ← Static assets from public/
```

### Preview Production Build

```bash
pnpm preview
# Serves dist/ locally at http://localhost:4173
```

Use this to test the production bundle locally before deployment.

---

## Build Pipeline Internals

```
pnpm build
  │
  ├─▶ tsc (TypeScript Compiler)
  │     - Reads tsconfig.json
  │     - Type-checks src/ against type definitions
  │     - Does NOT emit files (noEmit: true)
  │     - Fails on type errors, unused vars, unused params
  │
  └─▶ vite build
        - Reads vite.config.ts
        - Uses Rollup under the hood for bundling
        - Uses esbuild for TypeScript transpilation (fast)
        - Applies @vitejs/plugin-react for JSX transformation
        - Tree-shakes unused exports
        - Minifies JS and CSS
        - Content-hashes asset filenames for cache busting
        - Writes output to dist/
```

### Why Both tsc and Vite?

Vite uses esbuild for TypeScript transpilation, which is very fast but does **not** type-check. Running `tsc` before `vite build` ensures type safety at build time. This two-step approach is the standard Vite + TypeScript pattern.

---

## Linting

**Command:** `pnpm lint`  
**Underlying tool:** `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`

### What Gets Linted

- All `.ts` and `.tsx` files in the project (including root-level config files)
- Excludes: `dist/`, `.eslintrc.cjs` (per `ignorePatterns`)

### Lint Failure Modes

| Issue | Severity | Behavior |
|-------|----------|----------|
| ESLint recommended rule violation | error | Blocks (lint exits with non-zero) |
| TypeScript ESLint rule violation | error | Blocks |
| React Hooks rule violation | error | Blocks |
| `react-refresh/only-export-components` | warning → error | Blocks (due to `--max-warnings 0`) |

### When to Run

- Before every commit (or automate with a pre-commit hook)
- In CI/CD pipelines before building
- The build script (`pnpm build`) does NOT run lint automatically — run separately

---

## Package Manager: pnpm

This project uses **pnpm** as its package manager (indicated by `pnpm-lock.yaml`).

### Why pnpm?

- Faster installs than npm due to content-addressable storage
- Disk-efficient: packages are symlinked from a central store
- Strict: prevents accidental use of undeclared dependencies (unlike npm's hoisting)

### Key Commands

```bash
pnpm install              # Install all dependencies from lockfile
pnpm add <package>        # Add a production dependency
pnpm add -D <package>     # Add a dev dependency
pnpm remove <package>     # Remove a dependency
pnpm update               # Update dependencies within semver range
```

### Lockfile

`pnpm-lock.yaml` pins all dependency versions. **Always commit the lockfile** to ensure reproducible installs across environments.

> **Do not mix package managers.** Using `npm install` or `yarn` will create a conflicting lockfile and may cause subtle dependency resolution differences.

---

## Dependency Management

### Dependabot

The repository has `.github/dependabot.yml` which is configured to automatically open PRs when dependencies have new versions. Review Dependabot PRs carefully, especially for:
- `@azure/msal-browser` — major versions have breaking changes
- `@azure/msal-react` — must be compatible with `msal-browser` version
- `react` / `react-dom` — coordinate major upgrades

### Checking for Vulnerabilities

```bash
pnpm audit
# Lists known security vulnerabilities in dependencies
```

---

## index.html — Vite Entry Point

**File:** `index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Key Points

- **`<div id="root">`** — The DOM element React mounts to (referenced in `main.tsx` as `document.getElementById("root")!`).
- **`<script type="module" src="/src/main.tsx">`** — Vite serves `main.tsx` directly as an ES module in development. In production, Vite replaces this with the hashed bundle path.
- **`/vite.svg`** — Served from the `public/` directory, which contains static assets that are not processed by Vite's module system.

---

## Key Dependencies

| Package | Version | Role |
|---------|---------|------|
| `vite` | ^5.2.0 | Build tool, dev server |
| `@vitejs/plugin-react` | ^4.2.1 | React HMR + JSX transform |
| `typescript` | ^5.2.2 | Type checking |
| `eslint` | ^8.57.0 | Linting engine |
| `@typescript-eslint/parser` | ^7.2.0 | TypeScript parsing for ESLint |
| `@typescript-eslint/eslint-plugin` | ^7.2.0 | TypeScript lint rules |
| `eslint-plugin-react-hooks` | ^4.6.0 | React Hooks lint rules |
| `eslint-plugin-react-refresh` | ^0.4.6 | HMR compatibility lint rules |

---

## Known Issues / TODOs

- **No CI/CD pipeline:** There is no GitHub Actions workflow for automated linting, type checking, or building on push/PR. Adding a basic `.github/workflows/ci.yml` is recommended.
- **No environment variable support:** Credentials are hardcoded. Vite supports `.env` files with the `VITE_` prefix — migrate `clientId` and `tenantId` to environment variables.
- **`react-server-dom-webpack@19.0.0`:** Listed as a production dependency but unused. Remove it to reduce bundle size and eliminate a potential compatibility concern.
- **No test runner:** Neither Vitest nor Jest is configured. Adding Vitest (Vite-native test runner) would be straightforward.
- **`pnpm build` does not lint:** Running lint before or within the build script would catch issues earlier.
- **Page title:** `index.html` still has the default `"Vite + React + TS"` title — should be updated to the application name.
