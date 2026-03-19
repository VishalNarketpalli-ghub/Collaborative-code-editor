import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { FiShare2 } from "react-icons/fi";

function MonacoEditor({ isRoomCreator, language, setLanguage, roomId }) {
    // Reference to the DOM element where Monaco will be mounted
    const editorRef = useRef(null);

    // Reference to store Monaco editor instance
    const editorInstance = useRef(null);

    // Room link used for sharing
    const roomLink = `${window.location.origin}/room/${roomId}`;

    // Initialize Monaco Editor only once when component mounts
    useEffect(() => {
        editorInstance.current = monaco.editor.create(editorRef.current, {
            value: "// Start coding...", // Default content
            language: language, // Initial language
            theme: "vs-dark", // Dark theme
            automaticLayout: true, // Auto resize on container change

            // Disable minimap for cleaner UI
            minimap: { enabled: false },

            // Prevent extra empty space after last line
            scrollBeyondLastLine: false,

            // Smooth scrolling experience
            smoothScrolling: true,

            // Scrollbar customization
            scrollbar: {
                vertical: "visible",
                horizontal: "visible",
                useShadows: false,
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
            },
        });

        // Cleanup editor on component unmount
        return () => editorInstance.current.dispose();
    }, []);

    // Update editor language dynamically when language state changes
    useEffect(() => {
        if (editorInstance.current) {
            monaco.editor.setModelLanguage(
                editorInstance.current.getModel(),
                language,
            );
        }
    }, [language]);

    // Handle language dropdown change
    const changeLanguage = (e) => {
        setLanguage(e.target.value);
    };

    // Copy room link to clipboard
    const shareRoomLink = async () => {
        try {
            await navigator.clipboard.writeText(roomLink);
            alert("Room link copied to clipboard!");
        } catch {
            alert("Failed to copy link");
        }
    };

    // Placeholder for ending session logic
    const endSession = async () => {};

    return (
        // Main container using responsive grid
        // 1 column on mobile, 2 columns on medium screens and above
        <div className="h-screen grid grid-cols-1 md:grid-cols-2">
            {/* LEFT SIDE → MONACO CODE EDITOR */}
            <div className="flex flex-col border-r border-gray-700 overflow-hidden">
                {/* Top bar containing language selector and action buttons */}
                <div className="p-2 bg-[#1e1e1e] flex justify-between items-center">
                    {/* LEFT SECTION → Language Selector */}
                    <div>
                        {isRoomCreator ? (
                            // Room creator can change language
                            <select
                                value={language}
                                onChange={changeLanguage}
                                className="bg-black text-white px-2 py-1 rounded"
                            >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                            </select>
                        ) : (
                            // Other users can only view selected language
                            <span className="text-white px-2 py-1 bg-black rounded">
                                {language}
                            </span>
                        )}
                    </div>

                    {/* RIGHT SECTION → Share, Run, Clear buttons */}
                    <div className="flex items-center gap-2">
                        {/* Share Room Button */}
                        <button
                            onClick={shareRoomLink}
                            className="p-2 rounded hover:bg-gray-700"
                        >
                            <FiShare2 size={18} />
                        </button>

                        {/* Run Code Button */}
                        <button className="px-3 py-1 bg-green-600 rounded hover:bg-green-700">
                            Run
                        </button>

                        {/* Clear Output Button */}
                        <button className="px-3 py-1 bg-red-600 rounded hover:bg-red-700">
                            Clear
                        </button>
                    </div>
                </div>

                {/* Monaco Editor Container */}
                {/* flex-1 ensures it takes remaining height */}
                {/* min-h-0 fixes overflow issues in flex/grid */}
                {/* overflow-hidden prevents unwanted scrollbars */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <div ref={editorRef} className="h-full w-full" />
                </div>
            </div>

            {/* RIGHT SIDE → CHAT + OUTPUT */}
            {/* Split into two rows */}
            <div className="grid grid-rows-2 md:grid-rows-2 h-full">
                {/* TOP RIGHT → CHAT SECTION */}
                <div className="border-b border-gray-700 bg-[#111] text-white flex flex-col">
                    {/* Chat header */}
                    <div className="p-2 font-semibold border-b border-gray-700">
                        Chat
                    </div>

                    {/* Chat messages area */}
                    {/* overflow-y-auto enables scrolling */}
                    <div className="flex-1 p-2 overflow-y-auto">
                        Messages will appear here
                    </div>

                    {/* Chat input section */}
                    <div className="p-2 border-t border-gray-700 flex gap-2">
                        <input
                            type="text"
                            placeholder="Type message..."
                            className="flex-1 px-2 py-1 bg-black text-white rounded"
                        />
                        <button className="px-3 py-1 bg-blue-600 rounded">
                            Send
                        </button>
                    </div>
                </div>

                {/* BOTTOM RIGHT → OUTPUT SECTION */}
                <div className="bg-[#111] text-white flex flex-col">
                    {/* Output header with end session button */}
                    <div className="p-2 flex justify-between items-center border-b border-gray-700">
                        <h3 className="font-semibold">Output</h3>

                        <button
                            onClick={endSession}
                            className="px-2 py-1 bg-red-600 rounded"
                        >
                            End
                        </button>
                    </div>

                    {/* Output display area */}
                    {/* overflow-auto allows scrolling when output is large */}
                    <div className="flex-1 p-2 border-b border-gray-700 overflow-auto">
                        Output will appear here
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MonacoEditor;
