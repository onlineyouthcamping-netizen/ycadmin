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
  const token = localStorage.getItem('guide_token') || '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



guideApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("guide_token");
    }
    return Promise.reject(err);
  }
);

export { guideApi };
export default guideApi;
