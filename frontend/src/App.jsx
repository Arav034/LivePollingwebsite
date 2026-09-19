import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import CreatePollPage from "./pages/CreatePollPage";
import VotePage from "./pages/VotePage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/create" element={<CreatePollPage />} />
          <Route path="/poll/:id" element={<VotePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;