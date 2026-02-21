import { NavLink } from "react-router-dom";

export default function SideBar() {
  return (
    <aside className="w-64 bg-white border-r p-4">
      <nav className="flex flex-col gap-3">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/users">Users</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
    </aside>
  );
}