import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { redirect, notFound } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandPalette } from "@/components/command-palette";
import { ALL_ROLES } from "@/lib/roles";
import { getProfileBySession } from "@/lib/firebase/admin";
import type { Role } from "@/lib/types";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return ALL_ROLES.map((role) => ({ role }));
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ role: Role }>;
}) {
  const { role } = await params;

  if (!ALL_ROLES.includes(role)) notFound();


  const profile = await getProfileBySession((cookies() as unknown as ReadonlyRequestCookies));

  if (!profile) redirect("/login");
  if (profile.forcePasswordReset) redirect("/change-password");
  if (profile.role !== role) redirect(`/dashboard/${profile.role}`);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} />
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <MobileNav role={role} />
      </div>
      <CommandPalette />
    </div>
  );
}
