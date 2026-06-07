type Role = "super_admin" | "facilitator" | "kitchen_manager" | "security_officer";

interface MockUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  department?: string;
  institutionId?: string;
  password: string;
  platformUserId: string;
  createdAt: string;
}

const mockUsers: Record<string, MockUser> = {};

function generateUid(): string {
  return "mock-" + Math.random().toString(36).slice(2, 10);
}

function createPlatformUserId(role: Role, uid: string): string {
  const ROLE_PREFIX: Record<Role, string> = {
    super_admin: "SA",
    facilitator: "FAC",
    kitchen_manager: "KIT",
    security_officer: "SEC",
  };
  const prefix = ROLE_PREFIX[role];
  const year = new Date().getFullYear();
  const fingerprint = uid.replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase().padStart(8, "0");
  return `${prefix}-${year}-${fingerprint}`;
}

export function getMockUserByEmail(email: string): MockUser | undefined {
  const key = email.toLowerCase().trim();
  return Object.values(mockUsers).find((u) => u.email === key);
}

export function getMockUserByUid(uid: string): MockUser | undefined {
  return mockUsers[uid] || Object.values(mockUsers).find((u) => u.platformUserId === uid);
}

export function createMockSession(user: MockUser): string {
  return btoa(JSON.stringify({ uid: user.uid, email: user.email, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 24 * 5 }));
}

export function verifyMockSession(token: string): { uid: string; email: string; role: Role } | null {
  try {
    const payload = JSON.parse(atob(token));
    if (!payload.uid || !payload.email || !payload.role) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createMockUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  department?: string;
  institutionId?: string;
}): { uid: string; platformUserId: string } {
  const email = input.email.toLowerCase().trim();
  if (getMockUserByEmail(email)) {
    throw new Error("email-already-in-use");
  }
  const uid = generateUid();
  const platformUserId = createPlatformUserId(input.role, uid);
  const avatarColor = input.role === "super_admin" || input.role === "kitchen_manager" || input.role === "security_officer" ? "#c52a58" : "#f59e0b";

  mockUsers[uid] = {
    uid,
    email,
    name: input.name.trim(),
    role: input.role,
    department: input.department?.trim() || undefined,
    institutionId: input.institutionId?.trim() || "accra-main-campus",
    password: input.password,
    platformUserId,
    createdAt: new Date().toISOString(),
    avatarColor,
  };

  return { uid, platformUserId };
}

export function loginMockUser(email: string, password: string): MockUser {
  const user = getMockUserByEmail(email.toLowerCase().trim());
  if (!user) throw new Error("user-not-found");
  if (user.password !== password) throw new Error("wrong-password");
  return user;
}

export function getMockProfiles(): MockUser[] {
  return Object.values(mockUsers);
}