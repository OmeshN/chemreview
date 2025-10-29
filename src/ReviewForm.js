import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReviewForm() {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!name || !review || rating === 0) {
      alert("Please fill all fields and give a rating");
      return;
    }
    localStorage.setItem("reviewData", JSON.stringify({ name, review, rating }));
    navigate("/vote");
  };

  return (
    <div style={styles.container}>
      <h2>Exhibit Review</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        style={styles.textarea}
        placeholder="Your Review"
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />
      <div style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: "24px",
              cursor: "pointer",
              color: rating >= star ? "#ffcc00" : "#ccc",
            }}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
      <button style={styles.button} onClick={handleNext}>
        Next →
      </button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: "50px auto", textAlign: "center" },
  input: { width: "100%", padding: 10, marginBottom: 10 },
  textarea: { width: "100%", padding: 10, height: 80, marginBottom: 10 },
  ratingContainer: { marginBottom: 20 },
  button: {
    backgroundColor: "#4CAF50",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    cursor: "pointer",
    borderRadius: 5,
  },
};
