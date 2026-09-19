import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPoll, submitVote } from "../services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function VotePage() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState([]);

  // Fetch poll data on mount
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

  // Open WebSocket to listen for live updates
  useEffect(() => {
    if (!poll) return;

    const ws = new WebSocket(`ws://localhost:8080/api/polls/${id}/live`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPoll((prev) => ({ ...prev, results: data.results }));
      updateChartData(data.results);
    };

    ws.onerror = () => {
      console.error("WebSocket error");
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

  if (loading) return <div style={{ textAlign: "center", marginTop: 40 }}>Loading poll...</div>;
  if (error) return <div style={{ textAlign: "center", marginTop: 40, color: "red" }}>{error}</div>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>{poll.title}</h2>

      {!hasVoted ? (
        <div style={{ marginBottom: 32 }}>
          <p>Select an option to vote:</p>
          {poll.options.map((option, index) => (
            <div key={index} style={{ marginBottom: 8 }}>
              <button
                onClick={() => handleVote(index)}
                style={{
                  width: "100%",
                  padding: 12,
                  textAlign: "left",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {option}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "green", fontWeight: "bold" }}>✓ Your vote has been recorded</p>
      )}

      <h3>Live Results</h3>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="votes" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>No votes yet</p>
      )}
    </div>
  );
}

export default VotePage;