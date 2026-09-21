import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Database, getDatabase } from 'firebase/database';
import { FirebaseConfig } from './types';

declare global {
  interface Window {
    FIREBASE_CONFIG?: FirebaseConfig;
    firebaseConfig?: FirebaseConfig;
  }
}

let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;
let currentConfig: FirebaseConfig | null = null;

const STORAGE_KEY = 'bubblin_firebase_config';

/**
 * Extracts a single property from text even if keys/values are unquoted.
 */
function extractConfigProperty(text: string, key: string): string | undefined {
  const regex = new RegExp(`["']?${key}["']?\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^,\\s}\\n]+))`, 'i');
  const match = text.match(regex);
  if (match) {
    const val = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    return val.length > 0 ? val : undefined;
  }
  return undefined;
}

/**
 * Parses FIREBASE_CONFIG / firebaseConfig object from text (e.g. config.js source).
 * Resilient to:
 * - Standard JS object literal (eval)
 * - Pure JSON format
 * - Unquoted or quote-stripped key/values (regex extraction fallback)
 */
export function parseFirebaseConfigFromText(text: string): FirebaseConfig | null {
  if (!text) return null;

  // 1. Try matching object literal and evaluating via Function
  try {
    const match = text.match(/(?:(?:export\s+)?(?:const|let|var)\s+|window\.)?(?:FIREBASE_CONFIG|firebaseConfig)\s*=\s*({[\s\S]*?});?/i);
    if (match && match[1]) {
      const config = new Function(`return (${match[1]});`)();
      if (config && (config.apiKey || config.databaseURL)) {
        return config as FirebaseConfig;
      }
    }
  } catch {
    // If evaluation fails (e.g. unquoted values, syntax errors), fall through to regex extraction
  }

  // 2. Try JSON parsing
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const json = JSON.parse(trimmed);
      if (json && (json.apiKey || json.databaseURL)) {
        return json as FirebaseConfig;
      }
    }
  } catch {}

  // 3. Robust regex fallback for unquoted or quote-stripped config objects
  const apiKey = extractConfigProperty(text, 'apiKey');
  const databaseURL = extractConfigProperty(text, 'databaseURL');
  if (apiKey || databaseURL) {
    return {
      apiKey: apiKey || '',
      databaseURL: databaseURL || '',
      authDomain: extractConfigProperty(text, 'authDomain'),
      projectId: extractConfigProperty(text, 'projectId') || 'bubblin-game',
      storageBucket: extractConfigProperty(text, 'storageBucket'),
      messagingSenderId: extractConfigProperty(text, 'messagingSenderId'),
      appId: extractConfigProperty(text, 'appId'),
      measurementId: extractConfigProperty(text, 'measurementId')
    };
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

  // 1. Check window.FIREBASE_CONFIG or window.firebaseConfig
  if (typeof window !== 'undefined') {
    const winConfig = window.FIREBASE_CONFIG || window.firebaseConfig;
    if (winConfig?.databaseURL) {
      currentConfig = winConfig;
      return currentConfig;
    }
  }

  // 2. Check top-level lexical scope
  try {
    const evalConfig = new Function(
      "return typeof FIREBASE_CONFIG !== 'undefined' ? FIREBASE_CONFIG : (typeof firebaseConfig !== 'undefined' ? firebaseConfig : null)"
    )();
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
    firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
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
