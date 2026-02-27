import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { STAKEHOLDER_LIST } from "../../constants/stakeholders";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "freelancer", // default
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validation = useMemo(() => {
    const passwordChecks = {
      minLength: form.password.length >= 8,
      hasUpper: /[A-Z]/.test(form.password),
      hasLower: /[a-z]/.test(form.password),
      hasNumber: /\d/.test(form.password),
    };

    const passwordStrong = Object.values(passwordChecks).every(Boolean);
    const passwordsMatch =
      form.password.length > 0 && form.password === form.confirmPassword;
    const emailValid = /\S+@\S+\.\S+/.test(form.email);
    const nameValid = form.name.trim().length >= 2;

    return {
      passwordChecks,
      passwordStrong,
      passwordsMatch,
      emailValid,
      nameValid,
      canSubmit:
        nameValid &&
        emailValid &&
        passwordStrong &&
        passwordsMatch &&
        !loading,
    };
  }, [form, loading]);

  const selectedRoleDescription = useMemo(() => {
    const selected = STAKEHOLDER_LIST.find((item) => item.key === form.role);
    return selected?.description || STAKEHOLDER_LIST[0].description;
  }, [form.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validation.canSubmit) {
      setError("Please complete all fields with valid information.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: String(form.role || "").toLowerCase() === "client" ? "Client" : "Freelancer",
      });

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Create Your Account
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Join as a freelancer to find work, or as a client to hire talent.
        </p>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Your full name"
            />
            {form.name && !validation.nameValid && (
              <p className="text-red-600 text-sm mt-1">
                Name should be at least 2 characters.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="you@example.com"
            />
            {form.email && !validation.emailValid && (
              <p className="text-red-600 text-sm mt-1">
                Enter a valid email address.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1">Password</label>
            <div className="flex gap-3">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                className="btn"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-sm mt-1 text-gray-500">
              Use 8+ chars with uppercase, lowercase, and number.
            </p>
            {form.password && !validation.passwordStrong && (
              <p className="text-red-600 text-sm mt-1">
                Password is too weak.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block mb-1">Confirm Password</label>
            <div className="flex gap-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                className="btn"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {form.confirmPassword && !validation.passwordsMatch && (
              <p className="text-red-600 text-sm mt-1">
                Passwords do not match.
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block mb-1">Role</label>
            <div className="grid3 roleOptionGrid">
              {STAKEHOLDER_LIST.map((roleItem) => {
                const active = form.role === roleItem.key;
                return (
                  <button
                    key={roleItem.key}
                    type="button"
                    className={`roleOption ${active ? "roleOptionActive" : ""}`}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        role: roleItem.key,
                      }))
                    }
                  >
                    <span className="roleOptionIcon" aria-hidden="true">
                      {roleItem.icon}
                    </span>
                    <span className="roleOptionLabel">{roleItem.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm mt-1 text-gray-500">
              {selectedRoleDescription}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white ${loading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-sm mt-4 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
