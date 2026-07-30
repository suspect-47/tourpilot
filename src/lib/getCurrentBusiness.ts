import { prisma } from "./prisma";

/**
 * Hackathon simplification: every new Auth0 user who logs in joins the
 * single seeded demo business as staff, so multi-user login works
 * out of the box without a separate onboarding/invite flow.
 *
 * Next step for a real multi-tenant version: on first login, ask
 * "create a new business" vs "join with an invite code" instead of
 * auto-joining the demo business.
 */
export async function getOrCreateUserAndBusiness(auth0Id: string, email: string, name?: string) {
  const existing = await prisma.user.findUnique({
    where: { auth0Id },
    include: { business: true },
  });
  if (existing) return existing;

  let business = await prisma.business.findFirst();
  if (!business) {
    business = await prisma.business.create({
      data: { name: "My Tour Business", description: "", location: "", tourTypes: "" },
    });
  }

  const user = await prisma.user.create({
    data: { auth0Id, email, name, businessId: business.id, role: "staff" },
    include: { business: true },
  });
  return user;
}
