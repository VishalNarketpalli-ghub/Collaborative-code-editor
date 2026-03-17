import axios from "axios";

// Create axios instance
const API = axios.create({
    baseURL: "http://localhost:6600/api",
    timeout: 10000, // 10 sec timeout (good practice)
    headers: {
        "Content-Type": "application/json",
    },
});

// REQUEST INTERCEPTOR
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR (VERY IMPORTANT)
import { disconnectSocket } from "../socket-files/socket";

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                console.warn("Unauthorized - logging out");

                localStorage.removeItem("token");

                // disconnect socket on auth failure
                disconnectSocket();

                window.location.replace("/login");
            }

            if (status === 500) {
                console.error("Server error:", error.response.data);
            }
        } else {
            console.error("Network error:", error.message);
        }

        return Promise.reject(error);
    }
);

export default API;