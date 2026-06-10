export type Role =
  | "super_admin"
  | "facilitator"
  | "kitchen_manager"
  | "security_officer";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export type MealPreference = "pepper" | "pepper_free" | "alternative" | "no_meal";

export type DietaryTag = "vegetarian" | "vegan" | "halal" | "gluten_free" | "nut_allergy";

export type AttendanceMethod =
  | "qr"
  | "pin"
  | "gps"
  | "id_scan"
  | "nfc"
  | "rfid"
  | "biometric"
  | "manual";

export interface Campus {
  id: string;
  name: string;
  location: string;
  buildings: number;
  students: number;
  status: "active" | "onboarding" | "suspended";
}

export interface Building {
  id: string;
  name: string;
  campusId: string;
  capacity: number;
  occupancy: number;
  lat: number;
  lng: number;
}

export interface Department {
  id: string;
  name: string;
  faculty: string;
  students: number;
  attendanceRate: number;
}

export interface Person {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  institutionId?: string;
  avatarColor: string;
}

export interface AttendanceSession {
  id: string;
  course: string;
  facilitator: string;
  facilitatorDept: string;
  building: string;
  room: string;
  method: AttendanceMethod;
  startedAt: string;
  status: "live" | "completed" | "scheduled";
  present: number;
  total: number;
  flagged: number;
}

export interface AttendanceEvent {
  id: string;
  student: string;
  studentId: string;
  course: string;
  building: string;
  status: AttendanceStatus;
  method: AttendanceMethod;
  time: string;
  suspicious?: boolean;
  reason?: string;
}

export interface MenuItem {
  id: string;
  meal: "breakfast" | "lunch" | "dinner";
  name: string;
  preference: MealPreference;
  estimated: number;
  prepared: number;
  served: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
  device: string;
  time: string;
  severity: "info" | "warning" | "critical";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "attendance" | "meal" | "security" | "schedule" | "system" | "message";
  time: string;
  read: boolean;
  senderName: string;
  senderAvatarColor: string;
  online: boolean;
  conversationId?: string;
  conversation?: ConversationData;
  chatHistory?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarColor: string;
  text: string;
  time: string;
  isIncoming: boolean;
}

export interface ConversationData {
  participants: { id: string; name: string; avatarColor: string; online: boolean }[];
}

export interface AttendanceDraft {
  id: string;
  title: string;
  classId?: string;
  facilitatorId: string;
  facilitatorEmail?: string;
  members: { studentId: string; name: string; status?: AttendanceStatus }[];
  status: "draft" | "submitted" | "approved" | "sent_to_kitchen";
  createdBy: string;
  institutionId?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedBy?: string;
}
