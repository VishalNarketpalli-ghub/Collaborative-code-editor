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

    // Fetch rooms history
    useEffect(() => {
        if (user) {
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
            fetchRooms();
        }
    }, [user]);

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

                    {/* Join Room Button */}
                    <button
                        onClick={() => navigate("/join-room")}
                        className="px-8 py-3 rounded-full bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
                    >
                        Join Room
                    </button>
                </div>

                {/* Room History Section */}
                <div>
                    <h3 className="text-2xl font-semibold mb-6">Room History</h3>
                    
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

                                const handleRejoin = async () => {
                                    if (!room.isActive && isCreator) {
                                        try {
                                            await API.patch(`/room/${room.roomId}/reopen`);
                                        } catch (err) {
                                            alert(err.response?.data?.message || "Failed to reopen session");
                                            return;
                                        }
                                    }
                                    navigate(`/room/${room.roomId}`, {
                                        state: { isHost: isCreator, language: room.language },
                                    });
                                };

                                return (
                                    <div key={room._id} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-gray-600 transition-colors shadow-lg flex flex-col">
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
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-400 space-y-2 flex-grow">
                                            <div className="flex justify-between">
                                                <span>Room ID:</span>
                                                <span className="text-gray-200 font-mono bg-gray-800 px-1 rounded">{room.roomId}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Host:</span>
                                                <span className="text-gray-200">{room.createdBy?.username || "Unknown"}</span>
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
                                                onClick={handleRejoin}
                                                className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                                            >
                                                {room.isActive ? "Rejoin Room" : "Reopen Session"}
                                            </button>
                                        ) : room.isActive ? (
                                            <button
                                                onClick={handleRejoin}
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
