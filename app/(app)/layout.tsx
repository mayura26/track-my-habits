import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { TaskReminderManager } from "@/components/tasks/TaskReminderManager";
import { requireAuth } from "@/lib/auth-helpers";
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
    <div className="min-h-screen md:flex md:items-start">
      <Sidebar />
      <div className="relative min-w-0 flex-1 max-md:pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,rgba(230,196,139,0.14),transparent_68%)]" />
        <TopNav
          session={enrichedSession as Parameters<typeof TopNav>[0]["session"]}
        />
        <main className="relative mx-auto w-full max-w-6xl px-4 pt-3 pb-[calc(7.75rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
      <TaskReminderManager />
    </div>
  );
}
