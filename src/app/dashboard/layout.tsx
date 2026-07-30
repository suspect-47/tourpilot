import { redirect } from "next/navigation";
import { getSessionOrDemo as getSession } from "@/lib/demoSession";
import { getOrCreateUserAndBusiness } from "@/lib/getCurrentBusiness";
import DashboardShell from "@/components/shell/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/api/auth/login");

  const user = await getOrCreateUserAndBusiness(session.user.sub, session.user.email, session.user.name);

  return (
    <DashboardShell
      businessName={user.business.name}
      tier={user.business.subscriptionTier}
    >
      {children}
    </DashboardShell>
  );
}
