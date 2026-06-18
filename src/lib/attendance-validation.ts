export function validateOverallDraftStatus(status: string): void {
  const validStatuses = ['draft', 'submitted', 'confirmed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid draft status: ${status}. Must be one of ${validStatuses.join(', ')}.`);
  }
}

export function validateIndividualMemberStatus(status: string): void {
  const validStatuses = ['present', 'absent', 'late', 'excused'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid individual member status: ${status}. Must be one of ${validStatuses.join(', ')}.`);
  }
}

export function validateAttendanceMarks(members: Array<{ studentId: string; name: string; status?: string }>): void {
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('Members array cannot be empty.');
  }
  for (const member of members) {
    if (!member.studentId || typeof member.studentId !== 'string') {
      throw new Error('Each member must have a valid studentId.');
    }
    if (!member.name || typeof member.name !== 'string') {
      throw new Error('Each member must have a valid name.');
    }
    if (!member.status) {
        throw new Error(`Member ${member.name} (${member.studentId}) is missing attendance status.`);
    }
    validateIndividualMemberStatus(member.status);
  }
}

// This function is for validating the initial data when creating a new draft (POST request).
// Members in a POST request body do not necessarily have a 'status' field yet.
export function validateDraftInput(data: any): void {
  const { title, facilitatorId, members } = data;
  if (!title || typeof title !== 'string') {
    throw new Error('Title is required and must be a string.');
  }
  if (!facilitatorId || typeof facilitatorId !== 'string') {
    throw new Error('Facilitator ID is required and must be a string.');
  }
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('Members array cannot be empty for draft creation.');
  }
  // For POST, members only need studentId and name, not necessarily status.
  for (const member of members) {
    if (!member.studentId || typeof member.studentId !== 'string') {
      throw new Error('Each member must have a valid studentId.');
    }
    if (!member.name || typeof member.name !== 'string') {
      throw new Error('Each member must have a valid name.');
    }
  }
}