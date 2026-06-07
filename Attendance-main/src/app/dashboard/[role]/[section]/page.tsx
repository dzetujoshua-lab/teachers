import { notFound } from "next/navigation";
import { ROLES, ALL_ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { SectionShell } from "@/components/dashboard/section-shell";
import { FacilitatorSession } from "@/components/dashboards/facilitator-session";

export default async function Section({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const { role, section } = (await params) as { role: Role; section: string };

  if (!ALL_ROLES.includes(role)) notFound();

  // The facilitator's live attendance session is a fully interactive workflow.
  if (role === "facilitator" && section === "session") {
    return <FacilitatorSession />;
  }

  const item = ROLES[role].nav.find((n) => n.href.endsWith(`/${section}`));
  return (
    <SectionShell
      role={role}
      title={item?.label ?? section.replace(/_/g, " ")}
    />
  );
}
