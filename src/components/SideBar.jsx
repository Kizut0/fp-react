import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SideBar() {
  const { user } = useAuth();

  const linksByRole = {
    Client: [
      { to: "/client/dashboard", label: "Dashboard" },
      { to: "/client/jobs", label: "My Jobs" },
      { to: "/client/proposals", label: "Proposals" },
      { to: "/client/contracts", label: "Contracts" },
      { to: "/client/payments", label: "Payments" },
      { to: "/client/reviews", label: "Reviews" },
    ],
    Freelancer: [
      { to: "/freelancer/dashboard", label: "Dashboard" },
      { to: "/freelancer/browse", label: "Browse Jobs" },
      { to: "/freelancer/proposals", label: "My Proposals" },
      { to: "/freelancer/contracts", label: "Contracts" },
      { to: "/freelancer/payments", label: "Payments" },
      { to: "/freelancer/reviews", label: "Reviews" },
    ],
    Admin: [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/users", label: "Users" },
      { to: "/admin/jobs", label: "Jobs" },
      { to: "/admin/proposals", label: "Proposals" },
      { to: "/admin/contracts", label: "Contracts" },
      { to: "/admin/reviews", label: "Reviews" },
      { to: "/admin/payments", label: "Payments" },
    ],
  };

  const publicLinks = [
    { to: "/", label: "Home" },
    { to: "/jobs", label: "Browse Jobs" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
  ];

  const links = user ? linksByRole[user.role] || publicLinks : publicLinks;

  return (
    <aside className="w-64 bg-white border-r p-4">
      <nav className="flex flex-col gap-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "navLink navLinkActive" : "navLink"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
