import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import RootLayout from "./components/layout/RootLayout";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import Room from "./components/pages/Room";
import CreateRoom from "./components/room/CreateRoom";
import JoinRoom from "./components/room/JoinRoom";
import EditorPage from "./components/pages/EditorPage";
import Profile from "./components/pages/Profile";


function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }
    return user ? children : <Navigate to="/login" replace/>
}
function App() {
    const routerObj = createBrowserRouter([
        {
            path: "/",
            element: <RootLayout />,
            children: [
                {
                    index: true,
                    element: <Home />,
                },

                {
                    path: "login",
                    element: <Login />,
                },

                {
                    path: "register",
                    element: <Register />,
                },

                {
                    path: "room",
                    element: <PrivateRoute><Room /></PrivateRoute>,
                },

                {
                    path: "create-room",
                    element: <PrivateRoute><CreateRoom /></PrivateRoute>,
                },

                {
                    path: "join-room",
                    element: <PrivateRoute><JoinRoom /></PrivateRoute>,
                },
                {
                    path: "profile",
                    element: <PrivateRoute><Profile /></PrivateRoute>,
                },
            ],
        },
        {
            path: "/room/:roomId",
            element: <PrivateRoute><EditorPage/></PrivateRoute>
        },
    ]);

    return <RouterProvider router={routerObj} />;
}

export default App;
