// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from "react";
import API from "../utils/axios";
import { connectSocket, disconnectSocket } from "../socket-files/socket";

// Create a global context
const AuthContext = createContext();

// Provider component (wraps your app)
export const AuthProvider = ({ children }) => {
    // Stores logged-in user data
    const [user, setUser] = useState(null);

    // Used to prevent rendering before auth check completes
    const [loading, setLoading] = useState(true);

    //  RUN ON APP LOAD (Refresh Case)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Get token from localStorage
                const token = localStorage.getItem("token");

                // If no token → user not logged in
                if (!token) {
                    setLoading(false);
                    return;
                }

                // Fetch current user from backend
                const res = await API.get("/auth/getuser", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Save user in state
                setUser(res.data);

                // Reconnect socket after refresh
                connectSocket(token);
            } catch (err) {
                console.log(err);

                // If token invalid → remove it
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                localStorage.removeItem("username");
                localStorage.removeItem("user");

                setUser(null);
            } finally {
                // Stop loading
                setLoading(false);
            }
        };

        fetchUser();

        // Cleanup when app closes/unmounts
        return () => {
            disconnectSocket();
        };
    }, []);

    // LOGIN FUNCTION
    const login = (data) => {
        /**
         * Backend sends:
         * {
         *   token,
         *   id,
         *   username,
         *   email
         * }
         */

        // Normalize user object (VERY IMPORTANT)
        const userData = {
            _id: data.id, // convert id → _id (backend uses _id)
            username: data.username,
            email: data.email,
        };

        // Save user in React state
        setUser(userData);

        // Store auth data in localStorage (for persistence)
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.id);
        localStorage.setItem("username", data.username);
        localStorage.setItem("user", JSON.stringify(userData));

        // Connect socket immediately after login
        connectSocket(data.token);
    };

    //  LOGOUT FUNCTION
    const logout = async () => {
        try {
            const token = localStorage.getItem("token");

            // Inform backend (optional but good practice)
            await API.post(
                "/auth/logout",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
        } catch (err) {
            console.log(err);
        }

        // Clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("user");

        // Reset user state
        setUser(null);

        // Disconnect socket
        disconnectSocket();
    };

    // PROVIDE CONTEXT TO WHOLE APP
    return (
        <AuthContext.Provider
            value={{
                user, // logged-in user
                setUser, // optional (if needed)
                login, // login function
                logout, // logout function
                loading, // loading state
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for easy usage
export const useAuth = () => useContext(AuthContext);
