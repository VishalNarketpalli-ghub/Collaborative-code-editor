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

    // Track execution output and loading status
    const [output, setOutput] = useState("Run code to see output...");
    const [isRunning, setIsRunning] = useState(false);

    // Language mapping for Judge0 compile API
    const languageMap = {
        javascript: 63,
        python: 71,
        cpp: 54,
        java: 62,
    };

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

        socket.on("language_update", (newLang) => {
            setLanguage(newLang);
        });
    }, []);

    // Sync editor language whenever the language state changes
    useEffect(() => {
        if (editorInstance.current) {
            monaco.editor.setModelLanguage(
                editorInstance.current.getModel(),
                language
            );
        }
    }, [language]);

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
        CHANGE LANGUAGE
    */
    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        if (window.confirm("are you sure you want to change the language ?")) {
            setLanguage(newLang);
            socketRef.current.emit("language_change", { roomId, language: newLang });
        }
    };

    /*
        RUN CODE & SAVE TO DB
    */
    const handleRun = async () => {
        if (!editorInstance.current) return;
        
        // Get the current code from the editor
        const code = editorInstance.current.getValue();
        
        try {
            setIsRunning(true);
            setOutput("Running...");

            // 1. Update the code in the database
            await API.put(`/code/${roomId}`, {
                content: code,
            });

            // 2. Call the compile backend to execute the code
            const res = await API.post("/compile/run", {
                code,
                languageId: languageMap[language],
                input: "", // Empty input by default
            });

            // 3. Display the compilation result or output
            const data = res.data;
            const result =
                data.stderr ||
                data.compile_output ||
                data.stdout ||
                "No output";

            setOutput(result);
        } catch (err) {
            console.error("Run error:", err);
            setOutput(err.response?.data?.message || "Error running code");
        } finally {
            setIsRunning(false); // Stop loading state
        }
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
                        className="text-sm px-3 py-1 bg-blue-600 rounded cursor-pointer"
                    >
                        Copy Link
                    </button>
                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-4">
                    {isHost ? (
                        <select
                            value={language}
                            onChange={handleLanguageChange}
                            className="bg-gray-800 px-3 py-1 rounded cursor-pointer"
                        >
                            <option value="javascript">JS</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                    ) : (
                        <span className="bg-gray-800 px-3 py-1 rounded cursor-default">
                            {language === 'javascript' ? 'JS' : 
                             language === 'python' ? 'Python' :
                             language === 'cpp' ? 'C++' : 
                             language === 'java' ? 'Java' : language}
                        </span>
                    )}

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`px-4 py-1 rounded cursor-pointer ${isRunning ? "bg-green-800 opacity-70" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        {isRunning ? "Running..." : "Run"}
                    </button>

                    {isHost && (
                        <button
                            onClick={endSession}
                            className="bg-red-600 px-4 py-1 rounded cursor-pointer"
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
                <div className="flex-1 flex flex-col min-w-0 bg-gray-900 border-l border-gray-800">
                    {/* OUTPUT (TOP) */}
                    <div className="h-1/2 flex flex-col border-b border-gray-800 bg-gray-950">
                        <div className="p-3 border-b border-gray-800 font-semibold flex justify-between items-center text-gray-200 bg-gray-900">
                            <span>Output</span>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 text-sm text-gray-300 whitespace-pre-wrap break-words font-mono">
                            {output}
                        </div>
                    </div>

                    {/* CHAT (BOTTOM) */}
                    <div className="h-1/2 flex flex-col bg-gray-950">
                        <div className="p-3 font-semibold border-b border-gray-800 text-gray-200 bg-gray-900">
                            Chat
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 flex flex-col">
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className="bg-gray-800 p-3 rounded-lg shadow-sm text-sm break-words whitespace-pre-wrap text-gray-200 w-fit max-w-full"
                                >
                                    {msg.message}
                                </div>
                            ))}
                        </div>

                        <div className="p-3 border-t border-gray-800 flex gap-2 bg-gray-900">
                            <input
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-950 text-sm text-gray-200 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow min-w-0"
                                placeholder="Type a message..."
                            />

                            <button
                                onClick={sendMessage}
                                className="bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-md text-sm font-medium cursor-pointer shadow-md text-white shrink-0"
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
