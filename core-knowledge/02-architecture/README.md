# Chapter 02 — Architecture

**Last Updated:** 2026-04-01  
**Source Path(s):** `src/`, `index.html`, `vite.config.ts`  
**Status:** Verified

---

## Summary

This chapter describes the overall architectural layout of the application: how files relate to each other, how data flows from the browser through authentication to API calls, and the key design decisions made in the codebase.

---

## Table of Contents

- [High-Level Architecture Diagram](#high-level-architecture-diagram)
- [Module Dependency Map](#module-dependency-map)
- [Data Flow: Application Bootstrap](#data-flow-application-bootstrap)
- [Data Flow: Authenticated Page Load](#data-flow-authenticated-page-load)
- [Data Flow: API Token Acquisition](#data-flow-api-token-acquisition)
- [Key Architectural Decisions](#key-architectural-decisions)
- [File Roles at a Glance](#file-roles-at-a-glance)
- [Known Issues / TODOs](#known-issues--todos)

---

## High-Level Architecture Diagram

```
Browser
  │
  └─▶ index.html
        └─▶ src/main.tsx          ← Bootstrap: MSAL init + React mount
              └─▶ src/App.tsx     ← Root: MsalProvider + React Router
                    └─▶ src/Profile.tsx   ← Protected route (MsalAuthenticationTemplate)
                          ├─▶ src/MsGraphApiCall.ts  ← Calls Microsoft Graph /me
                          └─▶ src/CustomApiCall.ts   ← Calls localhost:8080/api/data
```

**External Systems:**
```
src/MsGraphApiCall.ts  ──▶  https://graph.microsoft.com/v1.0/me
src/CustomApiCall.ts   ──▶  http://localhost:8080/api/data
Both API callers       ──▶  https://login.microsoftonline.com/{tenantId}  (MSAL token endpoint)
```

---

## Module Dependency Map

```
main.tsx
  ├── msalConfig.ts         (imports: msalConfig, msalInstance is exported from main)
  ├── App.tsx               (passed msalInstance as prop)
  └── react-router-dom      (BrowserRouter)

App.tsx
  ├── NavigationClient.ts   (CustomNavigationClient)
  ├── Profile.tsx           (rendered at route "/")
  ├── @azure/msal-react     (MsalProvider)
  └── react-router-dom      (Routes, Route, useNavigate)

Profile.tsx
  ├── MsGraphApiCall.ts     (callMsGraph)
  ├── CustomApiCall.ts      (callToken)
  ├── Loading.tsx           (loading state)
  ├── ErrorComponent.tsx    (error state)
  ├── @azure/msal-react     (MsalAuthenticationTemplate, useMsal)
  └── @azure/msal-browser   (InteractionType, InteractionRequiredAuthError)

MsGraphApiCall.ts
  ├── main.tsx              (msalInstance — circular-ish, resolved by module init order)
  └── msalConfig.ts         (meRequest, graphConfig)

CustomApiCall.ts
  ├── main.tsx              (msalInstance)
  └── msalConfig.ts         (tokenRequest)

NavigationClient.ts
  └── @azure/msal-browser   (NavigationClient, NavigationOptions)
```

> **Note on msalInstance sharing:** `msalInstance` is created in `main.tsx` and imported directly by `MsGraphApiCall.ts` and `CustomApiCall.ts`. This works because ES modules are singletons — the same instance is shared across all imports. This avoids prop-drilling the instance down to utility functions.

---

## Data Flow: Application Bootstrap

```
1. Browser loads index.html
2. Vite serves /src/main.tsx as the module entry
3. main.tsx:
   a. Imports msalConfig from msalConfig.ts
   b. Creates PublicClientApplication (msalInstance)
   c. Calls msalInstance.initialize() [async, awaited]
   d. Checks getAllAccounts() — if any account exists, sets the first as active
   e. Registers an event callback: on LOGIN_SUCCESS → set active account
   f. Renders <BrowserRouter><App pca={msalInstance} /></BrowserRouter> into #root
```

---

## Data Flow: Authenticated Page Load

```
1. React renders App.tsx
2. App.tsx:
   a. Calls useNavigate() to get navigation function
   b. Creates CustomNavigationClient(navigate)
   c. Calls pca.setNavigationClient(customNavigationClient)
   d. Wraps children in <MsalProvider instance={pca}>
   e. Renders <Routes> with "/" → <Profile />

3. Profile.tsx renders MsalAuthenticationTemplate:
   a. interactionType = InteractionType.Redirect
   b. If user is NOT authenticated → MSAL triggers redirect to Azure login
   c. If user IS authenticated → renders <ProfileContent />

4. ProfileContent mounts:
   a. useEffect fires: calls callMsGraph()
   b. callMsGraph() acquires token silently (meRequest scopes)
   c. Fetches https://graph.microsoft.com/v1.0/me with Bearer token
   d. Sets graphData state → React re-renders with user data displayed as JSON
```

---

## Data Flow: API Token Acquisition

```
Silent acquisition path (normal):
  Component calls acquireTokenSilent(request)
    → MSAL checks sessionStorage cache
    → Token still valid → returns cached token
    → Token expired → MSAL silently refreshes via hidden iframe
    → Returns fresh access token

Interactive acquisition path (fallback):
  acquireTokenSilent throws InteractionRequiredAuthError
    → Component catches error
    → Calls acquireTokenRedirect(request)
    → Full page redirect to Azure login
    → After login, MSAL processes redirect response
    → Returns to application with new token in cache
```

---

## Key Architectural Decisions

### 1. Session Storage for Token Cache
Tokens are stored in `sessionStorage` (not `localStorage`). This means tokens are cleared when the tab or browser closes, which improves security at the cost of requiring re-authentication per session.

### 2. Custom NavigationClient
MSAL's default navigation uses `window.location.assign()`, which causes full page reloads. The `CustomNavigationClient` overrides `navigateInternal()` to use React Router's `navigate()` function, enabling client-side navigation without page reloads during redirect flows.

### 3. msalInstance as a Module-Level Singleton
Rather than passing `msalInstance` through props or context to API utility functions, the instance is exported directly from `main.tsx` and imported by the API modules. This is a pragmatic choice for a small app but would not scale well to a larger application where dependency injection would be preferred.

### 4. Direct Route Protection via MsalAuthenticationTemplate
The Profile route uses `MsalAuthenticationTemplate` as a component-level guard rather than a route-level guard. This means the protection is co-located with the page component rather than centralized in the router configuration.

### 5. No State Management Library
The application has no Redux, Zustand, or other state manager. `graphData` is local component state in `ProfileContent`. For a larger app this would need to be reconsidered.

---

## File Roles at a Glance

| File | Role | Category |
|------|------|----------|
| `index.html` | Browser entry point, defines `#root` div | Static |
| `src/main.tsx` | App bootstrap, MSAL init, React root render | Entry |
| `src/msalConfig.ts` | All MSAL/Azure configuration constants | Config |
| `src/App.tsx` | Root component, provider setup, routing | Container |
| `src/Profile.tsx` | Authenticated page with user data display | Page |
| `src/Home.tsx` | Unused authenticated/unauthenticated demo component | Utility |
| `src/MsGraphApiCall.ts` | Microsoft Graph API utility | API |
| `src/CustomApiCall.ts` | Custom backend API utility | API |
| `src/NavigationClient.ts` | MSAL + React Router bridge | Utility |
| `src/ErrorComponent.tsx` | Authentication error display | UI |
| `src/Loading.tsx` | Authentication loading display | UI |
| `src/vite-env.d.ts` | Vite type declarations | Types |

---

## Known Issues / TODOs

- `Home.tsx` is defined but never rendered in any route — it appears to be unused dead code.
- `CustomApiCall.ts` hardcodes `http://localhost:8080/api/data` — this should be moved to an environment variable.
- There is no logout button or logout flow implemented in the UI.
- No error boundary wraps the application outside of the MSAL-provided error component.
- The `msalInstance` singleton import creates an implicit coupling between `MsGraphApiCall.ts`/`CustomApiCall.ts` and `main.tsx`.
