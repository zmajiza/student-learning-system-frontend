import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// normalize responses globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API ERROR:", err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;