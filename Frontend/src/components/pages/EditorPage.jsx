// import MonacoEditor from "./MonacoEditor";
// import { btnDanger, btnWarning } from "../assets/style-collecton";

// function EditorPage({ roomData }) {
//   const { roomId, language, isHost } = roomData;

//   const leaveRoom = () => {
//     window.location.reload();
//   };

//   const endSession = () => {
//     alert("Session ended for everyone (later backend)");
//     window.location.reload();
//   };

//   return (
//     <div className="h-screen flex flex-col">

//       {/* Top Bar */}
//       <div className="flex justify-between items-center bg-gray-800 p-3 text-white">
//         <span>Room: {roomId}</span>

//         {isHost ? (
//           <button onClick={endSession} className={btnDanger}>
//             End Session
//           </button>
//         ) : (
//           <button onClick={leaveRoom} className={btnWarning}>
//             Leave
//           </button>
//         )}
//       </div>

//       {/* Editor */}
//       <div className="flex-1">
//         <MonacoEditor language={language} />
//       </div>
//     </div>
//   );
// }

import MonacoEditor from "../editor/MonacoEditor";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { btnDanger, btnWarning } from "../../assets/style-collecton";

function EditorPage() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  // ✅ Temporary fallback data
  const language = state?.language || "javascript";
  const isHost = state?.isHost || false;

  const leaveRoom = () => {
    navigate("/"); // better than reload
  };

  const endSession = () => {
    alert("Session ended (temporary)");
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col">

      {/* Top Bar */}
      <div className="flex justify-between items-center bg-gray-800 p-3 text-white">
        <span>Room: {roomId}</span>

        {isHost ? (
          <button onClick={endSession} className={btnDanger}>
            End Session
          </button>
        ) : (
          <button onClick={leaveRoom} className={btnWarning}>
            Leave
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <MonacoEditor language={language} />
      </div>
    </div>
  );
}

export default EditorPage;