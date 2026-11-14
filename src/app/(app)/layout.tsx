import { Sidebar } from "@/components/Sidebar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { planFeatures } from "@/lib/plans";
import { logout } from "../(auth)/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const pageCount = await db.page.count({ where: { userId: user.id } });
  return (
    <div className="min-h-screen">
      <Sidebar userName={user.name} planLabel={planFeatures(user.plan).label} pageCount={pageCount} logout={logout} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
