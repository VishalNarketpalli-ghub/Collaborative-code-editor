import { NavLink } from "react-router-dom";

function Header() {
  return (
    <div className="flex justify-between px-20 items-center bg-gray-600 text-white">
    <nav>
      <ul  className="flex gap-10">
        <li>
          <NavLink to="/">
            Home
          </NavLink>
        </li>

        <li>
          <NavLink to="/room">
            Room
          </NavLink>
        </li>

        <li>
          <NavLink to="/login">
            Login/SignUp
          </NavLink>
        </li>
      </ul>
    </nav>
    </div>
  );
}

export default Header;