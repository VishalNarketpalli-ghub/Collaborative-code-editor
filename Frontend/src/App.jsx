import { createBrowserRouter, RouterProvider } from "react-router-dom";
import  RootLayout  from "./components/RootLayout";
import Home from "./components/Home";
import Room from "./components/Room"
import Login from "./components/Login"

function App() {

  const routerObj = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        {
          index: true,
          element: <Home />
        },
        {
          path: "room",
          element: <Room />
        },
        {
          path: "login",
          element: <Login />
        }
      ]
    }
  ]);

  return <RouterProvider router={routerObj} />;
}

export default App;