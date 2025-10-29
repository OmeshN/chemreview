import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";

export default function VotingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [exhibits, setExhibits] = useState([]);
  const [selectedExhibit, setSelectedExhibit] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchExhibits = async () => {
      const snapshot = await getDocs(collection(db, "exhibits"));
      setExhibits(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchExhibits();
  }, []);

  const nextStep = () => {
    if (!name.trim()) {
      setError("🧪 Please enter your name before proceeding.");
      return;
    }
    if (!rating) {
      setError("⚗️ Please rate the Chemistry Expo before continuing.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedExhibit) {
      setError("🧫 Please select an exhibit before submitting your vote.");
      return;
    }

    await addDoc(collection(db, "reviews"), {
      name,
      review,
      rating,
      selectedExhibit,
      timestamp: new Date(),
    });

    const exhibitRef = doc(db, "exhibits", selectedExhibit);
    await updateDoc(exhibitRef, { votes: increment(1) });

    setError("");
    setSuccess("✅ Thank you for your review and vote!");
    setStep(3);
  };

  // 🔬 Styles
  const containerStyle = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, #001f3f, #002b50, #000a1a)",
    backgroundImage:
      "url('https://www.transparenttextures.com/patterns/cubes.png')",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const cardStyle = {
    backgroundColor: "rgba(0, 15, 25, 0.9)",
    border: "2px solid rgba(0,255,255,0.2)",
    padding: "40px",
    borderRadius: "20px",
    boxShadow: "0 0 40px rgba(0,255,255,0.2)",
    width: "90vw",
    maxWidth: "1100px",
    textAlign: "center",
    backdropFilter: "blur(8px)",
  };

  const inputStyle = {
    width: "90%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #00ffff66",
    marginBottom: "10px",
    backgroundColor: "#002b36",
    color: "white",
    fontSize: "16px",
    outline: "none",
  };

  const buttonStyle = {
    background:
      "linear-gradient(90deg, #00ffff, #00ff99, #00ccff, #00ffff)",
    backgroundSize: "400% 400%",
    color: "black",
    padding: "12px 28px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "15px",
    fontWeight: "bold",
    animation: "glow 3s ease infinite",
  };

  const exhibitContainerStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "20px",
    maxHeight: "400px",
    overflowY: "auto",
    marginBottom: "20px",
    padding: "10px",
  };

  const exhibitStyle = (selected) => ({
    background: selected
      ? "linear-gradient(145deg, #00ffaa33, #00ffff33)"
      : "rgba(0, 20, 30, 0.7)",
    border: selected
      ? "2px solid #00ffcc"
      : "1px solid rgba(0,255,255,0.2)",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "left",
    cursor: "pointer",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    boxShadow: selected
      ? "0 0 15px rgba(0,255,200,0.6)"
      : "0 0 10px rgba(0,255,255,0.1)",
  });

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {step === 1 && (
          <>
            <h2 style={{ fontSize: "30px", color: "#00ffcc", marginBottom: "20px" }}>
              Chemistry Expo Review 🔬
            </h2>
            <p style={{ color: "#ccc", marginBottom: "15px" }}>
              Share your thoughts before you cast your vote!
            </p>
            <input
              style={inputStyle}
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              style={{ ...inputStyle, height: "100px" }}
              placeholder="Write your review (optional)..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
            <div style={{ marginBottom: "15px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    fontSize: "30px",
                    color: rating >= star ? "orangered" : "#005555",
                    cursor: "pointer",
                    marginRight: "5px",
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            {error && (
              <p style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>
                {error}
              </p>
            )}
            <button style={buttonStyle} onClick={nextStep}>
              Next →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: "30px", color: "#00ffcc", marginBottom: "20px" }}>
              Vote for the Best Exhibit ⚗️
            </h2>
            <div style={exhibitContainerStyle}>
              {exhibits.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => setSelectedExhibit(ex.id)}
                  style={exhibitStyle(selectedExhibit === ex.id)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <b style={{ fontSize: "18px", color: "#00ffff" }}>{ex.name}</b>
                  <p style={{ color: "#ccc", marginTop: "5px" }}>
                    {ex.members || ex.teamMembers || "Team info unavailable"}
                  </p>
                </div>
              ))}
            </div>
            {error && (
              <p style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>
                {error}
              </p>
            )}
            <button
              style={{
                ...buttonStyle,
                background: "linear-gradient(90deg,#00ff99,#00ffff)",
              }}
              onClick={handleSubmit}
            >
              Submit Vote 🧪
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center", padding: "30px" }}>
            <h2 style={{ color: "#00ff99", fontSize: "30px" }}>🎉 Thank You!</h2>
            <p style={{ color: "#ccc", fontSize: "18px", marginTop: "10px" }}>
              Your review and vote have been recorded successfully.
            </p>
            <p
              style={{
                color: "#00ffff",
                marginTop: "15px",
                fontWeight: "bold",
              }}
            >
              You’ve helped recognize the best minds in Chemistry today!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
