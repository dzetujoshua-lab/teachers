import type { Role } from "./types";

const ROLE_PREFIX: Record<Role, string> = {
  super_admin: "SA",
  facilitator: "FAC",
  kitchen_manager: "KIT",
  security_officer: "SEC",
};

export function createPlatformUserId(role: Role, uid: string) {
  const prefix = ROLE_PREFIX[role];
  const year = new Date().getFullYear();
  const fingerprint = uid.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase().padStart(8, "0");
  return `${prefix}-${year}-${fingerprint}`;
}
