import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function normalizeRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (role === "freelance") return "freelancer";
  return role;
}

function roleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "client") return "Client";
  return "Freelancer";
}

function roleRoute(role) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "client") return "/client/dashboard";
  return "/freelancer/dashboard";
}

const ROLE_OPTIONS = [
  { key: "freelancer", title: "Freelancer", buttonClass: "btnOk" },
  { key: "client", title: "Client", buttonClass: "btnInfo" },
  { key: "admin", title: "Admin", buttonClass: "" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });
  const warningMessage = error || fieldErrors.email || fieldErrors.password;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (expectedRole) => {
    try {
      setActiveRole(expectedRole);
      setLoading(true);
      setError("");
      setFieldErrors({ email: "", password: "" });

      const data = await login(form);
      const accountRole = normalizeRole(data?.user?.role);

      if (accountRole !== expectedRole) {
        logout();
        setError(`This account is ${roleLabel(accountRole)}. Please use the correct role login button.`);
        return;
      }

      navigate(roleRoute(accountRole));
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const apiField = String(err.response?.data?.field || "").trim();
      const fallback = apiMessage || err.message || "Login failed";

      if (apiField === "email") {
        setFieldErrors((prev) => ({ ...prev, email: fallback }));
      } else if (apiField === "password") {
        setFieldErrors((prev) => ({ ...prev, password: fallback }));
      } else if (apiField === "email_password") {
        setFieldErrors({ email: "Email is required", password: "Password is required" });
      } else {
        setError(fallback);
      }
    } finally {
      setLoading(false);
      setActiveRole("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card" style={{ width: "100%", maxWidth: 760, padding: 24 }}>
        <h1 className="h1" style={{ textAlign: "center", marginBottom: 6 }}>
          Login
        </h1>

        {warningMessage && (
          <div className="card" style={{ background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca", marginBottom: 10 }}>
            <span>{warningMessage}</span>
          </div>
        )}

        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit("freelancer");
          }}
        >
          <div>
            <div className="grid3" style={{ marginTop: 4 }}>
              {ROLE_OPTIONS.map((role) => {
                const isSelected = activeRole === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    className={`btn ${role.buttonClass} w-full`.trim()}
                    style={isSelected ? { outline: "3px solid rgba(37, 99, 235, 0.2)" } : undefined}
                    disabled={loading}
                    onClick={() => setActiveRole(role.key)}
                  >
                    {role.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="input"
              style={fieldErrors.email ? { borderColor: "#ef4444" } : undefined}
            />
            {fieldErrors.email && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="input"
              style={fieldErrors.password ? { borderColor: "#ef4444" } : undefined}
            />
            {fieldErrors.password && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 6 }}>{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="button"
            className={`btn btnOk w-full`}
            disabled={loading || !activeRole}
            onClick={() => handleSubmit(activeRole || "freelancer")}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="muted" style={{ marginTop: 14, textAlign: "center" }}>
          Don’t have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
