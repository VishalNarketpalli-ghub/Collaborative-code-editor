import { NavLink } from "react-router-dom";

function Header() {
  return (
    <div className="px-6 pt-6 bg-gray-950">
      <header className="flex items-center justify-between px-6 py-4 border border-gray-800 bg-gray-900 rounded-full text-white shadow-md">

        {/* Logo */}
        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          CodeCollab
        </h1>

        {/* Navigation */}
        <nav>
          <ul className="flex gap-4">

            {/* Home */}
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`
                }
              >
                Home
              </NavLink>
            </li>

            {/* Room */}
            <li>
              <NavLink
                to="/room"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`
                }
              >
                Room
              </NavLink>
            </li>

            {/* Login / Signup */}
            <li>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`
                }
              >
                Login / Signup
              </NavLink>
            </li>

          </ul>
        </nav>

      </header>
    </div>
  );
}

export default Header;