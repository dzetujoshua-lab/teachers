import * as admin from 'firebase-admin';

// Check if Firebase app is already initialized to prevent re-initialization errors
if (!admin.apps.length) {
  // Initialize Firebase Admin SDK using environment variables
  // Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY
  // are set in your .env.local or deployment environment.
  // The private key often needs to have escaped newlines replaced.
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Export initialized Firestore and Auth instances
const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };