import { useState } from "react";
import MonacoEditor from "./MonacoEditor";

function Room() {
  const [mode, setMode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomPwd, setRoomPwd] = useState("");
  const [link, setLink] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [language, setLanguage] = useState("javascript");

  const generateLink = () => {
    const id = crypto.randomUUID().slice(0, 8);
    const generatedLink = `${window.location.origin}/room/${id}`;
    setRoomId(id);
    setLink(generatedLink);
  };

  const enterRoom = () => {
    if (!roomId) {
      alert("Room ID required");
      return;
    }
    setLoggedIn(true);
  };

  if (loggedIn) {
    return <MonacoEditor language={language} />;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">

      <div className="bg-gray-800 p-6 rounded-lg w-100 space-y-4">

        <h2 className="text-xl font-bold text-center">Code Collaboration</h2>

        {!mode && (
          <div className="flex gap-4">
            <button
              onClick={() => setMode("create")}
              className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700"
            >
              Create Room
            </button>

            <button
              onClick={() => setMode("join")}
              className="w-full bg-green-600 p-2 rounded hover:bg-green-700"
            >
              Join Room
            </button>
          </div>
        )}

        {/* CREATE ROOM */}
        {mode === "create" && (
          <>
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            />

            <input
              type="password"
              placeholder="Room Password"
              value={roomPwd}
              onChange={(e) => setRoomPwd(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            />

            {/* LANGUAGE DROPDOWN */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            {!link ? (
              <button
                onClick={generateLink}
                className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700"
              >
                Generate Link
              </button>
            ) : (
              <>
                <input
                  readOnly
                  value={link}
                  className="w-full p-2 rounded bg-gray-700"
                />

                <button
                  onClick={enterRoom}
                  className="w-full bg-purple-600 p-2 rounded hover:bg-purple-700"
                >
                  Enter Room
                </button>
              </>
            )}
          </>
        )}

        {/* JOIN ROOM */}
        {mode === "join" && (
          <>
            <input
              type="text"
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            />

            <input
              type="password"
              placeholder="Room Password"
              value={roomPwd}
              onChange={(e) => setRoomPwd(e.target.value)}
              className="w-full p-2 rounded bg-gray-700"
            />

            <button
              onClick={enterRoom}
              className="w-full bg-green-600 p-2 rounded hover:bg-green-700"
            >
              Join Room
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default Room;