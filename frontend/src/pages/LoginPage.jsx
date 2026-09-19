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
        // After successful signup, log them in right away for convenience
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
    <div style={{ maxWidth: 360, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h2>{isSignup ? "Create an account" : "Log in"}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <button onClick={() => setIsSignup(!isSignup)} style={{ background: "none", border: "none", color: "blue", cursor: "pointer" }}>
          {isSignup ? "Log in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}

export default LoginPage;