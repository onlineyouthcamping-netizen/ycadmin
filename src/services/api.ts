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
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
    if (TRACE_REQUESTS) {
      const config = err.config as any;
      if (config?._reqId) {
        const duration = Date.now() - (config._startTime || Date.now());
        const isCancelled = axios.isCancel(err);
        console.log(`[TRACE][${isCancelled ? 'CANCELLED' : 'FAILED'}] ID: ${config._reqId} | Duration: ${duration}ms | Status: ${err.response?.status || 'ERR'}`);
      }
    }

    // 401 Handling: Session expired or unauthorized
    if (err.response?.status === 401 && !axios.isCancel(err)) {
      const isLoginRequest = err.config?.url?.includes("/admin/login") || err.config?.url?.includes("/login");
      const isAlreadyOnLoginPage = typeof window !== 'undefined' && window.location.pathname.includes("/admin/login");

      if (!isLoginRequest && !isAlreadyOnLoginPage) {
        console.warn("🔐 Session expired - Clearing token and redirecting");
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
