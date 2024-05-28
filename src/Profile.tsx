import { useEffect, useState } from "react";

// Msal imports
import { MsalAuthenticationTemplate, useMsal } from "@azure/msal-react";
import {
  InteractionStatus,
  InteractionType,
  InteractionRequiredAuthError,
  AccountInfo,
} from "@azure/msal-browser";
import { meRequest } from "./msalConfig";
import { callMsGraph } from "./MsGraphApiCall";
import { ErrorComponent } from "./ErrorComponent";
import { Loading } from "./Loading";
import { callToken } from "./MsGraphApiCall2";

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

  return <div>
    <button onClick={() => callToken()}>Test token</button>
    {JSON.stringify(graphData)}</div>;
};

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
