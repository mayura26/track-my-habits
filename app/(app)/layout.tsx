import { requireAuth } from "@/lib/auth-helpers";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { db } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true },
  });

  const enrichedSession = {
    ...session,
    user: {
      ...session.user,
      xp: user?.xp ?? 0,
      level: user?.level ?? 1,
    },
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Sidebar />
      <div className="md:ml-60">
        <TopNav session={enrichedSession as Parameters<typeof TopNav>[0]["session"]} />
        <main className="px-4 py-6 pb-20 md:px-8 md:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
