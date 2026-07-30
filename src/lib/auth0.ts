import { initAuth0 } from "@auth0/nextjs-auth0";

// Provisioned via: stripe projects add auth0/client
// Credentials land in .env automatically; nothing to configure by hand here.
export const auth0 = initAuth0({
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});
