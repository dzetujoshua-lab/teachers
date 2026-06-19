export type Role = 'super_admin' | 'campus_admin' | 'facilitator' | 'kitchen_manager' | 'security_officer';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'suspended' | 'unmarked';
export type MealPreference = 'pepper' | 'pepper_free' | 'alternative';

export interface AttendanceEvent {
  id: string;
  student: string;
  course: string;
  method: string;
  timestamp: string;
  status?: AttendanceStatus;
}

export interface Person {
  uid: string;
  name?: string;
  email?: string;
  avatarColor?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: string;
  text: string;
  timestamp: string;
  read?: boolean;
}

export interface ConversationData {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  lastTimestamp?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'campus_admin' | 'facilitator';
  institutionId?: string;
}

export interface AttendanceMember {
  studentId: string;
  name: string;
  email?: string;
  status?: AttendanceStatus;
  diet?: string;
}

export interface AttendanceDraft {
  id: string;
  title: string;
  classId?: string;
  facilitatorId: string;
  facilitatorEmail?: string;
  members: AttendanceMember[];
  status: 'draft' | 'submitted' | 'approved' | 'confirmed' | 'sent_to_kitchen';
  createdBy: string; // Admin ID
  institutionId: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  submittedAt?: string; // Set when status = "submitted"
}