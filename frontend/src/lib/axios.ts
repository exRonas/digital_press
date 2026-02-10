import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Relative path for proxying or direct hit if served from same origin
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default api;
