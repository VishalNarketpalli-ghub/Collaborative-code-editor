import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CreateRoom() {
  const [roomName, setRoomName] = useState("");
  const [roomPwd, setRoomPwd] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [link, setLink] = useState("");
  const [roomId, setRoomId] = useState("");

  const navigate = useNavigate();

  const generateLink = () => {
    const id = crypto.randomUUID().slice(0, 8);
    const generatedLink = `${window.location.origin}/room/${id}`;

    setRoomId(id);
    setLink(generatedLink);
  };

  const enterRoom = () => {
    if (!roomId) return alert("Generate link first");

    navigate(`/room/${roomId}`, {
      state: {
        language,
        isHost: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="px-6 md:px-16 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Create Room
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6">

        <div className="w-full max-w-md space-y-8">

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Setup your room
            </h2>
            <p className="text-gray-400 text-sm">
              Create a new collaborative coding session
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-4">

            <input
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition"
            />

            <input
              type="password"
              placeholder="Room Password"
              value={roomPwd}
              onChange={(e) => setRoomPwd(e.target.value)}
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none transition"
            />

            {/* Language */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

          </div>

          {/* Actions */}
          {!link ? (
            <button
              onClick={generateLink}
              className="w-full py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
            >
              Generate Link
            </button>
          ) : (
            <div className="space-y-4">

              <input
                readOnly
                value={link}
                className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 text-gray-400"
              />

              <button
                onClick={enterRoom}
                className="w-full py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg"
              >
                Enter Room
              </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default CreateRoom;