import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Get user from global auth context
    const { user } = useAuth();

    // Styling for nav items
    const navItemStyle = ({ isActive }) =>
        `px-4 py-2 rounded-full transition-all duration-200 ${
            isActive
                ? "bg-linear-to-r from-blue-500 to-purple-600 text-white shadow-md"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
        }`;

    return (
        <div className="px-4 md:px-6 pt-4 bg-gray-950">
            <header className="flex items-center justify-between px-4 md:px-6 py-4 border border-gray-800 bg-gray-900 rounded-full text-white shadow-md">
                {/* Logo */}
                <h1
                    onClick={() => navigate("/")}
                    className="text-xl md:text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent cursor-pointer"
                >
                    CodeCollab
                </h1>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex">
                    <ul className="flex gap-4">
                        <li>
                            <NavLink to="/" className={navItemStyle}>
                                Home
                            </NavLink>
                        </li>

                        <li>
                            <NavLink to="/room" className={navItemStyle}>
                                Room
                            </NavLink>
                        </li>

                        <li>
                            {/* Show Profile if logged in, else Login */}
                            {user ? (
                                <NavLink to="/profile" className={navItemStyle}>
                                    Profile
                                </NavLink>
                            ) : (
                                <NavLink to="/login" className={navItemStyle}>
                                    Sign In
                                </NavLink>
                            )}
                        </li>
                    </ul>
                </nav>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    {menuOpen ? (
                        <FiX size={24} onClick={() => setMenuOpen(false)} />
                    ) : (
                        <FiMenu size={24} onClick={() => setMenuOpen(true)} />
                    )}
                </div>
            </header>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-5 md:hidden">
                    <ul className="flex flex-col divide-y divide-gray-800">
                        <li className="py-3 flex justify-center">
                            <NavLink
                                to="/"
                                className={navItemStyle}
                                onClick={() => setMenuOpen(false)}
                            >
                                Home
                            </NavLink>
                        </li>

                        <li className="py-3 flex justify-center">
                            <NavLink
                                to="/room"
                                className={navItemStyle}
                                onClick={() => setMenuOpen(false)}
                            >
                                Room
                            </NavLink>
                        </li>

                        <li className="py-3 flex justify-center">
                            {/* Same logic for mobile */}
                            {user ? (
                                <NavLink
                                    to="/profile"
                                    className={navItemStyle}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Profile
                                </NavLink>
                            ) : (
                                <NavLink
                                    to="/login"
                                    className={navItemStyle}
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Sign In
                                </NavLink>
                            )}
                        </li>
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Header;
