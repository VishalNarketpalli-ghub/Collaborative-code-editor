import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/axios";

function Profile() {
    const navigate = useNavigate();

    // Get user and logout function from global auth context
    const { user, logout, loading } = useAuth();

    // State for animation visibility
    const [visible, setVisible] = useState(false);
    
    // State for room history
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [deletingRoom, setDeletingRoom] = useState(null); // tracks which room is being deleted
    const [clearingAll, setClearingAll] = useState(false);

    // Fetch rooms history
    useEffect(() => {
        if (user) {
            fetchRooms();
        }
    }, [user]);

    const fetchRooms = async () => {
        setLoadingRooms(true);
        try {
            const { data } = await API.get("/room/history");
            if (Array.isArray(data)) {
                setRooms(data);
            } else {
                console.error("Expected array but got:", data);
                setRooms([]);
            }
        } catch (error) {
            console.error("Failed to fetch rooms:", error);
        } finally {
            setLoadingRooms(false);
        }
    };

    // Trigger animation on mount
    useEffect(() => {
        setVisible(true);
    }, []);

    // Redirect to login if user is not authenticated
    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
        }
    }, [user, loading, navigate]);

    // Handle logout using global context
    const handleLogout = async () => {
        await logout(); // clears token and user from context
        navigate("/login"); // redirect to login page
    };

    // Get first letter for avatar fallback
    const avatarLetter = user?.username?.charAt(0)?.toUpperCase() || "?";

    // ── Delete single room ────────────────────────────────────────────────────
    const handleDeleteRoom = async (room) => {
        const isCreator = room.createdBy?._id === user?._id;
        const confirmMsg = isCreator
            ? `Delete room "${room.title || 'Untitled Room'}"? This will permanently delete the room and all its data for all participants.`
            : `Remove "${room.title || 'Untitled Room'}" from your history?`;

        if (!window.confirm(confirmMsg)) return;

        setDeletingRoom(room.roomId);
        try {
            await API.delete(`/room/${room.roomId}`);
            setRooms((prev) => prev.filter((r) => r.roomId !== room.roomId));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete room");
        } finally {
            setDeletingRoom(null);
        }
    };

    // ── Clear all history ────────────────────────────────────────────────────
    const handleClearAll = async () => {
        if (!window.confirm("Clear all room history? Rooms you hosted will be permanently deleted for all participants. This cannot be undone.")) return;

        setClearingAll(true);
        try {
            await API.delete("/room/all");
            setRooms([]);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to clear history");
        } finally {
            setClearingAll(false);
        }
    };

    const handleRejoin = async (room) => {
        const isCreator = room.createdBy?._id === user?._id;

        if (!room.isActive && isCreator) {
            try {
                await API.patch(`/room/${room.roomId}/reopen`);

                // Update local state immediately so the card reflects the reopened status
                // if the host returns to Profile without a full page reload.
                setRooms((prev) =>
                    prev.map((r) =>
                        r.roomId === room.roomId ? { ...r, isActive: true } : r
                    )
                );
            } catch (err) {
                alert(err.response?.data?.message || "Failed to reopen session");
                return;
            }
        }

        navigate(`/room/${room.roomId}`, {
            state: { isHost: isCreator, language: room.language },
        });
    };

    // Show loading state while fetching user
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Top Bar */}
            <div className="flex justify-between items-center px-6 md:px-16 py-6 border-b border-gray-800">
                <h1 className="text-3xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Profile
                </h1>

                {/* Logout button */}
                <button
                    onClick={handleLogout}
                    className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 transition"
                >
                    Logout
                </button>
            </div>

            {/* Main Content */}
            <div
                className={`px-6 md:px-16 py-20 transition-all duration-700 ${
                    visible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                }`}
            >
                {/* Welcome Section */}
                <div className="mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Welcome back, {user?.username || "User"}
                    </h2>
                </div>

                {/* Profile Info Section */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                    {/* Avatar */}
                    <div className="shrink-0">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="avatar"
                                className="w-24 h-24 rounded-full border border-gray-700 object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-purple-600 text-3xl font-bold">
                                {avatarLetter}
                            </div>
                        )}
                    </div>

                    {/* User Details */}
                    <div className="space-y-6 text-center md:text-left">
                        {/* Username */}
                        <div>
                            <p className="text-gray-500 text-sm">Username</p>
                            <p className="text-xl">
                                {user?.username || "Not set"}
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <p className="text-gray-500 text-sm">Email</p>
                            <p className="text-xl">
                                {user?.email || "Not set"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 my-16"></div>

                {/* Actions Section */}
                <div className="flex flex-wrap gap-4 mb-16">
                    {/* Create Room Button */}
                    <button
                        onClick={() => navigate("/create-room")}
                        className="px-8 py-3 rounded-full bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform cursor-pointer"
                    >
                        Create Room
                    </button>

                    {/* Join Room Button — same gradient style as Create Room */}
                    <button
                        onClick={() => navigate("/join-room")}
                        className="px-8 py-3 rounded-full bg-linear-to-r from-blue-500 to-purple-600 hover:scale-105 transition transform cursor-pointer"
                    >
                        Join Room
                    </button>
                </div>

                {/* Room History Section */}
                <div>
                    {/* Section header with "Clear All" button */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-semibold">Room History</h3>
                        {rooms.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                disabled={clearingAll}
                                className="px-4 py-2 rounded-lg bg-red-900/60 hover:bg-red-800/80 border border-red-700/50 text-red-300 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {clearingAll ? "Clearing..." : "🗑️ Clear All History"}
                            </button>
                        )}
                    </div>
                    
                    {loadingRooms ? (
                        <div className="text-gray-400">Loading your history...</div>
                    ) : rooms.length === 0 ? (
                        <div className="text-gray-500 bg-gray-900/50 p-6 rounded-xl border border-gray-800 text-center">
                            You haven't joined or created any rooms yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {rooms.map((room) => {
                                const isCreator = room.createdBy?._id === user?._id;
                                const isBeingDeleted = deletingRoom === room.roomId;

                                return (
                                    <div
                                        key={room._id}
                                        className={`bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-gray-600 transition-colors shadow-lg flex flex-col ${isBeingDeleted ? "opacity-50" : ""}`}
                                    >
                                        {/* Card header: title + badges + delete button */}
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate pr-2">
                                                {room.title || "Untitled Room"}
                                            </h4>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 capitalize">
                                                    {room.language}
                                                </span>
                                                {!room.isActive && (
                                                    <span className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded">Ended</span>
                                                )}
                                                {/* Delete button */}
                                                <button
                                                    onClick={() => handleDeleteRoom(room)}
                                                    disabled={isBeingDeleted}
                                                    title={isCreator ? "Delete room" : "Remove from history"}
                                                    className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors cursor-pointer disabled:opacity-40"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                        <path d="M10 11v6M14 11v6" />
                                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-400 space-y-2 flex-grow">
                                            <div className="flex justify-between">
                                                <span>Room ID:</span>
                                                <span className="text-gray-200 font-mono bg-gray-800 px-1 rounded">{room.roomId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Host:</span>
                                                <span className="text-gray-200">
                                                    {room.createdBy?.username || "Unknown"}
                                                    {isCreator && <span className="text-yellow-500 text-xs ml-1">(You)</span>}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Participants:</span>
                                                <span className="text-gray-200">{room.participants?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Date:</span>
                                                <span className="text-gray-200">{new Date(room.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {isCreator ? (
                                            <button
                                                onClick={() => handleRejoin(room)}
                                                className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                                            >
                                                {room.isActive ? "Rejoin Room" : "Reopen Session"}
                                            </button>
                                        ) : room.isActive ? (
                                            <button
                                                onClick={() => handleRejoin(room)}
                                                className="mt-6 w-full py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                                            >
                                                Rejoin Room
                                            </button>
                                        ) : (
                                            <div className="mt-6 w-full py-2 bg-gray-800 rounded-lg text-sm font-semibold text-center text-gray-500 cursor-not-allowed">
                                                Session Ended
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
