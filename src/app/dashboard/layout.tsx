import { redirect } from "next/navigation";
import { getSession } from "@auth0/nextjs-auth0";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import { Nav } from "@/components/Nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);

  return (
    <div className="min-h-screen">
      <Nav businessName={user.business.name} tier={user.business.subscriptionTier} />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
