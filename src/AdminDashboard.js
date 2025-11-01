import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "./firebase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [exhibits, setExhibits] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newExhibit, setNewExhibit] = useState("");
  const [newMembers, setNewMembers] = useState("");
  const [editingExhibit, setEditingExhibit] = useState(null);
  const [editName, setEditName] = useState("");
  const [editMembers, setEditMembers] = useState("");
  const [selectedExhibit, setSelectedExhibit] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("exhibits"); // "exhibits" or "reviews"

  const reportRef = useRef();

  const ADMIN_ACCOUNTS = [
    { username: "arush", password: "arush123" },
    { username: "atul", password: "atul123" },
    { username: "aahil", password: "aahil123" },
    { username: "omesh", password: "omesh123" },
  ];

  const COLORS = ["#00e0ff", "#00ffaa", "#ff6b6b", "#c77dff", "#f1c40f", "#ff9ff3", "#54a0ff", "#ff9f43"];

  useEffect(() => {
    const loggedIn = localStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    await fetchExhibits();
    await fetchReviews();
  };

  const fetchExhibits = async () => {
    const querySnapshot = await getDocs(collection(db, "exhibits"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setExhibits(data);
  };

  const fetchReviews = async () => {
    const querySnapshot = await getDocs(collection(db, "reviews"));
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setReviews(data);
  };

  // Calculate vote counts and detailed statistics for each exhibit
  const getVoteData = () => {
    const voteCounts = {};
    const ratingSums = {};
    const ratingCounts = {};
    
    // Count reviews and calculate ratings for each exhibit
    reviews.forEach(review => {
      const exhibitId = review.selectedExhibit;
      if (exhibitId) {
        voteCounts[exhibitId] = (voteCounts[exhibitId] || 0) + 1;
        ratingSums[exhibitId] = (ratingSums[exhibitId] || 0) + (review.rating || 0);
        ratingCounts[exhibitId] = (ratingCounts[exhibitId] || 0) + 1;
      }
    });

    // Combine with exhibit data
    return exhibits.map(exhibit => ({
      ...exhibit,
      votes: voteCounts[exhibit.id] || 0,
      averageRating: ratingCounts[exhibit.id] 
        ? (ratingSums[exhibit.id] / ratingCounts[exhibit.id]).toFixed(1)
        : "0.0",
      totalRatings: ratingCounts[exhibit.id] || 0
    }));
  };

  const getReviewsForExhibit = (exhibitId) => {
    return reviews.filter(review => review.selectedExhibit === exhibitId);
  };

  // Get all reviews with exhibit names
  const getAllReviewsWithExhibitNames = () => {
    return reviews.map(review => {
      const exhibit = exhibits.find(e => e.id === review.selectedExhibit);
      return {
        ...review,
        exhibitName: exhibit ? exhibit.name : "Unknown Exhibit"
      };
    });
  };

  // Get rating distribution for all exhibits
  const getRatingDistribution = () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.rating && distribution[review.rating] !== undefined) {
        distribution[review.rating]++;
      }
    });
    return Object.entries(distribution).map(([rating, count]) => ({
      rating: `${rating} Star${rating !== '1' ? 's' : ''}`,
      count,
      percentage: reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(1) : 0
    }));
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
      fetchData();
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
    });
    setNewExhibit("");
    setNewMembers("");
    fetchExhibits();
  };

  const handleEditExhibit = (exhibit) => {
    setEditingExhibit(exhibit.id);
    setEditName(exhibit.name);
    setEditMembers(exhibit.members);
  };

  const handleUpdateExhibit = async (e) => {
    e.preventDefault();
    if (!editName || !editMembers) return;

    const exhibitRef = doc(db, "exhibits", editingExhibit);
    await updateDoc(exhibitRef, {
      name: editName,
      members: editMembers,
    });
    
    setEditingExhibit(null);
    setEditName("");
    setEditMembers("");
    fetchExhibits();
  };

  const handleDeleteExhibit = async (exhibitId) => {
    if (window.confirm("Are you sure you want to delete this exhibit? This will also delete all reviews for this exhibit.")) {
      // First delete all reviews for this exhibit
      try {
        const reviewsQuery = query(
          collection(db, "reviews"), 
          where("selectedExhibit", "==", exhibitId)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        const deleteReviewsPromises = reviewsSnapshot.docs.map(reviewDoc => 
          deleteDoc(doc(db, "reviews", reviewDoc.id))
        );
        await Promise.all(deleteReviewsPromises);
      } catch (error) {
        console.error("Error deleting reviews:", error);
      }

      // Then delete the exhibit
      await deleteDoc(doc(db, "exhibits", exhibitId));
      fetchData();
    }
  };

  const handleViewReviews = (exhibitId, exhibitName) => {
    const exhibitReviews = getReviewsForExhibit(exhibitId);
    setSelectedExhibit({ 
      id: exhibitId, 
      name: exhibitName,
      reviews: exhibitReviews 
    });
    setShowReviewsModal(true);
  };

  const handleViewAllReviews = () => {
    setShowAllReviewsModal(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      await deleteDoc(doc(db, "reviews", reviewId));
      fetchReviews();
      
      // Update the modal if it's open
      if (selectedExhibit) {
        const updatedReviews = getReviewsForExhibit(selectedExhibit.id);
        setSelectedExhibit(prev => ({
          ...prev,
          reviews: updatedReviews
        }));
      }
    }
  };

  const getRatingStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  // NEW: Generate PDF Report with detailed reviews
  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      // Show loading state
      const originalText = "📊 Generate PDF Report";
      const exportButton = document.querySelector('[data-export-pdf]');
      if (exportButton) {
        exportButton.textContent = "🔄 Generating PDF...";
        exportButton.disabled = true;
      }

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#001933",
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add detailed reviews page if there are reviews
      if (reviews.length > 0) {
        pdf.addPage();
        
        // Reviews page header
        pdf.setFontSize(20);
        pdf.setTextColor(0, 224, 255);
        pdf.text('Detailed Reviews Report', 20, 20);
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 255, 170);
        pdf.text(`Total Reviews: ${reviews.length}`, 20, 30);
        
        let yPosition = 45;
        const allReviews = getAllReviewsWithExhibitNames();
        
        allReviews.forEach((review, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(10);
          pdf.setTextColor(255, 255, 255);
          
          // Review header
          pdf.setTextColor("red");
          pdf.text(`Review ${index + 1}: ${review.name || "Anonymous"}`, 20, yPosition);
          pdf.setTextColor("black");
          pdf.text(`Exhibit: ${review.exhibitName}`, 20, yPosition + 5);
          pdf.setTextColor("cornflowerblue");
          pdf.text(`Rating: (${review.rating}/5)`, 20, yPosition + 10);
          
          // Review text
          pdf.setTextColor("black");
          const reviewText = review.review || "No review text provided";
          const splitText = pdf.splitTextToSize(`"${reviewText}"`, 170);
          pdf.text(splitText, 20, yPosition + 17);
          
          yPosition += 30 + (splitText.length * 5);
        });
      }

      pdf.save(`science-fair-report-${new Date().toISOString().split('T')[0]}.pdf`);

      // Restore button state
      if (exportButton) {
        exportButton.textContent = originalText;
        exportButton.disabled = false;
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
      
      const exportButton = document.querySelector('[data-export-pdf]');
      if (exportButton) {
        exportButton.textContent = "📊 Generate PDF Report";
        exportButton.disabled = false;
      }
    }
  };

  const backgroundStyle = {
    minHeight: '100vh',
    background: "radial-gradient(circle at top left, #001933, #00294d, #000a1a)",
    backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')",
    color: "white",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  };

  const voteData = getVoteData();
  const ratingDistribution = getRatingDistribution();
  const allReviewsWithNames = getAllReviewsWithExhibitNames();

  // --- LOGIN PAGE ---
  if (!isLoggedIn) {
    return (
      <div style={{ ...backgroundStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <form onSubmit={handleLogin} style={{
          backgroundColor: "rgba(0,0,0,0.8)",
          padding: "30px",
          borderRadius: "20px",
          width: "90%",
          maxWidth: "350px",
          textAlign: "center",
          boxShadow: "0 0 40px rgba(0, 255, 255, 0.3)",
          border: "1px solid rgba(0,255,255,0.2)",
        }}>
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
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: "30px",
      }}>
        <h2 style={{ color: "rgba(0, 15, 25, 0.9)", fontSize: "26px" }}>⚗️ Admin Dashboard</h2>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={handleViewAllReviews}
            style={{
              background: "linear-gradient(90deg, #f1c40f, #f39c12)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              marginTop: "10px",
              fontWeight: "bold",
            }}
          >
            📝 View All Reviews
          </button>
          <button
            onClick={generatePDF}
            data-export-pdf
            style={{
              background: "linear-gradient(90deg, #c77dff, #9d4edd)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              marginTop: "10px",
              fontWeight: "bold",
            }}
          >
            📊 Generate PDF Report
          </button>
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
      </div>

      {/* Tab Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("exhibits")}
          style={{
            background: activeTab === "exhibits" ? "linear-gradient(90deg, #00e0ff, #00ffaa)" : "rgba(255,255,255,0.1)",
            color: "black",
            border: "none",
            borderRadius: "8px 0 0 8px",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🧪 Exhibits
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          style={{
            background: activeTab === "reviews" ? "linear-gradient(90deg, #00e0ff, #00ffaa)" : "rgba(255,255,255,0.1)",
            color: "black",
            border: "none",
            borderRadius: "0 8px 8px 0",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          📊 Analytics
        </button>
      </div>

      {/* Report Section (for PDF export) */}
      <div ref={reportRef} style={{ backgroundColor: "rgba(0, 15, 25, 0.9)", padding: "20px", borderRadius: "15px", marginBottom: "30px" }}>
        {/* Report Header */}
        <div style={{ textAlign: "center", marginBottom: "30px", padding: "20px", borderBottom: "2px solid #00e0ff" }}>
          <h1 style={{ color: "#00e0ff", margin: "0 0 10px 0", fontSize: "28px" }}>🧪 Science Fair Voting Report</h1>
          <p style={{ color: "#00ffaa", margin: "0", fontSize: "16px" }}>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Stats Summary */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "15px", marginBottom: "30px" }}>
          <div style={{ backgroundColor: "rgba(0, 255, 170, 0.1)", padding: "15px", borderRadius: "10px", border: "1px solid #00ffaa", minWidth: "120px" }}>
            <h3 style={{ color: "#00ffaa", margin: "0" }}>{exhibits.length}</h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: 'white' }}>Exhibits</p>
          </div>
          <div style={{ backgroundColor: "rgba(0, 224, 255, 0.1)", padding: "15px", borderRadius: "10px", border: "1px solid #00e0ff", minWidth: "120px" }}>
            <h3 style={{ color: "#00e0ff", margin: "0" }}>{reviews.length}</h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: 'white' }}>Total Reviews</p>
          </div>
          <div style={{ backgroundColor: "rgba(199, 125, 255, 0.1)", padding: "15px", borderRadius: "10px", border: "1px solid #c77dff", minWidth: "120px" }}>
            <h3 style={{ color: "#c77dff", margin: "0" }}>
              {reviews.length > 0 ? (reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / reviews.length).toFixed(1) : "0.0"}
            </h3>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px", color: 'white' }}>Avg Rating</p>
          </div>
        </div>

        {/* Main Content based on Active Tab */}
        {activeTab === "exhibits" ? (
          /* EXHIBITS TAB */
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", gap: "20px" }}>
            {/* Table */}
            <div style={{ flex: "1 1 300px", minWidth: "300px", overflowX: "auto", backgroundColor: "rgba(0, 20, 40, 0.7)", borderRadius: "15px", padding: "10px", border: "1px solid rgba(0,255,255,0.2)" }}>
              <h3 style={{ color: "#00ffaa", marginBottom: "15px" }}>📋 Exhibits Overview</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(0, 255, 255, 0.2)" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>🧫 Exhibit</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>👩‍🔬 Team</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>📝 Votes</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>⭐ Avg Rating</th>
                    <th style={{ padding: "10px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {voteData.map((exhibit, index) => (
                    <tr key={exhibit.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.05)" : "transparent" }}>
                      <td style={{ padding: "10px" }}>{exhibit.name}</td>
                      <td style={{ padding: "10px", color: "#a8dadc" }}>{exhibit.members}</td>
                      <td style={{ padding: "10px", color: "#00ffaa", textAlign: "center", fontWeight: "bold" }}>
                        <button onClick={() => handleViewReviews(exhibit.id, exhibit.name)} style={{ background: "none", border: "1px solid #00ffaa", color: "#00ffaa", borderRadius: "5px", padding: "5px 10px", cursor: "pointer" }}>
                          {exhibit.votes} 📝
                        </button>
                      </td>
                      <td style={{ padding: "10px", color: "#f1c40f", textAlign: "center", fontWeight: "bold" }}>
                        {exhibit.averageRating} ⭐
                      </td>
                      <td style={{ padding: "10px", textAlign: "center" }}>
                        <button onClick={() => handleEditExhibit(exhibit)} style={{ background: "linear-gradient(90deg, #00e0ff, #0099ff)", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", marginRight: "5px", fontSize: "12px" }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteExhibit(exhibit.id)} style={{ background: "linear-gradient(90deg, #ff6666, #ff4d4d)", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chart */}
            <div style={{ flex: "1 1 300px", minWidth: "200px", backgroundColor: "rgba(0, 20, 40, 0.7)", borderRadius: "15px", padding: "20px", height: "400px", border: "1px solid rgba(0,255,255,0.2)" }}>
              <h3 style={{ color: "#00e0ff", marginBottom: "20px" }}>📊 Voting Distribution</h3>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Legend />
                  <Pie data={voteData} dataKey="votes" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, votes, percent }) => `${name}: ${votes} (${(percent * 100).toFixed(1)}%)`}>
                    {voteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, "Votes"]} contentStyle={{ backgroundColor: "#001933", border: "1px solid #00ffaa", color: "white", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          /* ANALYTICS TAB */
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px" }}>
            {/* Rating Distribution Chart */}
            <div style={{ flex: "1 1 400px", minWidth: "300px", backgroundColor: "rgba(0, 20, 40, 0.7)", borderRadius: "15px", padding: "20px", border: "1px solid rgba(0,255,255,0.2)" }}>
              <h3 style={{ color: "#f1c40f", marginBottom: "20px" }}>⭐ Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="rating" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip contentStyle={{ backgroundColor: "#001933", border: "1px solid #f1c40f", color: "white", borderRadius: "8px" }} />
                  <Bar dataKey="count" fill="#f1c40f" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Reviews Preview */}
            <div style={{ flex: "1 1 400px", minWidth: "300px", backgroundColor: "rgba(0, 20, 40, 0.7)", borderRadius: "15px", padding: "20px", border: "1px solid rgba(0,255,255,0.2)" }}>
              <h3 style={{ color: "#00ffaa", marginBottom: "20px" }}>📝 Recent Reviews</h3>
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {allReviewsWithNames.slice(0, 10).map((review, index) => (
                  <div key={review.id} style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <span style={{ fontWeight: "bold", color: "#00e0ff" }}>{review.name || "Anonymous"}</span>
                      <span style={{ color: "#f1c40f" }}>{getRatingStars(review.rating)}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#ccc", marginBottom: "5px" }}>Exhibit: {review.exhibitName}</div>
                    <div style={{ fontSize: "12px", color: "#a8dadc", fontStyle: "italic" }}>"{review.review || "No review text provided"}"</div>
                  </div>
                ))}
                {allReviewsWithNames.length === 0 && (
                  <p style={{ color: "#ccc", textAlign: "center" }}>No reviews yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "rgba(0, 40, 80, 0.3)", borderRadius: "10px" }}>
          <h3 style={{ color: "#c77dff", marginBottom: "15px" }}>📈 Summary</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00ffaa", fontSize: "18px", fontWeight: "bold" }}>
                {voteData.reduce((max, exhibit) => exhibit.votes > max.votes ? exhibit : max, voteData[0])?.name || "N/A"}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>Most Votes</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#00e0ff", fontSize: "18px", fontWeight: "bold" }}>
                {voteData.reduce((total, exhibit) => total + exhibit.votes, 0)}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>Total Votes</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#f1c40f", fontSize: "18px", fontWeight: "bold" }}>
                {voteData.length > 0 ? (voteData.reduce((total, exhibit) => total + exhibit.votes, 0) / voteData.length).toFixed(1) : "0"}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>Avg Votes/Exhibit</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#c77dff", fontSize: "18px", fontWeight: "bold" }}>
                {ratingDistribution.reduce((max, dist) => dist.count > max.count ? dist : dist, ratingDistribution[0])?.rating || "N/A"}
              </div>
              <div style={{ fontSize: "12px", color: "#ccc" }}>Most Common Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Exhibit Form */}
      <form onSubmit={handleAddExhibit} style={{
        backgroundColor: "rgba(0, 15, 25, 0.9)", padding: "20px", borderRadius: "15px", marginBottom: "30px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", border: "1px solid rgba(0,255,255,0.2)", boxShadow: "0 0 20px rgba(0,255,255,0.1)",
      }}>
        <h3 style={{ width: "100%", color: "#00ffaa", marginBottom: "10px" }}>➕ Add New Exhibit</h3>
        <input type="text" placeholder="Exhibit Title" value={newExhibit} onChange={(e) => setNewExhibit(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "rgba(0, 255, 255, 0.2)", color: "white", flex: "1 1 150px", minWidth: "150px" }} />
        <input type="text" placeholder="Team Members" value={newMembers} onChange={(e) => setNewMembers(e.target.value)} style={{ padding: "10px", borderRadius: "8px", border: "none", backgroundColor: "rgba(0, 255, 255, 0.2)", color: "white", flex: "1 1 150px", minWidth: "150px" }} />
        <button type="submit" style={{ background: "linear-gradient(90deg, #00e0ff, #00ffaa)", color: "black", fontWeight: "bold", padding: "10px 20px", border: "none", borderRadius: "10px", cursor: "pointer" }}>Add Exhibit</button>
      </form>

      {/* Edit Exhibit Modal */}
      {editingExhibit && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <form onSubmit={handleUpdateExhibit} style={{ backgroundColor: "rgba(0, 15, 25, 0.95)", padding: "30px", borderRadius: "15px", border: "2px solid #00ffaa", width: "90%", maxWidth: "400px" }}>
            <h3 style={{ color: "#00ffaa", marginBottom: "20px" }}>✏️ Edit Exhibit</h3>
            <input type="text" placeholder="Exhibit Title" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "8px", border: "none", backgroundColor: "rgba(0, 255, 255, 0.2)", color: "white" }} />
            <input type="text" placeholder="Team Members" value={editMembers} onChange={(e) => setEditMembers(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "8px", border: "none", backgroundColor: "rgba(0, 255, 255, 0.2)", color: "white" }} />
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ background: "linear-gradient(90deg, #00e0ff, #00ffaa)", color: "black", fontWeight: "bold", padding: "10px 20px", border: "none", borderRadius: "10px", cursor: "pointer", flex: 1 }}>Update</button>
              <button type="button" onClick={() => setEditingExhibit(null)} style={{ background: "linear-gradient(90deg, #ff6666, #ff4d4d)", color: "white", fontWeight: "bold", padding: "10px 20px", border: "none", borderRadius: "10px", cursor: "pointer", flex: 1 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Single Exhibit Reviews Modal */}
      {showReviewsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "rgba(0, 15, 25, 0.95)", padding: "30px", borderRadius: "15px", border: "2px solid #00e0ff", width: "90%", maxWidth: "600px", maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ color: "#00e0ff", marginBottom: "20px" }}>📝 Reviews for: {selectedExhibit?.name}</h3>
            <p style={{ color: "#ccc", marginBottom: "20px" }}>Total Reviews: {selectedExhibit?.reviews?.length || 0}</p>
            {selectedExhibit?.reviews?.length === 0 ? (
              <p style={{ color: "#ccc" }}>No reviews yet for this exhibit.</p>
            ) : (
              <div>
                {selectedExhibit?.reviews?.map((review, index) => (
                  <div key={review.id} style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", marginBottom: "15px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "16px" }}>{review.name || "Anonymous"}</div>
                        <div style={{ color: "#00ffaa", marginTop: "5px" }}>{getRatingStars(review.rating)} ({review.rating}/5)</div>
                      </div>
                      <button onClick={() => handleDeleteReview(review.id)} style={{ background: "linear-gradient(90deg, #ff6666, #ff4d4d)", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                    </div>
                    <div style={{ color: "#ccc", fontStyle: "italic" }}>"{review.review || "No review text provided"}"</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowReviewsModal(false)} style={{ background: "linear-gradient(90deg, #00e0ff, #00ffaa)", color: "black", fontWeight: "bold", padding: "10px 20px", border: "none", borderRadius: "10px", cursor: "pointer", marginTop: "20px", width: "100%" }}>Close</button>
          </div>
        </div>
      )}

      {/* All Reviews Modal */}
      {showAllReviewsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "rgba(0, 15, 25, 0.95)", padding: "30px", borderRadius: "15px", border: "2px solid #f1c40f", width: "90%", maxWidth: "800px", maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ color: "#f1c40f", marginBottom: "20px" }}>📋 All Reviews ({reviews.length})</h3>
            {allReviewsWithNames.length === 0 ? (
              <p style={{ color: "#ccc" }}>No reviews yet.</p>
            ) : (
              <div>
                {allReviewsWithNames.map((review, index) => (
                  <div key={review.id} style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px", marginBottom: "15px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "16px", color: "#00e0ff" }}>{review.name || "Anonymous"}</div>
                        <div style={{ color: "#00ffaa", marginTop: "5px" }}>{getRatingStars(review.rating)} ({review.rating}/5)</div>
                        <div style={{ color: "#c77dff", marginTop: "5px", fontSize: "14px" }}>Exhibit: {review.exhibitName}</div>
                      </div>
                      <button onClick={() => handleDeleteReview(review.id)} style={{ background: "linear-gradient(90deg, #ff6666, #ff4d4d)", color: "white", border: "none", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                    </div>
                    <div style={{ color: "#ccc", fontStyle: "italic" }}>"{review.review || "No review text provided"}"</div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowAllReviewsModal(false)} style={{ background: "linear-gradient(90deg, #00e0ff, #00ffaa)", color: "black", fontWeight: "bold", padding: "10px 20px", border: "none", borderRadius: "10px", cursor: "pointer", marginTop: "20px", width: "100%" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}