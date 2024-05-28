
import { MsalAuthenticationResult } from "@azure/msal-react";

export const ErrorComponent: React.FC<MsalAuthenticationResult> = ({error}) => {
    return <div>An Error Occurred: {error ? error.errorCode : "unknown error"}</div>;
}