import type { Metadata } from "next";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { SuperAdminDashboard } from "@/components/dashboards/super-admin";
import { CampusAdminDashboard } from "@/components/dashboards/campus-admin";
import { FacilitatorDashboard } from "@/components/dashboards/facilitator";
import { KitchenDashboard } from "@/components/dashboards/kitchen";
import { SecurityDashboard } from "@/components/dashboards/security";
import { StudentDashboard } from "@/components/dashboards/student";

export function generateMetadata({ params }: { params: { role: Role } }): Metadata {
  return { title: `${ROLE_LABELS[params.role] ?? "Dashboard"} Overview` };
}

export default function Overview({ params }: { params: { role: Role } }) {
  switch (params.role) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "campus_admin":
      return <CampusAdminDashboard />;
    case "facilitator":
      return <FacilitatorDashboard />;
    case "kitchen_manager":
      return <KitchenDashboard />;
    case "security_officer":
      return <SecurityDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      return null;
  }
}
