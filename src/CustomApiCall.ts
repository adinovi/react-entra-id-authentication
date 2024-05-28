import { tokenRequest } from "./msalConfig";
import { msalInstance } from "./main";

export async function callToken() {
  const account = msalInstance.getActiveAccount();
  if (!account) {
    throw Error(
      "No active account! Verify a user has been signed in and setActiveAccount has been called."
    );
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
    .then((response) => {
      response.json().then((i) => console.log(i));
    })
    .catch((error) => console.log(error));
}
