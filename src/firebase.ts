import { FirebaseApp, initializeApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';
import { FirebaseConfig } from './types';

declare global {
  interface Window {
    FIREBASE_CONFIG?: FirebaseConfig;
  }
}

let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;
let currentConfig: FirebaseConfig | null = null;

const STORAGE_KEY = 'bubblin_firebase_config';

/**
 * Parses FIREBASE_CONFIG object from text (e.g. config.js source).
 */
export function parseFirebaseConfigFromText(text: string): FirebaseConfig | null {
  try {
    // Matches: const FIREBASE_CONFIG = { ... }; or window.FIREBASE_CONFIG = { ... };
    const match = text.match(/(?:(?:export\s+)?(?:const|let|var)\s+|window\.)?FIREBASE_CONFIG\s*=\s*({[\s\S]*?});/);
    if (match && match[1]) {
      // Safely evaluate object literal
      const config = new Function(`return (${match[1]});`)();
      if (config && config.apiKey && config.databaseURL) {
        return config as FirebaseConfig;
      }
    }
  } catch (err) {
    console.warn('[Firebase] Failed to parse config from text:', err);
  }
  return null;
}

/**
 * Loads Firebase configuration from:
 * 1. Global window.FIREBASE_CONFIG or lexical FIREBASE_CONFIG
 * 2. localStorage
 * 3. Vite env vars (VITE_FIREBASE_DATABASE_URL, etc.)
 * 4. Fetching ./config.js
 */
export async function loadFirebaseConfig(): Promise<FirebaseConfig | null> {
  if (currentConfig) return currentConfig;

  // 1. Check window.FIREBASE_CONFIG
  if (typeof window !== 'undefined' && window.FIREBASE_CONFIG?.databaseURL) {
    currentConfig = window.FIREBASE_CONFIG;
    return currentConfig;
  }

  // 2. Check top-level lexical scope
  try {
    const evalConfig = new Function("return typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : null")();
    if (evalConfig && evalConfig.databaseURL) {
      currentConfig = evalConfig as FirebaseConfig;
      return currentConfig;
    }
  } catch {}

  // 3. Check localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.databaseURL) {
        currentConfig = parsed as FirebaseConfig;
        return currentConfig;
      }
    }
  } catch {}

  // 4. Check Vite environment variables
  const env = (import.meta as any).env;
  if (env && env.VITE_FIREBASE_DATABASE_URL && env.VITE_FIREBASE_API_KEY) {
    currentConfig = {
      apiKey: env.VITE_FIREBASE_API_KEY,
      databaseURL: env.VITE_FIREBASE_DATABASE_URL,
      projectId: env.VITE_FIREBASE_PROJECT_ID || 'bubblin-game',
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID
    };
    return currentConfig;
  }

  // 5. Try fetching ./config.js
  try {
    const res = await fetch('./config.js', { cache: 'no-cache' });
    if (res.ok) {
      const text = await res.text();
      const parsed = parseFirebaseConfigFromText(text);
      if (parsed) {
        currentConfig = parsed;
        return currentConfig;
      }
    }
  } catch {}

  return null;
}

/**
 * Initializes Firebase App & Realtime Database instance.
 */
export async function initFirebase(): Promise<Database | null> {
  if (database) return database;

  const config = await loadFirebaseConfig();
  if (!config || !config.databaseURL) {
    return null;
  }

  try {
    firebaseApp = initializeApp(config);
    database = getDatabase(firebaseApp);
    console.log('[Firebase] Realtime Database initialized successfully:', config.databaseURL);
    return database;
  } catch (err) {
    console.error('[Firebase] Failed to initialize Firebase:', err);
    return null;
  }
}

/**
 * Returns active Realtime Database instance.
 */
export function getFirebaseDatabase(): Database | null {
  return database;
}

/**
 * Checks if Firebase is configured.
 */
export function isFirebaseConfigured(): boolean {
  return !!currentConfig && !!currentConfig.databaseURL;
}

/**
 * Allows user to save custom Firebase config via UI modal into localStorage.
 */
export function saveCustomFirebaseConfig(config: FirebaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    currentConfig = config;
    if (firebaseApp) {
      // Re-initialize with new config
      firebaseApp = null;
      database = null;
    }
    initFirebase();
  } catch (e) {
    console.error('[Firebase] Failed to save config to localStorage:', e);
  }
}

/**
 * Clears custom Firebase config from localStorage.
 */
export function clearCustomFirebaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    currentConfig = null;
    firebaseApp = null;
    database = null;
  } catch (e) {
    console.error('[Firebase] Failed to clear config:', e);
  }
}
