import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPoll, submitVote } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function VotePage() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await getPoll(id);
        setPoll(res.data);
        updateChartData(res.data.results);
        setLoading(false);
      } catch (err) {
        setError("Poll not found");
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

 useEffect(() => {
  if (!poll) return;
  const ws = new WebSocket(`wss://live-polling-backend-3x70.onrender.com/api/polls/${id}/live`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPoll((prev) => ({ ...prev, results: data.results }));
      updateChartData(data.results);
    };
    return () => ws.close();
  }, [id, poll]);

  const updateChartData = (results) => {
    const data = Object.entries(results).map(([option, count]) => ({
      name: option,
      votes: count,
    }));
    setChartData(data);
  };

  const handleVote = async (optionIndex) => {
    try {
      await submitVote(id, optionIndex);
      setHasVoted(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to vote");
    }
  };

  if (loading)
    return (
      <div style={styles.center}>
        <p>Loading poll...</p>
      </div>
    );
  if (error)
    return (
      <div style={{ ...styles.center, color: "#e74c3c" }}>
        <p>{error}</p>
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{poll.title}</h1>

        {!hasVoted ? (
          <div style={{ marginBottom: 32 }}>
            <p style={{ color: "#666", marginBottom: 16, fontSize: 14 }}>
              Select an option to vote:
            </p>
            {poll.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleVote(index)}
                style={styles.optionButton}
              >
                <span style={{ fontSize: 20, marginRight: 12 }}>●</span>
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div style={styles.votedBanner}>
            <p>✓ Your vote has been recorded</p>
          </div>
        )}

        <h2 style={{ fontSize: 18, marginBottom: 16, color: "#333" }}>
          Live Results
        </h2>

        {chartData.length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
              {chartData.map((item, idx) => (
                <div key={idx} style={{ background: "#f8f9fa", padding: 16, borderRadius: 8, textAlign: "center", border: "1px solid #e0e0e0" }}>
                  <p style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>{item.name}</p>
                  <p style={{ fontSize: 24, fontWeight: "bold", color: "#667eea" }}>{item.votes}</p>
                  <p style={{ color: "#999", fontSize: 11 }}>vote{item.votes !== 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>

            {chartData.some((d) => d.votes > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
                No votes yet. Be the first!
              </p>
            )}

            <p style={{ textAlign: "center", color: "#999", fontSize: 12, marginTop: 16 }}>
              Results update in real-time
            </p>
          </>
        ) : (
          <p style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
            Loading results...
          </p>
        )}
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
    maxWidth: 700,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#333",
  },
  optionButton: {
    width: "100%",
    padding: "16px 20px",
    marginBottom: 12,
    border: "2px solid #e0e0e0",
    borderRadius: 8,
    background: "white",
    fontSize: 16,
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: 500,
    textAlign: "left",
    color: "#333",
  },
  votedBanner: {
    background: "#d4edda",
    border: "2px solid #c3e6cb",
    color: "#155724",
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    fontWeight: 600,
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    color: "#333",
  },
};

export default VotePage;