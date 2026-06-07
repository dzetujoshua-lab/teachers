import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandPalette } from "@/components/command-palette";
import { getProfileBySession } from "@/lib/firebase/admin";

export default async function FacilitatorUidLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ uid: string }>;
}) {
  const resolvedParams = await params;
  const uid = resolvedParams.uid;

  if (!uid) return notFound();

  const profile = await getProfileBySession(await cookies());

  if (!profile) redirect("/login");
  if (profile.forcePasswordReset) redirect("/change-password");
  if (profile.role !== "facilitator") redirect(`/dashboard/${profile.role}`);
  if (profile.uid !== uid) redirect(`/dashboard/facilitator/${profile.uid}`);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="facilitator" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role="facilitator" />
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <MobileNav role="facilitator" />
      </div>
      <CommandPalette />
    </div>
  );
}