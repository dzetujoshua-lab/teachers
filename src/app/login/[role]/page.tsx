import { notFound } from "next/navigation";
import { ALL_ROLES } from "@/lib/roles";
import type { Role } from "@/lib/types";
import { RoleLoginClient } from "./client";

interface RoleLoginPageProps {
  params: Promise<{
    role: string;
  }>;
}

export default async function RoleLoginPage({ params }: RoleLoginPageProps) {
  const resolvedParams = await params;
  const role = resolvedParams.role as Role;

  if (!ALL_ROLES.includes(role)) {
    return notFound();
  }

  return <RoleLoginClient role={role} />;
}
