import { Outlet } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NavBar from "./NavBar";
import SideBar from "./SideBar";

export default function AppShell({ children }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isPrivateRoute =
    pathname.startsWith("/client") ||
    pathname.startsWith("/freelancer") ||
    pathname.startsWith("/admin");
  const showSidebar = Boolean(user && isPrivateRoute);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex flex-1">
        {showSidebar && <SideBar />}
        <main className="flex-1 p-6 bg-gray-50">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
