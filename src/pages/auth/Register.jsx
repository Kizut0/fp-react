import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ErrorBox from "../../components/ErrorBox";
import FormField from "../../components/FormField";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState("Client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({ name, email, password, role });
      // send to role dashboard
      nav(role === "Client" ? "/client/dashboard" : "/freelancer/dashboard");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="h1">Register</div>
      <ErrorBox error={error} />
      <form className="row" onSubmit={onSubmit}>
        <FormField label="Full name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>

        <FormField label="Role">
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Client">Client</option>
            <option value="Freelancer">Freelancer</option>
          </select>
        </FormField>

        <FormField label="Email">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </FormField>

        <FormField label="Password">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>

        <button className="btn" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>

        <div className="muted">
          Already have an account? <Link to="/login" style={{ textDecoration: "underline" }}>Login</Link>
        </div>
      </form>
    </div>
  );
}