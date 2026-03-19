import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import * as monaco from "monaco-editor";
import API from "../../utils/axios";
import { connectSocket } from "../../socket-files/socket";

function Editor() {
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const editorRef = useRef(null);
    const editorInstance = useRef(null);
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState("");

    const [language, setLanguage] = useState(
        location.state?.language || "javascript",
    );

    const isHost = location.state?.isHost;

    // Only horizontal resize
    const [leftWidth, setLeftWidth] = useState(75);

    /*
        HORIZONTAL RESIZE LOGIC
    */
    const handleDrag = (e) => {
        const newWidth = (e.clientX / window.innerWidth) * 100;

        if (newWidth > 20 && newWidth < 80) {
            setLeftWidth(newWidth);
        }
    };

    const stopDrag = () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", stopDrag);
    };

    const startDrag = () => {
        window.addEventListener("mousemove", handleDrag);
        window.addEventListener("mouseup", stopDrag);
    };

    /*
        SOCKET + EDITOR SETUP
    */
    useEffect(() => {
        const socket = connectSocket();
        socketRef.current = socket;

        socket.emit("join-room", { roomId });

        editorInstance.current = monaco.editor.create(editorRef.current, {
            value: "",
            language,
            theme: "vs-dark",
            automaticLayout: true,
        });

        const loadCode = async () => {
            try {
                const res = await API.get(`/code/${roomId}`);
                editorInstance.current.setValue(res.data.content);
            } catch (err) {
                console.error(err);
            }
        };
        loadCode();

        editorInstance.current.onDidChangeModelContent(() => {
            const code = editorInstance.current.getValue();

            socket.emit("code_change", { roomId, code });
        });

        socket.on("code_update", (code) => {
            if (code !== editorInstance.current.getValue()) {
                editorInstance.current.setValue(code);
            }
        });

        socket.on("receive_message", (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => socket.disconnect();
    }, []);

    /*
        SEND CHAT
    */
    const sendMessage = () => {
        if (!inputMsg.trim()) return;

        socketRef.current.emit("send-message", {
            roomId,
            message: inputMsg,
        });

        setInputMsg("");
    };

    /*
        COPY LINK
    */
    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Room link copied");
    };

    /*
        END SESSION
    */
    const endSession = () => {
        if (!isHost) return;

        if (window.confirm("End this session?")) {
            socketRef.current.disconnect();
            navigate("/room");
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-950 text-white">
            {/* TOP BAR */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-900">
                {/* LEFT */}
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">Room ID:</span>

                    <span className="font-mono bg-gray-800 px-3 py-1 rounded">
                        {roomId}
                    </span>

                    <button
                        onClick={copyRoomLink}
                        className="text-sm px-3 py-1 bg-blue-600 rounded"
                    >
                        Copy Link
                    </button>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-800 px-3 py-1 rounded"
                    >
                        <option value="javascript">JS</option>
                        <option value="python">Python</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>

                    <button className="bg-green-600 px-4 py-1 rounded">
                        Run
                    </button>

                    {isHost && (
                        <button
                            onClick={endSession}
                            className="bg-red-600 px-4 py-1 rounded"
                        >
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex">
                {/* EDITOR */}
                <div
                    style={{ width: `${leftWidth}%` }}
                    className="h-full border-r border-gray-800"
                >
                    <div ref={editorRef} className="h-full w-full" />
                </div>

                {/* RESIZER */}
                <div
                    onMouseDown={startDrag}
                    className="w-1 bg-gray-700 cursor-col-resize hover:bg-blue-500"
                />

                {/* RIGHT PANEL */}
                <div className="flex-1 flex flex-col">
                    {/* OUTPUT (TOP) */}
                    <div className="h-1/2 flex flex-col border-b border-gray-800">
                        <div className="p-3 border-b border-gray-800 font-semibold">
                            Output
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 text-sm text-gray-300">
                            Run code to see output...
                        </div>
                    </div>

                    {/* CHAT (BOTTOM) */}
                    <div className="h-1/2 flex flex-col">
                        <div className="p-3 font-semibold border-b border-gray-800">
                            Chat
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-800 p-2 rounded"
                                >
                                    {msg.message}
                                </div>
                            ))}
                        </div>

                        <div className="p-2 flex gap-2">
                            <input
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded"
                            />

                            <button
                                onClick={sendMessage}
                                className="bg-blue-500 px-3 rounded"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Editor;
