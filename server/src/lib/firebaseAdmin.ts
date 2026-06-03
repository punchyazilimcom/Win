import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let initialized = false;

/**
 * Initializes the Firebase Admin SDK exactly once.
 * Credentials are resolved in this order:
 *   1. FIREBASE_SERVICE_ACCOUNT (inline JSON string)
 *   2. GOOGLE_APPLICATION_CREDENTIALS (path to JSON file)
 *   3. Application Default Credentials (e.g. on GCP)
 */
export function initFirebaseAdmin(): void {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  let credential: admin.credential.Credential | undefined;

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (inline && inline.trim().startsWith("{")) {
    credential = admin.credential.cert(JSON.parse(inline) as admin.ServiceAccount);
  } else if (credPath) {
    const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    if (fs.existsSync(abs)) {
      const json = JSON.parse(fs.readFileSync(abs, "utf-8"));
      credential = admin.credential.cert(json as admin.ServiceAccount);
    }
  }

  admin.initializeApp({
    credential: credential ?? admin.credential.applicationDefault(),
    projectId,
    storageBucket,
  });

  initialized = true;
}

export function db(): admin.firestore.Firestore {
  initFirebaseAdmin();
  return admin.firestore();
}

export function authAdmin(): admin.auth.Auth {
  initFirebaseAdmin();
  return admin.auth();
}

export { admin };
