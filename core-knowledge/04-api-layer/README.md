# Chapter 04 — API Layer

**Last Updated:** 2026-04-01  
**Source Path(s):** `src/MsGraphApiCall.ts`, `src/CustomApiCall.ts`  
**Status:** Verified

---

## Summary

This chapter documents the two API utility functions: one for calling the Microsoft Graph API to fetch the authenticated user's profile, and one for calling a custom backend API with a scoped Bearer token. Both functions follow the same pattern: acquire a token silently, then make an authenticated HTTP request.

---

## Table of Contents

- [callMsGraph — Microsoft Graph API Call](#callmsgraph--microsoft-graph-api-call)
- [callToken — Custom Backend API Call](#calltoken--custom-backend-api-call)
- [Shared Patterns](#shared-patterns)
- [Error Handling](#error-handling)
- [Key Dependencies](#key-dependencies)
- [Known Issues / TODOs](#known-issues--todos)

---

## callMsGraph — Microsoft Graph API Call

**File:** `src/MsGraphApiCall.ts`  
**Export:** `export async function callMsGraph(): Promise<any>`

### Purpose

Acquires an access token for the Microsoft Graph API and fetches the current user's profile from the `/me` endpoint.

### Full Implementation Walkthrough

```typescript
export async function callMsGraph() {
  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw Error("No active account! Verify a user has been signed in and setActiveAccount has been called.");
  }

  const response = await msalInstance.acquireTokenSilent({
    ...meRequest,
    account: account,
  });

  const headers = new Headers();
  const bearer = `Bearer ${response.accessToken}`;
  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch(graphConfig.graphMeEndpoint, options)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}
```

### Step-by-Step Explanation

| Step | Code | Description |
|------|------|-------------|
| 1 | `msalInstance.getActiveAccount()` | Gets the currently active account object. Throws if no account is set (user not signed in). |
| 2 | `msalInstance.acquireTokenSilent(...)` | Acquires an access token for `User.Read` scope silently. Uses the spread `...meRequest` to include the configured scopes. |
| 3 | `new Headers()` / `headers.append("Authorization", ...)` | Builds the HTTP headers with a `Bearer {token}` Authorization header. |
| 4 | `fetch(graphConfig.graphMeEndpoint, options)` | Makes a GET request to `https://graph.microsoft.com/v1.0/me`. |
| 5 | `.then((response) => response.json())` | Parses the JSON response body. |
| 6 | `.catch((error) => console.log(error))` | Logs fetch errors silently (no re-throw). |

### Return Value

Returns a `Promise<any>` that resolves to a parsed JSON object representing the Microsoft Graph user profile. Example response shape:

```json
{
  "displayName": "John Doe",
  "givenName": "John",
  "surname": "Doe",
  "mail": "john.doe@example.com",
  "userPrincipalName": "john.doe@example.com",
  "id": "00000000-0000-0000-0000-000000000000",
  "jobTitle": "Software Engineer",
  "officeLocation": "London",
  "mobilePhone": null,
  "businessPhones": []
}
```

### Imports

```typescript
import { msalInstance } from "./main";
import { graphConfig, meRequest } from "./msalConfig";
```

---

## callToken — Custom Backend API Call

**File:** `src/CustomApiCall.ts`  
**Export:** `export async function callToken(): Promise<void>`

### Purpose

Acquires an access token for a custom backend API using the `remu.read` and `archicon.read` scopes, then makes an authenticated GET request to `http://localhost:8080/api/data`.

### Full Implementation Walkthrough

```typescript
export async function callToken() {
  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw Error("No active account! Verify a user has been signed in.");
  }

  const response = await msalInstance.acquireTokenSilent({
    ...tokenRequest,
    account: account,
    forceRefresh: false,
  });

  const headers = new Headers();
  const bearer = `Bearer ${response.accessToken}`;
  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers,
  };

  return fetch("http://localhost:8080/api/data", options)
    .then((response) => console.log(response))
    .catch((error) => console.log(error));
}
```

### Step-by-Step Explanation

| Step | Code | Description |
|------|------|-------------|
| 1 | `msalInstance.getActiveAccount()` | Gets the active account. Throws if not signed in. |
| 2 | `msalInstance.acquireTokenSilent({ ...tokenRequest, account, forceRefresh: false })` | Acquires a scoped token for the custom backend. `forceRefresh: false` means use cache if available. |
| 3 | Build Bearer headers | Same pattern as `callMsGraph`. |
| 4 | `fetch("http://localhost:8080/api/data", options)` | Calls the local backend API. |
| 5 | `.then((response) => console.log(response))` | Logs the raw response (not the body) to console. |
| 6 | `.catch((error) => console.log(error))` | Logs errors silently. |

### Return Value

Returns `Promise<void>`. The response is only logged to the browser console — it is not returned or stored in any state.

### Imports

```typescript
import { msalInstance } from "./main";
import { tokenRequest } from "./msalConfig";
```

---

## Shared Patterns

Both API call functions follow the same pattern, which can be extracted as a general recipe:

```
1. Get active account → throw if null
2. Acquire token silently with spread scopes + account
3. Build Authorization: Bearer {token} header
4. fetch(url, { method: "GET", headers })
5. Parse / log response
6. Catch and log errors
```

### Common Design: Direct msalInstance Import

Both files import `msalInstance` directly from `main.tsx` rather than receiving it as a parameter. This works because ES modules are singletons — the same object reference is shared. While this is a pragmatic shortcut for a small app, it makes these functions harder to test in isolation (they have a hidden dependency on module-level state).

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No active account | Throws `Error("No active account! ...")` — will be an unhandled promise rejection unless caught by caller |
| `acquireTokenSilent` fails (e.g., `InteractionRequiredAuthError`) | Not caught here — propagates to caller. `Profile.tsx` catches `InteractionRequiredAuthError` and calls `acquireTokenRedirect`. |
| `fetch` network error | Caught by `.catch()` and logged to console. Error is swallowed — caller receives `undefined`. |
| Non-2xx HTTP response | Not checked. `response.json()` is called unconditionally. If the server returns an error JSON body, it will be returned as-is. |

### Important Gap

`callMsGraph` and `callToken` do not check `response.ok` before calling `.json()` or `.log()`. A failed HTTP response (e.g., 401, 403, 500) will be silently consumed.

---

## Key Dependencies

| Package | Used By | Purpose |
|---------|---------|---------|
| `@azure/msal-browser` (via `msalInstance`) | Both | Token acquisition |
| `msalConfig.ts` | Both | Scope and endpoint constants |
| `main.tsx` | Both | Shared `msalInstance` singleton |
| Browser `fetch` API | Both | HTTP requests |

---

## Known Issues / TODOs

- **Hardcoded backend URL:** `http://localhost:8080/api/data` in `CustomApiCall.ts` must be made configurable via `import.meta.env.VITE_API_URL` or similar.
- **No response.ok check:** Neither function validates the HTTP status code before processing the response.
- **callToken logs raw response:** The response object (not the parsed body) is logged — likely a debug artifact.
- **Error swallowing:** All fetch errors are caught and logged; callers receive `undefined` on failure with no indication that something went wrong.
- **No retry logic:** There is no retry mechanism for transient network errors.
- **Testability:** Direct imports of `msalInstance` make unit testing difficult. A refactor to accept `msalInstance` as a parameter would improve testability.
