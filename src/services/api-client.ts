import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://dummyjson.com',
  timeout: 12_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error instanceof Error ? error : new Error('Request failed')),
);
