import axios from 'axios';

let guideApiBaseUrl = import.meta.env.VITE_GUIDE_API_URL || 'http://localhost:5000/api';
if (!guideApiBaseUrl.endsWith('/api') && !guideApiBaseUrl.includes('/api/')) {
  guideApiBaseUrl = guideApiBaseUrl.replace(/\/$/, '') + '/api';
}
console.log('🚀 [Guide API] Active base URL:', guideApiBaseUrl);

const guideApi = axios.create({
  baseURL: guideApiBaseUrl
});

guideApi.interceptors.request.use((config) => {
  // Use localStorage guide_token if present.
  // Fallback to "1" ONLY in development mode for local guide API testing.
  const token = localStorage.getItem('guide_token') || (import.meta.env.DEV ? '1' : '');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

guideApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/login')) {
        return Promise.reject(err);
      }

      originalRequest._retry = true;
      localStorage.removeItem("guide_token");

      // Only attempt auto-relogin if we have a main backend token
      const mainToken = localStorage.getItem("token");
      if (mainToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return guideApi(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshing = true;
        try {
          console.log("🔄 Stale Guide API session detected. Re-authenticating in background...");
          // Dynamic import to prevent circular dependency
          const { guideService } = await import('./guide.service');
          const guideAuth = await guideService.login("9999999999", "admin");
          const newToken = guideAuth.id.toString();
          localStorage.setItem("guide_token", newToken);
          console.log("✅ Background Guide API re-login successful. Retrying original request.");

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          isRefreshing = false;
          return guideApi(originalRequest);
        } catch (reloginErr) {
          console.error("❌ Failed to re-authenticate to Guide API in background:", reloginErr);
          processQueue(reloginErr, null);
          isRefreshing = false;
          return Promise.reject(err);
        }
      }
    }
    return Promise.reject(err);
  }
);

export { guideApi };
export default guideApi;
