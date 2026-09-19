import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll } from "../services/api";
import { useAuth } from "../context/AuthContext";

function CreatePollPage() {
  const { token, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pollLink, setPollLink] = useState("");

  if (!token) {
    navigate("/");
    return null;
  }

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (index) =>
    setOptions(options.filter((_, i) => i !== index));
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Poll title is required");
      return;
    }
    const nonEmptyOptions = options.filter((opt) => opt.trim());
    if (nonEmptyOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setLoading(true);
    try {
      const res = await createPoll(title, nonEmptyOptions);
      const pollId = res.data.poll_id;
      const link = `${window.location.origin}/poll/${pollId}`;
      setPollLink(link);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  if (pollLink) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={{ fontSize: 28, marginBottom: 8 }}>Poll created!</h2>
            <p style={{ color: "#666" }}>Share this link with others to collect votes</p>
          </div>

          <div style={styles.linkBox}>
            <input
              type="text"
              readOnly
              value={pollLink}
              style={styles.linkInput}
            />
            <button
              onClick={() => navigator.clipboard.writeText(pollLink)}
              style={{ ...styles.button, marginBottom: 12 }}
            >
              📋 Copy link
            </button>
            <button
              onClick={() => window.open(pollLink, "_blank")}
              style={{ ...styles.button, marginBottom: 12, background: "#27ae60" }}
            >
              👁 Open poll
            </button>
          </div>

          <button
            onClick={() => {
              setPollLink("");
              setTitle("");
              setOptions(["", ""]);
            }}
            style={{ ...styles.button, marginBottom: 12 }}
          >
            ➕ Create another
          </button>

          <button
            onClick={() => {
              logoutUser();
              navigate("/");
            }}
            style={{ ...styles.button, background: "#95a5a6" }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={styles.title}>Create a poll</h1>
            <p style={{ color: "#666", fontSize: 14 }}>Ask a question and collect real-time votes</p>
          </div>
          <button
            onClick={() => {
              logoutUser();
              navigate("/");
            }}
            style={{ ...styles.button, background: "#95a5a6", width: "auto", padding: "8px 16px" }}
          >
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Poll question</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question?"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Options</label>
            {options.map((option, index) => (
              <div key={index} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  style={{ ...styles.input, flex: 1 }}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    style={{ ...styles.button, width: "auto", padding: "10px 16px", background: "#e74c3c" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              style={{ ...styles.button, width: "100%", background: "#95a5a6" }}
            >
              + Add option
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, fontSize: 16, padding: "14px 16px" }}
          >
            {loading ? "Creating..." : "🚀 Create poll"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 16,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
    padding: 40,
    width: "100%",
    maxWidth: 600,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#667eea",
    marginBottom: 8,
    marginLeft:-100,
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
    fontSize: 14,
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
  linkBox: {
    background: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    border: "1px solid #e0e0e0",
  },
  linkInput: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e0e0e0",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
    fontFamily: "monospace",
    color: "#333",
    background: "white",
  },
  successIcon: {
    width: 60,
    height: 60,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
};

export default CreatePollPage;