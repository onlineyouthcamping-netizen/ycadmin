import axios from 'axios';
import { ENV } from '../config/environment';

const api = axios.create({
  baseURL: ENV.API_BASE_URL.endsWith('/api') ? ENV.API_BASE_URL : `${ENV.API_BASE_URL}/api`,
  timeout: ENV.API_TIMEOUT_MS,
  withCredentials: true, // Support httpOnly secure session cookies
});

let requestIdCounter = 0;
let adminRedirectInProgress = false;

const TRACE_REQUESTS = ENV.IS_DEVELOPMENT && import.meta.env.VITE_TRACE_REQUESTS === "true";

api.interceptors.request.use((config) => {
  // Ensure relative endpoints don't get double prefixed if baseURL is fully configured
  if (config.url && !config.url.startsWith('/') && !config.url.startsWith('http')) {
    config.url = `/${config.url}`;
  }

  // Fallback to localStorage 'token' for legacy and dev environments
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
    adminRedirectInProgress = false;
  }

  if (TRACE_REQUESTS) {
    requestIdCounter++;
    const reqId = `REQ-${requestIdCounter}`;
    (config as any)._reqId = reqId;
    (config as any)._startTime = Date.now();
    // Log only basic sanitised infrastructure data, never tokens or request bodies
    console.log(`[TRACE][START] ID: ${reqId} | Endpoint: ${config.url}`);
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    if (TRACE_REQUESTS) {
      const config = res.config as any;
      if (config._reqId) {
        const duration = Date.now() - (config._startTime || Date.now());
        console.log(`[TRACE][DONE] ID: ${config._reqId} | Duration: ${duration}ms | Status: ${res.status}`);
      }
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url;

    if (status === 401 || status === 403) {
      console.error(`🔐 [API TRACE] HTTP ${status} from ${url}:`, {
        message: err.response?.data?.message || err.message,
        url,
        stack: new Error(`HTTP ${status} Trace`).stack
      });
    }

    // 401 Handling: Session expired or unauthorized
    if (status === 401 && !axios.isCancel(err)) {
      const isLoginRequest = url?.includes("/admin/login") || url?.includes("/login");
      const isAlreadyOnLoginPage = typeof window !== 'undefined' && window.location.pathname.includes("/admin/login");

      if (!isLoginRequest && !isAlreadyOnLoginPage) {
        console.warn(`🔐 [API TRACE] 401 Session Revoked for ${url} - Redirecting to /admin/login`);
        console.trace("🔐 [API TRACE] 401 Logout Stack");
        localStorage.removeItem('token');
        
        if (!adminRedirectInProgress) {
          adminRedirectInProgress = true;
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export { api };
export default api;
