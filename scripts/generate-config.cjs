/**
 * CI/CD Configuration Generator
 *
 * Safely generates config.js during GitHub Actions build from
 * repository variables (VARS_GTM_ID, VARS_FIREBASE_CONFIG).
 * Normalizes unquoted or quote-stripped Firebase credentials.
 */

const fs = require('fs');
const path = require('path');

function extractField(text, key) {
  const match = text.match(new RegExp(`["']?${key}["']?\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^,\\s}\\n]+))`, 'i'));
  return match ? (match[1] || match[2] || match[3] || '').trim() : '';
}

function parseAndNormalizeFirebaseConfig(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();

  // 1. Try JSON parsing
  try {
    const json = JSON.parse(trimmed);
    if (json && (json.apiKey || json.databaseURL)) return json;
  } catch {}

  // 2. Try JS object evaluation
  try {
    const fn = new Function(`return (${trimmed});`);
    const evalObj = fn();
    if (evalObj && (evalObj.apiKey || evalObj.databaseURL)) return evalObj;
  } catch {}

  // 3. Fallback: regex extraction for unquoted or quote-stripped objects
  const apiKey = extractField(trimmed, 'apiKey');
  const databaseURL = extractField(trimmed, 'databaseURL');
  if (apiKey || databaseURL) {
    return {
      apiKey: apiKey || '',
      authDomain: extractField(trimmed, 'authDomain'),
      databaseURL: databaseURL || '',
      projectId: extractField(trimmed, 'projectId') || 'bubblin-game',
      storageBucket: extractField(trimmed, 'storageBucket'),
      messagingSenderId: extractField(trimmed, 'messagingSenderId'),
      appId: extractField(trimmed, 'appId'),
      measurementId: extractField(trimmed, 'measurementId')
    };
  }

  return null;
}

function main() {
  const gtmId = (process.env.VARS_GTM_ID || process.env.GTM_ID || '').trim();
  const rawFirebase = (process.env.VARS_FIREBASE_CONFIG || process.env.FIREBASE_CONFIG || '').trim();

  const sections = [];

  if (gtmId) {
    console.log('[generate-config] Found GTM_ID:', gtmId);
    sections.push(`const GTM_ID = ${JSON.stringify(gtmId)};`);
  }

  if (rawFirebase) {
    console.log('[generate-config] Processing FIREBASE_CONFIG...');
    const normalized = parseAndNormalizeFirebaseConfig(rawFirebase);
    if (normalized) {
      console.log('[generate-config] Successfully parsed FIREBASE_CONFIG with databaseURL:', normalized.databaseURL);
      sections.push(`const FIREBASE_CONFIG = ${JSON.stringify(normalized, null, 2)};`);
    } else {
      console.warn('[generate-config] Could not parse structured FIREBASE_CONFIG, outputting raw string.');
      sections.push(rawFirebase.includes('=') ? rawFirebase : `const FIREBASE_CONFIG = ${rawFirebase};`);
    }
  }

  if (sections.length > 0) {
    const configContent = sections.join('\n\n') + '\n';
    const targetPath = path.resolve(__dirname, '..', 'config.js');
    fs.writeFileSync(targetPath, configContent, 'utf-8');
    console.log('[generate-config] Successfully wrote config.js to', targetPath);
  } else {
    console.log('[generate-config] No variables provided. Skipping config.js generation.');
  }
}

main();
