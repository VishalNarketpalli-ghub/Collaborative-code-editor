import { useEffect, useRef, useState } from "react";
import * as monaco from "monaco-editor";
import { FiShare2 } from "react-icons/fi";
import API from "../utils/axios";

function MonacoEditor({ isRoomCreator, language, setLanguage, roomId }) {
    const editorRef = useRef(null);
    const editorInstance = useRef(null);

    const [output, setOutput] = useState("");
    const [loading, setLoading] = useState(false);

    // Room link for sharing
    const roomLink = `${window.location.origin}/room/${roomId}`;

    // Mapping Monaco language to Judge0 language IDs
    const languageMap = {
        javascript: 63,
        python: 71,
        cpp: 54,
        java: 62,
    };

    // Initialize Monaco editor once
    useEffect(() => {
        editorInstance.current = monaco.editor.create(editorRef.current, {
            value: "// Start coding...",
            language: language,
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
        });

        return () => editorInstance.current.dispose();
    }, []);

    // Update language dynamically
    useEffect(() => {
        if (editorInstance.current) {
            monaco.editor.setModelLanguage(
                editorInstance.current.getModel(),
                language,
            );
        }
    }, [language]);

    // Change language handler
    const changeLanguage = (e) => {
        setLanguage(e.target.value);
    };

    // Copy room link
    const shareRoomLink = async () => {
        try {
            await navigator.clipboard.writeText(roomLink);
            alert("Room link copied");
        } catch {
            alert("Failed to copy");
        }
    };

    // Get code from editor
    const getCode = () => {
        if (!editorInstance.current) return "";
        return editorInstance.current.getValue();
    };

    // Run code using backend compile API
    const handleRun = async () => {
        console.log("RUN BUTTON CLICKED");

        try {
            setLoading(true);
            setOutput("Running...");

            const code = getCode();

            const res = await API.post("/compile/run", {
                code,
                languageId: languageMap[language],
                input: "",
            });

            console.log("API RESPONSE:", res.data);

            const data = res.data;

            const result =
                data.stderr ||
                data.compile_output ||
                data.stdout ||
                "No output";

            setOutput(result);
        } catch (err) {
            console.log("ERROR:", err);
            setOutput("Error running code");
        } finally {
            setLoading(false);
        }
    };

    // Save code manually (only creator)
    const handleSave = async () => {
        try {
            const code = getCode();

            await API.put(`/code/${roomId}`, {
                content: code,
            });

            alert("Code saved successfully");
        } catch (err) {
            alert(err.response?.data?.message || "Save failed");
        }
    };

    // Clear output panel
    const clearOutput = () => {
        setOutput("");
    };

    // End session placeholder
    const endSession = () => {
        alert("Session ended");
    };

    return (
        <div className="h-screen grid grid-cols-1 md:grid-cols-2">
            {/* LEFT SIDE */}
            <div className="flex flex-col h-full border-r border-gray-700">
                {/* TOOLBAR (separate layer, not inside editor) */}
                <div className="p-2 bg-[#1e1e1e] flex justify-between items-center flex-shrink-0">
                    {/* Language selector */}
                    <div>
                        {isRoomCreator ? (
                            <select
                                value={language}
                                onChange={changeLanguage}
                                className="bg-black text-white px-2 py-1 rounded cursor-pointer"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                            </select>
                        ) : (
                            <span className="text-white px-2 py-1 bg-black rounded">
                                {language}
                            </span>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={shareRoomLink}
                            className="p-2 rounded hover:bg-gray-700 cursor-pointer"
                        >
                            <FiShare2 size={18} />
                        </button>

                        {isRoomCreator && (
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
                            >
                                Save
                            </button>
                        )}

                        <button
                            onClick={handleRun}
                            className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 cursor-pointer"
                        >
                            {loading ? "Running..." : "Run"}
                        </button>

                        <button
                            onClick={clearOutput}
                            className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 cursor-pointer"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* EDITOR AREA */}
                <div className="flex-1 min-h-0">
                    <div ref={editorRef} className="h-full w-full" />
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="grid grid-rows-2 h-full">
                {/* CHAT */}
                <div className="border-b border-gray-700 bg-[#111] text-white flex flex-col">
                    <div className="p-2 font-semibold border-b border-gray-700">
                        Chat
                    </div>

                    <div className="flex-1 p-2 overflow-y-auto">
                        Messages will appear here
                    </div>

                    <div className="p-2 border-t border-gray-700 flex gap-2">
                        <input
                            type="text"
                            placeholder="Type message..."
                            className="flex-1 px-2 py-1 bg-black text-white rounded"
                        />
                        <button className="px-3 py-1 bg-blue-600 rounded cursor-pointer">
                            Send
                        </button>
                    </div>
                </div>

                {/* OUTPUT */}
                <div className="bg-[#111] text-white flex flex-col">
                    <div className="p-2 flex justify-between items-center border-b border-gray-700">
                        <h3 className="font-semibold">Output</h3>

                        <button
                            onClick={endSession}
                            className="px-2 py-1 bg-red-600 rounded cursor-pointer"
                        >
                            End
                        </button>
                    </div>

                    <div className="flex-1 p-2 overflow-auto whitespace-pre-wrap">
                        {output}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MonacoEditor;
