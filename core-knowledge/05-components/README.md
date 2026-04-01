# Chapter 05 — Components

**Last Updated:** 2026-04-01  
**Source Path(s):** `src/App.tsx`, `src/Profile.tsx`, `src/Home.tsx`, `src/ErrorComponent.tsx`, `src/Loading.tsx`  
**Status:** Verified

---

## Summary

This chapter documents all React components in the application: their props, rendering logic, MSAL hooks used, and how they fit into the component tree. The application has a shallow component hierarchy — one root container (`App`), one page (`Profile`), and three utility components (`Home`, `ErrorComponent`, `Loading`).

---

## Table of Contents

- [Component Tree](#component-tree)
- [App.tsx — Root Container](#apptsx--root-container)
- [Profile.tsx — Authenticated Page](#profiletsx--authenticated-page)
- [Home.tsx — Auth State Demo](#hometsx--auth-state-demo)
- [ErrorComponent.tsx — Authentication Error Display](#errorcomponenttsx--authentication-error-display)
- [Loading.tsx — Authentication Loading Display](#loadingtsx--authentication-loading-display)
- [MSAL React Hooks & Components Reference](#msal-react-hooks--components-reference)
- [Key Dependencies](#key-dependencies)
- [Known Issues / TODOs](#known-issues--todos)

---

## Component Tree

```
<BrowserRouter>                          ← main.tsx
  <App pca={msalInstance}>              ← App.tsx
    <MsalProvider instance={pca}>       ← App.tsx (from @azure/msal-react)
      <Routes>                          ← App.tsx
        <Route path="/" element={
          <Profile />                   ← Profile.tsx
            <MsalAuthenticationTemplate>← Profile.tsx (from @azure/msal-react)
              loadingComponent={<Loading />}        ← Loading.tsx
              errorComponent={<ErrorComponent />}   ← ErrorComponent.tsx
              <ProfileContent />        ← Profile.tsx (internal sub-component)
            </MsalAuthenticationTemplate>
        } />
      </Routes>
    </MsalProvider>
  </App>
</BrowserRouter>
```

> Note: `Home.tsx` is defined but not rendered in any route — it is effectively dead code.

---

## App.tsx — Root Container

**File:** `src/App.tsx`  
**Export:** `export default App`

### Props

```typescript
type AppProps = {
  pca: IPublicClientApplication;
};
```

`pca` (Public Client Application) — the initialized MSAL instance created in `main.tsx`.

### Full Implementation

```tsx
function App({ pca }: AppProps) {
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  pca.setNavigationClient(navigationClient);

  const Pages = () => {
    return (
      <Routes>
        <Route path="/" element={<Profile />} />
      </Routes>
    );
  };

  return (
    <MsalProvider instance={pca}>
      <Pages />
    </MsalProvider>
  );
}
```

### Key Logic

1. **`useNavigate()`** — Retrieves React Router's navigate function. This must be called inside a component that is a descendant of `<BrowserRouter>`, which is why `BrowserRouter` lives in `main.tsx`.
2. **`CustomNavigationClient(navigate)`** — Creates the MSAL navigation client that delegates to React Router.
3. **`pca.setNavigationClient(...)`** — Registers the custom client on the MSAL instance before rendering.
4. **`MsalProvider`** — Wraps the entire page tree, making MSAL hooks (`useMsal`, `useAccount`, etc.) available to all descendant components.
5. **`Pages` inline component** — Defines routing inside `MsalProvider` scope. Currently has a single route: `"/" → <Profile />`.

### Why Pages is Defined Inside App

The `Pages` component is defined as an inline function inside `App`. This is an acceptable pattern for simple routing but has a minor React pitfall: `Pages` is a new function reference on every render of `App`, causing React to unmount and remount the entire `Pages` tree on each `App` render. For a small app this is not a practical concern.

---

## Profile.tsx — Authenticated Page

**File:** `src/Profile.tsx`  
**Export:** `export function Profile(): JSX.Element`

### Sub-Components

- `Profile` — outer component, wraps `ProfileContent` in `MsalAuthenticationTemplate`
- `ProfileContent` — inner component, fetches and displays user data

### Profile Component

```tsx
export function Profile(): JSX.Element {
  const authRequest = {
    ...loginRequest,
  };

  return (
    <MsalAuthenticationTemplate
      interactionType={InteractionType.Redirect}
      authenticationRequest={authRequest}
      errorComponent={ErrorComponent}
      loadingComponent={Loading}
    >
      <ProfileContent />
    </MsalAuthenticationTemplate>
  );
}
```

**`MsalAuthenticationTemplate` behavior:**
- If the user is **not authenticated**: triggers `interactionType` (Redirect) — redirects to Azure login page.
- While authentication is **in progress**: renders `loadingComponent` (`<Loading />`).
- If authentication **fails**: renders `errorComponent` (`<ErrorComponent />`).
- If authentication **succeeds**: renders children (`<ProfileContent />`).

> Note: `loginRequest` is imported from `msalConfig.ts` but the config file does not export a `loginRequest` symbol — it exports `meRequest`. This is likely a naming error or copy-paste artifact that should be `meRequest` (see Known Issues).

---

### ProfileContent Component

```tsx
function ProfileContent() {
  const { instance, inProgress } = useMsal();
  const [graphData, setGraphData] = useState<object | null>(null);

  useEffect(() => {
    if (!graphData && inProgress === InteractionStatus.None) {
      callMsGraph()
        .then((response) => setGraphData(response))
        .catch((e) => {
          if (e instanceof InteractionRequiredAuthError) {
            instance.acquireTokenRedirect(tokenRequest);
          }
        });
    }
  }, [inProgress, graphData, instance]);

  return (
    <div>
      {graphData ? <p>{JSON.stringify(graphData)}</p> : null}
      <button onClick={() => callToken()}>Test token</button>
    </div>
  );
}
```

### ProfileContent State

| State | Type | Initial Value | Purpose |
|-------|------|---------------|---------|
| `graphData` | `object \| null` | `null` | Stores user data fetched from Microsoft Graph |

### ProfileContent MSAL Hooks

| Hook | Destructured | Purpose |
|------|-------------|---------|
| `useMsal()` | `instance`, `inProgress` | Access MSAL instance and current interaction status |

### ProfileContent useEffect Logic

The `useEffect` runs when `[inProgress, graphData, instance]` change. It triggers `callMsGraph()` only when:
- `graphData` is `null` (not yet fetched)
- `inProgress === InteractionStatus.None` (no authentication flow currently active — safe to acquire tokens)

If `callMsGraph()` fails with `InteractionRequiredAuthError` (silent token acquisition failed), it calls `instance.acquireTokenRedirect(tokenRequest)` to initiate an interactive flow.

> Note: `tokenRequest` is imported and used here for the fallback redirect — this is the custom API scope, not the Graph scope. This is inconsistent: the Graph call fails but the fallback redirects with API scopes. It should use `meRequest` instead.

### ProfileContent Render

- Renders `graphData` as a raw JSON string (no formatting).
- Renders a "Test token" button that calls `callToken()` when clicked.

---

## Home.tsx — Auth State Demo

**File:** `src/Home.tsx`  
**Export:** `export function Home(): JSX.Element`

### Status: Unused

`Home` is not rendered in any route in `App.tsx`. It appears to be a demo or placeholder component.

### Implementation

```tsx
export function Home(): JSX.Element {
  return (
    <div>
      <AuthenticatedTemplate>
        <p>Auht</p>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <p>Unauth</p>
      </UnauthenticatedTemplate>
    </div>
  );
}
```

### MSAL Components Used

| Component | Behavior |
|-----------|----------|
| `AuthenticatedTemplate` | Renders children **only** when user is authenticated |
| `UnauthenticatedTemplate` | Renders children **only** when user is NOT authenticated |

This demonstrates the simple conditional rendering pattern offered by `@azure/msal-react` — no hooks needed.

---

## ErrorComponent.tsx — Authentication Error Display

**File:** `src/ErrorComponent.tsx`  
**Export:** `export const ErrorComponent: React.FC<MsalAuthenticationResult>`

### Props

```typescript
// MsalAuthenticationResult shape (from @azure/msal-react):
{
  error: AuthError | null;
  // ... other fields provided by MsalAuthenticationTemplate
}
```

### Implementation

```tsx
export const ErrorComponent: React.FC<MsalAuthenticationResult> = ({ error }) => {
  return (
    <p>
      An Error Occurred: {error ? error.errorCode : "unknown error"}
    </p>
  );
};
```

### Behavior

- Displays `"An Error Occurred: {error.errorCode}"` when the MSAL `AuthError` object is available.
- Falls back to `"An Error Occurred: unknown error"` when no error object is provided.

---

## Loading.tsx — Authentication Loading Display

**File:** `src/Loading.tsx`  
**Export:** `export const Loading: React.FC`

### Implementation

```tsx
export const Loading: React.FC = () => {
  return <p>Authentication in progress...</p>;
};
```

### Behavior

Renders a simple paragraph while MSAL is processing an authentication flow (redirect, popup, or silent). No spinner or progress indicator is implemented.

---

## MSAL React Hooks & Components Reference

| Hook / Component | File Used In | Purpose |
|-----------------|-------------|---------|
| `MsalProvider` | `App.tsx` | Provides MSAL context to entire component tree |
| `MsalAuthenticationTemplate` | `Profile.tsx` | Protects route; handles auth redirect/loading/error |
| `useMsal()` | `Profile.tsx` (ProfileContent) | Access `instance`, `accounts`, `inProgress` |
| `AuthenticatedTemplate` | `Home.tsx` | Render only when authenticated |
| `UnauthenticatedTemplate` | `Home.tsx` | Render only when not authenticated |

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@azure/msal-react` | All MSAL React hooks and components |
| `@azure/msal-browser` | `InteractionType`, `InteractionRequiredAuthError`, `InteractionStatus` |
| `react` | `useState`, `useEffect` |
| `react-router-dom` | `Routes`, `Route`, `useNavigate` |

---

## Known Issues / TODOs

- **`loginRequest` import in Profile.tsx:** The spread `...loginRequest` is used but `loginRequest` is not exported from `msalConfig.ts`. The correct export is `meRequest`. This would cause a runtime error — it is either an oversight or `loginRequest` has the same shape as `meRequest` and the spread results in an object with just `{}` (no scopes).
- **Fallback redirect uses `tokenRequest`:** In `ProfileContent`'s catch block, `acquireTokenRedirect(tokenRequest)` uses the custom backend scopes instead of the Graph scopes (`meRequest`). This is incorrect and would not resolve the Graph token failure.
- **Raw JSON display:** `graphData` is rendered with `JSON.stringify(graphData)` — no formatting, no field labels, no structured UI.
- **No logout button:** There is no logout mechanism in the UI.
- **`Pages` defined inline in `App`:** Minor React anti-pattern (causes remounting on App re-renders). Should be defined outside `App` or use `useMemo`.
- **`Home` component is dead code:** It is never rendered and could be removed or added to a route.
- **`callToken()` return value ignored:** The button click handler calls `callToken()` without `await` or `.catch()`. Any error from `callToken` would be an unhandled promise rejection.
