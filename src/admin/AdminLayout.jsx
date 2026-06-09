import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  FaHome,
  FaPuzzlePiece,
  FaList,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";

const nav = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: <FaHome />,
    end: true,
  },
  {
    to: "/admin/puzzles",
    label: "Puzzles",
    icon: <FaPuzzlePiece />,
  },
  {
    to: "/admin/categories",
    label: "Categories",
    icon: <FaList />,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: <FaUsers />,
  },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <aside className="sm:w-60 bg-navy text-cream p-5 sm:min-h-screen shadow-md">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Admin Panel</h2>
          <p className="text-xs text-cream/70 break-all mt-1">
            {user?.email}
          </p>
        </div>

        <nav className="flex sm:flex-col gap-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded transition ${
                  isActive
                    ? "bg-brand-orange text-white"
                    : "hover:bg-navy-soft"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 mt-8 px-3 py-2 rounded border border-transparent hover:border-white/10 hover:bg-navy-soft transition duration-200"
          >
          <FaSignOutAlt />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6 bg-cream/30">
        <Outlet />
      </main>
    </div>
  );
}