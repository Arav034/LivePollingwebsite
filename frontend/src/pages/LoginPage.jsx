import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../services/api";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await signup(email, password);
        const res = await login(email, password);
        loginUser(res.data.token);
      } else {
        const res = await login(email, password);
        loginUser(res.data.token);
      }
      navigate("/create");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Polling</h1>
          <p style={styles.subtitle}>Real-time polls made simple</p>
        </div>

        <h2 style={{ fontSize: 24, marginBottom: 24, color: "#333" }}>
          {isSignup ? "Create account" : "Welcome back"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••"
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Loading..." : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <p style={styles.toggle}>
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            style={styles.toggleBtn}
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: 16,
  },
  card: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
    padding: 40,
    width: "100%",
    maxWidth: 400,
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#667eea",
    marginBottom: 8,
  },
  subtitle: {
    color: "#666",
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: "#333",
  },
  input: {
  width: "100%",
  padding: "12px 16px",
  border: "2px solid #e0e0e0",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  color: "#333",
  background: "white",
},
  button: {
    width: "100%",
    padding: "12px 16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  error: {
    color: "#e74c3c",
    fontSize: 14,
    marginBottom: 16,
    fontWeight: 500,
  },
  toggle: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 14,
    color: "#666",
  },
  toggleBtn: {
    background: "none",
    border: "none",
    color: "#667eea",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    textDecoration: "underline",
  },
};

export default LoginPage;