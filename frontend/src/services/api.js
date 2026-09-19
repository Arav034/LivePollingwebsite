import axios from "axios";

// Single place to change when you deploy the backend later —
// swap this to your live backend URL and nothing else needs to change.
const API_BASE_URL = "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the JWT (if we have one) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = (email, password) =>
  api.post("/signup", { email, password });

export const login = (email, password) =>
  api.post("/login", { email, password });

export const createPoll = (title, options) =>
  api.post("/api/polls", { title, options });

export const getPoll = (id) => api.get(`/api/polls/${id}`);

export const submitVote = (id, optionIndex) =>
  api.post(
    `/api/polls/${id}/vote`,
    { option_index: optionIndex },
    { withCredentials: true } // ensures the voter_id cookie is sent/stored
  );

export default api;