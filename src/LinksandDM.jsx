import React, { useState, useEffect } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
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

// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// 2. STYLES (High-End & Glassmorphism)
// ==========================================
const styles = {
  container: {
    fontFamily: "'Inter', 'Poppins', sans-serif",
    minHeight: "100vh",
    color: "#1f2937",
    background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
  },
  landingHero: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    textAlign: "center",
    padding: "20px",
  },
  btnPrimary: {
    background: "#ffffff",
    color: "#764ba2",
    fontWeight: "800",
    fontSize: "18px",
    padding: "16px 32px",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
    width: "200px", // Fixed width for equality
    margin: "10px",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.2)",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "18px",
    padding: "16px 32px",
    borderRadius: "50px",
    border: "2px solid #ffffff",
    cursor: "pointer",
    backdropFilter: "blur(10px)",
    width: "200px", // Fixed width for equality
    margin: "10px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "30px",
    maxWidth: "480px",
    width: "100%",
    margin: "40px auto",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    border: "1px solid rgba(255,255,255,0.5)",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    marginBottom: "12px",
    fontSize: "16px",
    background: "#f9fafb",
    boxSizing: "border-box",
  },
  smartBtn: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    marginBottom: "10px",
    fontWeight: "600",
    color: "#374151",
  },
  eyeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  dmButtonPublic: {
    display: "block",
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "none",
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "12px",
    cursor: "pointer",
    color: "white",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
  },
  linkRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px",
    background: "white",
    borderRadius: "12px",
    marginBottom: "8px",
    textDecoration: "none",
    color: "#333",
    fontWeight: "600",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
function LinksAndDM() {
  // App State
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("landing");
  const [isSaving, setIsSaving] = useState(false);
  const [shareLink, setShareLink] = useState("");

  // Public Profile Logic
  const [receiverUid, setReceiverUid] = useState("");
  const [publicProfile, setPublicProfile] = useState({});
  const [contactsPublic, setContactsPublic] = useState([]);
  
  // Data State
  const [priorityContacts, setPriorityContacts] = useState([]); // Array of emails
  const [charityLinks, setCharityLinks] = useState([]);
  const [socialHandles, setSocialHandles] = useState([]);
  const [emails, setEmails] = useState([]);
  const [phones, setPhones] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [portfolio, setPortfolio] = useState({});
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState({
    name: "",
    profession: "",
    bio: "",
    username: "",
    profilePic: "",
    theme: "Light",
  });

  // Inbox State
  const [inbox, setInbox] = useState([]);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // 'meeting', 'collab', 'connect', 'cause', 'link'
  const [modalData, setModalData] = useState(null); // For generic link modals
  const [msgForm, setMsgForm] = useState({ name: "", email: "", message: "" });

  // ------------------------------------
  // AUTH & ROUTING
  // ------------------------------------
  useEffect(() => {
    // 1. Check URL for Public Profile
    const path = window.location.pathname;
    if (path.startsWith("/user/")) {
      const username = path.split("/user/")[1];
      if (username) {
        loadPublicProfile(username);
      }
    }

    // 2. Auth Listener
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUser(usr);
        await loadUserData(usr.uid);
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  // ------------------------------------
  // FIREBASE ACTIONS
  // ------------------------------------
  const loadUserData = async (uid) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      setProfile(d.profile || {});
      setPriorityContacts(d.priorityContacts || []);
      setCharityLinks(d.charityLinks || []);
      setSocialHandles(d.socialHandles || []);
      setEmails(d.emails || []);
      setPhones(d.phones || []);
      setWebsites(d.websites || []);
      setPortfolio(d.portfolio || {});
      setProjects(d.projects || []);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
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
      // Generate Link
      if (profile.username) {
        setShareLink(`https://linksanddms.netlify.app/user/${profile.username}`);
      }
      alert("✅ Saved Successfully!");
    } catch (e) {
      console.error(e);
      alert("Error saving data.");
    }
    setIsSaving(false);
  };

  const loadPublicProfile = async (username) => {
    try {
      const q = query(
        collection(db, "users"),
        where("profile.username", "==", username)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0].data();
        setReceiverUid(snap.docs[0].id);
        setPublicProfile(d.profile || {});
        // Store contacts locally for view
        setContactsPublic({
          priority: d.priorityContacts,
          charity: d.charityLinks,
          social: d.socialHandles,
          emails: d.emails,
          phones: d.phones,
          websites: d.websites,
          portfolio: d.portfolio,
          projects: d.projects,
        });
        setCurrentView("public-preview");
      } else {
        alert("User not found");
        setCurrentView("landing");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async () => {
    // Determine Receiver (Demo or Real)
    if (currentView === "demo-preview") {
      alert(`✅ Demo Message Sent!\nType: ${modalType}\nMessage: ${msgForm.message}`);
      setModalOpen(false);
      setMsgForm({ name: "", email: "", message: "" });
      return;
    }

    if (!receiverUid) return;

    // Check Priority
    let isPriority = false;
    // We need to check against the receiver's priority list (stored in contactsPublic for public view)
    if (contactsPublic?.priority?.some(p => p.toLowerCase() === msgForm.email.toLowerCase())) {
        isPriority = true;
    }

    try {
      await addDoc(collection(db, "users", receiverUid, "messages"), {
        senderName: msgForm.name,
        senderContact: msgForm.email,
        message: msgForm.message,
        type: modalType, // 'meeting', 'collab', 'connect'
        isPriority,
        timestamp: serverTimestamp(),
      });
      alert("✅ Message Sent!");
      setModalOpen(false);
      setMsgForm({ name: "", email: "", message: "" });
    } catch (e) {
      console.error(e);
      alert("Failed to send.");
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Enter your email for password reset:");
    if (email) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Check your email for reset instructions.");
      } catch (e) {
        alert(e.message);
      }
    }
  };

  // ------------------------------------
  // RENDER HELPERS
  // ------------------------------------
  const renderModal = () => {
    if (!modalOpen) return null;
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(5px)",
        }}
        onClick={(e) => {
            // Close if clicked outside card
            if(e.target === e.currentTarget) setModalOpen(false)
        }}
      >
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>
            {modalType === "meeting" && "📅 Book a Meeting"}
            {modalType === "collab" && "🤝 Collab Request"}
            {modalType === "connect" && "🌸 Let's Connect"}
            {modalType === "cause" && "❤️ Support a Cause"}
            {modalType === "link" && "🔗 Link Info"}
          </h3>

          {/* MESSAGE FORMS */}
          {(modalType === "meeting" || modalType === "collab" || modalType === "connect") && (
            <>
              <input
                style={styles.input}
                placeholder="Your Name"
                value={msgForm.name}
                onChange={(e) => setMsgForm({ ...msgForm, name: e.target.value })}
              />
              <input
                style={styles.input}
                placeholder="Your Email"
                value={msgForm.email}
                onChange={(e) => setMsgForm({ ...msgForm, email: e.target.value })}
              />
              <textarea
                style={{ ...styles.input, height: "100px" }}
                placeholder="Your Message..."
                value={msgForm.message}
                onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
              />
              <button
                style={{ ...styles.dmButtonPublic, background: "#6366f1" }}
                onClick={handleSendMessage}
              >
                Send Message
              </button>
            </>
          )}

          {/* CAUSE / LINK MODALS */}
          {(modalType === "cause" || modalType === "link") && (
             <div style={{textAlign: "center"}}>
                {modalType === "cause" && <p>This user supports:</p>}
                {modalData && modalData.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noreferrer" style={styles.linkRow}>
                        {item.title || item.url} ↗
                    </a>
                ))}
                {!modalData?.length && <p>No links available.</p>}
             </div>
          )}

          <button
            onClick={() => setModalOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              marginTop: "10px",
              cursor: "pointer",
              width: "100%"
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // ------------------------------------
  // VIEWS
  // ------------------------------------
  
  // 1. LANDING PAGE
  if (currentView === "landing") {
    return (
      <div style={styles.landingHero}>
        <h1 style={{ fontSize: "64px", fontWeight: "900", marginBottom: "20px" }}>
          LINKS & DM
        </h1>
        <p style={{ fontSize: "24px", maxWidth: "600px", lineHeight: "1.5" }}>
          The Ultimate Link-in-Bio for Businesses & Creators. <br />
          Sort DMs, Showcase Links, Build Your Brand.
        </p>
        <div style={{ marginTop: "40px", display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
          <button style={styles.btnPrimary} onClick={() => setCurrentView("auth")}>
            Get Started
          </button>
          <button style={styles.btnSecondary} onClick={() => setCurrentView("demo-preview")}>
            See Demo
          </button>
        </div>
      </div>
    );
  }

  // 2. AUTH PAGE
  if (currentView === "auth") {
    return (
      <div style={styles.container}>
        <div style={{ paddingTop: "60px" }}>
          <div style={styles.card}>
            <h2 style={{ textAlign: "center", fontSize: "28px" }}>Welcome</h2>
            <p style={{ textAlign: "center", color: "#6b7280" }}>Login or Sign Up below</p>
            <input id="email" style={styles.input} placeholder="Email" />
            <input id="password" type="password" style={styles.input} placeholder="Password" />
            
            <button
              style={{ ...styles.dmButtonPublic, background: "#764ba2" }}
              onClick={async () => {
                const e = document.getElementById("email").value;
                const p = document.getElementById("password").value;
                try {
                  await signInWithEmailAndPassword(auth, e, p);
                  setCurrentView("editor");
                } catch {
                  try {
                    await createUserWithEmailAndPassword(auth, e, p);
                    setCurrentView("editor");
                  } catch (err) {
                    alert(err.message);
                  }
                }
              }}
            >
              Continue
            </button>

            <button
               onClick={handleForgotPassword}
               style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", display: "block", margin: "10px auto" }}
            >
              Forgot Password?
            </button>

            <button
              onClick={() => setCurrentView("landing")}
              style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "block", margin: "20px auto" }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. DEMO PREVIEW (PERFECT PROFILE)
  if (currentView === "demo-preview") {
    return (
      <div style={{ ...styles.container, background: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)", padding: "40px 20px" }}>
        {renderModal()}
        <div style={styles.card}>
            <div style={{ textAlign: "center" }}>
                <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" 
                    alt="Demo" 
                    style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid white" }}
                />
                <h2 style={{ margin: "10px 0 5px" }}>Sarah Creator</h2>
                <p style={{ color: "#555", fontStyle: "italic" }}>Digital Artist & Influencer</p>
                <p>Welcome to my world! ✨ Connect with me properly using the buttons below.</p>
            </div>

            <div style={{ marginTop: "30px" }}>
                {/* DM Sorter Buttons */}
                <button 
                    style={{ ...styles.dmButtonPublic, background: "linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)" }}
                    onClick={() => { setModalType("meeting"); setModalOpen(true); }}
                >
                    📅 Book a Meeting
                </button>
                <button 
                    style={{ ...styles.dmButtonPublic, background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)" }}
                    onClick={() => { setModalType("collab"); setModalOpen(true); }}
                >
                    🤝 Collab Request
                </button>
                <button 
                    style={{ ...styles.dmButtonPublic, background: "linear-gradient(90deg, #fa709a 0%, #fee140 100%)" }}
                    onClick={() => { setModalType("connect"); setModalOpen(true); }}
                >
                    🌸 Let's Connect
                </button>
                
                {/* Mock Link Buttons */}
                <button style={{ ...styles.dmButtonPublic, background: "#fb7185" }} onClick={() => alert("Demo: Opens Charity Links")}>
                     ❤️ Support a Cause
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button style={styles.linkRow} onClick={() => alert("Demo: Instagram/Twitter")}>📸 Handles</button>
                    <button style={styles.linkRow} onClick={() => alert("Demo: Mailto")}>📧 Email</button>
                    <button style={styles.linkRow} onClick={() => alert("Demo: Call")}>📞 Contact</button>
                    <button style={styles.linkRow} onClick={() => alert("Demo: Website")}>🌐 Website</button>
                </div>
            </div>

            <button 
                onClick={() => setCurrentView("landing")} 
                style={{ marginTop: "20px", width: "100%", padding: "10px", background: "transparent", border: "none", cursor: "pointer" }}
            >
                Exit Demo
            </button>
        </div>
      </div>
    );
  }

  // 4. EDITOR (PRIVATE)
  if (currentView === "editor") {
    return (
      <div style={{ ...styles.container, background: "#f3f4f6", paddingBottom: "100px" }}>
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2>✏️ Editor</h2>
            <div>
                 <button onClick={() => setCurrentView("inbox")} style={{ marginRight: "10px", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", border: "none", background: "#6366f1", color: "white" }}>
                    📥 Inbox
                 </button>
                 <button onClick={() => signOut(auth)} style={{ cursor: "pointer", padding: "8px 16px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white" }}>
                    Logout
                 </button>
            </div>
          </div>

          <div style={styles.card}>
            <h3>Profile Info</h3>
            <input style={styles.input} placeholder="Name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            <input style={styles.input} placeholder="Profession" value={profile.profession} onChange={e => setProfile({...profile, profession: e.target.value})} />
            <textarea style={styles.input} placeholder="Bio" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
            <input style={styles.input} placeholder="Username (no spaces)" value={profile.username} onChange={e => setProfile({...profile, username: e.target.value.replace(/\s/g, "")})} />
            <input style={styles.input} placeholder="Profile Pic URL" value={profile.profilePic} onChange={e => setProfile({...profile, profilePic: e.target.value})} />
            
            <button 
                onClick={saveProfile} 
                disabled={isSaving}
                style={{ width: "100%", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" }}
            >
                {isSaving ? "Saving..." : "💾 Save Changes"}
            </button>
            
            {shareLink && (
                <div style={{ marginTop: "15px", padding: "10px", background: "#ecfdf5", borderRadius: "8px", textAlign: "center", wordBreak: "break-all" }}>
                    <small>Your Public Link:</small><br/>
                    <a href={shareLink} target="_blank" rel="noreferrer" style={{ fontWeight: "bold", color: "#059669" }}>{shareLink}</a>
                </div>
            )}
          </div>

          <div style={styles.card}>
             <h3>⭐ Priority Contacts</h3>
             <p style={{ fontSize: "12px", color: "#666" }}>Add emails of friends/family. Their messages will have a star.</p>
             {priorityContacts.map((email, i) => (
                 <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                     <input 
                        style={{ ...styles.input, marginBottom: 0 }} 
                        value={email} 
                        onChange={e => {
                            const newArr = [...priorityContacts];
                            newArr[i] = e.target.value;
                            setPriorityContacts(newArr);
                        }}
                     />
                 </div>
             ))}
             <button onClick={() => setPriorityContacts([...priorityContacts, ""])} style={{ fontSize: "12px", cursor: "pointer", background: "none", border: "1px dashed #ccc", padding: "4px 8px", borderRadius: "4px" }}>+ Add Email</button>
          </div>

          <div style={styles.card}>
            <h3>Smart DM Buttons</h3>
            <div style={styles.smartBtn}><span>📅 Book a Meeting</span> <button style={styles.eyeBtn}>👁️</button></div>
            <div style={styles.smartBtn}><span>🤝 Collab Request</span> <button style={styles.eyeBtn}>👁️</button></div>
            <div style={styles.smartBtn}><span>🌸 Let's Connect</span> <button style={styles.eyeBtn}>👁️</button></div>
          </div>

          <div style={styles.card}>
             <h3>Links & Contacts</h3>
             {/* Simple list editors for brevity */}
             <h4>Social Handles</h4>
             {socialHandles.map((h, i) => (
                 <div key={i} style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
                     <input placeholder="Platform (e.g. Instagram)" style={styles.input} value={h.platform} onChange={e => {const n=[...socialHandles];n[i].platform=e.target.value;setSocialHandles(n)}} />
                     <input placeholder="@username" style={styles.input} value={h.handle} onChange={e => {const n=[...socialHandles];n[i].handle=e.target.value;setSocialHandles(n)}} />
                 </div>
             ))}
             <button onClick={() => setSocialHandles([...socialHandles, {platform:"", handle:""}])}>+ Add Handle</button>

             <h4 style={{ marginTop: "20px" }}>Emails</h4>
             {emails.map((item, i) => (
                 <input key={i} style={styles.input} value={item.email} placeholder="Email Address" onChange={e => {const n=[...emails];n[i].email=e.target.value;setEmails(n)}} />
             ))}
             <button onClick={() => setEmails([...emails, {email:""}])}>+ Add Email</button>

             <h4 style={{ marginTop: "20px" }}>Charity Links</h4>
             {charityLinks.map((l, i) => (
                 <div key={i} style={{ display: "flex", gap: "5px", marginBottom: "5px" }}>
                    <input placeholder="Title" style={styles.input} value={l.title} onChange={e => {const n=[...charityLinks];n[i].title=e.target.value;setCharityLinks(n)}} />
                    <input placeholder="URL" style={styles.input} value={l.url} onChange={e => {const n=[...charityLinks];n[i].url=e.target.value;setCharityLinks(n)}} />
                 </div>
             ))}
             <button onClick={() => setCharityLinks([...charityLinks, {title:"", url:""}])}>+ Add Cause</button>
          </div>
        </div>
      </div>
    );
  }

  // 5. PUBLIC PROFILE (LIVE)
  if (currentView === "public-preview") {
    return (
      <div style={{ ...styles.container, background: "linear-gradient(180deg, #e0c3fc 0%, #8ec5fc 100%)", padding: "40px 20px" }}>
        {renderModal()}
        <div style={styles.card}>
           <div style={{ textAlign: "center" }}>
               <img 
                   src={publicProfile.profilePic || "https://via.placeholder.com/150"} 
                   alt="Profile" 
                   style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", border: "4px solid white" }}
               />
               <h2 style={{ margin: "10px 0 5px" }}>{publicProfile.name}</h2>
               <p style={{ fontStyle: "italic", color: "#555" }}>{publicProfile.profession}</p>
               <p>{publicProfile.bio}</p>
           </div>

           <div style={{ marginTop: "30px" }}>
                {/* DM Buttons - Open Modals */}
                <button style={{ ...styles.dmButtonPublic, background: "#6366f1" }} onClick={() => { setModalType("meeting"); setModalOpen(true); }}>📅 Book a Meeting</button>
                <button style={{ ...styles.dmButtonPublic, background: "#10b981" }} onClick={() => { setModalType("collab"); setModalOpen(true); }}>🤝 Collab Request</button>
                <button style={{ ...styles.dmButtonPublic, background: "#f472b6" }} onClick={() => { setModalType("connect"); setModalOpen(true); }}>🌸 Let's Connect</button>
                
                {/* Cause */}
                {contactsPublic.charity?.length > 0 && (
                    <button style={{ ...styles.dmButtonPublic, background: "#FB7185" }} onClick={() => { setModalType("cause"); setModalData(contactsPublic.charity); setModalOpen(true); }}>
                        ❤️ Support a Cause
                    </button>
                )}
           </div>

           <div style={{ marginTop: "20px" }}>
               {/* Real Links */}
               {contactsPublic.social?.map((s, i) => (
                   <a key={i} href={`https://${s.platform.toLowerCase()}.com/${s.handle.replace("@","")}`} target="_blank" rel="noreferrer" style={styles.linkRow}>
                       @{s.handle} ({s.platform})
                   </a>
               ))}
               {contactsPublic.emails?.map((e, i) => (
                   <a key={i} href={`mailto:${e.email}`} style={styles.linkRow}>📧 {e.email}</a>
               ))}
               {contactsPublic.phones?.map((p, i) => (
                   <a key={i} href={`tel:${p.number}`} style={styles.linkRow}>📞 {p.number}</a>
               ))}
           </div>
        </div>
      </div>
    );
  }

  // 6. INBOX (PRIVATE)
  if (currentView === "inbox") {
    return (
        <div style={{ ...styles.container, background: "#f3f4f6", padding: "20px" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2>📥 Inbox</h2>
                    <button onClick={() => setCurrentView("editor")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none" }}>Back to Editor</button>
                </div>
                
                <button 
                    onClick={async () => {
                        if (!user) return;
                        const q = query(collection(db, "users", user.uid, "messages"));
                        const snap = await getDocs(q);
                        const msgs = snap.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => b.timestamp?.seconds - a.timestamp?.seconds);
                        setInbox(msgs);
                    }}
                    style={{ ...styles.dmButtonPublic, background: "#6366f1", marginBottom: "20px" }}
                >
                    🔄 Refresh Messages
                </button>

                {inbox.map(msg => (
                    <div key={msg.id} style={{ background: "white", padding: "15px", borderRadius: "12px", marginBottom: "10px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: msg.isPriority ? "5px solid #fbbf24" : "5px solid #e5e7eb" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <strong>{msg.senderName}</strong>
                            <span style={{ fontSize: "20px" }}>
                                {msg.isPriority && "⭐ "} 
                                {msg.type === "meeting" && "📅"}
                                {msg.type === "collab" && "🤝"}
                                {msg.type === "connect" && "🌸"}
                            </span>
                        </div>
                        <p style={{ margin: "5px 0", color: "#374151" }}>{msg.message}</p>
                        <small style={{ color: "#9ca3af" }}>From: {msg.senderContact}</small>
                    </div>
                ))}
                {inbox.length === 0 && <p style={{ textAlign: "center" }}>No messages loaded. Click refresh.</p>}
            </div>
        </div>
    );
  }

  return <div>Loading...</div>;
}

export default LinksAndDM;
