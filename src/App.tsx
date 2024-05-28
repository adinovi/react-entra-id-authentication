import { Routes, Route, useNavigate } from "react-router-dom";

// MSAL imports
import { MsalProvider } from "@azure/msal-react";
import { IPublicClientApplication } from "@azure/msal-browser";


import { Profile } from "./Profile";
import { CustomNavigationClient } from "./NavigationClient";

type AppProps = {
  pca: IPublicClientApplication;
};

function App({ pca }: AppProps) {
  // The next 3 lines are optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  pca.setNavigationClient(navigationClient);


  return (
    <MsalProvider instance={pca}>
      <Pages />
    </MsalProvider>
  );
}

function Pages() {
  return (
    <Routes>
      <Route path="/" element={<Profile />} />
    </Routes>
  );
}

export default App;
