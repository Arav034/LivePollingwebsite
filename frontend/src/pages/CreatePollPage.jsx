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
      <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
        <h2>Poll created!</h2>
        <p>Share this link with others:</p>
        <input
          type="text"
          readOnly
          value={pollLink}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />
        <button
          onClick={() => navigator.clipboard.writeText(pollLink)}
          style={{ marginRight: 8, padding: 10, cursor: "pointer" }}
        >
          Copy link
        </button>
        <button
          onClick={() => window.open(pollLink, "_blank")}
          style={{ marginRight: 8, padding: 10, cursor: "pointer" }}
        >
          Open poll
        </button>
        <button
          onClick={() => {
            setPollLink("");
            setTitle("");
            setOptions(["", ""]);
          }}
          style={{ padding: 10, cursor: "pointer" }}
        >
          Create another
        </button>
        <button
          onClick={() => {
            logoutUser();
            navigate("/");
          }}
          style={{ float: "right", padding: 10, cursor: "pointer" }}
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Create a poll</h2>
        <button
          onClick={() => {
            logoutUser();
            navigate("/");
          }}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Log out
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Poll question</label>
          <br />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Best programming language?"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Options</label>
          {options.map((option, index) => (
            <div key={index} style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                style={{ flex: 1, padding: 8 }}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  style={{ padding: "8px 12px", cursor: "pointer" }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            style={{ marginTop: 8, padding: "8px 16px", cursor: "pointer" }}
          >
            + Add option
          </button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 12, cursor: "pointer", fontSize: 16 }}
        >
          {loading ? "Creating..." : "Create poll"}
        </button>
      </form>
    </div>
  );
}

export default CreatePollPage;