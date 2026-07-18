import axios from 'axios';
import { ENV } from '../config/environment';

const guideApi = axios.create({
  baseURL: ENV.GUIDE_API_BASE_URL.endsWith('/api') ? ENV.GUIDE_API_BASE_URL : `${ENV.GUIDE_API_BASE_URL}/api`,
  timeout: ENV.API_TIMEOUT_MS,
});

guideApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('guide_access_token') || '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

guideApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("guide_access_token");
    }
    return Promise.reject(err);
  }
);

export { guideApi };
export default guideApi;
