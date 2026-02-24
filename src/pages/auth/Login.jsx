import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
 
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
 
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setFieldErrors({ email: "", password: "" });

      const data = await login(form);
      const role = String(data?.user?.role || "").toLowerCase();
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "client") navigate("/client/dashboard");
      else navigate("/freelancer/dashboard");
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
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Login
        </h1>
 
        {warningMessage && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center gap-2">
            <span aria-hidden="true">⚠</span>
            <span>{warningMessage}</span>
          </div>
        )}
 
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded ${fieldErrors.email ? "border-red-500" : ""}`}
            />
            {fieldErrors.email && (
              <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded ${fieldErrors.password ? "border-red-500" : ""}`}
            />
            {fieldErrors.password && (
              <p className="text-red-600 text-sm mt-1">⚠ {fieldErrors.password}</p>
            )}
          </div>
 
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white ${loading
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
 
        <p className="text-sm mt-4 text-center">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
 
 
