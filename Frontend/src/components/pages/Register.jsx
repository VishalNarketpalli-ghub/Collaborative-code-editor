import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="px-6 md:px-16 py-6 border-b border-gray-800">
        <h1
          onClick={() => navigate("/")}
          className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer"
        >
          SignUp
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="w-full max-w-md space-y-8">

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Create your account
            </h2>
            <p className="text-gray-400 text-sm">
              Start collaborating with your team
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">

            <input
              type="text"
              placeholder="Username"
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition"
            />

            <input
              type="email"
              placeholder="Email"
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none transition"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none transition"
            />

          </div>

          {/* Button */}
          <button
            className="w-full py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
          >
            Create Account
          </button>

          {/* Login Redirect */}
          <p className="text-sm text-center text-gray-400">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-400 hover:underline"
            >
              Login
            </button>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Register;