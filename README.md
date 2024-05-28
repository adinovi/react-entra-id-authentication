# Using EntraID for Authentication in a React Application

## Introduction
This guide provides an overview of integrating EntraID for authentication in a React application using the `@azure/msal-react` library. By following this guide, you will be able to configure authentication, initialize MSAL, and make API calls to retrieve authenticated user data.

## Installing the `@azure/msal-react` Library
To start, install the necessary libraries by running the following command in your terminal:

```bash
npm install @azure/msal-react @azure/msal-browser
```

## Initializing the MSAL Application
Create a file named `main.tsx` (or `main.js` if you are using JavaScript) where you will initialize the MSAL instance and configure account selection logic and authentication event callbacks.

### `main.tsx`
```typescript
...

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize the MSAL instance
msalInstance.initialize().then(() => {
  // Account selection logic
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  // Callback for authentication events
  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      const account = payload.account;
      msalInstance.setActiveAccount(account);
    }
  });

  // Render the React application
  const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
  );
  
  root.render(
    <Router>
      <App pca={msalInstance} />
    </Router>
  );
});
```

## MSAL Configuration
Create a file named `msalConfig.ts` where you will configure the MSAL settings.

### `msalConfig.ts`
```typescript
...
// MSAL Configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: "xxxxxxx-xxxxxxxx-xxxxx-xxx", // Replace with your client ID
    authority: "https://login.microsoftonline.com/xxxx-xxxxx-xxxxx-xxxxxx", // Replace with your tenant ID
  },
  cache: {
    cacheLocation: "sessionStorage", // You can use "localStorage" as well
    storeAuthStateInCookie: false, // Set to true for IE 11
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message) {
        console.log(level, message);
      },
    },
  },
};

// Add here scopes for ID token to be used at MS Identity Platform endpoints.
export const meRequest: PopupRequest = {
  scopes: ["User.Read"],
};

// Add here scopes for the access token to be used at your API.
export const tokenRequest: PopupRequest = {
  scopes: [
    "api://6db23449-b145-4b3e-bcba-1612151adddb/remu.read",
    "api://6db23449-b145-4b3e-bcba-1612151adddb/archicon.read",
  ],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
```

## Example API Call to Retrieve User Data
Create a function to make an API call to Microsoft Graph to retrieve authenticated user data.

### `MsGraphApiCall.ts`
```typescript
...
// Function to call Microsoft Graph API
export async function callMsGraph() {
  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw Error(
      "No active account! Verify a user has been signed in and setActiveAccount has been called."
    );
  }

  // Acquire token silently
  const response = await msalInstance.acquireTokenSilent({
    ...meRequest,
    account: account
  });

  const headers = new Headers();
  const bearer = `Bearer ${response.accessToken}`;
  headers.append("Authorization", bearer);

  const options = {
    method: "GET",
    headers: headers,
  };

  // API call to get user data
  return fetch(graphConfig.graphMeEndpoint, options)
    .then((response) => response.json())
    .catch((error) => console.log(error));
}
```

## React Components to Display User Profile
Create a React component that uses MSAL to authenticate the user and display profile data.

### `Profile.tsx`
```typescript
...

// Component for displaying profile content
const ProfileContent = () => {
  const { instance, inProgress } = useMsal();
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    if (!graphData && inProgress === InteractionStatus.None) {
      callMsGraph()
        .then((response) => setGraphData(response))
        .catch((e) => {
          if (e instanceof InteractionRequiredAuthError) {
            instance.acquireTokenRedirect({
              ...meRequest,
              account: instance.getActiveAccount() as AccountInfo,
            });
          }
        });
    }
  }, [inProgress, graphData, instance]);

  return (
    <>
      {JSON.stringify(graphData)}
    </>
  );
};

// Main component for displaying user profile
export function Profile() {
  const authRequest = {
    ...meRequest,
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
