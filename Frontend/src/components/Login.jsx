import { useState } from "react";

function Login() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">

      <div className="bg-gray-800 p-6 rounded-lg w-100 space-y-4">

        <h2 className="text-xl font-bold text-center">
          {isLogin ? "Login" : "Sign Up"}
        </h2>

        {/* Name only for signup */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            className="w-full p-2 rounded bg-gray-700 outline-none"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-gray-700 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-gray-700 outline-none"
        />

        {/* Confirm password for signup */}
        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-2 rounded bg-gray-700 outline-none"
          />
        )}

        <button className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700">
          {isLogin ? "Login" : "Create Account"}
        </button>

        <p className="text-sm text-center text-gray-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:underline"
          >
            {isLogin ? "or sign up" : "or login"}
          </button>
        </p>

      </div>

    </div>
  );
}

export default Login;