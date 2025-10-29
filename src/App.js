// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VotingPage from "./VotingPage";
import AdminDashboard from "./AdminDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VotingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}
