import React, { useState, useEffect } from "react";
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
} from "recharts";

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

  // Calculate vote counts for each exhibit based on reviews
  const getVoteData = () => {
    const voteCounts = {};
    
    // Count reviews for each exhibit
    reviews.forEach(review => {
      const exhibitId = review.selectedExhibit;
      if (exhibitId) {
        voteCounts[exhibitId] = (voteCounts[exhibitId] || 0) + 1;
      }
    });

    // Combine with exhibit data
    return exhibits.map(exhibit => ({
      ...exhibit,
      votes: voteCounts[exhibit.id] || 0
    }));
  };

  const getReviewsForExhibit = (exhibitId) => {
    return reviews.filter(review => review.selectedExhibit === exhibitId);
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

  const voteData = getVoteData();

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

      {/* Stats Summary */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div style={{
          backgroundColor: "rgba(0, 255, 170, 0.1)",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #00ffaa",
          minWidth: "120px",
        }}>
          <h3 style={{ color: "#00ffaa", margin: "0" }}>{exhibits.length}</h3>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px",color:'black' }}>Exhibits</p>
        </div>
        <div style={{
          backgroundColor: "rgba(0, 224, 255, 0.1)",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #00e0ff",
          minWidth: "120px",
        }}>
          <h3 style={{ color: "#00e0ff", margin: "0" }}>{reviews.length}</h3>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px",color:'black' }}>Total Reviews</p>
        </div>
        <div style={{
          backgroundColor: "rgba(199, 125, 255, 0.1)",
          padding: "15px",
          borderRadius: "10px",
          border: "1px solid #c77dff",
          minWidth: "120px",
        }}>
          <h3 style={{ color: "#c77dff", margin: "0" }}>
            {reviews.length > 0 ? (reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / reviews.length).toFixed(1) : "0.0"}
          </h3>
          <p style={{ margin: "5px 0 0 0", fontSize: "14px",color:'black' }}>Avg Rating</p>
        </div>
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

      {/* Edit Exhibit Modal */}
      {editingExhibit && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <form
            onSubmit={handleUpdateExhibit}
            style={{
              backgroundColor: "rgba(0, 15, 25, 0.95)",
              padding: "30px",
              borderRadius: "15px",
              border: "2px solid #00ffaa",
              width: "90%",
              maxWidth: "400px",
            }}
          >
            <h3 style={{ color: "#00ffaa", marginBottom: "20px" }}>✏️ Edit Exhibit</h3>
            <input
              type="text"
              placeholder="Exhibit Title"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "rgba(0, 255, 255, 0.2)",
                color: "white",
              }}
            />
            <input
              type="text"
              placeholder="Team Members"
              value={editMembers}
              onChange={(e) => setEditMembers(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "rgba(0, 255, 255, 0.2)",
                color: "white",
              }}
            />
            <div style={{ display: "flex", gap: "10px" }}>
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
                  flex: 1,
                }}
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => setEditingExhibit(null)}
                style={{
                  background: "linear-gradient(90deg, #ff6666, #ff4d4d)",
                  color: "white",
                  fontWeight: "bold",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "rgba(0, 15, 25, 0.95)",
            padding: "30px",
            borderRadius: "15px",
            border: "2px solid #00e0ff",
            width: "90%",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflow: "auto",
          }}>
            <h3 style={{ color: "#00e0ff", marginBottom: "20px" }}>
              📝 Reviews for: {selectedExhibit?.name}
            </h3>
            <p style={{ color: "#ccc", marginBottom: "20px" }}>
              Total Reviews: {selectedExhibit?.reviews?.length || 0}
            </p>
            
            {selectedExhibit?.reviews?.length === 0 ? (
              <p style={{ color: "#ccc" }}>No reviews yet for this exhibit.</p>
            ) : (
              <div>
                {selectedExhibit?.reviews?.map((review, index) => (
                  <div
                    key={review.id}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      padding: "15px",
                      borderRadius: "10px",
                      marginBottom: "15px",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                          {review.name || "Anonymous"}
                        </div>
                        <div style={{ color: "#00ffaa", marginTop: "5px" }}>
                          {getRatingStars(review.rating)} ({review.rating}/5)
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        style={{
                          background: "linear-gradient(90deg, #ff6666, #ff4d4d)",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "5px 10px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{ color: "#ccc", fontStyle: "italic" }}>
                      "{review.review || "No review text provided"}"
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowReviewsModal(false)}
              style={{
                background: "linear-gradient(90deg, #00e0ff, #00ffaa)",
                color: "black",
                fontWeight: "bold",
                padding: "10px 20px",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                marginTop: "20px",
                width: "100%",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
                <th style={{ padding: "10px" }}>📝 Reviews</th>
                <th style={{ padding: "10px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {voteData.map((exhibit) => (
                <tr
                  key={exhibit.id}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <td style={{ padding: "10px" }}>{exhibit.name}</td>
                  <td style={{ padding: "10px", color: "#a8dadc" }}>{exhibit.members}</td>
                  <td style={{ padding: "10px", color: "#00ffaa" }}>
                    <button
                      onClick={() => handleViewReviews(exhibit.id, exhibit.name)}
                      style={{
                        background: "none",
                        border: "1px solid #00ffaa",
                        color: "#00ffaa",
                        borderRadius: "5px",
                        padding: "5px 15px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {exhibit.votes} 📝
                    </button>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <button
                      onClick={() => handleEditExhibit(exhibit)}
                      style={{
                        background: "linear-gradient(90deg, #00e0ff, #0099ff)",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 10px",
                        cursor: "pointer",
                        marginRight: "5px",
                        fontSize: "12px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExhibit(exhibit.id)}
                      style={{
                        background: "linear-gradient(90deg, #ff6666, #ff4d4d)",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        padding: "5px 10px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Delete
                    </button>
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
            height: "160px",
            border: "1px solid rgba(0,255,255,0.2)",
            boxShadow: "0 0 20px rgba(0,255,255,0.1)",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Legend />
              <Pie
                data={voteData}
                dataKey="votes"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                label
              >
                {voteData.map((entry, index) => (
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