import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();
  const dashboardPath = user
    ? `/${String(user.role || "").toLowerCase()}/dashboard`
    : "/";
  const userName = String(user?.name || "Account").trim();
  const initial = userName ? userName[0].toUpperCase() : "A";

  return (
    <nav className="appNav">
      <Link to={dashboardPath} className="appNavBrand">
        Freelance Hub
      </Link>

      <div className="appNavActions">
        {user && (
          <span className="appNavUser">
            <span className="appNavInitial" aria-hidden="true">{initial}</span>
            <span>{userName}</span>
          </span>
        )}
        {user && (
          <button
            onClick={logout}
            className="btn btnGhost"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
