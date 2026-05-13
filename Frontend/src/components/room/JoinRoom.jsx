import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/axios";

function JoinRoom() {
    const [roomId, setRoomId] = useState("");
    const [roomPwd, setRoomPwd] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const joinRoom = async () => {
        if (!roomId.trim()) {
            return alert("Room ID is required");
        }

        try {
            setLoading(true);

            const res = await API.post("/room/join", {
                roomId,
                password: roomPwd,
            });

            const room = res.data;

            // ✅ Navigate to editor
            navigate(`/room/${roomId}`, {
                state: {
                    isHost: false,
                    language: room.language,
                },
            });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to join room");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Header */}
            <div className="px-6 md:px-16 py-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Join Room
                </h1>
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-md space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            Enter Room Details
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Join an existing session using Room ID
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            placeholder="Room ID"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                        />

                        <input
                            type="password"
                            placeholder="Room Password (if any)"
                            value={roomPwd}
                            onChange={(e) => setRoomPwd(e.target.value)}
                            className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none"
                        />
                    </div>

                    <button
                        onClick={joinRoom}
                        disabled={loading}
                        className="w-full py-3 rounded-full text-lg bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Joining..." : "Join Room"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default JoinRoom;
