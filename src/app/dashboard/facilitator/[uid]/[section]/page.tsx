import { notFound, redirect } from "next/navigation";
import { getProfileBySession } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export default async function FacilitatorUidSection({
  params,
}: {
  params: Promise<{ uid: string; section: string }>;
}) {
  const resolvedParams = await params;
  const profile = await getProfileBySession(await cookies());

  if (!profile) redirect("/login");
  if (profile.role !== "facilitator") redirect(`/dashboard/${profile.role}`);
  if (profile.uid !== resolvedParams.uid) redirect(`/dashboard/facilitator/${profile.uid}/${resolvedParams.section}`);

  const validSections = ["session", "drafts", "classes", "students", "reports"];
  if (!validSections.includes(resolvedParams.section)) return notFound();

  if (resolvedParams.section === "session") {
    const { FacilitatorSession } = await import("@/components/dashboards/facilitator-session");
    return <FacilitatorSession />;
  }

  if (resolvedParams.section === "drafts") {
    const { FacilitatorDraftsDashboard } = await import("@/components/dashboards/facilitator-drafts");
    return <FacilitatorDraftsDashboard />;
  }

  const { SectionShell } = await import("@/components/dashboard/section-shell");
  const sectionLabels: Record<string, string> = {
    classes: "My Classes",
    students: "Students",
    reports: "Reports",
  };

  return <SectionShell role="facilitator" title={sectionLabels[resolvedParams.section] ?? resolvedParams.section} section={resolvedParams.section} />;
}