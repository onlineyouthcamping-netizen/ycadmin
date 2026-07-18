/**
 * Application environment configuration
 */

function normalizeUrl(value: string | undefined, defaultValue: string): string {
  if (!value) return defaultValue;
  const trimmed = value.trim();
  // Remove trailing slashes
  const cleaned = trimmed.replace(/\/+$/, "");
  
  // Basic absolute URL check
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://")) {
    throw new Error(`Invalid base URL configured: "${cleaned}". URL must start with http:// or https://`);
  }
  
  return cleaned;
}

function parseTimeout(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEVELOPMENT = import.meta.env.DEV;

// Resolve default configuration based on environment
const defaultApiUrl = IS_DEVELOPMENT ? "http://localhost:3001" : "https://api.youthcamping.online";
const defaultGuideApiUrl = IS_DEVELOPMENT ? "http://localhost:5000" : "https://api.youthcamping.online";

const rawApiUrl = import.meta.env.VITE_API_URL;
const rawGuideApiUrl = import.meta.env.VITE_GUIDE_API_URL;

// In production, enforce that configuration exists
if (IS_PRODUCTION) {
  if (!rawApiUrl) {
    console.error("❌ Critical: VITE_API_URL is missing in production environment!");
  }
  if (!rawGuideApiUrl) {
    console.error("❌ Critical: VITE_GUIDE_API_URL is missing in production environment!");
  }
}

const API_BASE_URL = normalizeUrl(rawApiUrl, defaultApiUrl);
const GUIDE_API_BASE_URL = normalizeUrl(rawGuideApiUrl, defaultGuideApiUrl);
const API_TIMEOUT_MS = parseTimeout(import.meta.env.VITE_API_TIMEOUT_MS, 30000);

export const ENV = Object.freeze({
  API_BASE_URL,
  GUIDE_API_BASE_URL,
  API_TIMEOUT_MS,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
});

export default ENV;
