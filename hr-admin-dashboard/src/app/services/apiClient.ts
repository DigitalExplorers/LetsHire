import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? process.env.LOCALHOST_URL;

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Adds fresh token before every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
