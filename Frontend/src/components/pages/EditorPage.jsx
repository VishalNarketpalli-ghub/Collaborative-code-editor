import { useEffect, useRef, useState, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import * as monaco from "monaco-editor"
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import API from "../../utils/axios"
import { getSocket } from "../../socket-files/socket"
import { useAuth } from "../../context/AuthContext"
import FileExplorer from "../editor/FileExplorer"
import TabBar from "../editor/TabBar"
import "../editor/editor.css"

// Configure Monaco worker URLs once at module level.
self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json')                              return new jsonWorker()
        if (['css', 'scss', 'less'].includes(label))      return new cssWorker()
        if (['html', 'handlebars', 'razor'].includes(label)) return new htmlWorker()
        if (['typescript', 'javascript'].includes(label)) return new tsWorker()
        return new editorWorker()
    }
}

// ── Language helpers ─────────────────────────────────────────────────────────

// Derive Monaco language from a filename extension.
function languageFromFilename(filename) {
    const EXT_MAP = {
        js: "javascript", jsx: "javascript",
        ts: "typescript", tsx: "typescript",
        py: "python", java: "java",
        cpp: "cpp", cc: "cpp", cxx: "cpp",
        c: "c", cs: "csharp",
        go: "go", rs: "rust",
        rb: "ruby", php: "php",
        html: "html", css: "css",
        json: "json", md: "markdown",
        sh: "shell", sql: "sql",
        xml: "xml", yaml: "yaml", yml: "yaml",
    }
    const ext = filename?.split(".").pop()?.toLowerCase() || ""
    return EXT_MAP[ext] || "plaintext"
}

// ── Main component ────────────────────────────────────────────────────────────

function EditorPage() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    // ── Refs ──────────────────────────────────────────────────────────────────

    const editorRef        = useRef(null)   // DOM node for Monaco to mount into
    const editorInstance   = useRef(null)   // monaco.editor.IStandaloneCodeEditor
    const isRemoteUpdate   = useRef(false)  // prevents echo-back of remote edits

    // Per-user cursor decorations: { userId -> decorationId[] }
    const decorationsRef     = useRef({})
    // Injected CSS stylesheet for cursor bar rules.
    const styleSheetRef      = useRef(null)
    // Monaco Content Widgets for remote user name labels.
    const cursorWidgetsRef   = useRef({})
    // Color map: userId -> hex color string.
    const userColorMapRef    = useRef({})
    // Monotonic counter for next palette index.
    const nextColorIndexRef  = useRef(0)
    // Hide-label timers: userId -> setTimeout handle.
    const cursorLabelTimers  = useRef({})

    // In-memory content cache: filename -> string
    // Prevents unnecessary API round-trips when switching between already-loaded tabs.
    const fileContentCache = useRef({})

    // Track the active filename in a ref so socket handlers always read the
    // current value without needing to be recreated on every state change.
    const activeFileRef = useRef(null)

    // ── State ─────────────────────────────────────────────────────────────────

    const [room,             setRoom]             = useState(null)
    const [isHost,           setIsHost]           = useState(false)
    const [messages,         setMessages]         = useState([])
    const [inputMsg,         setInputMsg]         = useState("")
    const [stdin,            setStdin]            = useState("")
    const [output,           setOutput]           = useState({ text: "Run code to see output...", isError: false })
    const [isRunning,        setIsRunning]        = useState(false)
    const [participants,     setParticipants]     = useState([])
    const [showOnlineUsers,  setShowOnlineUsers]  = useState(false)
    const [loading,          setLoading]          = useState(true)
    const [leftWidth,        setLeftWidth]        = useState(18)  // file-explorer panel width %
    const [editorWidth,      setEditorWidth]      = useState(52)  // editor panel width %

    // File-system state
    const [files,      setFiles]      = useState([])    // list of file metadata objects
    const [activeFile, setActiveFile] = useState(null)  // currently open filename

    const chatEndRef = useRef(null)

    // ── Color palette ─────────────────────────────────────────────────────────
    // Ordered for maximum visual distance so the first two users always get
    // maximally different colors.
    const CURSOR_COLORS = [
        "#00F5D4", "#F72585", "#FFD60A", "#7B2FFF",
        "#43E97B", "#FF6B35", "#00B4D8", "#FF4D6D",
        "#06D6A0", "#F8961E", "#4CC9F0", "#FF99C8",
    ]

    const getOrAssignColor = (userId) => {
        if (!userId) return CURSOR_COLORS[0]
        if (!userColorMapRef.current[userId]) {
            const index = nextColorIndexRef.current % CURSOR_COLORS.length
            userColorMapRef.current[userId] = CURSOR_COLORS[index]
            nextColorIndexRef.current++
        }
        return userColorMapRef.current[userId]
    }

    const getUserColor = (userId) => getOrAssignColor(userId)

    // ── Stylesheet for cursor bar decorations ─────────────────────────────────
    useEffect(() => {
        const styleEl = document.createElement("style")
        document.head.appendChild(styleEl)
        styleSheetRef.current = styleEl.sheet
        styleSheetRef.current._injected = new Set()
        return () => styleEl.remove()
    }, [])

    // ── STEP 1: Fetch room, auto-reopen if needed, validate access ────────────
    useEffect(() => {
        if (!user) return

        const initRoom = async () => {
            try {
                const { data: roomData } = await API.get(`/room/${roomId}`)

                const hostId    = roomData.createdBy?._id || roomData.createdBy
                const userIsHost = String(hostId) === String(user?._id)
                setIsHost(userIsHost)
                setRoom(roomData)

                // Non-hosts cannot be on an ended session's editor page.
                if (!roomData.isActive && !userIsHost) {
                    alert("This session has ended.")
                    navigate("/profile")
                    return
                }

                // If the host navigates directly to this page while the room is
                // still marked inactive (e.g. via browser history after ending
                // a session), reopen it automatically so the DB state is consistent
                // and non-hosts can rejoin after the host shares the link.
                if (!roomData.isActive && userIsHost) {
                    try {
                        await API.patch(`/room/${roomId}/reopen`)
                    } catch (err) {
                        alert(err.response?.data?.message || "Failed to reopen session")
                        navigate("/profile")
                        return
                    }
                }

                // Direct-link / refresh join: if the user is not yet a participant,
                // join via REST so the socket's participant check passes.
                const userId       = String(user?._id)
                const isParticipant = roomData.participants?.some(
                    (p) => String(p._id || p) === userId
                )

                if (!isParticipant) {
                    if (roomData.password) {
                        navigate(`/join-room?roomId=${roomId}`)
                        return
                    }
                    await API.post("/room/join", { roomId, password: "" })
                }

                // Load the file list for this room.
                const { data: fileList } = await API.get(`/code/${roomId}/files`)
                setFiles(fileList)

                setLoading(false)
            } catch (err) {
                const msg = err.response?.data?.message
                if (msg) alert(msg)
                console.error("Room init error:", err)
                navigate("/profile")
            }
        }

        initRoom()
    }, [roomId, user])

    // ── Switch active file ────────────────────────────────────────────────────
    // Loads file content from the cache or API, then updates Monaco.
    const switchToFile = useCallback(async (filename) => {
        if (!filename || !editorInstance.current) return

        activeFileRef.current = filename
        setActiveFile(filename)

        // Apply the correct Monaco language for this file.
        const lang = languageFromFilename(filename)
        monaco.editor.setModelLanguage(editorInstance.current.getModel(), lang)

        // Serve from in-memory cache if available (avoids re-fetching on tab switch).
        if (fileContentCache.current[filename] !== undefined) {
            isRemoteUpdate.current = true
            editorInstance.current.setValue(fileContentCache.current[filename])
            isRemoteUpdate.current = false
            return
        }

        // Fetch from DB.
        try {
            const { data } = await API.get(`/code/${roomId}/file/${encodeURIComponent(filename)}`)
            const content = data.content || ""
            fileContentCache.current[filename] = content
            isRemoteUpdate.current = true
            editorInstance.current.setValue(content)
            isRemoteUpdate.current = false
        } catch (err) {
            console.error("Failed to load file content:", err)
        }

        // Notify peers which file is now active (informational, not mandatory).
        getSocket().emit("active_file_switch", { roomId, filename })
    }, [roomId])

    // ── STEP 2: Init editor + socket listeners ────────────────────────────────
    useEffect(() => {
        if (loading || !editorRef.current) return

        const socket = getSocket()

        socket.emit("join-room", { roomId, username: user?.username || "Unknown" })

        // Create the Monaco editor instance.
        editorInstance.current = monaco.editor.create(editorRef.current, {
            value: "",
            language: "plaintext",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            tabSize: 4,
            wordWrap: "off",
            renderLineHighlight: "gutter",
            cursorSmoothCaretAnimation: "on",
        })

        // Load chat history.
        const loadChatHistory = async () => {
            try {
                const { data } = await API.get(`/chat/${roomId}`)
                setMessages(data)
            } catch (err) {
                console.error("Load chat error:", err)
            }
        }
        loadChatHistory()

        // Broadcast local code edits.
        editorInstance.current.onDidChangeModelContent(() => {
            if (isRemoteUpdate.current) return
            const code = editorInstance.current.getValue()

            // Keep the in-memory cache up to date as the user types.
            if (activeFileRef.current) {
                fileContentCache.current[activeFileRef.current] = code
            }

            socket.emit("code_change", { roomId, code, filename: activeFileRef.current })
        })

        // Broadcast local cursor moves.
        editorInstance.current.onDidChangeCursorPosition((e) => {
            socket.emit("cursor_move", {
                roomId,
                line: e.position.lineNumber,
                column: e.position.column
            })
        })

        // ── Applies a remote code edit without resetting the cursor ────────────
        // We use pushEditOperations instead of setValue to preserve cursor
        // position and selection across collaborative edits.
        const applyRemoteCode = (code) => {
            if (!editorInstance.current) return
            const model = editorInstance.current.getModel()
            if (!model || code === model.getValue()) return

            const savedPosition  = editorInstance.current.getPosition()
            const savedSelection = editorInstance.current.getSelection()

            isRemoteUpdate.current = true
            model.pushEditOperations(
                [],
                [{ range: model.getFullModelRange(), text: code }],
                () => null
            )
            isRemoteUpdate.current = false

            if (savedPosition)  editorInstance.current.setPosition(savedPosition)
            if (savedSelection) editorInstance.current.setSelection(savedSelection)
        }

        // ── Socket event handlers ─────────────────────────────────────────────

        // A remote user changed code in their active file.
        // Only apply if it targets the same file we are currently viewing.
        const onCodeUpdate = ({ code, filename }) => {
            if (filename !== undefined && filename !== activeFileRef.current) {
                // Update cache for the other file so we see fresh content on switch.
                if (filename) fileContentCache.current[filename] = code
                return
            }
            applyRemoteCode(code)
            if (activeFileRef.current) {
                fileContentCache.current[activeFileRef.current] = code
            }
        }

        // A peer is asking us to push our current editor state to a new joiner.
        const onRequestCodeSync = ({ targetSocketId }) => {
            if (!editorInstance.current) return
            socket.emit("send_code_sync", {
                targetSocketId,
                code: editorInstance.current.getValue(),
                filename: activeFileRef.current,
            })
        }

        // We just joined and a peer has sent us their current editor state.
        // setValue is acceptable here because we have no existing content yet.
        const onCodeSync = ({ code, filename }) => {
            if (!editorInstance.current) return

            // If the peer told us which file they have open, switch to it.
            if (filename && filename !== activeFileRef.current) {
                switchToFile(filename)
                return
            }

            isRemoteUpdate.current = true
            editorInstance.current.setValue(code || "")
            isRemoteUpdate.current = false
            if (activeFileRef.current) {
                fileContentCache.current[activeFileRef.current] = code || ""
            }
        }

        const onLanguageUpdate = (newLang) => {
            // Language change events from the room-level language selector are
            // no longer the primary mechanism (language is per-file). We still
            // handle them for backward compatibility.
        }

        const onReceiveMessage = (msg) => {
            setMessages((prev) => [...prev, msg])
        }

        const onExecutionStatus = () => {
            setOutput({ text: "Running...", isError: false })
            setIsRunning(true)
        }

        const onCodeOutput = ({ stdout, stderr }) => {
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
            setParticipants(users)
            users.forEach((u) => getOrAssignColor(u.userId))

            // If we are the only user, load the active file from DB.
            // Otherwise rely on peer code-sync (onCodeSync).
            if (users.length <= 1 && activeFileRef.current) {
                switchToFile(activeFileRef.current)
            } else if (users.length > 1 && activeFileRef.current) {
                // Fallback: if peer sync doesn't arrive in 2 s, load from DB.
                setTimeout(() => {
                    if (editorInstance.current && !editorInstance.current.getValue()) {
                        switchToFile(activeFileRef.current)
                    }
                }, 2000)
            }
        }

        const onUserJoined = ({ userId, username }) => {
            setParticipants((prev) => {
                if (prev.some((p) => p.userId === userId)) return prev
                return [...prev, { userId, username }]
            })
            getOrAssignColor(userId)
            setMessages((prev) => [...prev, { isSystem: true, message: `${username} joined the room` }])
        }

        const onUserLeft = ({ userId, username }) => {
            setParticipants((prev) => prev.filter((p) => p.userId !== userId))
            setMessages((prev) => [...prev, { isSystem: true, message: `${username} left the room` }])

            // Remove cursor decorations for the departed user.
            if (decorationsRef.current[userId] && editorInstance.current) {
                editorInstance.current.deltaDecorations(decorationsRef.current[userId], [])
                delete decorationsRef.current[userId]
            }
            if (cursorWidgetsRef.current[userId] && editorInstance.current) {
                editorInstance.current.removeContentWidget(cursorWidgetsRef.current[userId].widget)
                delete cursorWidgetsRef.current[userId]
            }
            if (cursorLabelTimers.current[userId]) {
                clearTimeout(cursorLabelTimers.current[userId])
                delete cursorLabelTimers.current[userId]
            }
        }

        const onCursorUpdate = ({ userId, line, column, username }) => {
            if (!editorInstance.current) return

            const color       = getOrAssignColor(userId)
            const displayName = (username || "User").slice(0, 8)
            const safeId      = userId.replace(/[^a-zA-Z0-9]/g, "")
            const cursorClass = `rc-cursor-${safeId}`

            // Inject cursor bar CSS rule once per user.
            if (styleSheetRef.current && !styleSheetRef.current._injected.has(safeId)) {
                styleSheetRef.current._injected.add(safeId)
                styleSheetRef.current.insertRule(
                    `.${cursorClass} { border-left: 2px solid ${color}; position: absolute; z-index: 10; }`,
                    styleSheetRef.current.cssRules.length
                )
            }

            decorationsRef.current[userId] = editorInstance.current.deltaDecorations(
                decorationsRef.current[userId] || [],
                [{ range: new monaco.Range(line, column, line, column), options: { className: cursorClass } }]
            )

            // Content Widget for the name label.
            if (cursorWidgetsRef.current[userId]) {
                const entry = cursorWidgetsRef.current[userId]
                entry.state.line   = line
                entry.state.column = column
                entry.domNode.style.display = "block"
                editorInstance.current.layoutContentWidget(entry.widget)
            } else {
                const state   = { line, column }
                const domNode = document.createElement("div")
                domNode.textContent = displayName
                Object.assign(domNode.style, {
                    background: color, color: "#000",
                    fontSize: "10px", fontWeight: "700",
                    fontFamily: "monospace", padding: "2px 6px",
                    borderRadius: "3px", pointerEvents: "none",
                    whiteSpace: "nowrap", zIndex: "100", lineHeight: "16px",
                })

                const widget = {
                    getId: () => `cursor-label-${safeId}`,
                    getDomNode: () => domNode,
                    getPosition: () => ({
                        position: { lineNumber: state.line, column: state.column },
                        preference: [
                            monaco.editor.ContentWidgetPositionPreference.ABOVE,
                            monaco.editor.ContentWidgetPositionPreference.BELOW,
                        ]
                    })
                }

                editorInstance.current.addContentWidget(widget)
                editorInstance.current.layoutContentWidget(widget)
                cursorWidgetsRef.current[userId] = { widget, state, domNode }
            }

            // Hide the name label after 3 seconds of inactivity.
            if (cursorLabelTimers.current[userId]) {
                clearTimeout(cursorLabelTimers.current[userId])
            }
            cursorLabelTimers.current[userId] = setTimeout(() => {
                cursorWidgetsRef.current[userId]?.domNode &&
                    (cursorWidgetsRef.current[userId].domNode.style.display = "none")
            }, 3000)
        }

        // Session ended by host — non-hosts are redirected away.
        // The host does NOT receive this event (the socket handler uses socket.to()
        // which excludes the sender, which prevents the race condition where both
        // navigate("/profile") and navigate("/room") fire simultaneously).
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

        // ── File system socket events (from peers/host) ───────────────────────

        // A new file was created by the host — add it to the local list.
        const onFileCreated = ({ file }) => {
            setFiles((prev) => {
                if (prev.some((f) => f.filename === file.filename)) return prev
                return [...prev, file]
            })
        }

        // A file was deleted by the host.
        const onFileDeleted = ({ filename }) => {
            setFiles((prev) => {
                const remaining = prev.filter((f) => f.filename !== filename)

                // If the currently open file was deleted, switch to the first remaining one.
                if (activeFileRef.current === filename) {
                    if (remaining.length > 0) {
                        // Defer the file switch so React can flush the state update first.
                        setTimeout(() => switchToFile(remaining[0].filename), 0)
                    } else {
                        activeFileRef.current = null
                        setActiveFile(null)
                        if (editorInstance.current) {
                            isRemoteUpdate.current = true
                            editorInstance.current.setValue("")
                            isRemoteUpdate.current = false
                        }
                    }
                }

                return remaining
            })
        }

        // A file was renamed by the host.
        const onFileRenamed = ({ oldName, newName, newLanguage }) => {
            setFiles((prev) =>
                prev.map((f) =>
                    f.filename === oldName
                        ? { ...f, filename: newName, language: newLanguage }
                        : f
                )
            )
            // Migrate the in-memory cache to the new name.
            if (fileContentCache.current[oldName] !== undefined) {
                fileContentCache.current[newName] = fileContentCache.current[oldName]
                delete fileContentCache.current[oldName]
            }
            if (activeFileRef.current === oldName) {
                activeFileRef.current = newName
                setActiveFile(newName)
                if (editorInstance.current) {
                    monaco.editor.setModelLanguage(editorInstance.current.getModel(), newLanguage)
                }
            }
        }

        // Register all listeners.
        socket.on("code_update",       onCodeUpdate)
        socket.on("request_code_sync", onRequestCodeSync)
        socket.on("code_sync",         onCodeSync)
        socket.on("language_update",   onLanguageUpdate)
        socket.on("receive_message",   onReceiveMessage)
        socket.on("execution_status",  onExecutionStatus)
        socket.on("code_output",       onCodeOutput)
        socket.on("room_users",        onRoomUsers)
        socket.on("user_joined",       onUserJoined)
        socket.on("user_left",         onUserLeft)
        socket.on("cursor_update",     onCursorUpdate)
        socket.on("session_ended",     onSessionEnded)
        socket.on("kicked",            onKicked)
        socket.on("banned",            onBanned)
        socket.on("file_created",      onFileCreated)
        socket.on("file_deleted",      onFileDeleted)
        socket.on("file_renamed",      onFileRenamed)

        return () => {
            editorInstance.current?.dispose()
            Object.values(cursorWidgetsRef.current).forEach((entry) =>
                editorInstance.current?.removeContentWidget(entry.widget)
            )
            cursorWidgetsRef.current = {}

            socket.off("code_update",       onCodeUpdate)
            socket.off("request_code_sync", onRequestCodeSync)
            socket.off("code_sync",         onCodeSync)
            socket.off("language_update",   onLanguageUpdate)
            socket.off("receive_message",   onReceiveMessage)
            socket.off("execution_status",  onExecutionStatus)
            socket.off("code_output",       onCodeOutput)
            socket.off("room_users",        onRoomUsers)
            socket.off("user_joined",       onUserJoined)
            socket.off("user_left",         onUserLeft)
            socket.off("cursor_update",     onCursorUpdate)
            socket.off("session_ended",     onSessionEnded)
            socket.off("kicked",            onKicked)
            socket.off("banned",            onBanned)
            socket.off("file_created",      onFileCreated)
            socket.off("file_deleted",      onFileDeleted)
            socket.off("file_renamed",      onFileRenamed)
        }
    }, [loading, roomId])

    // ── Open the first file once files are loaded ─────────────────────────────
    // This runs when the file list first becomes non-empty and we don't yet
    // have an active file, so the editor is not left blank on entry.
    useEffect(() => {
        if (files.length > 0 && !activeFile && editorInstance.current) {
            switchToFile(files[0].filename)
        }
    }, [files, activeFile, switchToFile])

    // ── Scroll chat to bottom on new messages ─────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // ── Handlers ──────────────────────────────────────────────────────────────

    // Save the currently active file to DB.
    const handleSave = async () => {
        if (!isHost || !editorInstance.current || !activeFile) return
        try {
            await API.put(
                `/code/${roomId}/file/${encodeURIComponent(activeFile)}`,
                { content: editorInstance.current.getValue() }
            )
            // Brief visual feedback without a blocking alert.
            setOutput((prev) => ({ ...prev, text: `"${activeFile}" saved.`, isError: false }))
            setTimeout(() => setOutput((prev) =>
                prev.text === `"${activeFile}" saved.`
                    ? { text: "Run code to see output...", isError: false }
                    : prev
            ), 2000)
        } catch (err) {
            alert(err.response?.data?.message || "Save failed")
        }
    }

    // Run the code in the currently active file.
    const handleRun = () => {
        if (!editorInstance.current || isRunning) return
        const code = editorInstance.current.getValue()
        if (!code.trim()) return

        const lang = activeFile ? languageFromFilename(activeFile) : "plaintext"

        getSocket().emit("run_code", {
            roomId,
            source_code: code,
            language: lang,
            stdin
        })
        setIsRunning(true)
        setOutput({ text: "Running...", isError: false })
    }

    // Host kick / ban
    const handleKick = (targetUserId, targetUsername) => {
        if (!isHost) return
        if (window.confirm(`Remove ${targetUsername} from the room?`)) {
            getSocket().emit("kick_user", { roomId, targetUserId })
        }
    }

    const handleBan = (targetUserId, targetUsername) => {
        if (!isHost) return
        if (window.confirm(`Ban ${targetUsername}? They will not be able to rejoin.`)) {
            getSocket().emit("ban_user", { roomId, targetUserId })
        }
    }

    // Send a chat message.
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

    // Copy room link to clipboard.
    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert("Room link copied!")
    }

    // End session — host only. The socket handler broadcasts session_ended to
    // peers only (not the host) so the host's navigate() is not overwritten.
    const handleEndSession = async () => {
        if (!isHost) return
        if (!window.confirm("Have you saved your files? Click OK to end the session.")) return
        getSocket().emit("end_session", { roomId })
        navigate("/profile")
    }

    const handleLeaveRoom = () => {
        getSocket().emit("leave_room", { roomId })
        navigate("/profile")
    }

    // ── File explorer callbacks ────────────────────────────────────────────────
    const handleFileSelect = useCallback((filename) => {
        if (filename && filename !== activeFileRef.current) {
            switchToFile(filename)
        }
    }, [switchToFile])

    const handleFilesChange = useCallback((updatedFiles) => {
        setFiles(updatedFiles)
    }, [])

    // ── Drag handles ──────────────────────────────────────────────────────────

    // Left drag: resize file explorer width.
    const startLeftDrag = () => {
        const onMove = (e) => {
            const pct = (e.clientX / window.innerWidth) * 100
            if (pct > 8 && pct < 35) setLeftWidth(pct)
        }
        const stop = () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", stop)
        }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", stop)
    }

    // Right drag: resize editor vs right panel.
    const startRightDrag = () => {
        const onMove = (e) => {
            const pct = (e.clientX / window.innerWidth) * 100
            const rightPanelPct = pct - leftWidth
            if (rightPanelPct > 25 && rightPanelPct < 75) setEditorWidth(rightPanelPct)
        }
        const stop = () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseup", stop)
        }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseup", stop)
    }

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="editor-loading">
                <div className="editor-spinner" />
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────────────
    const rightPanelWidth = 100 - leftWidth - editorWidth

    return (
        <div className="editor-root">

            {/* ── TOP BAR ────────────────────────────────────────────────── */}
            <div className="editor-topbar">

                {/* Left: room ID + copy buttons */}
                <div className="topbar-left">
                    <span className="topbar-label">Room</span>
                    <code className="topbar-room-id">{roomId}</code>
                    <button
                        className="topbar-btn"
                        onClick={() => { navigator.clipboard.writeText(roomId); alert("Room ID copied!") }}
                    >
                        Copy ID
                    </button>
                    <button className="topbar-btn topbar-btn--primary" onClick={copyRoomLink}>
                        Copy Link
                    </button>
                    {room?.title && (
                        <span className="topbar-room-title">{room.title}</span>
                    )}
                </div>

                {/* Right: action buttons */}
                <div className="topbar-right">
                    {activeFile && (
                        <span className="topbar-active-file">
                            {activeFile}
                            <span className="topbar-lang-badge">
                                {languageFromFilename(activeFile)}
                            </span>
                        </span>
                    )}

                    {isHost && (
                        <button className="topbar-btn topbar-btn--save" onClick={handleSave}>
                            Save
                        </button>
                    )}

                    <button
                        className={`topbar-btn topbar-btn--run${isRunning ? " topbar-btn--running" : ""}`}
                        onClick={handleRun}
                        disabled={isRunning}
                    >
                        {isRunning ? "Running..." : "Run"}
                    </button>

                    {!isHost && (
                        <button className="topbar-btn" onClick={handleLeaveRoom}>
                            Leave Room
                        </button>
                    )}

                    {isHost && (
                        <button className="topbar-btn topbar-btn--danger" onClick={handleEndSession}>
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* ── MAIN LAYOUT ────────────────────────────────────────────── */}
            <div className="editor-body">

                {/* FILE EXPLORER */}
                <div className="editor-explorer" style={{ width: `${leftWidth}%` }}>
                    <FileExplorer
                        roomId={roomId}
                        files={files}
                        activeFile={activeFile}
                        isHost={isHost}
                        onFileSelect={handleFileSelect}
                        onFilesChange={handleFilesChange}
                        maxFiles={10}
                    />
                </div>

                {/* DRAG: explorer / editor */}
                <div className="editor-drag-handle" onMouseDown={startLeftDrag} />

                {/* EDITOR PANEL */}
                <div className="editor-panel" style={{ width: `${editorWidth}%` }}>
                    {/* Tab bar */}
                    <TabBar
                        files={files}
                        activeFile={activeFile}
                        onTabClick={handleFileSelect}
                    />

                    {/* Monaco mount point — always in the DOM so the ref stays stable.
                        When no files exist an overlay covers it; when files are loaded
                        the overlay disappears and Monaco becomes visible. */}
                    <div
                        ref={editorRef}
                        className="editor-monaco"
                        style={{ display: files.length === 0 ? "none" : "flex", flex: 1 }}
                    />
                    {files.length === 0 && (
                        <div className="editor-empty-state">
                            {isHost
                                ? "Create a file in the explorer to start coding."
                                : "Waiting for the host to create files."}
                        </div>
                    )}
                </div>

                {/* DRAG: editor / right panel */}
                <div className="editor-drag-handle" onMouseDown={startRightDrag} />

                {/* RIGHT PANEL */}
                <div className="editor-right-panel" style={{ width: `${rightPanelWidth}%` }}>

                    {/* Output + stdin */}
                    <div className="output-panel">
                        <div className="panel-header">Output</div>
                        <div className={`output-body${output.isError ? " output-body--error" : ""}`}>
                            {output.text}
                        </div>
                        <div className="panel-subheader">stdin</div>
                        <textarea
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            placeholder="Program input (stdin)..."
                            rows={2}
                            className="stdin-input"
                        />
                    </div>

                    {/* Chat */}
                    <div className="chat-panel">
                        <div
                            className="panel-header panel-header--clickable"
                            onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                        >
                            <span>Chat &middot; {participants.length} online</span>
                            <span className="panel-header-caret">{showOnlineUsers ? "▼" : "▲"}</span>
                        </div>

                        {/* Online users dropdown */}
                        {showOnlineUsers && (
                            <div className="online-users-dropdown">
                                {participants.map((p) => {
                                    const pIsHost = p.userId === (room?.createdBy?._id || room?.createdBy)
                                    const isMe    = p.userId === user?._id
                                    return (
                                        <div key={p.userId} className="online-user-row group">
                                            <div className="online-user-info">
                                                <div className="online-dot" />
                                                <span style={{ color: getUserColor(p.userId) }}>
                                                    {p.username}
                                                </span>
                                                {pIsHost && <span className="badge badge--host">Host</span>}
                                                {isMe    && <span className="badge badge--me">You</span>}
                                            </div>
                                            {isHost && !isMe && (
                                                <div className="host-actions">
                                                    <button
                                                        className="host-action-btn host-action-btn--kick"
                                                        onClick={() => handleKick(p.userId, p.username)}
                                                    >
                                                        Remove
                                                    </button>
                                                    <button
                                                        className="host-action-btn host-action-btn--ban"
                                                        onClick={() => handleBan(p.userId, p.username)}
                                                    >
                                                        Ban
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, i) => (
                                <div key={i} className={`chat-msg${msg.isSystem ? " chat-msg--system" : ""}`}>
                                    {msg.isSystem ? (
                                        <span className="chat-msg-system-text">{msg.message}</span>
                                    ) : (
                                        <>
                                            <span className="chat-msg-sender">
                                                {msg.sender?.username || "User"}:&nbsp;
                                            </span>
                                            <span className="chat-msg-body">{msg.message}</span>
                                        </>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-row">
                            <input
                                value={inputMsg}
                                onChange={(e) => setInputMsg(e.target.value)}
                                onKeyDown={handleChatKeyDown}
                                placeholder="Type a message... (Enter to send)"
                                className="chat-input"
                            />
                            <button className="chat-send-btn" onClick={sendMessage}>
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
