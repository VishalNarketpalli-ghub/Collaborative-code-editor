import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

function Profile({ setIsAuthenticated, user }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("auth");
    navigate("/login");
  };

  const avatarLetter = user?.username?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 md:px-16 py-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Profile
        </h1>

        <button
          onClick={logout}
          className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div
        className={`px-6 md:px-16 py-20 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >

        {/* Welcome */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back, {user?.username || "User"} 👋
          </h2>

        </div>

        {/* Profile Section (NO CARD) */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10">

          {/* Avatar */}
          <div className="shrink-0">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="avatar"
                className="w-24 h-24 rounded-full border border-gray-700 object-cover"
              />
            ) : (
              <div className="w-24 h-24 flex items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-600 text-3xl font-bold">
                {avatarLetter}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-6 text-center md:text-left">

            <div>
              <p className="text-gray-500 text-sm">Username</p>
              <p className="text-xl">{user?.username || "Not set"}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Email</p>
              <p className="text-xl">{user?.email || "Not set"}</p>
            </div>

          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-16"></div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">

          <button
            onClick={() => navigate("/create-room")}
            className="px-8 py-3 rounded-full bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform"
          >
            Create Room
          </button>

          <button
            onClick={() => navigate("/join-room")}
            className="px-8 py-3 rounded-full bg-gray-800 hover:bg-gray-700 transition"
          >
            Join Room
          </button>

        </div>

      </div>

    </div>
  );
}

export default Profile;