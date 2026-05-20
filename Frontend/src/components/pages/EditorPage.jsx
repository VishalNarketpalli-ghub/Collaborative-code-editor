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
    const isRemoteUpdate = useRef(false)

    // decorationsRef: tracks the Monaco decoration IDs for each remote user's cursor bar.
    // Key = userId, Value = array of decoration IDs returned by deltaDecorations.
    const decorationsRef = useRef({})

    // styleSheetRef: the CSSStyleSheet for injecting per-user cursor bar rules.
    const styleSheetRef = useRef(null)

    // cursorWidgetsRef: tracks the Monaco Content Widget for each remote user's name label.
    // Key = userId, Value = { widget, state, domNode }
    // Content Widgets are the correct Monaco API for overlaying DOM elements without clipping.
    const cursorWidgetsRef = useRef({})

    // userColorMapRef: maps userId -> color string. Colors are assigned in join order
    // so that the first two users always get maximally different colors (indices 0 and 1),
    // regardless of userId hash collisions.
    const userColorMapRef = useRef({})

    // nextColorIndexRef: counter that advances each time a new user gets a color.
    const nextColorIndexRef = useRef(0)

    // cursorLabelTimers: one setTimeout handle per userId for hiding the name label
    // after 3 seconds of inactivity.
    const cursorLabelTimers = useRef({})

    const [room, setRoom] = useState(null)
    const [isHost, setIsHost] = useState(false)
    const [language, setLanguage] = useState(location.state?.language || "javascript")
    const [messages, setMessages] = useState([])
    const [inputMsg, setInputMsg] = useState("")
    const [stdin, setStdin] = useState("")
    const [output, setOutput] = useState({ text: "Run code to see output...", isError: false })
    const [isRunning, setIsRunning] = useState(false)
    const [participants, setParticipants] = useState([])
    const [showOnlineUsers, setShowOnlineUsers] = useState(false)
    const [loading, setLoading] = useState(true)
    const [leftWidth, setLeftWidth] = useState(70)

    const chatEndRef = useRef(null)

    // Color palette ordered for maximum visual distance.
    // The ordering ensures indices 0 and 1 look nothing alike, 0-2 look nothing alike, etc.
    // This matters when participant count is low (e.g., 2 users always get cyan + hot pink).
    const CURSOR_COLORS = [
        "#00F5D4", // neon cyan
        "#F72585", // hot pink
        "#FFD60A", // bright yellow
        "#7B2FFF", // electric purple
        "#43E97B", // lime green
        "#FF6B35", // orange
        "#00B4D8", // sky blue
        "#FF4D6D", // vivid red-pink
        "#06D6A0", // emerald
        "#F8961E", // amber
        "#4CC9F0", // light blue
        "#FF99C8", // soft pink
    ];

    // Assign a color to a userId in join order.
    // If the user already has a color (i.e., they were seen before), return the same one.
    // This guarantees consistent color per user and maximum distance between simultaneous users.
    const getOrAssignColor = (userId) => {
        if (!userId) return CURSOR_COLORS[0];
        if (!userColorMapRef.current[userId]) {
            // Assign the next color in the palette sequentially.
            const index = nextColorIndexRef.current % CURSOR_COLORS.length;
            userColorMapRef.current[userId] = CURSOR_COLORS[index];
            nextColorIndexRef.current++;
        }
        return userColorMapRef.current[userId];
    };

    // Alias used in the participant list UI to color each user's name.
    // Same function ensures cursor color and list color always match.
    const getUserColor = (userId) => getOrAssignColor(userId);

    // Init dynamic stylesheet for cursor bar rules only (not labels).
    // Labels use Monaco Content Widgets (actual DOM elements) which are not clipped.
    useEffect(() => {
        const styleEl = document.createElement("style")
        document.head.appendChild(styleEl)
        styleSheetRef.current = styleEl.sheet
        // Track which userIds have already had their cursor bar CSS injected.
        styleSheetRef.current._injected = new Set();
        return () => styleEl.remove()
    }, [])

    // ── STEP 1: Fetch room + handle direct-link join ──────────────────────────
    useEffect(() => {
        // Guard: wait until user is loaded from AuthContext
        if (!user) return

        const initRoom = async () => {
            try {
                // Fetch room details
                const { data: roomData } = await API.get(`/room/${roomId}`)

                // Determine isHost from DB (survives refresh)
                const hostId = roomData.createdBy?._id || roomData.createdBy
                setIsHost(hostId === user?._id)
                setLanguage(roomData.language)
                setRoom(roomData)

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

        // Join the socket room — include username so backend can populate participant list
        socket.emit("join-room", { roomId, username: user?.username || "Unknown" })

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

        // Initial load of code from DB
        const loadCode = async () => {
            try {
                const { data } = await API.get(`/code/${roomId}`)
                // Only update if no remote update has happened yet
                if (!isRemoteUpdate.current) {
                    isRemoteUpdate.current = true
                    editorInstance.current.setValue(data.content || "")
                    isRemoteUpdate.current = false
                }
            } catch (err) {
                console.error("Load code error:", err)
            }
        }
        
        // We DO NOT call loadCode() unconditionally here anymore.
        // It is called in onRoomUsers conditionally to avoid race conditions.
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

        // Local edits → broadcast
        editorInstance.current.onDidChangeModelContent(() => {
            if (isRemoteUpdate.current) return
            const code = editorInstance.current.getValue()
            socket.emit("code_change", { roomId, code })
        })

        // Local cursor moves → broadcast
        editorInstance.current.onDidChangeCursorPosition((e) => {
            socket.emit("cursor_move", {
                roomId,
                line: e.position.lineNumber,
                column: e.position.column
            })
        })

        // ── Socket event listeners ──
        const onCodeUpdate = (code) => {
            if (code === editorInstance.current.getValue()) return
            isRemoteUpdate.current = true
            editorInstance.current.setValue(code)
            isRemoteUpdate.current = false
        }

        // A new user joined and the server is asking us to push our current code to them.
        // We read the editor's live in-memory value and send it back via "send_code_sync".
        // This guarantees the new joiner gets up-to-date code, not a stale DB snapshot.
        const onRequestCodeSync = ({ targetSocketId }) => {
            if (!editorInstance.current) return;
            const currentCode = editorInstance.current.getValue();
            socket.emit("send_code_sync", { targetSocketId, code: currentCode });
        }

        // We just joined and a peer has sent us their live editor content.
        // Load it into the editor only if it is newer (non-empty) than what we loaded from DB.
        // isRemoteUpdate guards against re-broadcasting this load as a local change.
        const onCodeSync = (code) => {
            if (!editorInstance.current) return;
            isRemoteUpdate.current = true;
            editorInstance.current.setValue(code || "");
            isRemoteUpdate.current = false;
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

        const onRoomUsers = (users) => {
            setParticipants(users);
            // Pre-assign colors to all users already in the room, in the order they appear.
            // This ensures that when there are only 2-3 users, they get palette indices 0, 1, 2
            // which are the most visually distinct entries (cyan, pink, yellow).
            users.forEach(u => getOrAssignColor(u.userId));

            // If we are the only user in the room, load code from DB.
            // If there are other users, we rely on the live code sync from peers.
            if (users.length <= 1) {
                loadCode();
            } else {
                // Fallback: If peer sync fails or times out after 2s, load from DB
                setTimeout(() => {
                    // Check if editor is still empty (meaning no sync happened)
                    if (editorInstance.current && !editorInstance.current.getValue()) {
                        loadCode();
                    }
                }, 2000);
            }
        }

        const onUserJoined = ({ userId, username }) => {
            setParticipants((prev) => {
                if (prev.some(p => p.userId === userId)) return prev;
                return [...prev, { userId, username }];
            });
            // Assign a color when the new user joins so their cursor color is ready.
            getOrAssignColor(userId);
            setMessages((prev) => [...prev, {
                isSystem: true,
                message: `${username} joined the room`
            }]);
        }

        const onUserLeft = ({ userId, username }) => {
            setParticipants((prev) => prev.filter((p) => p.userId !== userId));
            setMessages((prev) => [...prev, {
                isSystem: true,
                message: `${username} left the room`
            }]);

            // Remove the cursor bar decoration for this user.
            if (decorationsRef.current[userId] && editorInstance.current) {
                editorInstance.current.deltaDecorations(decorationsRef.current[userId], []);
                delete decorationsRef.current[userId];
            }

            // Remove the name label Content Widget for this user.
            if (cursorWidgetsRef.current[userId] && editorInstance.current) {
                editorInstance.current.removeContentWidget(cursorWidgetsRef.current[userId].widget);
                delete cursorWidgetsRef.current[userId];
            }

            // Cancel any pending hide timer for this user.
            if (cursorLabelTimers.current[userId]) {
                clearTimeout(cursorLabelTimers.current[userId]);
                delete cursorLabelTimers.current[userId];
            }
        }


        const onCursorUpdate = ({ userId, line, column, username }) => {
            if (!editorInstance.current) return;

            // Get (or assign) a consistent color for this user.
            const color = getOrAssignColor(userId);

            // Display name: truncate to 8 characters as requested.
            const displayName = (username || "User").slice(0, 8);

            // Sanitize userId for use as a CSS class name (remove non-alphanumeric chars).
            const safeId = userId.replace(/[^a-zA-Z0-9]/g, "");
            const cursorClass = `rc-cursor-${safeId}`;

            // ── Cursor bar (CSS decoration) ──────────────────────────────────────────
            // Inject the cursor bar CSS rule once per user.
            // We use a Set to prevent re-injecting on every cursor move event.
            if (styleSheetRef.current && !styleSheetRef.current._injected.has(safeId)) {
                styleSheetRef.current._injected.add(safeId);
                styleSheetRef.current.insertRule(
                    `.${cursorClass} { border-left: 2px solid ${color}; position: absolute; z-index: 10; }`,
                    styleSheetRef.current.cssRules.length
                );
            }

            // Apply (or update) the cursor bar decoration at the new position.
            decorationsRef.current[userId] = editorInstance.current.deltaDecorations(
                decorationsRef.current[userId] || [],
                [{ range: new monaco.Range(line, column, line, column), options: { className: cursorClass } }]
            );

            // ── Name label (Monaco Content Widget) ───────────────────────────────────
            // Content Widgets are real DOM nodes that Monaco positions relative to the
            // editor coordinate system. Unlike CSS ::before pseudo-elements, they are
            // NOT clipped by overflow:hidden on the line containers, so the label is
            // always visible above the cursor line.

            if (cursorWidgetsRef.current[userId]) {
                // Widget already exists: update its position and make it visible again.
                const entry = cursorWidgetsRef.current[userId];
                entry.state.line = line;
                entry.state.column = column;
                entry.domNode.style.display = "block";
                editorInstance.current.layoutContentWidget(entry.widget);
            } else {
                // First appearance for this user: create the Content Widget.

                // Mutable state object that getPosition() closes over.
                // We update entry.state.line/column in place to reposition the widget.
                const state = { line, column };

                const domNode = document.createElement("div");
                domNode.textContent = displayName;

                // Style the label chip. Colors match the user's cursor bar color so
                // it is immediately clear which cursor belongs to which label.
                Object.assign(domNode.style, {
                    background: color,
                    color: "#000000",        // dark text on vibrant background = readable
                    fontSize: "10px",
                    fontWeight: "700",
                    fontFamily: "monospace",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    zIndex: "100",
                    lineHeight: "16px",
                });

                const widget = {
                    // getId must return a unique stable string for this widget.
                    getId: () => `cursor-label-${safeId}`,

                    // getDomNode is called once by Monaco; we return our pre-built element.
                    getDomNode: () => domNode,

                    // getPosition is called on every layoutContentWidget call.
                    // We provide ABOVE as the primary preference, and BELOW as a fallback.
                    // ABOVE fails silently when the cursor is on line 1 (no space above it),
                    // so BELOW ensures the label still appears in that case.
                    getPosition: () => ({
                        position: { lineNumber: state.line, column: state.column },
                        preference: [
                            monaco.editor.ContentWidgetPositionPreference.ABOVE,
                            monaco.editor.ContentWidgetPositionPreference.BELOW
                        ]
                    })
                };

                editorInstance.current.addContentWidget(widget);

                // IMPORTANT: addContentWidget registers the widget but does NOT guarantee
                // that Monaco will calculate and apply its pixel position immediately.
                // Without this explicit layoutContentWidget call, the widget exists in
                // Monaco's internal list but renders at position 0,0 (off-screen).
                editorInstance.current.layoutContentWidget(widget);

                cursorWidgetsRef.current[userId] = { widget, state, domNode };
            }

            // ── Inactivity timer: hide the label after 3 seconds of no movement ─────
            if (cursorLabelTimers.current[userId]) {
                clearTimeout(cursorLabelTimers.current[userId]);
            }
            cursorLabelTimers.current[userId] = setTimeout(() => {
                // Hide the DOM node. The widget itself stays registered so it can
                // be made visible again instantly on the next cursor_update without
                // having to recreate and re-register it.
                if (cursorWidgetsRef.current[userId]) {
                    cursorWidgetsRef.current[userId].domNode.style.display = "none";
                }
            }, 3000);
        }


        // Session ended by host → navigate everyone away
        const onSessionEnded = () => {
            alert("The host has ended this session.")
            navigate("/room")
        }

        const onKicked = () => {
            alert("You have been removed from the session by the host.")
            navigate("/profile")
        }

        const onBanned = () => {
            alert("You have been banned from this session.")
            navigate("/profile")
        }

        socket.on("code_update", onCodeUpdate)
        socket.on("request_code_sync", onRequestCodeSync)
        socket.on("code_sync", onCodeSync)
        socket.on("language_update", onLanguageUpdate)
        socket.on("receive_message", onReceiveMessage)
        socket.on("execution_status", onExecutionStatus)
        socket.on("code_output", onCodeOutput)
        socket.on("room_users", onRoomUsers)
        socket.on("user_joined", onUserJoined)
        socket.on("user_left", onUserLeft)
        socket.on("cursor_update", onCursorUpdate)
        socket.on("session_ended", onSessionEnded)
        socket.on("kicked", onKicked)
        socket.on("banned", onBanned)

        // ── Cleanup ──
        return () => {
            // Dispose the Monaco editor instance.
            editorInstance.current?.dispose();

            // Remove all Content Widgets (name labels) that were added for remote cursors.
            Object.values(cursorWidgetsRef.current).forEach(entry => {
                editorInstance.current?.removeContentWidget(entry.widget);
            });
            cursorWidgetsRef.current = {};

            // Unregister all socket event listeners to prevent memory leaks.
            socket.off("code_update", onCodeUpdate)
            socket.off("request_code_sync", onRequestCodeSync)
            socket.off("code_sync", onCodeSync)
            socket.off("language_update", onLanguageUpdate)
            socket.off("receive_message", onReceiveMessage)
            socket.off("execution_status", onExecutionStatus)
            socket.off("code_output", onCodeOutput)
            socket.off("room_users", onRoomUsers)
            socket.off("user_joined", onUserJoined)
            socket.off("user_left", onUserLeft)
            socket.off("cursor_update", onCursorUpdate)
            socket.off("session_ended", onSessionEnded)
            socket.off("kicked", onKicked)
            socket.off("banned", onBanned)
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

    // Host kick/ban controls
    const handleKick = (targetUserId, targetUsername) => {
        if (!isHost) return
        if (window.confirm(`Are you sure you want to remove ${targetUsername} from the room?`)) {
            getSocket().emit("kick_user", { roomId, targetUserId })
        }
    }

    const handleBan = (targetUserId, targetUsername) => {
        if (!isHost) return
        if (window.confirm(`Are you sure you want to BAN ${targetUsername}? They will not be able to rejoin.`)) {
            getSocket().emit("ban_user", { roomId, targetUserId })
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
        if (!window.confirm("Have you saved the code? Click OK to end the session. All participants will be removed.")) return
        getSocket().emit("end_session", { roomId })
        navigate("/profile")
    }

    // Leave room
    const handleLeaveRoom = () => {
        getSocket().emit("leave_room", { roomId })
        navigate("/profile")
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
                        onClick={() => {
                            navigator.clipboard.writeText(roomId)
                            alert("Room ID copied!")
                        }}
                        className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer"
                    >
                        Copy ID
                    </button>
                    <button
                        onClick={copyRoomLink}
                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                    >
                        Copy Link
                    </button>
                    {/* Session Ended badge is intentionally omitted here.
                        The room's isActive flag is managed server-side and shown
                        on the Profile/Room history page, not inside the live editor. */}
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
                        {isRunning ? "Running..." : "Run"}
                    </button>

                    {!isHost && (
                        <button
                            onClick={handleLeaveRoom}
                            className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded cursor-pointer"
                        >
                            Leave Room
                        </button>
                    )}

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
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        <div 
                            className="px-3 py-2 text-xs font-semibold text-gray-400 bg-gray-900 border-b border-gray-800 uppercase tracking-wide cursor-pointer flex justify-between items-center hover:bg-gray-800"
                            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                        >
                            <span>Chat · {participants.length} online</span>
                            <span className="text-gray-500">{showOnlineUsers ? "▼" : "▲"}</span>
                        </div>

                        {/* Online Users Dropdown */}
                        {showOnlineUsers && (
                            <div className="absolute top-8 left-0 right-0 bg-gray-800 border-b border-gray-700 z-20 max-h-40 overflow-y-auto">
                                {participants.map((p) => {
                                    const pIsHost = p.userId === (room?.createdBy?._id || room?.createdBy);
                                    const isMe = p.userId === user?._id;
                                    return (
                                        <div key={p.userId} className="px-3 py-2 text-sm text-gray-300 flex items-center justify-between border-b border-gray-700 last:border-0 group">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span style={{ color: getUserColor(p.userId) }}>{p.username}</span>
                                                {pIsHost && <span className="text-xs text-yellow-500 font-bold ml-1">(Host)</span>}
                                                {isMe && <span className="text-xs text-gray-500">(You)</span>}
                                            </div>
                                            
                                            {/* Admin Controls */}
                                            {isHost && !isMe && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleKick(p.userId, p.username)}
                                                        className="text-[10px] bg-red-600 hover:bg-red-500 px-2 py-1 rounded cursor-pointer"
                                                    >
                                                        Remove
                                                    </button>
                                                    <button 
                                                        onClick={() => handleBan(p.userId, p.username)}
                                                        className="text-[10px] bg-red-900 hover:bg-red-800 px-2 py-1 rounded cursor-pointer border border-red-700"
                                                    >
                                                        Ban
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {messages.map((msg, i) => (
                                <div key={i} className={`text-sm ${msg.isSystem ? "text-center my-2" : ""}`}>
                                    {msg.isSystem ? (
                                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                                            {msg.message}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-blue-400 font-medium">
                                                {msg.sender?.username || "User"}:&nbsp;
                                            </span>
                                            <span className="text-gray-300 break-words">{msg.message}</span>
                                        </>
                                    )}
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
