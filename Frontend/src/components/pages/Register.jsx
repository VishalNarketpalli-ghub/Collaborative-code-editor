import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useState } from "react";
import API from "../../utils/axios"; // Axios instance for API calls
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

function Register() {
    // Hook for navigation between routes
    const navigate = useNavigate();
    const {login} = useAuth()
    const { showToast } = useToast();
    // Loading state to disable button during API call
    const [loading, setLoading] = useState(false);

    // React Hook Form setup
    const {
        register, // Used to connect inputs with form state
        handleSubmit, // Handles form submission
        watch, // Watches input values (used for confirm password)
        formState: { errors }, // Contains validation errors
    } = useForm();

    // Watch password field to validate confirm password
    const password = watch("password");

    // Function triggered on form submit
    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Sending POST request to backend register endpoint
            const res = await API.post("/auth/register", {
                username: data.username,
                email: data.email,
                password: data.password,
            });
            login(res.data); // updates auth context, stores token, connects socket

            // Redirect user after successful registration
            navigate("/profile");
        } catch (err) {
            // Handle errors from backend or network
            console.error(err);
            showToast(err.response?.data?.message || "Registration failed", "error");
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Header section */}
            <div className="px-6 md:px-16 py-6 border-b border-gray-800">
                <h1
                    onClick={() => navigate("/")}
                    className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer"
                >
                    SignUp
                </h1>
            </div>

            {/* Main content */}
            <div className="flex flex-1 items-center justify-center px-6">
                {/* Form starts here */}
                <form
                    onSubmit={handleSubmit(onSubmit)} // React Hook Form submission handler
                    className="w-full max-w-md space-y-8"
                >
                    {/* Title section */}
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            Create your account
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Start collaborating with your team
                        </p>
                    </div>

                    {/* Input fields */}
                    <div className="space-y-4">
                        {/* Username Input */}
                        <div>
                            <input
                                type="text"
                                placeholder="Username"
                                // Registering input with validation rules
                                {...register("username", {
                                    required: "Username is required",
                                    minLength: {
                                        value: 3,
                                        message: "Minimum 3 characters",
                                    },
                                })}
                                className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                            />

                            {/* Display validation error */}
                            {errors.username && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        {/* Email Input */}
                        <div>
                            <input
                                type="email"
                                placeholder="Email"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^\S+@\S+$/i,
                                        message: "Invalid email",
                                    },
                                })}
                                className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none"
                            />

                            {errors.email && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <input
                                type="password"
                                placeholder="Password"
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: {
                                        value: 6,
                                        message: "Minimum 6 characters",
                                    },
                                })}
                                className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                            />

                            {errors.password && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                {...register("confirmPassword", {
                                    required: "Confirm your password",

                                    // Custom validation: check if passwords match
                                    validate: (value) =>
                                        value === password ||
                                        "Passwords do not match",
                                })}
                                className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none"
                            />

                            {errors.confirmPassword && (
                                <p className="text-red-400 text-sm mt-1">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading} // Disable button during API call
                        className="w-full py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Account"}
                    </button>

                    {/* Redirect to Login */}
                    <p className="text-sm text-center text-gray-400">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="text-blue-400 hover:underline"
                        >
                            Login
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Register;
