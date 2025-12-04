// =========================================
// LinksAndDM.jsx  —  Final Production Build
// =========================================
// All inline styles preserved exactly as before
// Full Firebase + Public Profile + DM + Editor logic fixed
// -----------------------------------------

import React, { useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

// ----------------------
// 🔥 Firebase Initialize
// ----------------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ----------------------------------
// 🧱 Error Boundary to wrap the app
// ----------------------------------
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            fontFamily: "sans-serif",
          }}
        >
          <h2>⚠️ Something went wrong.</h2>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              background: "#6366f1",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --------------------------------------
// 🧩 Main Functional Component
// --------------------------------------
function LinksAndDM() {
  // ---------- App States ----------
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState("landing");
  const [isSaving, setIsSaving] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [receiverUid, setReceiverUid] = useState("");
  const [publicProfile, setPublicProfile] = useState({});
  const [priorityContacts, setPriorityContacts] = useState([]);
  const [charityLinks, setCharityLinks] = useState([]);
  const [socialHandles, setSocialHandles] = useState([]);
  const [emails, setEmails] = useState([]);
  const [phones, setPhones] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [portfolio, setPortfolio] = useState({});
  const [projects, setProjects] = useState({});
  const [profile, setProfile] = useState({
    name: "",
    profession: "",
    bio: "",
    username: "",
    profilePic: "",
    selectedTheme: "Soft Lavender",
  });

  // Message modal
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [currentMessageType, setCurrentMessageType] = useState("");
  const [messageForm, setMessageForm] = useState({
    senderName: "",
    senderContact: "",
    message: "",
  });
  // Modals and Inbox
const [showCharityModal, setShowCharityModal] = useState(false);
const [inbox, setInbox] = useState([]);

// Opens message form modal for Book a Meeting / Let's Connect / Collab Request
const openMessageForm = (type) => {
  setCurrentMessageType(type);
  setShowMessageForm(true);
};

  // ---------------------------
  // Authentication watcher
  // ---------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUser(usr);
        if (usr.email === "ashworldco@gmail.com") setIsAdmin(true);
        await loadUserProfile(usr.uid);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  // ---------------------------------
  // Load user profile from Firestore
  // ---------------------------------
  const loadUserProfile = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data.profile || {});
        setPriorityContacts(data.priorityContacts || []);
        setCharityLinks(data.charityLinks || []);
        setSocialHandles(data.socialHandles || []);
        setEmails(data.emails || []);
        setPhones(data.phones || []);
        setWebsites(data.websites || []);
        setPortfolio(data.portfolio || {});
        setProjects(data.projects || {});
      }
    } catch (err) {
      console.error("Load profile error:", err);
    }
  };

  // ---------------------------------
  // Save user profile to Firestore
  // ---------------------------------
  const saveProfile = async () => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        {
          profile,
          priorityContacts,
          charityLinks,
          socialHandles,
          emails,
          phones,
          websites,
          portfolio,
          projects,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // ---------------------------------
  // Generate shareable link
  // ---------------------------------
  const generateShareLink = async () => {
    if (!profile.username) {
      alert("Please set a username first!");
      return;
    }
    await saveProfile();
    const url = `https://linksanddms.netlify.app/user/${profile.username}`;
    setShareLink(url);
    alert("✅ Link generated!");
  };

  // ---------------------------------
  // Load public profile by username
  // ---------------------------------
  const loadPublicProfileByUsername = async (username) => {
    try {
      const q = query(collection(db, "users"), where("profile.username", "==", username));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0];
        const data = docData.data();
        setReceiverUid(docData.id);
        setPublicProfile(data.profile || {});
        setPriorityContacts(data.priorityContacts || []);
        setCharityLinks(data.charityLinks || []);
        setSocialHandles(data.socialHandles || []);
        setEmails(data.emails || []);
        setPhones(data.phones || []);
        setWebsites(data.websites || []);
        setPortfolio(data.portfolio || {});
        setProjects(data.projects || {});
        setCurrentView("public-preview");
      } else setCurrentView("not-found");
    } catch (err) {
      console.error("Public load error:", err);
      setCurrentView("not-found");
    }
  };

  // Detect direct public URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/user/")) {
      const username = decodeURIComponent(path.split("/user/")[1]);
      loadPublicProfileByUsername(username);
    }
  }, []);

  // ---------------------------------
  // DM Modal + Firestore Send
  // ---------------------------------
  const handleSendMessage = async () => {
    if (!receiverUid) return;
    if (!messageForm.senderContact) {
      alert("Please enter your email.");
      return;
    }
    const isPriority = priorityContacts.some(
      (c) =>
        c.email?.trim().toLowerCase() ===
        messageForm.senderContact.trim().toLowerCase()
    );
    const msgData = {
      senderName: messageForm.senderName,
      senderContact: messageForm.senderContact,
      message: messageForm.message,
      messageType: currentMessageType,
      timestamp: serverTimestamp(),
      isPriority,
    };
    try {
      await addDoc(collection(db, "users", receiverUid, "messages"), msgData);
      alert("✅ Message sent!");
      setShowMessageForm(false);
      setMessageForm({ senderName: "", senderContact: "", message: "" });
    } catch (err) {
      console.error("Send msg error:", err);
    }
  };
    // ---------------------------------------------------
  // 🖥️ View Switcher: Landing / Auth / Editor / Public
  // ---------------------------------------------------
  const renderView = () => {
    switch (currentView) {
      // ----------------
      // 1️⃣ Landing Page
      // ----------------
      case "landing":
        return (
          <div
            style={{
              background: "linear-gradient(135deg,#fbc2eb 0%,#a6c1ee 100%)",
              minHeight: "100vh",
              fontFamily: "Poppins,sans-serif",
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "38px", fontWeight: "700", marginBottom: "8px" }}>
              🔗 Links & DM 💬
            </div>
            <button
              style={{
                marginTop: "8px",
                fontSize: "20px",
                padding: "10px 20px",
                background: "#fff",
                borderRadius: "30px",
                border: "none",
                cursor: "pointer",
              }}
              onClick={() => setCurrentView("auth")}
            >
              Let's Do It!
            </button>

            <h1 style={{ fontSize: "46px", fontWeight: "900", marginTop: "60px" }}>
              One Link.<br />Sorted DMs.
            </h1>
            <p style={{ fontSize: "18px", marginTop: "20px" }}>
              The Ultimate Link-in-Bio for Creators ✨<br />
              Connect with followers • Organize messages • Manage links • Build your brand
            </p>

            <div style={{ marginTop: "60px" }}>
              <button
                style={{
                  padding: "16px 30px",
                  fontSize: "18px",
                  fontWeight: "700",
                  borderRadius: "50px",
                  border: "none",
                  background: "#a78bfa",
                  color: "white",
                  marginRight: "12px",
                }}
                onClick={() => setCurrentView("auth")}
              >
                🚀 Get Started Now
              </button>
              <button
                style={{
                  padding: "16px 30px",
                  fontSize: "18px",
                  fontWeight: "700",
                  borderRadius: "50px",
                  border: "2px solid #a78bfa",
                  background: "white",
                  color: "#a78bfa",
                }}
                onClick={() => setCurrentView("demo-preview")}
              >
                ✨ See Demo
              </button>
            </div>
          </div>
        );

      // ---------------
      // 2️⃣ Auth View
      // ---------------
      case "auth":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100vh",
              background: "linear-gradient(135deg,#fdfbfb 0%,#ebedee 100%)",
            }}
          >
            <h2>Login / Sign Up to Links & DM</h2>
            <input
              id="email"
              placeholder="Email"
              style={{
                width: "80%",
                maxWidth: "400px",
                margin: "10px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
            <input
              id="password"
              type="password"
              placeholder="Password"
              style={{
                width: "80%",
                maxWidth: "400px",
                margin: "10px",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            />
            <div style={{ marginTop: "20px" }}>
              <button
                onClick={async () => {
                  const email = document.getElementById("email").value;
                  const pw = document.getElementById("password").value;
                  try {
                    await signInWithEmailAndPassword(auth, email, pw);
                    setCurrentView("editor");
                  } catch {
                    await createUserWithEmailAndPassword(auth, email, pw);
                    setCurrentView("editor");
                  }
                }}
                style={{
                  background: "#6366f1",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  cursor: "pointer",
                }}
              >
                Continue
              </button>
            </div>
            <button
              onClick={() => setCurrentView("landing")}
              style={{
                marginTop: "40px",
                border: "none",
                background: "transparent",
                color: "#6366f1",
                cursor: "pointer",
              }}
            >
              ← Back to Home
            </button>
          </div>
        );

      // -----------------
      // 3️⃣ Editor Start
      // -----------------
      case "editor":
        return (
          <div
            style={{
              minHeight: "100vh",
              background: "linear-gradient(180deg,#fceabb 0%,#f8b500 100%)",
              padding: "40px 16px 100px",
              fontFamily: "Poppins,sans-serif",
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              ✏️ Edit Your Profile
            </h2>

            {/* Name / Profession / Bio */}
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Name"
                style={{
                  width: "100%",
                  marginBottom: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                }}
              />
              <input
                value={profile.profession}
                onChange={(e) =>
                  setProfile({ ...profile, profession: e.target.value })
                }
                placeholder="Profession"
                style={{
                  width: "100%",
                  marginBottom: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                }}
              />
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Bio"
                rows="3"
                style={{
                  width: "100%",
                  marginBottom: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                }}
              />
              <input
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
                placeholder="📱 Username (for shareable link)"
                style={{
                  width: "100%",
                  marginBottom: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                }}
              />

              <button
                onClick={generateShareLink}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#3b82f6",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "700",
                  borderRadius: "10px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🔗 Generate Share Link
              </button>

              {shareLink && (
                <div
                  style={{
                    marginTop: "20px",
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "10px",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                >
                  <p style={{ margin: "4px 0" }}>📱 Your Shareable Link:</p>
                  <input
                    readOnly
                    value={shareLink}
                    style={{
                      width: "100%",
                      border: "none",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  />
                </div>
              )}
            </div>
                        {/* -------------------------------------------------- */}
            {/* 💌 Smart DM Buttons  */}
            {/* -------------------------------------------------- */}
            <div
              style={{
                marginTop: "40px",
                background: "linear-gradient(135deg,#f9a8d4 0%,#f472b6 100%)",
                borderRadius: "20px",
                padding: "18px 16px",
                color: "white",
              }}
            >
              <h3 style={{ marginBottom: "14px", fontSize: "20px", fontWeight: "700" }}>
                💌 Smart DM Buttons
              </h3>

              {[
                { key: "meeting", label: "📅 Book a Meeting" },
                { key: "connect", label: "🌸 Let’s Connect" },
                { key: "collab", label: "🤝 Collab Request" },
                { key: "cause", label: "❤️ Support a Cause" },
              ].map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "white",
                    borderRadius: "12px",
                    padding: "10px 14px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      color: "#333",
                      fontWeight: "600",
                      fontSize: "16px",
                    }}
                  >
                    {b.label}
                  </span>
                  <button
                    onClick={() =>
                      b.key === "cause"
                        ? setShowCharityModal(true)
                        : openMessageForm(b.key)
                    }
                    style={{
                      background:
                        "linear-gradient(135deg,#a78bfa 0%,#6366f1 100%)",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "none",
                      borderRadius: "10px",
                      padding: "6px 14px",
                      marginLeft: "auto",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    👁️ Preview
                  </button>
                </div>
              ))}
            </div>

            {/* -------------------------------------------------- */}
            {/* ❤️ Charity / Cause Links */}
            {/* -------------------------------------------------- */}
            <div
              style={{
                background: "#FB7185",
                borderRadius: "16px",
                padding: "18px 16px",
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "white",
                  marginBottom: "10px",
                }}
              >
                ❤️ Charity / Cause Links
              </h3>

              {charityLinks.map((link, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    value={link.title}
                    onChange={(e) =>
                      setCharityLinks((prev) => {
                        const arr = [...prev];
                        arr[i].title = e.target.value;
                        return arr;
                      })
                    }
                    placeholder="Title"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "15px",
                    }}
                  />
                  <input
                    value={link.url}
                    onChange={(e) =>
                      setCharityLinks((prev) => {
                        const arr = [...prev];
                        arr[i].url = e.target.value;
                        return arr;
                      })
                    }
                    placeholder="URL"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "15px",
                    }}
                  />
                </div>
              ))}

              <button
                onClick={() =>
                  setCharityLinks([...charityLinks, { title: "", url: "" }])
                }
                style={{
                  marginTop: "6px",
                  background: "rgba(255,255,255,0.25)",
                  border: "2px dashed white",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "700",
                  borderRadius: "12px",
                  padding: "10px 0",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                + Add Charity Link
              </button>
            </div>

            {/* -------------------------------------------------- */}
            {/* 🌐 Social Handles */}
            {/* -------------------------------------------------- */}
            <div
              style={{
                background: "#8B5CF6",
                borderRadius: "16px",
                padding: "18px 16px",
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "white",
                  marginBottom: "10px",
                }}
              >
                🌐 Social Handles
              </h3>

              {socialHandles.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    value={h.platform}
                    onChange={(e) =>
                      setSocialHandles((prev) => {
                        const arr = [...prev];
                        arr[i].platform = e.target.value;
                        return arr;
                      })
                    }
                    placeholder="Platform"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "15px",
                    }}
                  />
                  <input
                    value={h.handle}
                    onChange={(e) =>
                      setSocialHandles((prev) => {
                        const arr = [...prev];
                        arr[i].handle = e.target.value;
                        return arr;
                      })
                    }
                    placeholder="@username"
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "15px",
                    }}
                  />
                </div>
              ))}

              <button
                onClick={() =>
                  setSocialHandles([
                    ...socialHandles,
                    { platform: "", handle: "" },
                  ])
                }
                style={{
                  marginTop: "6px",
                  background: "rgba(255,255,255,0.25)",
                  border: "2px dashed white",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "700",
                  borderRadius: "12px",
                  padding: "10px 0",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                + Add Handle
              </button>
            </div>

            {/* -------------------------------------------------- */}
            {/* 💾 Save All Changes */}
            {/* -------------------------------------------------- */}
            <div style={{ marginTop: "40px", textAlign: "center" }}>
              <button
                onClick={async () => {
                  setIsSaving(true);
                  await saveProfile();
                  alert("✅ All changes saved!");
                  setIsSaving(false);
                }}
                disabled={isSaving}
                style={{
                  width: "100%",
                  background: "#10b981",
                  color: "white",
                  padding: "14px",
                  fontSize: "18px",
                  fontWeight: "700",
                  border: "none",
                  borderRadius: "14px",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                💾 Save All Changes
              </button>
            </div>
          </div>
        );
              // -----------------
      // 4️⃣ Public Profile
      // -----------------
      case "public-preview":
        return (
          <div
            style={{
              minHeight: "100vh",
              background: "linear-gradient(180deg,#e0c3fc 0%,#8ec5fc 100%)",
              padding: "40px 16px",
              fontFamily: "Poppins,sans-serif",
              textAlign: "center",
            }}
          >
            <img
              src={publicProfile.profilePic || "https://via.placeholder.com/120"}
              alt="profile"
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "10px",
              }}
            />
            <h2>{publicProfile.name}</h2>
            <p style={{ fontStyle: "italic", marginBottom: "20px" }}>
              {publicProfile.profession}
            </p>
            <p>{publicProfile.bio}</p>

            {/* DM Buttons */}
            <div style={{ marginTop: "30px" }}>
              <button
                onClick={() => openMessageForm("meeting")}
                style={dmBtnStyle}
              >
                📅 Book a Meeting
              </button>
              <button
                onClick={() => openMessageForm("connect")}
                style={dmBtnStyle}
              >
                🌸 Let's Connect
              </button>
              <button
                onClick={() => openMessageForm("collab")}
                style={dmBtnStyle}
              >
                🤝 Collab Request
              </button>
              <button onClick={() => setShowCharityModal(true)} style={dmBtnStyle}>
                ❤️ Support a Cause
              </button>
            </div>

            {/* Social + Contact + Links */}
            <div style={{ marginTop: "40px" }}>
              {socialHandles.map((s, i) => (
                <a
                  key={i}
                  href={`https://www.${s.platform.toLowerCase()}.com/${s.handle.replace("@","")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  @{s.handle}
                </a>
              ))}
              {emails.map((e, i) => (
                <a key={i} href={`mailto:${e.email}`} style={linkStyle}>
                  📧 {e.email}
                </a>
              ))}
              {phones.map((p, i) => (
                <a key={i} href={`tel:${p.number}`} style={linkStyle}>
                  📞 {p.number}
                </a>
              ))}
              {websites.map((w, i) => (
                <a key={i} href={w.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  🌐 {w.url}
                </a>
              ))}
              {portfolio?.url && (
                <a
                  href={portfolio.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  💼 Portfolio
                </a>
              )}
              {projects?.list &&
                projects.list.map((p, i) => (
                  <a
                    key={i}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={linkStyle}
                  >
                    📁 {p.title}
                  </a>
                ))}
            </div>

            <button
              onClick={() => setCurrentView("landing")}
              style={{
                marginTop: "60px",
                background: "transparent",
                border: "none",
                color: "#4f46e5",
                cursor: "pointer",
              }}
            >
              ← Back to Landing
            </button>
          </div>
        );

      // -----------------
      // 5️⃣ Inbox View
      // -----------------
      case "inbox":
        return (
          <div
            style={{
              background: "#f3f4f6",
              minHeight: "100vh",
              padding: "20px",
              fontFamily: "Poppins,sans-serif",
            }}
          >
            <h2 style={{ textAlign: "center" }}>📥 Inbox</h2>
            <button
              onClick={async () => {
                const q = query(
                  collection(db, "users", user.uid, "messages")
                );
                const snap = await getDocs(q);
                const arr = snap.docs
                  .map((d) => ({ id: d.id, ...d.data() }))
                  .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);
                setInbox(arr);
              }}
              style={{
                display: "block",
                margin: "10px auto 20px",
                background: "#6366f1",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              🔄 Refresh Inbox
            </button>

            {inbox?.length
              ? inbox.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: "white",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>{m.senderName}</strong>
                      <p style={{ margin: "4px 0" }}>{m.message}</p>
                      <small>{m.senderContact}</small>
                    </div>
                    <div style={{ fontSize: "18px" }}>
                      {m.isPriority && "⭐"}
                      {m.messageType === "meeting" && " 📅"}
                      {m.messageType === "collab" && " 🤝"}
                      {m.messageType === "connect" && " 🌸"}
                    </div>
                  </div>
                ))
              : "No messages yet."}
          </div>
        );

      // -----------------
      // 6️⃣ Not Found
      // -----------------
      case "not-found":
        return (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Poppins,sans-serif",
            }}
          >
            <h2>404 — Profile Not Found</h2>
            <button
              onClick={() => setCurrentView("landing")}
              style={{
                marginTop: "20px",
                background: "#6366f1",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Go Home
            </button>
          </div>
        );

      default:
        return <div>Loading…</div>;
    }
  };

  // 🔘 Shared Button Styles
  const dmBtnStyle = {
    display: "block",
    width: "80%",
    maxWidth: "300px",
    margin: "10px auto",
    padding: "12px 0",
    borderRadius: "12px",
    border: "none",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    background: "linear-gradient(135deg,#a78bfa 0%,#6366f1 100%)",
    color: "white",
  };

  const linkStyle = {
    display: "block",
    margin: "6px auto",
    color: "#1f2937",
    textDecoration: "none",
    fontWeight: "600",
  };

  // ----------------------------------------------------
  // 🧩 Render component view
  // ----------------------------------------------------
  return <>{renderView()}</>;
}

// ----------------------------------------------------
// 🌐 Wrapper Export with ErrorBoundary
// ----------------------------------------------------
export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <LinksAndDM />
    </ErrorBoundary>
  );
}
