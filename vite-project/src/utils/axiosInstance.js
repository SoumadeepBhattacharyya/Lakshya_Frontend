import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://lakshya-d7xc.onrender.com/api',
});

// Automatically attach token from localStorage
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
