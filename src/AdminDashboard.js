import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [votes, setVotes] = useState([]);
  const [newExhibit, setNewExhibit] = useState("");
  const [newMembers, setNewMembers] = useState("");

  const ADMIN_ACCOUNTS = [
    { username: "arush", password: "arush123" },
    { username: "atul", password: "atul123" },
    { username: "aahil", password: "aahil123" },
    { username: "omesh", password: "omesh123" },
  ];

  const COLORS = ["#00e0ff", "#00ffaa", "#ff6b6b", "#c77dff", "#f1c40f"];

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
      fetchVotes();
    }
  }, []);

  const fetchVotes = async () => {
    const querySnapshot = await getDocs(collection(db, "exhibits"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setVotes(data);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const foundAdmin = ADMIN_ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    );
    setUsername("")
    setPassword("")
    if (foundAdmin) {
      setIsLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
      fetchVotes();
    } else {
      setError("Access denied: Invalid admin credentials.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("adminLoggedIn");
  };

  const handleAddExhibit = async (e) => {
    e.preventDefault();
    if (!newExhibit || !newMembers) return;

    await addDoc(collection(db, "exhibits"), {
      name: newExhibit,
      members: newMembers,
      votes: 0,
    });
    setNewExhibit("");
    setNewMembers("");
    fetchVotes();
  };

  const backgroundStyle = {
    minHeight: '100vh',
    background:
      "radial-gradient(circle at top left, #001933, #00294d, #000a1a)",
    backgroundImage:
      "url('https://www.transparenttextures.com/patterns/cubes.png')",
    color: "white",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  // --- LOGIN PAGE ---
  if (!isLoggedIn) {
    return (
      <div
        style={{
          ...backgroundStyle,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <form
          onSubmit={handleLogin}
          style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: "30px",
            borderRadius: "20px",
            width: "90%",
            maxWidth: "350px",
            textAlign: "center",
            boxShadow: "0 0 40px rgba(0, 255, 255, 0.3)",
            border: "1px solid rgba(0,255,255,0.2)",
          }}
        >
          <h2 style={{ marginBottom: "20px", color: "#00e0ff" }}>🧪 Admin Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#102a43",
              color: "white",
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#102a43",
              color: "white",
              outline: "none",
            }}
          />
          {error && <p style={{ color: "#ff4d4d" }}>{error}</p>}
          <button
            type="submit"
            style={{
              background: "linear-gradient(90deg, #00e0ff, #00ffaa)",
              color: "black",
              fontWeight: "bold",
              padding: "10px 20px",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              marginTop: "10px",
              width: "100%",
            }}
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div style={{ ...backgroundStyle, padding: "20px", textAlign: "center" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ color: "rgba(0, 15, 25, 0.9)", fontSize: "26px" }}>⚗️ Admin Dashboard</h2>
        <button
          onClick={handleLogout}
          style={{
            background: "linear-gradient(90deg, #ff6666, #ff4d4d)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
            marginTop: "10px",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>

      {/* Add Exhibit */}
      <form
        onSubmit={handleAddExhibit}
        style={{
          backgroundColor: "rgba(0, 15, 25, 0.9)",
          padding: "20px",
          borderRadius: "15px",
          marginBottom: "30px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
          border: "1px solid rgba(0,255,255,0.2)",
          boxShadow: "0 0 20px rgba(0,255,255,0.1)",
        }}
      >
        <h3 style={{ width: "100%", color: "#00ffaa", marginBottom: "10px" }}>
          ➕ Add New Exhibit
        </h3>
        <input
          type="text"
          placeholder="Exhibit Title"
          value={newExhibit}
          onChange={(e) => setNewExhibit(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "rgba(0, 255, 255, 0.2)",
            color: "white",
            flex: "1 1 150px",
            minWidth: "150px",
          }}
        />
        <input
          type="text"
          placeholder="Team Members"
          value={newMembers}
          onChange={(e) => setNewMembers(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "rgba(0, 255, 255, 0.2)",
            color: "white",
            flex: "1 1 150px",
            minWidth: "150px",
          }}
        />
        <button
          type="submit"
          style={{
            background: "linear-gradient(90deg, #00e0ff, #00ffaa)",
            color: "black",
            fontWeight: "bold",
            padding: "10px 20px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Add Exhibit
        </button>
      </form>

      {/* Table + Chart Row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        {/* Table */}
        <div
          style={{
            flex: "1 1 300px",
            minWidth: "300px",
            overflowX: "auto",
            backgroundColor: "rgba(0, 15, 25, 0.9)",
            borderRadius: "15px",
            padding: "10px",
            border: "1px solid rgba(0,255,255,0.2)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              color: "white",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "rgba(0, 255, 255, 0.2)" }}>
                <th style={{ padding: "10px" }}>🧫 Exhibit</th>
                <th style={{ padding: "10px" }}>👩‍🔬 Team</th>
                <th style={{ padding: "10px" }}>⚗️ Votes</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((v) => (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <td style={{ padding: "10px" }}>{v.name}</td>
                  <td style={{ padding: "10px", color: "#a8dadc" }}>{v.members}</td>
                  <td style={{ padding: "10px", color: "#00ffaa" }}>
                    {v.votes || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chart */}
<div
  style={{
    flex: "1 1 300px",
    minWidth: "200px",
    backgroundColor: "rgba(0, 15, 25, 0.9)",
    borderRadius: "15px",
    padding: "20px",
    height: "160px", // 🔹 reduced height
    border: "1px solid rgba(0,255,255,0.2)",
    boxShadow: "0 0 20px rgba(0,255,255,0.1)",
  }}
>
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Legend />
      <Pie
        data={votes}
        dataKey="votes"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={65} // 🔹 smaller radius for compact look
        label
      >
        {votes.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: "#fff",
          border: "1px solid #00ffaa",
          color: "#00ffaa",
        }}
      />
    </PieChart>
  </ResponsiveContainer>
</div>

      </div>
    </div>
  );
}
