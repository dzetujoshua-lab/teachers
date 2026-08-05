import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { SuperAdminDashboard } from "@/components/dashboards/super-admin";
import { KitchenDashboard } from "@/components/dashboards/kitchen";
import { SecurityDashboard } from "@/components/dashboards/security";

export async function generateMetadata({ params }: { params: Promise<{ role: Role }> }): Promise<Metadata> {
  const resolvedParams = await params;
  return { title: `${ROLE_LABELS[resolvedParams.role] ?? "Dashboard"} Overview` };
}

export default async function Overview({ params }: { params: Promise<{ role: Role }> }) {
  const resolvedParams = await params;
  switch (resolvedParams.role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "facilitator":
      return null;
    case "kitchen_manager":
      return <KitchenDashboard />;
    case "security_officer":
      return <SecurityDashboard />;
    case "campus_admin":
      redirect("/dashboard/campus_admin/classes");
    default:
      return null;
  }
}
