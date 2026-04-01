# Chapter 03 — Authentication System

**Last Updated:** 2026-04-01  
**Source Path(s):** `src/main.tsx`, `src/msalConfig.ts`, `src/NavigationClient.ts`  
**Status:** Verified

---

## Summary

This chapter covers the complete authentication system: how MSAL is configured and initialized, how the authentication lifecycle is managed, and how React Router navigation is bridged to MSAL's redirect flows. This is the core of the project.

---

## Table of Contents

- [MSAL Overview](#msal-overview)
- [msalConfig.ts — Configuration Constants](#msalconfigts--configuration-constants)
- [main.tsx — Initialization & Bootstrap](#maintsx--initialization--bootstrap)
- [NavigationClient.ts — React Router Bridge](#navigationclientts--react-router-bridge)
- [Token Acquisition Flows](#token-acquisition-flows)
- [Session & Cache Strategy](#session--cache-strategy)
- [Authentication Event Callbacks](#authentication-event-callbacks)
- [Key Dependencies](#key-dependencies)
- [Known Issues / TODOs](#known-issues--todos)

---

## MSAL Overview

**Microsoft Authentication Library (MSAL)** handles the OAuth 2.0 / OpenID Connect flows with Azure Entra ID. In a SPA:

- The library runs entirely in the browser.
- It exchanges authorization codes for tokens.
- It caches tokens in browser storage and refreshes them silently.
- It exposes React hooks and components (`useMsal`, `MsalProvider`, `MsalAuthenticationTemplate`) for convenient integration.

The MSAL version in use is `@azure/msal-browser ^3.x` (breaking change from 2.x in that `initialize()` must be awaited before use).

---

## msalConfig.ts — Configuration Constants

**File:** `src/msalConfig.ts`

This file exports four constants used throughout the application.

### `msalConfig` — Core MSAL Configuration

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: "6db23449-b145-4b3e-bcba-1612151adddb",
    authority: "https://login.microsoftonline.com/72d74aa2-ffea-4854-b246-6241845ee5ff",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

| Field | Value | Purpose |
|-------|-------|---------|
| `clientId` | `6db23449-b145-4b3e-bcba-1612151adddb` | The Azure AD App Registration client ID |
| `authority` | `https://login.microsoftonline.com/72d74aa2-ffea-4854-b246-6241845ee5ff` | The tenant-specific Azure login endpoint |
| `cacheLocation` | `sessionStorage` | Tokens cleared on tab close |
| `storeAuthStateInCookie` | `false` | No cookie fallback (not needed for modern browsers) |

**Security note:** The `clientId` and `tenantId` are not secrets — they are public identifiers required by the SPA's OAuth flow. Actual sensitive secrets (client secrets) must never be used in browser code; they exist only on the backend.

---

### `meRequest` — ID Token Scope (Microsoft Graph)

```typescript
export const meRequest: PopupRequest = {
  scopes: ["User.Read"],
};
```

Used by `callMsGraph()` to acquire a token for Microsoft Graph. `User.Read` grants permission to read the signed-in user's basic profile (`/me` endpoint).

---

### `tokenRequest` — Custom Backend API Scope

```typescript
export const tokenRequest: PopupRequest = {
  scopes: [
    "api://6db23449-b145-4b3e-bcba-1612151adddb/remu.read",
    "api://6db23449-b145-4b3e-bcba-1612151adddb/archicon.read",
  ],
};
```

Used by `callToken()` to acquire a token for the custom backend API. The scopes follow the format `api://{clientId}/{scopeName}`. Both `remu.read` and `archicon.read` are custom scopes exposed by the same Azure App Registration.

---

### `graphConfig` — Microsoft Graph Endpoint

```typescript
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
```

The URL for the Microsoft Graph `/me` endpoint. Stored here to centralize the URL rather than hardcoding it in the API call file.

---

## main.tsx — Initialization & Bootstrap

**File:** `src/main.tsx`

This is the application entry point. Its responsibilities are:

1. **Create the MSAL instance** (before React renders):
   ```typescript
   export const msalInstance = new PublicClientApplication(msalConfig);
   ```
   Exported so `MsGraphApiCall.ts` and `CustomApiCall.ts` can import it directly.

2. **Await initialization** (MSAL 3.x requirement):
   ```typescript
   await msalInstance.initialize();
   ```
   Ensures the MSAL cache is loaded and processed before any authentication operations.

3. **Set the active account** on startup:
   ```typescript
   const accounts = msalInstance.getAllAccounts();
   if (accounts.length > 0) {
     msalInstance.setActiveAccount(accounts[0]);
   }
   ```
   If a session exists from a previous visit (token still in `sessionStorage`), the user is automatically signed in without a redirect.

4. **Register an event callback** for post-login account setting:
   ```typescript
   msalInstance.addEventCallback((event) => {
     if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
       const payload = event.payload as AuthenticationResult;
       msalInstance.setActiveAccount(payload.account);
     }
   });
   ```
   After a successful redirect login, sets the newly authenticated account as active.

5. **Render the React app**:
   ```typescript
   ReactDOM.createRoot(document.getElementById("root")!).render(
     <BrowserRouter>
       <App pca={msalInstance} />
     </BrowserRouter>
   );
   ```
   `BrowserRouter` is placed in `main.tsx` (outside `App`) so that `App.tsx` can call `useNavigate()` at the top level.

---

## NavigationClient.ts — React Router Bridge

**File:** `src/NavigationClient.ts`

**Problem it solves:** By default, MSAL uses `window.location.assign()` or `window.location.replace()` for redirect navigation. In a React SPA with React Router, this causes unnecessary full page reloads. The `CustomNavigationClient` overrides this behavior.

### Class Definition

```typescript
export class CustomNavigationClient extends NavigationClient {
  private navigate: NavigateFunction;

  constructor(navigate: NavigateFunction) {
    super();
    this.navigate = navigate;
  }

  async navigateInternal(url: string, options: NavigationOptions): Promise<boolean> {
    const relativePath = url.replace(window.location.origin, "");
    if (options.noHistory) {
      this.navigate(relativePath, { replace: true });
    } else {
      this.navigate(relativePath);
    }
    return false;
  }
}
```

### Key Behaviors

| Behavior | Detail |
|----------|--------|
| **URL stripping** | Removes `window.location.origin` from the full URL to get a relative path compatible with React Router |
| **History mode** | If `options.noHistory` is `true`, uses `replace: true` to avoid adding to browser history (used for silent redirects) |
| **Return value** | Returns `false` to tell MSAL that it should NOT also call its own default navigation — the custom client handled it |
| **Instance creation** | Done inside `App.tsx` using the `useNavigate()` hook, then set on the MSAL instance via `pca.setNavigationClient()` |

### Why `useNavigate()` is Called in App.tsx

`useNavigate()` can only be called inside a component that is rendered under a `<Router>` provider. That is why `BrowserRouter` wraps `App` in `main.tsx`, and the navigation client is created inside `App.tsx`.

---

## Token Acquisition Flows

### Silent Flow (Normal Case)

1. Component calls `msalInstance.acquireTokenSilent({ scopes, account })`.
2. MSAL looks up the token cache in `sessionStorage`.
3. If a valid (non-expired) access token exists → returns it immediately.
4. If the access token is expired but a valid refresh token exists → silently requests a new access token from Azure (no user interaction).
5. Returns the `AuthenticationResult` containing the `accessToken` string.

### Interactive Flow (Fallback)

1. `acquireTokenSilent` throws `InteractionRequiredAuthError` (e.g., first login, consent required, session expired).
2. The caller catches the error and calls `msalInstance.acquireTokenRedirect(request)`.
3. Browser redirects to the Azure Entra ID login page.
4. After authentication, Azure redirects back to the app with an authorization code in the URL.
5. MSAL processes the redirect response, exchanges the code for tokens, stores them in cache.
6. The `LOGIN_SUCCESS` event fires, setting the active account in `main.tsx`.
7. The original page re-renders with the user authenticated.

---

## Session & Cache Strategy

| Setting | Value | Implication |
|---------|-------|-------------|
| `cacheLocation` | `sessionStorage` | Tokens are tab-scoped. Each new tab starts fresh. Closing tab/browser clears all tokens. |
| `storeAuthStateInCookie` | `false` | No IE11/cross-iframe compatibility needed — modern browsers only. |
| Active account | Set from `getAllAccounts()[0]` on startup | If the user had an active session (tokens in sessionStorage), they are auto-signed in. |

---

## Authentication Event Callbacks

The `addEventCallback` registration in `main.tsx` listens to MSAL events. Currently only `LOGIN_SUCCESS` is handled:

```typescript
EventType.LOGIN_SUCCESS → set active account from payload.account
```

Other MSAL event types that could be handled but currently are not:

| Event | Trigger | Common Use |
|-------|---------|------------|
| `LOGOUT_SUCCESS` | After logout completes | Clear app state |
| `ACQUIRE_TOKEN_SUCCESS` | After any token acquisition | Token logging |
| `ACQUIRE_TOKEN_FAILURE` | After silent token failure | Show error UI |
| `SSO_SILENT_SUCCESS` | After silent SSO attempt | Auto-sign-in UX |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@azure/msal-browser` | ^3.14.0 | Core MSAL browser library |
| `@azure/msal-react` | ^2.0.16 | React bindings (MsalProvider, hooks, components) |

---

## Known Issues / TODOs

- There is no logout flow in the UI. A logout button calling `msalInstance.logoutRedirect()` or `msalInstance.logoutPopup()` should be added.
- The `tokenRequest` scopes (`remu.read`, `archicon.read`) are specific to a private Azure App Registration. Any fork of this project must update these scope values.
- The `clientId` and `tenantId` in `msalConfig.ts` are hardcoded. For a multi-environment deployment, these should be environment variables (e.g., `import.meta.env.VITE_CLIENT_ID`).
- There is no handling for `ACQUIRE_TOKEN_FAILURE` events at the application level.
- Multi-account support is not implemented — only `accounts[0]` is used.
