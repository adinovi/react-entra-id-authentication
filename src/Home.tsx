import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";


export function Home() {
  return (
    <>
      <AuthenticatedTemplate>Auht</AuthenticatedTemplate>

      <UnauthenticatedTemplate>Unauth </UnauthenticatedTemplate>
    </>
  );
}
