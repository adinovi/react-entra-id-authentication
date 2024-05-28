import type { Configuration, PopupRequest } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "6db23449-b145-4b3e-bcba-1612151adddb",
    authority: "https://login.microsoftonline.com/72d74aa2-ffea-4854-b246-6241845ee5ff"
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback(level, message) {
        console.log(level, message);
      },
    },
  },
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const meRequest: PopupRequest = {
    scopes: ["User.Read"],
};


export const tokenRequest: PopupRequest = {
  scopes: ["api://6db23449-b145-4b3e-bcba-1612151adddb/remu.read", "api://6db23449-b145-4b3e-bcba-1612151adddb/archicon.read"],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};