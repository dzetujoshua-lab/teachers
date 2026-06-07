import { notFound } from "next/navigation";
import { ROLES, ALL_ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { SectionShell } from "@/components/dashboard/section-shell";

export default async function Section({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const resolvedParams = await params;
  if (!ALL_ROLES.includes(resolvedParams.role as Role)) notFound();
  const role = resolvedParams.role as Role;

  const item = ROLES[role].nav.find((n) => n.href.endsWith(`/${resolvedParams.section}`));
  return (
    <SectionShell
      role={role}
      title={item?.label ?? resolvedParams.section.replace(/_/g, " ")}
      section={resolvedParams.section}
    />
  );
}
