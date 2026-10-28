// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'https://sakshatkaar.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to inject the JWT dynamically from localStorage on every outbound request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient;