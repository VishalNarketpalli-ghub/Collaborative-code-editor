import { useNavigate } from "react-router-dom";

function Room() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="px-6 md:px-16 pt-10 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Room
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Create or join a collaborative coding session
        </p>
      </div>

      {/* Subtle Divider */}
      <div className="h-px bg-linear-to-r from-transparent via-gray-800 to-transparent mx-6 md:mx-16"></div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="text-center space-y-10 max-w-md">

          {/* Title */}
          <div>
            <h2 className="text-4xl font-bold mb-3">
              Start a session
            </h2>
            <p className="text-gray-400">
              Create a new room or join an existing one
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <button
              onClick={() => navigate("/create-room")}
              className="px-8 py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
            >
              Create Room
            </button>

            <button
              onClick={() => navigate("/join-room")}
              className="px-8 py-3 rounded-full text-lg bg-gray-800 hover:bg-gray-700 transition"
            >
              Join Room
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Room;