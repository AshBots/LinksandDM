import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

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
  const [currentUsername, setCurrentUsername] = useState('');
  const [previewUsername, setPreviewUsername] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showModal, setShowModal] = useState(null);
  
  // Auth states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');

  // Editor states
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
  
  // Message states
  const [messageType, setMessageType] = useState(null);
  const [messageForm, setMessageForm] = useState({ name: '', contact: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const pastelColors = { 
    bookMeeting: '#ADD8E6', 
    letsConnect: '#DDA0DD', 
    collabRequest: '#AFEEEE', 
    supportCause: '#FFB6D9', 
    handles: '#FFB6C1', 
    email: '#B0E0E6', 
    contact: '#B4F8C8', 
    website: '#DDA0DD', 
    portfolio: '#B0E0E6', 
    projects: '#FFDAB9' 
  };

  const textColors = { 
    bookMeeting: '#0066cc', 
    letsConnect: '#8B008B', 
    collabRequest: '#008B8B', 
    supportCause: '#C71585', 
    handles: '#C71585', 
    email: '#1E90FF', 
    contact: '#228B22', 
    website: '#663399', 
    portfolio: '#1E90FF', 
    projects: '#FF8C00' 
  };

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

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser.uid);
        setCurrentUsername(currentUser.email.split('@')[0]);
      }
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
        setCurrentUsername(data.username || '');
      }
      loadMessages(uid);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Load messages for current user
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
          profile: {
            ...profile,
            username: username,
          },
          dmButtons,
          charityLinks: [],
          socialHandles: [],
          emails: [],
          phones: [],
          websites: [],
          portfolio: { enabled: false, url: '' },
          projects: { enabled: false, list: [] },
          priorityContacts: [],
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
      const username = profile.username.trim() || currentUsername;
      setCurrentUsername(username);
      
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
        username: username,
        lastUpdated: new Date(),
      });
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    }
  };

  // Generate share link
  const generateShareLink = () => {
    const username = profile.username.trim() || currentUsername;
    const link = `${window.location.origin}/${username}`;
    alert(`Your link: ${link}\n\nCopy this to your bio!`);
  };

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
        emoji: messageType?.icon || '💬',
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

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontSize: '24px' }}>Loading...</div>;
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
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Outfit:wght@600;700&display=swap'); 
        .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 900; } 
        .heading-lg { font-family: 'Poppins', sans-serif; font-weight: 800; } 
        .heading-md { font-family: 'Poppins', sans-serif; font-weight: 700; }`}</style>

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
              margin: 0,
              fontFamily: 'Poppins, sans-serif',
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
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
            >
              {user ? '✏️ Edit' : "Let's Do It!"}
            </button>
          </div>

          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h1 style={{
              fontSize: '72px',
              fontWeight: '900',
              color: 'white',
              textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
              margin: '0 0 20px 0',
              fontFamily: 'Poppins, sans-serif',
            }}>One Link.</h1>
            <h1 style={{
              fontSize: '72px',
              fontWeight: '900',
              color: 'white',
              textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
              margin: '0 0 32px 0',
              fontFamily: 'Poppins, sans-serif',
            }}>Sorted DMs.</h1>
            <p style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              marginBottom: '12px',
              margin: '0 0 12px 0',
            }}>The Ultimate Link-in-Bio for Creators 🌟</p>
            <p style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
              margin: 0,
            }}>Manage all your links, messages & projects in one beautiful place</p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto 64px auto',
          }}>
            {[
              { emoji: '💬', title: 'Smart DM Sorting', desc: 'Organize all messages intelligently', gradient: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)' },
              { emoji: '🎨', title: '12 Beautiful Themes', desc: 'Choose your perfect vibe', gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)' },
              { emoji: '📱', title: 'All Socials in One', desc: 'Connect all your platforms instantly', gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' },
              { emoji: '📧', title: 'Email Hub', desc: 'Never miss important emails', gradient: 'linear-gradient(135deg, #3B82F6 0%, #06E0FF 100%)' },
              { emoji: '📁', title: 'Portfolio & Projects', desc: 'Showcase your incredible work', gradient: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)' },
              { emoji: '📞', title: 'Contact Central', desc: 'Phone, web, everything connected', gradient: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                background: feature.gradient,
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: '3px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>{feature.emoji}</div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                  margin: '0 0 8px 0',
                  fontFamily: 'Poppins, sans-serif',
                }}>{feature.title}</h3>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                  margin: 0,
                }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div style={{
            background: 'linear-gradient(to right, #A855F7, #EC4899)',
            borderRadius: '24px',
            border: '3px solid white',
            padding: '40px',
            maxWidth: '600px',
            margin: '0 auto 64px auto',
            textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              margin: '0 0 32px 0',
              fontFamily: 'Poppins, sans-serif',
            }}>Transform Your Link-in-Bio Today 🚀</h3>
            <button
              onClick={() => user ? setCurrentView('editor') : setCurrentView('auth')}
              style={{
                background: 'white',
                color: '#A855F7',
                padding: '16px 48px',
                borderRadius: '24px',
                border: '3px solid #E9D5FF',
                fontWeight: 'bold',
                fontSize: '18px',
                cursor: 'pointer',
                width: '100%',
                marginBottom: '16px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
            >
              Get Started Now
            </button>
            <button
              onClick={() => setCurrentView('preview')}
              style={{
                background: 'rgba(255,255,255,0.3)',
                border: '3px solid white',
                color: 'white',
                padding: '16px 48px',
                borderRadius: '24px',
                fontWeight: 'bold',
                fontSize: '18px',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.3s',
                textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; e.target.style.transform = 'scale(1)'; }}
            >
              See Demo ✨
            </button>
          </div>

          <div style={{ textAlign: 'center', color: 'white', textShadow: '1px 1px 0px rgba(0,0,0,0.2)', fontWeight: 'bold', fontSize: '18px' }}>
            Trusted by Influencers, Celebrities & Brands 💎
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
        background: 'linear-gradient(135deg, #f591ba 0%, #a8d8ea 100%)',
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '30px', textAlign: 'center', color: '#333' }}>
            {authMode === 'signin' ? 'Sign In' : 'Create Account'}
          </h2>

          {authError && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="Email"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />

            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '20px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '15px',
              }}
            >
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <button
            onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '15px',
            }}
          >
            {authMode === 'signin' ? 'Create New Account' : 'Already have account? Sign In'}
          </button>

          <button
            onClick={() => setCurrentView('landing')}
            style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ← Back to Landing
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
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Outfit:wght@600&display=swap');`}</style>

        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
              margin: 0,
              marginBottom: '8px',
              fontFamily: 'Poppins, sans-serif',
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
                  filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.1))',
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
                filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.1))',
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
              fontFamily: 'Poppins, sans-serif',
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
                  background: pastelColors.bookMeeting,
                  color: textColors.bookMeeting,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>📅</span>
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
                  background: pastelColors.letsConnect,
                  color: textColors.letsConnect,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>💬</span>
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
                  background: pastelColors.collabRequest,
                  color: textColors.collabRequest,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>🤝</span>
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
                  background: pastelColors.supportCause,
                  color: textColors.supportCause,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>❤️</span>
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
                  background: pastelColors.handles,
                  color: textColors.handles,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>🌐</span>
                <span style={{ lineHeight: '1.2' }}>@ Handles</span>
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
                  background: pastelColors.email,
                  color: textColors.email,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>📧</span>
                <span style={{ lineHeight: '1.2' }}>@ Email</span>
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
                  background: pastelColors.contact,
                  color: textColors.contact,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>📱</span>
                <span style={{ lineHeight: '1.2' }}>Contact</span>
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
                  background: pastelColors.website,
                  color: textColors.website,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>🌍</span>
                <span style={{ lineHeight: '1.2' }}>Website</span>
              </button>
            )}

            {portfolio.enabled && (
              <button
                onClick={() => portfolio.url && window.open(formatUrl(portfolio.url), '_blank')}
                style={{
                  borderRadius: '24px',
                  padding: '20px 12px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  background: pastelColors.portfolio,
                  color: textColors.portfolio,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>🎨</span>
                <span style={{ lineHeight: '1.2' }}>Portfolio</span>
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
                  background: pastelColors.projects,
                  color: textColors.projects,
                  border: '3px solid rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
              >
                <span style={{ fontSize: '28px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>📁</span>
                <span style={{ lineHeight: '1.2' }}>Projects</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => setCurrentView('landing')}
              style={{
                background: 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)',
                border: '3px solid white',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.4)'; }}
            >
              ← Back
            </button>

            {user ? (
              <>
                <button
                  onClick={() => setCurrentView('editor')}
                  style={{
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid white',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.6)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.4)'; }}
                >
                  ✏️ Editor
                </button>
                <button
                  onClick={() => setCurrentView('inbox')}
                  style={{
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '3px solid white',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.6)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.4)'; }}
                >
                  📬 Inbox ({messages.length})
                </button>
              </>
            ) : (
              <button
                onClick={() => setCurrentView('auth')}
                style={{
                  background: 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '3px solid white',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '16px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.6)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.4)'; }}
              >
                🔐 Sign In
              </button>
            )}
          </div>
        </div>

        {/* Modals */}
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
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '3px solid #E9D5FF',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🌐 Handles</h3>
                <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {socialHandles.map((handle, idx) => (
                  <div key={idx} style={{
                    background: '#F3F4F6',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <p style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', margin: '0 0 4px 0' }}>{handle.platform}</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0066cc', margin: 0, wordBreak: 'break-all' }}>{handle.handle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '3px solid #E9D5FF',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>📧 Email</h3>
                <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {emails.map((email, idx) => (
                  <div key={idx} style={{
                    background: '#F3F4F6',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1E90FF', margin: 0, wordBreak: 'break-all' }}>{email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '3px solid #E9D5FF',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>📱 Contact</h3>
                <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {phones.map((phone, idx) => (
                  <div key={idx} style={{
                    background: '#F3F4F6',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#228B22', margin: 0, wordBreak: 'break-all' }}>{phone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '3px solid #E9D5FF',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🌍 Website</h3>
                <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {websites.map((website, idx) => (
                  <div key={idx} style={{
                    background: '#F3F4F6',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#663399', margin: 0, wordBreak: 'break-all' }}>{website}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '3px solid #E9D5FF',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>📁 Projects</h3>
                <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projects.list.map((project, idx) => (
                  <div key={idx} style={{
                    background: '#F3F4F6',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <p style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', margin: '0 0 4px 0' }}>Project</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#FF8C00', margin: '0 0 4px 0', wordBreak: 'break-all' }}>{project.title}</p>
                    <p style={{ fontSize: '12px', color: '#999', margin: 0, wordBreak: 'break-all' }}>{project.url}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '3px solid #E9D5FF',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>❤️ Support a Cause</h3>
                <button onClick={() => setShowModal(null)} style={{ fontSize: '28px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {charityLinks.map((charity, idx) => (
                  <div key={idx} style={{
                    background: '#F3F4F6',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <p style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', margin: '0 0 4px 0' }}>{charity.name || 'Charity'}</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#EC4899', margin: 0, wordBreak: 'break-all' }}>{charity.url}</p>
                  </div>
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
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
              border: '3px solid #E9D5FF',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Send Message</h3>
                <button onClick={() => setShowMessageForm(false)} style={{ fontSize: '28px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
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

                <div style={{
                  background: '#F3E8FF',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', margin: 0 }}>Message Type: <span style={{ fontSize: '20px' }}>{messageType?.icon}</span></p>
                </div>

                <button
                  onClick={handleSendMessage}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(to right, #A855F7, #EC4899)',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Toast */}
        {showConfirmation && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            border: '3px solid #10B981',
            zIndex: '2000',
            textAlign: 'center',
            animation: 'bounce 0.5s',
          }}>
            <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>✅</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: '0 0 4px 0' }}>Message Sent!</p>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>You'll hear back soon 🎉</p>
          </div>
        )}
      </div>
    );
  }

  // EDITOR PAGE
  if (currentView === 'editor' && user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5a6c5 0%, #a8d8ea 100%)',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <button
              onClick={() => setCurrentView('preview')}
              style={{
                padding: '10px 15px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              👁️ Preview
            </button>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>✏️ Edit Profile</div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 15px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Logout
            </button>
          </div>

          {/* Profile Info */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Profile Information</h3>

            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Your Name"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
              }}
            />

            <input
              type="text"
              value={profile.profession}
              onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
              placeholder="Your Profession"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
              }}
            />

            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Your Bio"
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
                minHeight: '80px',
              }}
            />

            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => setProfile({ ...profile, profilePic: event.target.result });
                  reader.readAsDataURL(file);
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
              }}
            />

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>🎨 Theme:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
                {themes.map((theme, idx) => (
                  <button
                    key={idx}
                    onClick={() => setProfile({ ...profile, selectedTheme: idx })}
                    style={{
                      background: theme.gradient,
                      padding: '15px',
                      borderRadius: '10px',
                      border: profile.selectedTheme === idx ? '3px solid #333' : '1px solid #ddd',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: 'white',
                      fontSize: '12px',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                    }}
                    title={theme.name}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>

              <div style={{ background: '#f9f9f9', border: '2px solid #ddd', borderRadius: '10px', padding: '15px', marginBottom: '10px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333', fontWeight: 'bold' }}>🎯 Or Create Custom Theme</h4>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333', fontSize: '12px' }}>Color 1 (Start)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={profile.customColor1 || '#40E0D0'}
                      onChange={(e) => setProfile({ ...profile, customColor1: e.target.value })}
                      style={{
                        width: '60px',
                        height: '50px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={profile.customColor1 || '#40E0D0'}
                      onChange={(e) => setProfile({ ...profile, customColor1: e.target.value })}
                      placeholder="#40E0D0"
                      style={{
                        flex: '1',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#333', fontSize: '12px' }}>Color 2 (End)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={profile.customColor2 || '#20B2AA'}
                      onChange={(e) => setProfile({ ...profile, customColor2: e.target.value })}
                      style={{
                        width: '60px',
                        height: '50px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={profile.customColor2 || '#20B2AA'}
                      onChange={(e) => setProfile({ ...profile, customColor2: e.target.value })}
                      placeholder="#20B2AA"
                      style={{
                        flex: '1',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  background: `linear-gradient(135deg, ${profile.customColor1 || '#40E0D0'} 0%, ${profile.customColor2 || '#20B2AA'} 100%)`,
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                }}>
                  Preview Your Custom Theme
                </div>

                <button
                  onClick={() => {
                    const customTheme = {
                      name: 'Custom',
                      gradient: `linear-gradient(135deg, ${profile.customColor1 || '#40E0D0'} 0%, ${profile.customColor2 || '#20B2AA'} 100%)`
                    };
                    const newThemes = [...themes];
                    newThemes[0] = customTheme;
                    setProfile({ ...profile, selectedTheme: 0 });
                    alert('✅ Custom theme applied! Theme 1 has been updated.');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ✨ Apply Custom Theme
                </button>
              </div>
            </div>
          </div>

          {/* DM Buttons */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>DM Buttons</h3>

            {Object.keys(dmButtons).map((key) => (
              <div key={key} style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dmButtons[key].enabled}
                    onChange={(e) => setDmButtons({
                      ...dmButtons,
                      [key]: { ...dmButtons[key], enabled: e.target.checked }
                    })}
                    style={{ marginRight: '10px', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#333' }}>{dmButtons[key].label}</span>
                </label>
              </div>
            ))}
          </div>

          {/* Social Handles */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Social Handles</h3>

            {socialHandles.map((handle, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={handle.platform || ''}
                  onChange={(e) => {
                    const updated = [...socialHandles];
                    updated[idx].platform = e.target.value;
                    setSocialHandles(updated);
                  }}
                  placeholder="Platform"
                  style={{
                    flex: '0.5',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="text"
                  value={handle.handle || ''}
                  onChange={(e) => {
                    const updated = [...socialHandles];
                    updated[idx].handle = e.target.value;
                    setSocialHandles(updated);
                  }}
                  placeholder="Handle"
                  style={{
                    flex: '1',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => setSocialHandles(socialHandles.filter((_, i) => i !== idx))}
                  style={{
                    padding: '10px 15px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => setSocialHandles([...socialHandles, { platform: '', handle: '' }])}
              style={{
                width: '100%',
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              + Add Handle
            </button>
          </div>

          {/* Emails */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Emails</h3>

            {emails.map((email, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const updated = [...emails];
                    updated[idx] = e.target.value;
                    setEmails(updated);
                  }}
                  placeholder="Email"
                  style={{
                    flex: '1',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => setEmails(emails.filter((_, i) => i !== idx))}
                  style={{
                    padding: '10px 15px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => setEmails([...emails, ''])}
              style={{
                width: '100%',
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              + Add Email
            </button>
          </div>

          {/* Phones */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Phone Numbers</h3>

            {phones.map((phone, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const updated = [...phones];
                    updated[idx] = e.target.value;
                    setPhones(updated);
                  }}
                  placeholder="Phone"
                  style={{
                    flex: '1',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                  style={{
                    padding: '10px 15px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => setPhones([...phones, ''])}
              style={{
                width: '100%',
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              + Add Phone
            </button>
          </div>

          {/* Websites */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Websites</h3>

            {websites.map((website, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => {
                    const updated = [...websites];
                    updated[idx] = e.target.value;
                    setWebsites(updated);
                  }}
                  placeholder="Website URL"
                  style={{
                    flex: '1',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => setWebsites(websites.filter((_, i) => i !== idx))}
                  style={{
                    padding: '10px 15px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => setWebsites([...websites, ''])}
              style={{
                width: '100%',
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              + Add Website
            </button>
          </div>

          {/* Portfolio */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Portfolio</h3>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={portfolio.enabled}
                onChange={(e) => setPortfolio({ ...portfolio, enabled: e.target.checked })}
                style={{ marginRight: '10px', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 'bold', color: '#333' }}>Enable Portfolio</span>
            </label>

            {portfolio.enabled && (
              <input
                type="url"
                value={portfolio.url}
                onChange={(e) => setPortfolio({ ...portfolio, url: e.target.value })}
                placeholder="Portfolio URL"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Projects */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Projects</h3>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={projects.enabled}
                onChange={(e) => setProjects({ ...projects, enabled: e.target.checked })}
                style={{ marginRight: '10px', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 'bold', color: '#333' }}>Enable Projects</span>
            </label>

            {projects.enabled && (
              <>
                {projects.list.map((project, idx) => (
                  <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => {
                        const updated = [...projects.list];
                        updated[idx].title = e.target.value;
                        setProjects({ ...projects, list: updated });
                      }}
                      placeholder="Project Title"
                      style={{
                        flex: '0.6',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <input
                      type="url"
                      value={project.url}
                      onChange={(e) => {
                        const updated = [...projects.list];
                        updated[idx].url = e.target.value;
                        setProjects({ ...projects, list: updated });
                      }}
                      placeholder="Project URL"
                      style={{
                        flex: '0.8',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      onClick={() => setProjects({
                        ...projects,
                        list: projects.list.filter((_, i) => i !== idx)
                      })}
                      style={{
                        padding: '10px 15px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setProjects({
                    ...projects,
                    list: [...projects.list, { title: '', url: '' }]
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  + Add Project
                </button>
              </>
            )}
          </div>

          {/* Charity Links */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Charity Links</h3>

            {charityLinks.map((charity, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={charity.name}
                  onChange={(e) => {
                    const updated = [...charityLinks];
                    updated[idx].name = e.target.value;
                    setCharityLinks(updated);
                  }}
                  placeholder="Charity Name"
                  style={{
                    flex: '0.5',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="url"
                  value={charity.url}
                  onChange={(e) => {
                    const updated = [...charityLinks];
                    updated[idx].url = e.target.value;
                    setCharityLinks(updated);
                  }}
                  placeholder="Charity URL"
                  style={{
                    flex: '1',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => setCharityLinks(charityLinks.filter((_, i) => i !== idx))}
                  style={{
                    padding: '10px 15px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => setCharityLinks([...charityLinks, { name: '', url: '' }])}
              style={{
                width: '100%',
                padding: '10px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              + Add Charity
            </button>
          </div>

          {/* Save Button */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}>
            <button
              onClick={saveProfile}
              style={{
                padding: '12px',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              💾 Save Profile
            </button>

            <button
              onClick={generateShareLink}
              style={{
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🔗 Share Link
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
        background: 'linear-gradient(135deg, #f5a6c5 0%, #a8d8ea 100%)',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <button
              onClick={() => setCurrentView('editor')}
              style={{
                padding: '10px 15px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ← Back
            </button>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>📬 Messages</div>
            <div style={{ width: '80px' }} />
          </div>

          {/* Filter Buttons */}
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '15px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
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
                  borderRadius: '20px',
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
              borderRadius: '20px',
              padding: '40px',
              textAlign: 'center',
              color: '#999',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📬</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>No messages yet</div>
              <div style={{ fontSize: '12px' }}>Messages will appear here when you share your profile!</div>
            </div>
          ) : (
            <div>
              {getFilteredMessages().map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '15px',
                    padding: '15px',
                    marginBottom: '10px',
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

  return null;
};

export default LinksAndDM;
