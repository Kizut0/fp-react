import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();
  const dashboardPath = user
    ? `/${String(user.role || "").toLowerCase()}/dashboard`
    : "/";

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between">
      <Link to={dashboardPath} className="font-bold text-lg text-white">
        Freelance Hub
      </Link>

      <div className="flex items-center gap-4">
        {user && <span>{user.name || "Account"}</span>}
        {user && (
          <button
            onClick={logout}
            className="bg-white text-blue-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
