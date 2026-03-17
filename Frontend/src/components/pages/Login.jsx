import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
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

      {/* Subtle Divider */}
      <div className="h-px bg-linear-to-r from-transparent via-gray-800 to-transparent mx-6 md:mx-16"></div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="w-full max-w-md space-y-8">

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back
            </h2>
            <p className="text-gray-400 text-sm">
              Login to continue your coding sessions
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none transition"
            />

          </div>

          {/* Button */}
          <button
            className="w-full py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
          >
            Login
          </button>

          {/* Signup */}
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