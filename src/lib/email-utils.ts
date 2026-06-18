import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Sends an email notification when a facilitator submits an attendance draft.
 * @param toEmail The email address of the admin to notify.
 * @param senderName The name of the facilitator (or admin if admin submitted).
 * @param draftTitle The title of the attendance draft.
 * @param draftId The ID of the attendance draft.
 */
export async function sendAttendanceSubmissionEmail(
  toEmail: string,
  senderName: string,
  draftTitle: string,
  draftId: string
) {
  try {
    const reviewLink = `${NEXT_PUBLIC_BASE_URL}/dashboard/campus_admin/drafts/${draftId}`; // Assuming admin dashboard path
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Replace with your verified sender domain
      to: toEmail,
      subject: `Attendance Submitted: ${draftTitle} by ${senderName}`,
      html: `<p>Hello,</p><p><strong>${senderName}</strong> has submitted attendance for <strong>${draftTitle}</strong>.</p><p>Please review it here: <a href="${reviewLink}">${reviewLink}</a></p><p>Thank you,</p><p>Your Attendance System</p>`,
    });
    console.log(`Attendance submission email sent to ${toEmail} for draft ${draftId}`);
  } catch (error) {
    console.error('Failed to send attendance submission email:', error);
  }
}