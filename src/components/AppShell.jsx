import NavBar from "./NavBar";
import SideBar from "./SideBar";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex flex-1">
        <SideBar />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}