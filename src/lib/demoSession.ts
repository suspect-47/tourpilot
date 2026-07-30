import { getSession, type Session } from "@auth0/nextjs-auth0";

/**
 * Local-only auth bypass.
 *
 * When `DEMO_BYPASS_AUTH=1` is set AND the build is not production, this
 * returns a synthetic session so the dashboard can be driven before Auth0
 * credentials exist in `.env`. In every other case it is a pass-through to
 * the real `getSession()`, so leaving it in place changes nothing.
 *
 * The `NODE_ENV` check is the important half: it means the bypass cannot be
 * switched on in a deployed environment even if the variable leaks into that
 * environment's config. Do not remove it, and do not set DEMO_BYPASS_AUTH
 * anywhere but a local machine.
 */
const DEMO_USER = {
  sub: "demo|local-bypass",
  email: "demo@bluecove.test",
  name: "Demo Owner",
};

export function isDemoBypassActive(): boolean {
  return process.env.DEMO_BYPASS_AUTH === "1" && process.env.NODE_ENV !== "production";
}

export async function getSessionOrDemo(): Promise<Session | null | undefined> {
  if (isDemoBypassActive()) {
    return { user: DEMO_USER } as Session;
  }
  return getSession();
}
