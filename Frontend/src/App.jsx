import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./components/layout/RootLayout";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Room from "./components/pages/Room";

function App() {
    const routerObj = createBrowserRouter([
        {
            path: "/",
            element: <RootLayout />,
            children: [
                {
                    path: "",
                    element: <Home />,
                },
                {
                    path: "room",
                    element: <Room />,
                },
                {
                    path: "login",
                    element: <Login />,
                },
            ],
        },
    ]);

    return <RouterProvider router={routerObj} />;
}

export default App;
