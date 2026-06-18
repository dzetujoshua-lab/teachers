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
  status?: 'present' | 'absent' | 'late' | 'excused';
  diet?: string;
}

export interface AttendanceDraft {
  id: string;
  title: string;
  classId?: string;
  facilitatorId: string;
  facilitatorEmail?: string;
  members: AttendanceMember[];
  status: 'draft' | 'submitted' | 'confirmed';
  createdBy: string; // Admin ID
  institutionId: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  submittedAt?: string; // Set when status = "submitted"
}