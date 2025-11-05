import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAAFqbEIL3TOAcFmsxoqltJfrtfE2sOXVs",
  authDomain: "links-dm-pro.firebaseapp.com",
  projectId: "links-dm-pro",
  storageBucket: "links-dm-pro.appspot.com",
  messagingSenderId: "965082307073",
  appId: "1:965082307073:web:78ea49e4c5888852307e00",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const LinksAndDM = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedButtonToColor, setSelectedButtonToColor] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Auth states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');

  // Profile states
  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    profession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    username: '',
    profilePic: null,
    selectedTheme: 0,
  });

  const [dmButtons, setDmButtons] = useState({
    bookMeeting: { enabled: true, link: '', label: 'Book a Meeting', icon: '📅' },
    letsConnect: { enabled: true, label: "Let's Connect", icon: '💬' },
    collabRequest: { enabled: true, label: 'Collab Request', icon: '🤝' },
    supportCause: { enabled: false, label: 'Support a Cause', icon: '❤️' },
  });

  const [charityLinks, setCharityLinks] = useState([]);
  const [socialHandles, setSocialHandles] = useState([]);
  const [emails, setEmails] = useState([]);
  const [phones, setPhones] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [portfolio, setPortfolio] = useState({ enabled: false, url: '' });
  const [projects, setProjects] = useState({ enabled: false, list: [] });
  const [priorityContacts, setPriorityContacts] = useState([]);
  
  // UI states
  const [messageType, setMessageType] = useState(null);
  const [messageForm, setMessageForm] = useState({ name: '', contact: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Button colors
  const [buttonColors, setButtonColors] = useState({
    bookMeeting: { bg: '#ADD8E6', text: '#0066cc' },
    letsConnect: { bg: '#DDA0DD', text: '#8B008B' },
    collabRequest: { bg: '#AFEEEE', text: '#008B8B' },
    supportCause: { bg: '#FFB6D9', text: '#C71585' },
    handles: { bg: '#FFB6C1', text: '#C71585' },
    email: { bg: '#B0E0E6', text: '#1E90FF' },
    contact: { bg: '#B4F8C8', text: '#228B22' },
    website: { bg: '#DDA0DD', text: '#663399' },
    portfolio: { bg: '#B0E0E6', text: '#1E90FF' },
    projects: { bg: '#FFDAB9', text: '#FF8C00' },
    charities: { bg: '#FFB6D9', text: '#C71585' },
  });

  const themes = [
    { name: 'Turquoise Dream', gradient: 'linear-gradient(135deg, #40E0D0 0%, #20B2AA 100%)' },
    { name: 'Ice Blue', gradient: 'linear-gradient(135deg, #B0E0E6 0%, #87CEEB 100%)' },
    { name: 'Pastel Mint', gradient: 'linear-gradient(135deg, #98FF98 0%, #AFEEEE 100%)' },
    { name: 'Soft Lavender', gradient: 'linear-gradient(135deg, #DDA0DD 0%, #E6E6FA 100%)' },
    { name: 'Peach Cream', gradient: 'linear-gradient(135deg, #FFDAB9 0%, #FFE4B5 100%)' },
    { name: 'Rose Quartz', gradient: 'linear-gradient(135deg, #FF69B4 0%, #FFB6C1 100%)' },
    { name: 'Aquamarine', gradient: 'linear-gradient(135deg, #7FFFD4 0%, #40E0D0 100%)' },
    { name: 'Powder Blue', gradient: 'linear-gradient(135deg, #B0E0E6 0%, #ADD8E6 100%)' },
    { name: 'Honeydew', gradient: 'linear-gradient(135deg, #F0FFF0 0%, #E0FFE0 100%)' },
    { name: 'Misty Rose', gradient: 'linear-gradient(135deg, #FFE4E1 0%, #FFE4C4 100%)' },
    { name: 'Sky', gradient: 'linear-gradient(135deg, #87CEEB 0%, #E0FFFF 100%)' },
    { name: 'Orchid Dream', gradient: 'linear-gradient(135deg, #DA70D6 0%, #EE82EE 100%)' },
  ];

  // Auth Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser.uid);
      }
      setLoading(false);
    }, (error) => {
      console.error('Auth error:', error);
      setError('Authentication failed: ' + error.message);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load user profile from Firebase
  const loadUserProfile = async (uid) => {
    try {
      const profileRef = doc(db, 'users', uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfile(data.profile || profile);
        setDmButtons(data.dmButtons || dmButtons);
        setCharityLinks(data.charityLinks || []);
        setSocialHandles(data.socialHandles || []);
        setEmails(data.emails || []);
        setPhones(data.phones || []);
        setWebsites(data.websites || []);
        setPortfolio(data.portfolio || { enabled: false, url: '' });
        setProjects(data.projects || { enabled: false, list: [] });
        setPriorityContacts(data.priorityContacts || []);
        setButtonColors(data.buttonColors || buttonColors);
      }
      loadMessages(uid);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Load messages
  const loadMessages = async (uid) => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('recipientId', '==', uid), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const msgs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Authentication handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setCurrentView('editor');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const uid = userCred.user.uid;
        const username = authEmail.split('@')[0];
        
        await setDoc(doc(db, 'users', uid), {
          email: authEmail,
          username: username,
          profile: { ...profile, username: username },
          dmButtons,
          charityLinks: [],
          socialHandles: [],
          emails: [],
          phones: [],
          websites: [],
          portfolio: { enabled: false, url: '' },
          projects: { enabled: false, list: [] },
          priorityContacts: [],
          buttonColors,
          createdAt: new Date(),
        });
        setCurrentView('editor');
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('landing');
    setProfile({
      name: 'Your Name Here',
      profession: 'Your Profession',
      bio: 'Add your bio here! 🌟',
      username: '',
      profilePic: null,
      selectedTheme: 0,
    });
  };

  // Save profile to Firebase
  const saveProfile = async () => {
    if (!user) return;
    try {
      const username = profile.username.trim();
      await updateDoc(doc(db, 'users', user.uid), {
        profile: { ...profile, username },
        dmButtons,
        charityLinks,
        socialHandles,
        emails,
        phones,
        websites,
        portfolio,
        projects,
        priorityContacts,
        buttonColors,
        username: username,
        lastUpdated: new Date(),
      });
      alert('✅ Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error saving profile');
    }
  };

  // Generate share link
  const generateShareLink = () => {
    if (!profile.username) {
      alert('⚠️ Please set a username first!');
      return;
    }
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/user/${profile.username}`;
    setShareLink(link);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageForm.name || !messageForm.contact || !messageForm.message) {
      alert('Please fill all fields');
      return;
    }
    try {
      await addDoc(collection(db, 'messages'), {
        recipientId: user.uid,
        senderName: messageForm.name,
        senderContact: messageForm.contact,
        message: messageForm.message,
        messageType: messageType?.icon || '💬',
        timestamp: new Date(),
        isPriority: priorityContacts.some(c => c.handle === messageForm.contact),
      });
      setShowMessageForm(false);
      setMessageForm({ name: '', contact: '', message: '' });
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const handleMessageFormOpen = (buttonKey) => {
    setMessageType(dmButtons[buttonKey]);
    setShowMessageForm(true);
  };

  const getFilteredMessages = () => {
    let filtered = messages;
    if (inboxFilter === 'priority') {
      filtered = messages.filter(m => m.isPriority);
    }
    return filtered;
  };

  const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const getSocialMediaUrl = (platform, handle) => {
    const urls = {
      'Instagram': `https://instagram.com/${handle.replace('@', '')}`,
      'Twitter': `https://twitter.com/${handle.replace('@', '')}`,
      'TikTok': `https://tiktok.com/@${handle.replace('@', '')}`,
      'LinkedIn': `https://linkedin.com/in/${handle.replace('@', '')}`,
      'YouTube': `https://youtube.com/@${handle.replace('@', '')}`,
      'Facebook': `https://facebook.com/${handle.replace('@', '')}`,
    };
    return urls[platform] || `https://${platform}.com/${handle}`;
  };

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profilePic: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#ffebee',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{
          background: 'white',
          border: '3px solid #dc2626',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>❌ Error</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); }}
            style={{
              background: '#667eea',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5a6c5 0%, #a8d8ea 100%)',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: 0 }}>Loading Links & DM...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // LANDING PAGE
  if (currentView === 'landing') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f591ba, #f2bc7c, #7fda7f)',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
              margin: 0,
            }}>🔗 Links & DM 💬</h1>
            <button
              onClick={() => user ? setCurrentView('editor') : setCurrentView('auth')}
              style={{
                background: 'white',
                color: '#8B5CF6',
                padding: '12px 40px',
                borderRadius: '50px',
                border: '3px solid #E9D5FF',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {user ? '✏️ Edit' : "Let's Do It!"}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h1 style={{
              fontSize: '72px',
              fontWeight: '900',
              color: 'white',
              textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
              margin: '0 0 32px 0',
            }}>One Link. Sorted DMs.</h1>
            <p style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              marginBottom: '12px',
            }}>The Ultimate Link-in-Bio for Creators 🌟</p>
            <p style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
            }}>Manage all your links, messages & projects in one beautiful place</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '64px',
          }}>
            {[
              { emoji: '💬', title: 'Smart DM Sorting', desc: 'Organize messages', gradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)' },
              { emoji: '🎨', title: '12 Beautiful Themes', desc: 'Choose your vibe', gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)' },
              { emoji: '📱', title: 'All Socials', desc: 'Connect platforms', gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' },
              { emoji: '📧', title: 'Email Hub', desc: 'Never miss emails', gradient: 'linear-gradient(135deg, #3B82F6 0%, #06E0FF 100%)' },
              { emoji: '📁', title: 'Portfolio & Projects', desc: 'Showcase work', gradient: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)' },
              { emoji: '📞', title: 'Contact Central', desc: 'Everything connected', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                background: feature.gradient,
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: '3px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{feature.emoji}</div>
                <h3 style={{ fontSize: '20px', color: 'white', fontWeight: 'bold', margin: '0 0 8px 0' }}>{feature.title}</h3>
                <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>
            <p>Trusted by Influencers, Celebrities & Brands 💎</p>
          </div>
        </div>
      </div>
    );
  }

  // AUTH PAGE
  if (currentView === 'auth' && !user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f591ba, #f2bc7c, #7fda7f)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
            {authMode === 'signin' ? '🔐 Sign In' : '📝 Sign Up'}
          </h2>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              style={{
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            />
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              style={{
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            />

            {authError && <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>❌ {authError}</p>}

            <button
              type="submit"
              style={{
                background: '#667eea',
                color: 'white',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontWeight: 'bold',
                textDecoration: 'underline',
              }}
            >
              {authMode === 'signin' ? 'Need an account?' : 'Already have an account?'}
            </button>
          </div>

          <button
            onClick={() => setCurrentView('landing')}
            style={{
              width: '100%',
              background: 'white',
              color: '#667eea',
              padding: '12px',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // PREVIEW PAGE
  if (currentView === 'preview') {
    const theme = themes[profile.selectedTheme];

    return (
      <div style={{
        minHeight: '100vh',
        background: theme.gradient,
        padding: '32px 16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
              margin: '0 0 8px 0',
            }}>🔗 Links&DM 💬</h1>
            <p style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              margin: 0,
            }}>Connect • Collaborate • Create</p>
          </div>

          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            {profile.profilePic ? (
              <img
                src={profile.profilePic}
                alt="Profile"
                style={{
                  width: '176px',
                  height: '176px',
                  borderRadius: '50%',
                  border: '8px solid white',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  margin: '0 auto 24px auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{
                width: '176px',
                height: '176px',
                borderRadius: '50%',
                border: '8px solid white',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                margin: '0 auto 24px auto',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
              }}>
                📸
              </div>
            )}
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
              margin: '0 0 8px 0',
            }}>
              {profile.name}
            </h2>
            <p style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              margin: '0 0 12px 0',
            }}>
              {profile.profession}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: '14px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              fontWeight: '600',
              margin: 0,
            }}>
              {profile.bio}
            </p>
          </div>

          {/* DM Buttons */}
          <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {dmButtons.bookMeeting.enabled && (
              <button
                onClick={() => handleMessageFormOpen('bookMeeting')}
                style={{
                  width: '100%',
                  borderRadius: '24px',
                  padding: '20px 24px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.5)',
                  background: buttonColors.bookMeeting.bg,
                  color: buttonColors.bookMeeting.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '28px' }}>📅</span>
                <span>{dmButtons.bookMeeting.label}</span>
              </button>
            )}

            {dmButtons.letsConnect.enabled && (
              <button
                onClick={() => handleMessageFormOpen('letsConnect')}
                style={{
                  width: '100%',
                  borderRadius: '24px',
                  padding: '20px 24px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.5)',
                  background: buttonColors.letsConnect.bg,
                  color: buttonColors.letsConnect.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '28px' }}>💬</span>
                <span>{dmButtons.letsConnect.label}</span>
              </button>
            )}

            {dmButtons.collabRequest.enabled && (
              <button
                onClick={() => handleMessageFormOpen('collabRequest')}
                style={{
                  width: '100%',
                  borderRadius: '24px',
                  padding: '20px 24px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.5)',
                  background: buttonColors.collabRequest.bg,
                  color: buttonColors.collabRequest.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '28px' }}>🤝</span>
                <span>{dmButtons.collabRequest.label}</span>
              </button>
            )}

            {dmButtons.supportCause.enabled && charityLinks.length > 0 && (
              <button
                onClick={() => setShowModal('charities')}
                style={{
                  width: '100%',
                  borderRadius: '24px',
                  padding: '20px 24px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.5)',
                  background: buttonColors.supportCause.bg,
                  color: buttonColors.supportCause.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '28px' }}>❤️</span>
                <span>{dmButtons.supportCause.label}</span>
              </button>
            )}
          </div>

          {/* Category Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '40px',
          }}>
            {socialHandles.length > 0 && (
              <button
                onClick={() => setShowModal('handles')}
                style={{
                  borderRadius: '24px',
                  padding: '20px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: buttonColors.handles.bg,
                  color: buttonColors.handles.text,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>🌐</span>
                <span>@ Handles</span>
              </button>
            )}

            {emails.length > 0 && (
              <button
                onClick={() => setShowModal('email')}
                style={{
                  borderRadius: '24px',
                  padding: '20px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: buttonColors.email.bg,
                  color: buttonColors.email.text,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>📧</span>
                <span>Email</span>
              </button>
            )}

            {phones.length > 0 && (
              <button
                onClick={() => setShowModal('contact')}
                style={{
                  borderRadius: '24px',
                  padding: '20px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: buttonColors.contact.bg,
                  color: buttonColors.contact.text,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>📱</span>
                <span>Contact</span>
              </button>
            )}

            {websites.length > 0 && (
              <button
                onClick={() => setShowModal('website')}
                style={{
                  borderRadius: '24px',
                  padding: '20px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: buttonColors.website.bg,
                  color: buttonColors.website.text,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>🌍</span>
                <span>Website</span>
              </button>
            )}

            {portfolio.enabled && portfolio.url && (
              <button
                onClick={() => window.open(formatUrl(portfolio.url), '_blank')}
                style={{
                  borderRadius: '24px',
                  padding: '20px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: buttonColors.portfolio.bg,
                  color: buttonColors.portfolio.text,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>🎨</span>
                <span>Portfolio</span>
              </button>
            )}

            {projects.enabled && projects.list.length > 0 && (
              <button
                onClick={() => setShowModal('projects')}
                style={{
                  borderRadius: '24px',
                  padding: '20px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: buttonColors.projects.bg,
                  color: buttonColors.projects.text,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '28px' }}>📁</span>
                <span>Projects</span>
              </button>
            )}
          </div>

          {/* MODALS - NOW WITH CLICKABLE LINKS */}

          {/* Handles Modal - CLICKABLE SOCIAL MEDIA LINKS */}
          {showModal === 'handles' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🌐 Handles</h3>
                  <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {socialHandles.map((handle, idx) => (
                    <a
                      key={idx}
                      href={getSocialMediaUrl(handle.platform, handle.handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '16px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', margin: '0 0 4px 0' }}>{handle.platform}</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0066cc', margin: 0, wordBreak: 'break-all' }}>{handle.handle}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Modal - CLICKABLE MAILTO LINKS */}
          {showModal === 'email' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>📧 Email</h3>
                  <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {emails.map((email, idx) => (
                    <a
                      key={idx}
                      href={`mailto:${email}`}
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '16px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E90FF', margin: 0, wordBreak: 'break-all' }}>{email}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Modal - CLICKABLE TEL LINKS */}
          {showModal === 'contact' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>📱 Contact</h3>
                  <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {phones.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${phone}`}
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '16px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#228B22', margin: 0, wordBreak: 'break-all' }}>{phone}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Website Modal - CLICKABLE EXTERNAL LINKS */}
          {showModal === 'website' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🌍 Website</h3>
                  <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                  {websites.map((website, idx) => (
                    <a
                      key={idx}
                      href={formatUrl(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '16px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#663399', margin: 0, wordBreak: 'break-all' }}>{website}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Projects Modal - CLICKABLE PROJECT LINKS */}
          {showModal === 'projects' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>📁 Projects</h3>
                  <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {projects.list.map((project, idx) => (
                    <a
                      key={idx}
                      href={formatUrl(project.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '16px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', margin: '0 0 4px 0' }}>Project</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#FF8C00', margin: '0 0 4px 0', wordBreak: 'break-all' }}>{project.title}</p>
                      <p style={{ fontSize: '12px', color: '#999', margin: 0, wordBreak: 'break-all' }}>{project.url}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Charities Modal - CLICKABLE CHARITY LINKS */}
          {showModal === 'charities' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>❤️ Support a Cause</h3>
                  <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {charityLinks.map((charity, idx) => (
                    <a
                      key={idx}
                      href={formatUrl(charity.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '16px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', margin: '0 0 4px 0' }}>{charity.name || 'Charity'}</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#EC4899', margin: 0, wordBreak: 'break-all' }}>{charity.url}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message Form Modal */}
          {showMessageForm && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Send Message</h3>
                  <button onClick={() => setShowMessageForm(false)} style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#333' }}>Name</label>
                    <input
                      type="text"
                      value={messageForm.name}
                      onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                      placeholder="Your name"
                      style={{
                        width: '100%',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#333' }}>Email or Handle</label>
                    <input
                      type="text"
                      value={messageForm.contact}
                      onChange={(e) => setMessageForm({ ...messageForm, contact: e.target.value })}
                      placeholder="email@example.com or @handle"
                      style={{
                        width: '100%',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', fontSize: '12px', marginBottom: '8px', color: '#333' }}>Message</label>
                    <textarea
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      placeholder="Your message..."
                      style={{
                        width: '100%',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        boxSizing: 'border-box',
                        minHeight: '100px',
                        resize: 'none',
                      }}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    style={{
                      background: '#667eea',
                      color: 'white',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '10px',
                    }}
                  >
                    Send Message ✨
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          {showConfirmation && (
            <div style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#10B981',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              zIndex: '2000',
              fontWeight: 'bold',
            }}>
              ✅ Message sent! Thanks for reaching out!
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setCurrentView('landing')}
              style={{
                background: 'rgba(255,255,255,0.4)',
                border: '3px solid white',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>

            {user ? (
              <>
                <button
                  onClick={() => setCurrentView('editor')}
                  style={{
                    background: 'rgba(255,255,255,0.4)',
                    border: '3px solid white',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  ✏️ Editor
                </button>
                <button
                  onClick={() => setCurrentView('inbox')}
                  style={{
                    background: 'rgba(255,255,255,0.4)',
                    border: '3px solid white',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  📬 Inbox ({messages.length})
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentView('auth')}
                style={{
                  background: 'rgba(255,255,255,0.4)',
                  border: '3px solid white',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                🔐 Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // EDITOR PAGE
  if (currentView === 'editor' && user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f591ba, #f2bc7c, #7fda7f)',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', color: 'white', fontWeight: 'bold', margin: 0 }}>✏️ Edit Profile</h1>
            <button
              onClick={handleLogout}
              style={{
                background: '#dc2626',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🚪 Logout
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '30px' }}>
            <button
              onClick={() => saveProfile()}
              style={{
                background: '#10B981',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              💾 Save
            </button>
            <button
              onClick={() => { saveProfile(); setCurrentView('preview'); }}
              style={{
                background: '#3B82F6',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              👁️ Preview
            </button>
            <button
              onClick={() => setCurrentView('inbox')}
              style={{
                background: '#8B5CF6',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              📬 Inbox ({messages.length})
            </button>
          </div>

          {/* Profile Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: 'bold' }}>👤 Profile</h2>

            {/* Profile Picture */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <label style={{ cursor: 'pointer' }}>
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt="Profile" style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #667eea',
                  }} />
                ) : (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    border: '3px solid #667eea',
                    margin: '0 auto',
                  }}>
                    📸
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleProfilePicUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box',
                  }}
                  maxLength="50"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Profession</label>
                <input
                  type="text"
                  value={profile.profession}
                  onChange={(e) => setProfile(prev => ({ ...prev, profession: e.target.value }))}
                  style={{
                    width: '100%',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box',
                  }}
                  maxLength="50"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  style={{
                    width: '100%',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box',
                    minHeight: '80px',
                    resize: 'vertical',
                  }}
                  maxLength="200"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Username (for shareable link)</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g., john_doe"
                  style={{
                    width: '100%',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    padding: '10px',
                    fontWeight: 'bold',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                  }}
                  maxLength="30"
                />
                {profile.username && (
                  <>
                    <button
                      onClick={generateShareLink}
                      style={{
                        width: '100%',
                        background: '#3B82F6',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginBottom: '10px',
                      }}
                    >
                      🔗 Generate Share Link
                    </button>
                    {shareLink && (
                      <div style={{
                        background: '#F3F4F6',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '10px',
                      }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Your Link:</p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={shareLink}
                            readOnly
                            style={{
                              flex: 1,
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              padding: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              boxSizing: 'border-box',
                            }}
                          />
                          <button
                            onClick={copyToClipboard}
                            style={{
                              background: copySuccess ? '#10B981' : '#667eea',
                              color: 'white',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {copySuccess ? '✅ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#999' }}>📱 Paste this in your Instagram bio to share your profile!</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Themes Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>🎨 Choose Theme</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '12px',
            }}>
              {themes.map((theme, idx) => (
                <button
                  key={idx}
                  onClick={() => setProfile(prev => ({ ...prev, selectedTheme: idx }))}
                  style={{
                    background: theme.gradient,
                    border: profile.selectedTheme === idx ? '4px solid #333' : '2px solid #ddd',
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    color: 'white',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                  }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* DM Buttons Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>💌 Message Buttons</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(dmButtons).map(([key, btn]) => (
                <div key={key} style={{
                  background: '#F3F4F6',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <input
                    type="checkbox"
                    checked={btn.enabled}
                    onChange={() => setDmButtons(prev => ({
                      ...prev,
                      [key]: { ...prev[key], enabled: !prev[key].enabled }
                    }))}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '20px' }}>{btn.icon}</span>
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) => setDmButtons(prev => ({
                      ...prev,
                      [key]: { ...prev[key], label: e.target.value }
                    }))}
                    style={{
                      flex: 1,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                    }}
                    maxLength="25"
                  />
                  <button
                    onClick={() => {
                      setSelectedButtonToColor(key);
                      setShowColorPicker(true);
                    }}
                    style={{
                      background: buttonColors[key].bg,
                      color: buttonColors[key].text,
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    🎨 Color
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Social Handles Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>🌐 Social Handles</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {socialHandles.map((handle, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={handle.platform}
                    onChange={(e) => {
                      const newHandles = [...socialHandles];
                      newHandles[idx].platform = e.target.value;
                      setSocialHandles(newHandles);
                    }}
                    placeholder="Instagram"
                    style={{
                      flex: 0.4,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="text"
                    value={handle.handle}
                    onChange={(e) => {
                      const newHandles = [...socialHandles];
                      newHandles[idx].handle = e.target.value;
                      setSocialHandles(newHandles);
                    }}
                    placeholder="@yourhandle"
                    style={{
                      flex: 1,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {socialHandles.length > 1 && (
                    <button
                      onClick={() => setSocialHandles(socialHandles.filter((_, i) => i !== idx))}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setSocialHandles([...socialHandles, { platform: '', handle: '' }])}
              style={{
                width: '100%',
                background: '#667eea',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Add Handle
            </button>
          </div>

          {/* Emails Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>📧 Emails</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {emails.map((email, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...emails];
                      newEmails[idx] = e.target.value;
                      setEmails(newEmails);
                    }}
                    placeholder="email@example.com"
                    style={{
                      flex: 1,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {emails.length > 1 && (
                    <button
                      onClick={() => setEmails(emails.filter((_, i) => i !== idx))}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setEmails([...emails, ''])}
              style={{
                width: '100%',
                background: '#667eea',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Add Email
            </button>
          </div>

          {/* Phones Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>📱 Phone Numbers</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {phones.map((phone, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const newPhones = [...phones];
                      newPhones[idx] = e.target.value;
                      setPhones(newPhones);
                    }}
                    placeholder="+1 (555) 123-4567"
                    style={{
                      flex: 1,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {phones.length > 1 && (
                    <button
                      onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setPhones([...phones, ''])}
              style={{
                width: '100%',
                background: '#667eea',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Add Phone
            </button>
          </div>

          {/* Websites Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>🌍 Websites/Stores</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {websites.map((website, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => {
                      const newWebsites = [...websites];
                      newWebsites[idx] = e.target.value;
                      setWebsites(newWebsites);
                    }}
                    placeholder="https://yourwebsite.com"
                    style={{
                      flex: 1,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {websites.length > 1 && (
                    <button
                      onClick={() => setWebsites(websites.filter((_, i) => i !== idx))}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setWebsites([...websites, ''])}
              style={{
                width: '100%',
                background: '#667eea',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Add Website
            </button>
          </div>

          {/* Portfolio Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>🎨 Portfolio</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={portfolio.enabled}
                onChange={(e) => setPortfolio(prev => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label style={{ fontWeight: 'bold', cursor: 'pointer' }}>Enable Portfolio</label>
            </div>
            {portfolio.enabled && (
              <input
                type="url"
                value={portfolio.url}
                onChange={(e) => setPortfolio(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://yourportfolio.com"
                style={{
                  width: '100%',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '10px',
                  fontWeight: 'bold',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Projects Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>📁 Projects</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={projects.enabled}
                onChange={(e) => setProjects(prev => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label style={{ fontWeight: 'bold', cursor: 'pointer' }}>Enable Projects</label>
            </div>
            {projects.enabled && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
                  {projects.list.map((project, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={project.title}
                        onChange={(e) => {
                          const newList = [...projects.list];
                          newList[idx].title = e.target.value;
                          setProjects(prev => ({ ...prev, list: newList }));
                        }}
                        placeholder="Project Title"
                        style={{
                          flex: 0.4,
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          padding: '8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <input
                        type="url"
                        value={project.url}
                        onChange={(e) => {
                          const newList = [...projects.list];
                          newList[idx].url = e.target.value;
                          setProjects(prev => ({ ...prev, list: newList }));
                        }}
                        placeholder="https://..."
                        style={{
                          flex: 0.6,
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          padding: '8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                      {projects.list.length > 1 && (
                        <button
                          onClick={() => {
                            const newList = projects.list.filter((_, i) => i !== idx);
                            setProjects(prev => ({ ...prev, list: newList }));
                          }}
                          style={{
                            background: '#dc2626',
                            color: 'white',
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setProjects(prev => ({ ...prev, list: [...prev.list, { title: '', url: '' }] }))}
                  style={{
                    width: '100%',
                    background: '#667eea',
                    color: 'white',
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  + Add Project
                </button>
              </>
            )}
          </div>

          {/* Charities Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: 'bold' }}>❤️ Charities/Causes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
              {charityLinks.map((charity, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={charity.name}
                    onChange={(e) => {
                      const newList = [...charityLinks];
                      newList[idx].name = e.target.value;
                      setCharityLinks(newList);
                    }}
                    placeholder="Cause Name"
                    style={{
                      flex: 0.3,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="url"
                    value={charity.url}
                    onChange={(e) => {
                      const newList = [...charityLinks];
                      newList[idx].url = e.target.value;
                      setCharityLinks(newList);
                    }}
                    placeholder="https://charity.org"
                    style={{
                      flex: 0.7,
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      padding: '8px',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {charityLinks.length > 1 && (
                    <button
                      onClick={() => setCharityLinks(charityLinks.filter((_, i) => i !== idx))}
                      style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setCharityLinks([...charityLinks, { name: '', url: '' }])}
              style={{
                width: '100%',
                background: '#667eea',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              + Add Charity
            </button>
          </div>

          {/* Color Picker Modal */}
          {showColorPicker && selectedButtonToColor && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                maxWidth: '400px',
                width: '100%',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', margin: '0 0 20px 0' }}>
                  🎨 Customize Button Colors
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Background Color</label>
                    <input
                      type="color"
                      value={buttonColors[selectedButtonToColor].bg}
                      onChange={(e) => setButtonColors(prev => ({
                        ...prev,
                        [selectedButtonToColor]: { ...prev[selectedButtonToColor], bg: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        height: '50px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>Text Color</label>
                    <input
                      type="color"
                      value={buttonColors[selectedButtonToColor].text}
                      onChange={(e) => setButtonColors(prev => ({
                        ...prev,
                        [selectedButtonToColor]: { ...prev[selectedButtonToColor], text: e.target.value }
                      }))}
                      style={{
                        width: '100%',
                        height: '50px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  <div style={{
                    background: buttonColors[selectedButtonToColor].bg,
                    color: buttonColors[selectedButtonToColor].text,
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}>
                    Preview
                  </div>

                  <button
                    onClick={() => setShowColorPicker(false)}
                    style={{
                      width: '100%',
                      background: '#667eea',
                      color: 'white',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Done ✓
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <button
              onClick={saveProfile}
              style={{
                background: '#10B981',
                color: 'white',
                padding: '16px 40px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              💾 Save Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INBOX PAGE
  if (currentView === 'inbox' && user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f591ba, #f2bc7c, #7fda7f)',
        padding: '20px',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <button
              onClick={() => setCurrentView('editor')}
              style={{
                background: '#667eea',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: '24px', color: 'white', fontWeight: 'bold', margin: 0 }}>📬 Messages</h1>
            <div style={{ width: '80px' }} />
          </div>

          {/* Filter Buttons */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            gap: '12px',
          }}>
            {['all', 'priority'].map((filter) => (
              <button
                key={filter}
                onClick={() => setInboxFilter(filter)}
                style={{
                  padding: '8px 15px',
                  background: inboxFilter === filter ? '#667eea' : '#f0f0f0',
                  color: inboxFilter === filter ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                {filter === 'all' && '💬 All'}
                {filter === 'priority' && '⭐ Priority'}
              </button>
            ))}
          </div>

          {/* Messages */}
          {getFilteredMessages().length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: '#999',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📬</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>No messages yet</div>
              <div style={{ fontSize: '12px' }}>Messages will appear here when you share your profile!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getFilteredMessages().map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '12px',
                    padding: '15px',
                    borderLeft: `4px solid ${msg.isPriority ? '#f39c12' : '#ddd'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                        {msg.isPriority ? '⭐' : '🌸'} {msg.senderName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{msg.senderContact}</div>
                    </div>
                    <div style={{ fontSize: '18px' }}>{msg.messageType}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5' }}>{msg.message}</div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '10px' }}>
                    {msg.timestamp?.toDate?.()?.toLocaleString?.() || 'Just now'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEFAULT FALLBACK (prevents blank screen)
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f0f0',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', margin: 0, marginBottom: '20px' }}>⚠️ Something went wrong</h1>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>Please refresh the page</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#667eea',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default LinksAndDM;
