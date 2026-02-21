import React, { useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import ErrorBox from "../../components/ErrorBox";

import FormField from "../../components/FormField";

export default function Login() {

  const { login } = useAuth();

  const nav = useNavigate();

  const loc = useLocation();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);

  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {

    e.preventDefault();

    setError(null);

    setBusy(true);

    try {

      await login({ email, password });

      nav(loc.state?.from || "/");

    } catch (err) {

      setError(err);

    } finally {

      setBusy(false);

    }

  };

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="h1">Login</div>
      <ErrorBox error={error} />
      <form className="row" onSubmit={onSubmit}>
        <FormField label="Email">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </FormField>
        <FormField label="Password">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Login"}</button>
        <div className="muted">

          No account? <Link to="/register" style={{ textDecoration: "underline" }}>Register</Link>
        </div>
      </form>
    </div>

  );

}
