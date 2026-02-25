import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function NavBar() {
  const { user, logout } = useAuth();
  const dashboardPath = user
    ? `/${String(user.role || "").toLowerCase()}/dashboard`
    : "/";

  return (
    <nav className="appNav">
      <Link
        to={dashboardPath}
        className="appNavBrand"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        Freelance Hub
      </Link>

      <div className="appNavActions" style={{ zIndex: 1 }}>
        {user && <span className="appNavUser">{user.name || "Account"}</span>}
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
