import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { FiShare2 } from "react-icons/fi";

function MonacoEditor({ isRoomCreator, language, setLanguage, roomId }) {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  const roomLink = `${window.location.origin}/room/${roomId}`;

  useEffect(() => {
    editorInstance.current = monaco.editor.create(editorRef.current, {
      value: "// Start coding...",
      language: language,
      theme: "vs-dark",
      automaticLayout: true
    });

    return () => editorInstance.current.dispose();
  }, []);

  useEffect(() => {
    if (editorInstance.current) {
      monaco.editor.setModelLanguage(
        editorInstance.current.getModel(),
        language
      );
    }
  }, [language]);

  const changeLanguage = (e) => {
    setLanguage(e.target.value);
  };

  const shareRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      alert("Room link copied to clipboard!");
    } catch {
      alert("Failed to copy link");
    }
  };

  const endSession = async () =>  {

  }
  return (
    <div className="flex h-125">

      {/* Editor Section */}
      <div className="w-3/5 flex flex-col">

        <div className="p-1 bg-[#1e1e1e]">
          {isRoomCreator ? (
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
            <span className="text-white px-2 py-1 bg-black rounded">
              {language}
            </span>
          )}
        </div>

        <div
          ref={editorRef}
          className="flex-1 border-r-2 border-gray-700"
        />
      </div>

      {/* Output Section */}
      <div className="w-2/5 bg-[#111] text-white p-3 flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          
          <h3 className="text-lg font-semibold">Output</h3>

          <div className="flex justify-between gap-2">
          <button onClick={endSession}
            className="p-2  bg-red-600 rounded hover:bg-red-700"
            title="End session">End session</button>

          <button
            onClick={shareRoomLink}
            className="p-2 rounded hover:bg-gray-700"
            title="Share Room"
          >
            <FiShare2 size={18} />
          </button>
          </div>
        </div>

        <div className="flex-1 border border-gray-700 mb-3 p-3">
          Output will appear here
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1 bg-green-600 rounded hover:bg-green-700">
            Run
          </button>

          <button className="px-3 py-1 bg-red-600 rounded hover:bg-red-700">
            Clear
          </button>
        </div>

      </div>

    </div>
  );
}

export default MonacoEditor;