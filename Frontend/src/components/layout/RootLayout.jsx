import Header from "./Header";
import Footer from "./Footer";
import { Outlet, useLocation } from "react-router-dom";

function RootLayout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <Header />
      <main key={location.pathname} className="flex-grow page-fade-in flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default RootLayout ;