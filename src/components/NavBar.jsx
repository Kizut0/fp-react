import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between">
      <Link to="/" className="font-bold text-lg">
        MyApp
      </Link>

      <div className="flex items-center gap-4">
        {user && <span>{user.name}</span>}
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