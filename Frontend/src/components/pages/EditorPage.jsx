import { useEffect, useRef, useState } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import * as monaco from "monaco-editor"
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import API from "../../utils/axios"
import { getSocket } from "../../socket-files/socket"
import { useAuth } from "../../context/AuthContext"

self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker()
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker()
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker()
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker()
        }
        return new editorWorker()
    }
}

function EditorPage() {
    const { roomId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { user } = useAuth()

    const editorRef = useRef(null)
    const editorInstance = useRef(null)
    const isRemoteUpdate = useRef(false)   // prevents echo loop

    const [room, setRoom] = useState(null)
    const [isHost, setIsHost] = useState(false)
    const [language, setLanguage] = useState(location.state?.language || "javascript")
    const [messages, setMessages] = useState([])
    const [inputMsg, setInputMsg] = useState("")
    const [stdin, setStdin] = useState("")
    const [output, setOutput] = useState({ text: "Run code to see output...", isError: false })
    const [isRunning, setIsRunning] = useState(false)
    const [participants, setParticipants] = useState([])
    const [loading, setLoading] = useState(true)
    const [leftWidth, setLeftWidth] = useState(70)

    const chatEndRef = useRef(null)

    // ── STEP 1: Fetch room + handle direct-link join ──────────────────────────
    useEffect(() => {
        const initRoom = async () => {
            try {
                // Fetch room details
                const { data: roomData } = await API.get(`/room/${roomId}`)

                // Determine isHost from DB (survives refresh)
                const hostId = roomData.createdBy?._id || roomData.createdBy
                setIsHost(hostId === user?._id)
                setLanguage(roomData.language)
                setRoom(roomData)
                setParticipants(roomData.participants || [])

                // Direct-link join: check if user is already a participant
                const userId = user?._id
                const isParticipant = roomData.participants?.some(
                    (p) => (p._id || p) === userId
                )

                if (!isParticipant) {
                    // Has password → redirect to join-room page
                    if (roomData.password) {
                        navigate(`/join-room?roomId=${roomId}`)
                        return
                    }
                    // No password → auto-join
                    await API.post("/room/join", { roomId, password: "" })
                }

                setLoading(false)
            } catch (err) {
                console.error("Room init error:", err)
                navigate("/room")
            }
        }
        initRoom()
    }, [roomId, user])

    // ── STEP 2: Init editor + socket listeners ────────────────────────────────
    useEffect(() => {
        if (loading || !editorRef.current) return

        const socket = getSocket()

        // Join the socket room
        socket.emit("join-room", { roomId })

        // Init Monaco editor
        editorInstance.current = monaco.editor.create(editorRef.current, {
            value: "",
            language,
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            fontSize: 14,
        })

        // Load code from DB
        const loadCode = async () => {
            try {
                const { data } = await API.get(`/code/${roomId}`)
                isRemoteUpdate.current = true
                editorInstance.current.setValue(data.content || "")
                isRemoteUpdate.current = false
            } catch (err) {
                console.error("Load code error:", err)
            }
        }
        loadCode()

        // Load chat history from DB
        const loadChatHistory = async () => {
            try {
                const { data } = await API.get(`/chat/${roomId}`)
                setMessages(data)
            } catch (err) {
                console.error("Load chat error:", err)
            }
        }
        loadChatHistory()

        // Local edits → broadcast (SKIP if it's a remote update to prevent echo)
        editorInstance.current.onDidChangeModelContent(() => {
            if (isRemoteUpdate.current) return
            const code = editorInstance.current.getValue()
            socket.emit("code_change", { roomId, code })
        })

        // ── Socket event listeners ──
        const onCodeUpdate = (code) => {
            if (code === editorInstance.current.getValue()) return
            isRemoteUpdate.current = true
            editorInstance.current.setValue(code)
            isRemoteUpdate.current = false
        }

        const onLanguageUpdate = (newLang) => {
            setLanguage(newLang)
        }

        const onReceiveMessage = (msg) => {
            setMessages((prev) => [...prev, msg])
        }

        const onExecutionStatus = () => {
            setOutput({ text: "Running...", isError: false })
            setIsRunning(true)
        }

        const onCodeOutput = ({ stdout, stderr, exitCode }) => {
            if (stderr && stderr.trim()) {
                setOutput({ text: stderr.trim(), isError: true })
            } else if (stdout && stdout.trim()) {
                setOutput({ text: stdout.trim(), isError: false })
            } else {
                setOutput({ text: "(no output)", isError: false })
            }
            setIsRunning(false)
        }

        const onUserJoined = ({ userId }) => {
            setParticipants((prev) =>
                prev.includes(userId) ? prev : [...prev, userId]
            )
        }

        const onUserLeft = ({ userId }) => {
            setParticipants((prev) => prev.filter((p) => p !== userId))
        }

        // Session ended by host → navigate everyone away
        const onSessionEnded = () => {
            alert("The host has ended this session.")
            navigate("/room")
        }

        socket.on("code_update", onCodeUpdate)
        socket.on("language_update", onLanguageUpdate)
        socket.on("receive_message", onReceiveMessage)
        socket.on("execution_status", onExecutionStatus)
        socket.on("code_output", onCodeOutput)
        socket.on("user_joined", onUserJoined)
        socket.on("user_left", onUserLeft)
        socket.on("session_ended", onSessionEnded)

        // ── Cleanup ──
        return () => {
            editorInstance.current?.dispose()
            socket.off("code_update", onCodeUpdate)
            socket.off("language_update", onLanguageUpdate)
            socket.off("receive_message", onReceiveMessage)
            socket.off("execution_status", onExecutionStatus)
            socket.off("code_output", onCodeOutput)
            socket.off("user_joined", onUserJoined)
            socket.off("user_left", onUserLeft)
            socket.off("session_ended", onSessionEnded)
        }
    }, [loading, roomId])

    // ── Sync editor language when language state changes ──────────────────────
    useEffect(() => {
        if (editorInstance.current) {
            monaco.editor.setModelLanguage(editorInstance.current.getModel(), language)
        }
    }, [language])

    // ── Scroll chat to bottom on new messages ─────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleLanguageChange = (e) => {
        if (!isHost) return
        const newLang = e.target.value
        if (window.confirm(`Change language to ${newLang}? This will affect all participants.`)) {
            setLanguage(newLang)
            getSocket().emit("language_change", { roomId, language: newLang })
        }
    }

    // Save code to DB — host only
    const handleSave = async () => {
        if (!isHost || !editorInstance.current) return
        try {
            await API.put(`/code/${roomId}`, { content: editorInstance.current.getValue() })
            alert("Code saved!")
        } catch (err) {
            alert(err.response?.data?.message || "Save failed")
        }
    }

    // Run code via socket — broadcasts output to ALL users in room
    const handleRun = () => {
        if (!editorInstance.current || isRunning) return
        const code = editorInstance.current.getValue()
        if (!code.trim()) return

        getSocket().emit("run_code", {
            roomId,
            source_code: code,
            language,   // send language name string (e.g. "python"), Piston handles it
            stdin
        })
        setIsRunning(true)
        setOutput({ text: "Running...", isError: false })
    }

    // Send chat message
    const sendMessage = () => {
        if (!inputMsg.trim()) return
        getSocket().emit("send-message", { roomId, message: inputMsg })
        setInputMsg("")
    }

    const handleChatKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // Copy room link
    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert("Room link copied!")
    }

    // End session — host only, broadcasts to everyone
    const handleEndSession = async () => {
        if (!isHost) return
        if (!window.confirm("End this session? All participants will be removed.")) return
        getSocket().emit("end_session", { roomId })
        navigate("/room")
    }

    // Horizontal resize
    const startDrag = () => {
        const onMove = (e) => {
            const newWidth = (e.clientX / window.innerWidth) * 100
            if (newWidth > 30 && newWidth < 80) setLeftWidth(newWidth)
        }
        const stopDrag = () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", stopDrag)
        }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", stopDrag)
    }

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">

            {/* TOP BAR */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900 shrink-0">
                {/* Left: Room ID + Copy */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Room:</span>
                    <span className="font-mono bg-gray-800 px-2 py-1 rounded text-sm">{roomId}</span>
                    <button
                        onClick={copyRoomLink}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                    >
                        Copy Link
                    </button>
                    {!room?.isActive && (
                        <span className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded">
                            Session Ended
                        </span>
                    )}
                </div>

                {/* Right: Language + Buttons */}
                <div className="flex items-center gap-2">
                    {isHost ? (
                        <select
                            value={language}
                            onChange={handleLanguageChange}
                            className="bg-gray-800 text-sm px-2 py-1 rounded cursor-pointer border border-gray-700"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                            <option value="java">Java</option>
                        </select>
                    ) : (
                        <span className="bg-gray-800 text-sm px-2 py-1 rounded capitalize">
                            {language}
                        </span>
                    )}

                    {isHost && (
                        <button
                            onClick={handleSave}
                            className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                        >
                            Save
                        </button>
                    )}

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`text-sm px-3 py-1 rounded cursor-pointer ${isRunning ? "bg-green-800 opacity-60" : "bg-green-600 hover:bg-green-700"}`}
                    >
                        {isRunning ? "Running..." : "▶ Run"}
                    </button>

                    {isHost && (
                        <button
                            onClick={handleEndSession}
                            className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                        >
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* MAIN LAYOUT */}
            <div className="flex flex-1 min-h-0">

                {/* EDITOR */}
                <div style={{ width: `${leftWidth}%` }} className="h-full flex flex-col min-w-0">
                    <div ref={editorRef} className="flex-1" />
                </div>

                {/* DRAG HANDLE */}
                <div
                    onMouseDown={startDrag}
                    className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize shrink-0"
                />

                {/* RIGHT PANEL */}
                <div className="flex-1 flex flex-col min-w-0 bg-gray-900">

                    {/* OUTPUT + STDIN — combined terminal panel */}
                    <div className="h-1/2 flex flex-col border-b border-gray-800">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-900 border-b border-gray-800 uppercase tracking-wide">
                            Output
                        </div>
                        <div className={`flex-1 overflow-auto p-3 font-mono text-sm whitespace-pre-wrap ${output.isError ? "text-red-400" : "text-gray-300"}`}>
                            {output.text}
                        </div>
                        <div className="border-t border-gray-700 px-3 py-1 text-xs text-gray-500 bg-gray-900">
                            stdin
                        </div>
                        <textarea
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            placeholder="Program input (stdin)..."
                            rows={2}
                            className="w-full bg-gray-950 text-sm text-gray-300 px-3 py-2 resize-none outline-none font-mono border-t border-gray-800"
                        />
                    </div>

                    {/* CHAT */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-900 border-b border-gray-800 uppercase tracking-wide">
                            Chat · {participants.length} online
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {messages.map((msg, i) => (
                                <div key={i} className="text-sm">
                                    <span className="text-blue-400 font-medium">
                                        {msg.sender?.username || "User"}:&nbsp;
                                    </span>
                                    <span className="text-gray-300 break-words">{msg.message}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="p-2 border-t border-gray-800 flex gap-2 bg-gray-900">
                            <input
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                onKeyDown={handleChatKeyDown}
                                placeholder="Type a message... (Enter to send)"
                                className="flex-1 bg-gray-950 text-sm text-gray-200 px-3 py-2 rounded border border-gray-700 outline-none focus:border-blue-500 min-w-0"
                            />
                            <button
                                onClick={sendMessage}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm cursor-pointer shrink-0"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditorPage
