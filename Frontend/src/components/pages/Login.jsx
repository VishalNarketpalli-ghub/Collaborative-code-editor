import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import API from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";

function Login() {
    const navigate = useNavigate();

    // Get login function and user from global auth context
    const { login, user } = useAuth();

    // react-hook-form setup
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm();

    // Loading state for button
    const [loading, setLoading] = useState(false);

    // If user is already logged in, redirect to profile
    useEffect(() => {
        if (user) {
            navigate("/profile");
        }
    }, [user, navigate]);

    // Form submit handler
    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Send login request to backend
            const response = await API.post("/auth/login", {
                email: data.email,
                password: data.password,
            });

            // Use global auth context to store user and token
            // This ensures the entire app has access to user data
            login(response.data);

            // Redirect to profile page after successful login
            navigate("/profile");
        } catch (error) {
            // Extract error message from backend or use default
            const message = error.response?.data?.message || "Login failed";

            // Set error in react-hook-form (global error)
            setError("root", {
                type: "manual",
                message: message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Header Section */}
            <div className="px-6 md:px-16 pt-10 pb-6">
                <h1
                    onClick={() => navigate("/")}
                    className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer"
                >
                    Login
                </h1>
                <p className="text-gray-500 text-sm mt-2">
                    Access your account to continue
                </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-linear-to-r from-transparent via-gray-800 to-transparent mx-6 md:mx-16"></div>

            {/* Main Content */}
            <div className="flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-md space-y-6">
                    {/* Title */}
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            Welcome back
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Login to continue your coding sessions
                        </p>
                    </div>

                    {/* Backend error message */}
                    {errors.root && (
                        <p className="text-red-500 text-sm">
                            {errors.root.message}
                        </p>
                    )}

                    {/* Login Form */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        {/* Email Error */}
                        {errors.email && (
                            <p className="text-red-500 text-xs">
                                {errors.email.message}
                            </p>
                        )}

                        {/* Email Input */}
                        <input
                            type="email"
                            placeholder="Email"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Invalid email format",
                                },
                            })}
                            className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition"
                        />

                        {/* Password Error */}
                        {errors.password && (
                            <p className="text-red-500 text-xs">
                                {errors.password.message}
                            </p>
                        )}

                        {/* Password Input */}
                        <input
                            type="password"
                            placeholder="Password"
                            {...register("password", {
                                required: "Password is required",
                                minLength: {
                                    value: 6,
                                    message:
                                        "Password must be at least 6 characters",
                                },
                            })}
                            className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none transition"
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    {/* Redirect to Register */}
                    <p className="text-sm text-center text-gray-400">
                        Don't have an account?{" "}
                        <button
                            onClick={() => navigate("/register")}
                            className="text-blue-400 hover:underline"
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
