import { cookies } from 'next/headers';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

/**
 * Represents a simplified user profile with essential fields.
 */
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'facilitator' | 'kitchen' | 'security';
}

/**
 * Retrieves the user's profile by verifying the Firebase session cookie.
 * This function is intended for server-side use (API routes, Server Components).
 *
 * @returns {Promise<UserProfile | null>} The user's profile if authenticated and authorized, otherwise null.
 */
export async function getProfileBySession(): Promise<UserProfile | null> {
  try {
    // Get the session cookie from the incoming request headers
    const sessionCookie = (await cookies()).get('__session')?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify the session cookie using Firebase Admin Auth
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true); // Check for revoked sessions

    if (!decodedClaims || !decodedClaims.uid) {
      return null;
    }

    // Fetch the user's role and other profile data from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
    if (!userDoc.exists || !userDoc.data()?.role) {
      return null; // User document or role not found
    }

    return userDoc.data() as UserProfile; // Cast to UserProfile as per your Firestore structure
  } catch (error) {
    console.error('Error verifying session or fetching profile:', error);
    return null; // Session invalid, expired, or other error
  }
}