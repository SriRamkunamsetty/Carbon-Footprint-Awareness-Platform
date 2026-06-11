/**
 * @module firebase
 * @description Firebase client SDK initialization with environment-based configuration.
 * Initializes Auth, Firestore, Storage, Analytics, and Performance monitoring.
 *
 * All sensitive configuration values are sourced from environment variables
 * prefixed with NEXT_PUBLIC_ to allow Next.js client-side access.
 *
 * Analytics and Performance monitoring are only initialized in browser
 * environments (guarded by `typeof window !== "undefined"`).
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import {
  getAnalytics,
  type Analytics,
  isSupported as isAnalyticsSupported,
} from "firebase/analytics";
import { getPerformance, type FirebasePerformance } from "firebase/performance";
import { getRemoteConfig, type RemoteConfig, isSupported as isRemoteConfigSupported } from "firebase/remote-config";
import { getMessaging, type Messaging, isSupported as isMessagingSupported } from "firebase/messaging";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

/**
 * Firebase configuration sourced from environment variables.
 * All values use the NEXT_PUBLIC_ prefix so they are available in client bundles.
 *
 * @see https://firebase.google.com/docs/web/setup#config-object
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  throw new Error(
    "Missing required environment variables for Firebase. " +
    "Please check your .env.local file. See .env.example for reference."
  );
}

/**
 * Firebase App singleton instance.
 * Re-uses an existing app if one has already been initialized (e.g. during HMR).
 */
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/** Firebase Authentication instance for sign-in, sign-up, and session management */
const auth: Auth = getAuth(app);

/** Cloud Firestore instance for real-time document database operations */
const db: Firestore = getFirestore(app);

/** Firebase Cloud Storage instance for file uploads and downloads */
const storage: FirebaseStorage = getStorage(app);

/**
 * Firebase Analytics instance (client-side only).
 * Initialized asynchronously after checking browser support.
 * Will be `null` on the server or if the browser does not support Analytics.
 */
let analytics: Analytics | null = null;

/**
 * Firebase Performance Monitoring instance (client-side only).
 * Will be `null` on the server or if initialization fails.
 */
let performance: FirebasePerformance | null = null;

let remoteConfig: RemoteConfig | null = null;
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });

  isRemoteConfigSupported().then((supported) => {
    if (supported) {
      remoteConfig = getRemoteConfig(app);
    }
  });

  isMessagingSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });

  const appCheckSiteKey = process.env.NEXT_PUBLIC_APP_CHECK_SITE_KEY;
  if (appCheckSiteKey && appCheckSiteKey !== "6Ld_placeholder_site_key_for_recaptcha") {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn("App Check could not be initialized:", message);
    }
  } else {
    console.info("Firebase App Check skipped: No valid NEXT_PUBLIC_APP_CHECK_SITE_KEY provided.");
  }

  try {
    performance = getPerformance(app);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn("Firebase Performance could not be initialized:", message);
  }
}

export { app, auth, db, storage, analytics, performance, remoteConfig, messaging };
