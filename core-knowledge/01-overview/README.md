# Chapter 01 — Overview

**Last Updated:** 2026-04-01  
**Source Path(s):** `/` (root), `README.md`, `package.json`  
**Status:** Verified

---

## Summary

`react-entra-id-authentication` is a minimal, production-ready React boilerplate that demonstrates how to integrate **Microsoft Entra ID** (formerly Azure Active Directory) authentication into a React single-page application (SPA).

It uses the **Microsoft Authentication Library (MSAL)** for browser-side token acquisition and integrates with both **Microsoft Graph API** (to read user profile data) and a **custom backend API** (to demonstrate Bearer-token-protected endpoints).

The project is intentionally small (~293 lines of TypeScript/TSX) and serves as a reference implementation or starting point rather than a production application.

---

## Table of Contents

- [Purpose & Goals](#purpose--goals)
- [Technology Stack](#technology-stack)
- [Key Features](#key-features)
- [Project Scope and Limitations](#project-scope-and-limitations)
- [Who Should Use This](#who-should-use-this)
- [Related Resources](#related-resources)

---

## Purpose & Goals

The project solves the common challenge of adding enterprise-grade SSO (Single Sign-On) to a React application backed by Azure/Entra ID. Specifically, it demonstrates:

1. **MSAL Browser integration** — How to initialize the MSAL `PublicClientApplication` and manage the authentication lifecycle.
2. **Silent token acquisition** — How to retrieve access tokens silently from the MSAL cache to avoid re-prompting the user.
3. **Microsoft Graph API calls** — How to call the `/me` endpoint to fetch the authenticated user's profile.
4. **Custom backend API calls** — How to acquire a scoped token for a private backend and include it in HTTP requests.
5. **React Router integration** — How to use a custom `NavigationClient` so that MSAL's redirect flows work correctly with React Router's `navigate` function instead of `window.location`.

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | ^5.2.2 |
| UI Framework | React | ^18.2.0 |
| Routing | React Router DOM | ^6.23.1 |
| Authentication | @azure/msal-browser | ^3.14.0 |
| MSAL React bindings | @azure/msal-react | ^2.0.16 |
| Build tool | Vite | ^5.2.0 |
| Package manager | pnpm | (lockfile present) |
| Linter | ESLint | ^8.57.0 |
| Type checking | TypeScript (strict) | — |

---

## Key Features

- **Protected routes** — The `Profile` page is wrapped in `MsalAuthenticationTemplate`, which automatically redirects unauthenticated users to the Azure login page.
- **Token caching** — Tokens are stored in `sessionStorage`, so they are cleared when the browser tab closes, preventing session leakage.
- **Silent token refresh** — `acquireTokenSilent` is used for all API calls; fallback to interactive flows on `InteractionRequiredAuthError`.
- **Custom navigation client** — Prevents full-page reloads during MSAL redirect flows by delegating navigation to React Router.
- **Dual API scopes** — Two distinct token scopes are configured: one for Microsoft Graph (`User.Read`) and one for a private backend (`remu.read`, `archicon.read`).

---

## Project Scope and Limitations

| Aspect | Status |
|--------|--------|
| Authentication | ✅ Fully implemented |
| Microsoft Graph (read user profile) | ✅ Implemented |
| Custom backend call | ✅ Implemented (hardcoded to `localhost:8080`) |
| Unit / integration tests | ❌ Not present |
| Error handling (beyond MSAL defaults) | ⚠️ Minimal |
| Authorization (role-based access) | ❌ Not implemented |
| Logout flow | ❌ Not implemented in UI |
| Multi-account support | ❌ Not implemented |
| Server-side rendering | ❌ Not applicable (pure SPA) |

---

## Who Should Use This

- Developers adding Entra ID SSO to a greenfield React SPA.
- Teams who need a reference implementation for MSAL Browser + React Router integration.
- Developers who want to understand silent vs. interactive token acquisition patterns.

---

## Related Resources

- [MSAL Browser documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser)
- [MSAL React documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Microsoft Graph API reference](https://learn.microsoft.com/en-us/graph/api/overview)
- [Microsoft Entra ID (Azure AD) documentation](https://learn.microsoft.com/en-us/entra/identity/)
