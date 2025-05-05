import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL, 
});

// Request interceptor: Add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized (401) - Logging out', error.response);
      localStorage.removeItem('authToken');
      // Redirect to login or refresh the page to trigger App.js check
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 