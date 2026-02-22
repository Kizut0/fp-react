import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loading from "./Loading";

export default function RoleGate({
  children,
  allow,
  allowedRoles = [],
  redirectTo = "/unauthorized",
}) {
  const { user, isLoading } = useAuth();
  const roles = allow ?? allowedRoles;

  if (isLoading) {
    return <Loading />;
  }


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children ?? <Outlet />;
}
