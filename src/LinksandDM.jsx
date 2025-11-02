import React, { useState, useEffect } from "react";
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAFqbEIL3TOAcFmsxoqltJfrtfE2sOXVs",
  authDomain: "links-dm-pro.firebaseapp.com",
  projectId: "links-dm-pro",
  storageBucket: "links-dm-pro.firebasestorage.app",
  messagingSenderId: "965082307073",
  appId: "1:965082307073:web:78ea49e4c5888852307e00",
  measurementId: "G-QVH0R5D92B"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function LinksAndDM() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ name: "", text: "" });

  // ✅ Fetch messages in real-time
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => doc.data()));
    });
    return () => unsubscribe();
  }, []);

  // ✅ Handle new message submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.name || !newMessage.text) return;
    try {
      await addDoc(collection(db, "messages"), {
        name: newMessage.name,
        text: newMessage.text,
        createdAt: serverTimestamp(),
      });
      setNewMessage({ name: "", text: "" });
    } catch (error) {
      console.error("❌ Error adding message:", error);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)",
        padding: "20px",
        color: "#fff",
        fontFamily: "Poppins, sans-serif",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>
        Links & DM 💬
      </h1>
      <p>All your links. Smartly managed. All your DMs, sorted.</p>

      {/* ✅ Message form */}
      <form
        onSubmit={handleSubmit}
        style={{
          margin: "30px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          maxWidth: "400px",
          backgroundColor: "rgba(255,255,255,0.15)",
          borderRadius: "12px",
          padding: "20px",
          backdropFilter: "blur(6px)",
        }}
      >
        <input
          type="text"
          placeholder="Your Name"
          value={newMessage.name}
          onChange={(e) =>
            setNewMessage({ ...newMessage, name: e.target.value })
          }
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            outline: "none",
          }}
        />
        <textarea
          placeholder="Type your message..."
          value={newMessage.text}
          onChange={(e) =>
            setNewMessage({ ...newMessage, text: e.target.value })
          }
          rows={3}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: "#fff",
            color: "#3B82F6",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Send Message
        </button>
      </form>

      {/* ✅ Messages Inbox */}
      <div
        style={{
          marginTop: "40px",
          textAlign: "left",
          backgroundColor: "rgba(255,255,255,0.1)",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "500px",
          marginInline: "auto",
        }}
      >
        <h2 style={{ marginBottom: "15px", textAlign: "center" }}>
          📥 Inbox
        </h2>
        {messages.length === 0 ? (
          <p style={{ textAlign: "center", opacity: 0.7 }}>
            No messages yet...
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              <strong>{msg.name}</strong>
              <p style={{ margin: "5px 0" }}>{msg.text}</p>
              <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                {msg.createdAt?.toDate
                  ? msg.createdAt.toDate().toLocaleString()
                  : "just now"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LinksAndDM;
