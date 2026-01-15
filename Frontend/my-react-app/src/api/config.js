import axios from 'axios';

// The base URL for the API
export const BASE_URL = import.meta.env.VITE_API_URL || "https://toggle-nest-1.onrender.com";

const API = axios.create({
    baseURL: BASE_URL,
});

export default API;

