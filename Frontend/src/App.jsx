import { createBrowserRouter, RouterProvider } from "react-router-dom";

import RootLayout from "./components/layout/RootLayout";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import CreateRoom from "./components/room/CreateRoom";
import JoinRoom from "./components//room/JoinRoom";
import EditorPage from "./components/pages/EditorPage";
import Register from "./components/pages/Register";
import Room from "./components/pages/Room";
import Dashboard from "./components/pages/Profile";
import Profile from "./components/pages/Profile";

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
                    path: "room",
                    element: <Room />,
                },

                {
                    path: "create-room",
                    element: <CreateRoom />,
                },

                {
                    path: "join-room",
                    element: <JoinRoom />,
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
                    path: "dashboard",
                    element: <Dashboard />,
                },
                {
                    path: "profile",
                    element: <Profile />,
                },
            ],
        },
        {
            path: "/room/:roomId",
            element: <EditorPage />,
        },
    ]);

    return <RouterProvider router={routerObj} />;
}

export default App;
