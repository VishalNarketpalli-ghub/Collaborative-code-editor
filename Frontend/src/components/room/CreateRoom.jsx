import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/axios";
import { useToast } from "../../context/ToastContext";

function CreateRoom() {
    const [roomName, setRoomName] = useState("");
    const [roomPwd, setRoomPwd] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState("");

    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleCreateRoom = async () => {
        if (!roomName.trim()) {
            setValidationError("Room name is required");
            return;
        }

        try {
            setLoading(true);

            const res = await API.post("/room/create", {
                title: roomName,
                password: roomPwd,
                language: language,
            });

            const room = res.data;

            // Navigate to editor page
            navigate(`/room/${room.roomId}`, {
                state: {
                    language: room.language,
                    isHost: true,
                },
            });
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || "Failed to create room", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col">
            {/* Header */}
            <div className="px-6 md:px-16 py-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Create Room
                </h1>
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-center px-6">
                <div className="w-full max-w-md space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">
                            Setup your room
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Create a new collaborative coding session
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <input
                                placeholder="Room Name"
                                value={roomName}
                                onChange={(e) => {
                                    setRoomName(e.target.value);
                                    if (e.target.value.trim()) setValidationError("");
                                }}
                                className={`w-full px-5 py-3 rounded-full bg-gray-900 border ${
                                    validationError ? "border-red-500 focus:border-red-500" : "border-gray-800 focus:border-blue-500"
                                } outline-none`}
                            />
                            {validationError && (
                                <p className="text-red-500 text-xs mt-1 ml-4">{validationError}</p>
                            )}
                        </div>

                        <input
                            type="password"
                            placeholder="Room Password (optional)"
                            value={roomPwd}
                            onChange={(e) => setRoomPwd(e.target.value)}
                            className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none"
                        />

                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-5 py-3 rounded-full bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="w-full py-3 rounded-full text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Room"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateRoom;
