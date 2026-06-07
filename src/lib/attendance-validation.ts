/**
 * Server-side validation for attendance drafts
 */

export interface ValidatedDraft {
  title: string;
  classId: string | null;
  facilitatorId: string;
  members: { studentId: string; name: string }[];
  status: "draft" | "submitted" | "confirmed";
}

export function validateDraftInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.facilitatorId || typeof data.facilitatorId !== "string" || data.facilitatorId.trim().length === 0) {
    errors.push("facilitatorId is required and must be a non-empty string");
  }

  if (!Array.isArray(data.members) || data.members.length === 0) {
    errors.push("members must be a non-empty array");
  } else {
    for (let i = 0; i < data.members.length; i++) {
      const member = data.members[i];
      if (!member.studentId || typeof member.studentId !== "string") {
        errors.push(`members[${i}].studentId is required and must be a string`);
      }
      if (!member.name || typeof member.name !== "string") {
        errors.push(`members[${i}].name is required and must be a string`);
      }
    }
  }

  if (data.title && typeof data.title !== "string") {
    errors.push("title must be a string");
  }

  if (data.status && !["draft", "submitted", "confirmed"].includes(data.status)) {
    errors.push("status must be 'draft', 'submitted', or 'confirmed'");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateMemberStatus(status: any): boolean {
  return ["present", "absent", "late", "excused"].includes(status);
}

export function validateAttendanceMarks(members: any[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(members)) {
    return { valid: false, errors: ["members must be an array"] };
  }

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    if (!member.studentId) {
      errors.push(`members[${i}].studentId is required`);
    }
    if (member.status && !validateMemberStatus(member.status)) {
      errors.push(`members[${i}].status must be 'present', 'absent', 'late', or 'excused'`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
