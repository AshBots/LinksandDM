import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAFqbEIL3TOAcFmsxoqltJfrtfE2sOXVs",
  authDomain: "links-dm-pro.firebaseapp.com",
  projectId: "links-dm-pro",
  storageBucket: "links-dm-pro.firebasestorage.app",
  messagingSenderId: "965082307073",
  appId: "1:965082307073:web:78ea49e4c5888852307e00",
  measurementId: "G-QVH0R5D92B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: "'Poppins', sans-serif",
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '16px', fontWeight: '900' }}>
              Oops! Something went wrong
            </h2>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px', wordBreak: 'break-word' }}>
              {this.state.error?.toString()}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                cursor: 'pointer',
              }}
            >
              🔄 Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LinksAndDM = () => {
  // Auth States
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');

  // Profile States
  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    profession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    username: '',
    profilePic: null,
    selectedTheme: 0,
    customBgColor: null,
    email: '',
  });

  // DM Buttons
  const [dmButtons, setDmButtons] = useState({
    bookMeeting: { enabled: true, label: 'Book a Meeting' },
    letsConnect: { enabled: true, label: "Let's Connect" },
    collabRequest: { enabled: true, label: 'Collab Request' },
  });

  // Button Colors
  const [buttonColors, setButtonColors] = useState({
    bookMeeting: { bg: '#B0E0E6', text: '#0066cc' },
    letsConnect: { bg: '#DDA0DD', text: '#8B008B' },
    collabRequest: { bg: '#AFEEEE', text: '#008B8B' },
  });

  // Contact Info
  const [socialHandles, setSocialHandles] = useState([]);
  const [emails, setEmails] = useState([]);
  const [phones, setPhones] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [portfolio, setPortfolio] = useState({ enabled: false, url: '' });
  const [projects, setProjects] = useState({ enabled: false, list: [] });
  const [priorityContacts, setPriorityContacts] = useState([]);

  // Messages
  const [messages, setMessages] = useState([]);
  const [inboxFilter, setInboxFilter] = useState('all');

  // Message Form
  const [messageForm, setMessageForm] = useState({ 
    name: '', 
    email: '', 
    message: '', 
    messageType: 'general' 
  });
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [currentMessageType, setCurrentMessageType] = useState(null);

  // UI States
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState(null);
  const [newInputValue, setNewInputValue] = useState('');
  const [inputType, setInputType] = useState('');

  // Public Profile Route
  const [publicUsername, setPublicUsername] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);

  // Themes
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

  // Check public route on mount
  useEffect(() => {
    const checkPublicRoute = async () => {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const match = path.match(/\/user\/([^\/]+)/);
        if (match && match[1]) {
          const username = match[1];
          setPublicUsername(username);
          setPublicProfileLoading(true);
          try {
            const q = query(collection(db, 'users'), where('profile.username', '==', username));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.docs.length > 0) {
              const data = querySnapshot.docs[0].data();
              setPublicProfile(data);
              setCurrentView('public-preview');
            } else {
              setCurrentView('not-found');
            }
          } catch (error) {
            console.error('Error loading public profile:', error);
            setCurrentView('not-found');
          } finally {
            setPublicProfileLoading(false);
          }
        }
      }
    };
    checkPublicRoute();
  }, []);

  // Auth effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load user profile
  const loadUserProfile = async (uid) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data.profile || profile);
        setDmButtons(data.dmButtons || dmButtons);
        setButtonColors(data.buttonColors || buttonColors);
        setSocialHandles(data.socialHandles || []);
        setEmails(data.emails || []);
        setPhones(data.phones || []);
        setWebsites(data.websites || []);
        setPortfolio(data.portfolio || { enabled: false, url: '' });
        setProjects(data.projects || { enabled: false, list: [] });
        setPriorityContacts(data.priorityContacts || []);
      }
      loadMessages(uid);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Load messages
  const loadMessages = async (uid) => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('recipientId', '==', uid),
        orderBy('timestamp', 'desc')
      );
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

  // Save profile
  const saveProfile = async () => {
    if (!user || !profile.username.trim()) {
      alert('⚠️ Please enter a username');
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        profile: { ...profile, email: user.email },
        dmButtons,
        buttonColors,
        socialHandles,
        emails,
        phones,
        websites,
        portfolio,
        projects,
        priorityContacts,
        lastUpdated: new Date(),
      });
      alert('✅ Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!authEmail || !authPassword) {
      setAuthError('Please fill in all fields');
      return;
    }
    
    if (authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters');
      return;
    }

    try {
      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      }
      setAuthEmail('');
      setAuthPassword('');
      setCurrentView('editor');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setAuthError('❌ User not found');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('❌ Incorrect password');
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError('❌ Email already in use');
      } else if (error.code === 'auth/invalid-email') {
        setAuthError('❌ Invalid email');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('❌ Password too weak');
      } else {
        setAuthError(`❌ ${error.message}`);
      }
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('landing');
  };

  // Generate share link
  const generateShareLink = () => {
    if (!profile.username.trim()) {
      alert('⚠️ Please set a username first!');
      return;
    }
    const link = `${window.location.origin}/user/${profile.username}`;
    setShareLink(link);
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      alert('❌ Failed to copy');
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageForm.name || !messageForm.email || !messageForm.message) {
      alert('⚠️ Please fill all fields');
      return;
    }

    try {
      let recipientId = user?.uid;
      if (!recipientId && publicUsername) {
        const q = query(collection(db, 'users'), where('profile.username', '==', publicUsername));
        const snap = await getDocs(q);
        if (snap.docs.length === 0) {
          alert('Recipient not found');
          return;
        }
        recipientId = snap.docs[0].id;
      }

      if (!recipientId) {
        alert('Error: Recipient not found');
        return;
      }

      const recipientData = (await getDoc(doc(db, 'users', recipientId))).data();
      const isPriority = recipientData?.priorityContacts?.includes(messageForm.email) || false;

      let messageTypeLabel = '💬 Message';
      let messageEmoji = '🌸';

      if (currentMessageType === 'bookMeeting') {
        messageTypeLabel = '📅 Book a Meeting';
        messageEmoji = '📅';
      } else if (currentMessageType === 'letsConnect') {
        messageTypeLabel = isPriority ? '⭐ Let\'s Connect' : '🌸 Let\'s Connect';
        messageEmoji = isPriority ? '⭐' : '🌸';
      } else if (currentMessageType === 'collabRequest') {
        messageTypeLabel = '🤝 Collab Request';
        messageEmoji = '🤝';
      }

      await addDoc(collection(db, 'messages'), {
        recipientId,
        senderName: messageForm.name,
        senderEmail: messageForm.email,
        senderContact: messageForm.email,
        message: messageForm.message,
        messageType: messageTypeLabel,
        messageEmoji: messageEmoji,
        isPriority,
        timestamp: new Date(),
      });

      alert('✅ Message sent successfully!');
      setMessageForm({ name: '', email: '', message: '', messageType: 'general' });
      setShowMessageForm(false);
      
      if (user?.uid) {
        await loadMessages(user.uid);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  // Delete message
  const deleteMessage = async (msgId) => {
    if (window.confirm('Delete this message?')) {
      try {
        await deleteDoc(doc(db, 'messages', msgId));
        if (user?.uid) {
          await loadMessages(user.uid);
        }
        alert('✅ Message deleted');
      } catch (error) {
        alert('❌ Error: ' + error.message);
      }
    }
  };

  // Filter messages
  const getFilteredMessages = () => {
    if (inboxFilter === 'all') return messages;
    if (inboxFilter === 'priority') return messages.filter(m => m.isPriority);
    if (inboxFilter === 'meeting') return messages.filter(m => m.messageType.includes('📅'));
    if (inboxFilter === 'connect') return messages.filter(m => m.messageType.includes('Let\'s Connect'));
    if (inboxFilter === 'collab') return messages.filter(m => m.messageType.includes('🤝'));
    if (inboxFilter === 'fans') return messages.filter(m => m.messageEmoji === '🌸');
    if (inboxFilter === 'friends') return messages.filter(m => m.messageEmoji === '⭐');
    return messages;
  };

  // Add contact helper
  const addContact = (type, value) => {
    if (!value.trim()) {
      alert('⚠️ Please enter a value');
      return;
    }
    switch (type) {
      case 'social':
        setSocialHandles([...socialHandles, value]);
        break;
      case 'email':
        setEmails([...emails, value]);
        break;
      case 'phone':
        setPhones([...phones, value]);
        break;
      case 'website':
        setWebsites([...websites, value]);
        break;
      default:
        break;
    }
    setNewInputValue('');
  };

  // Remove contact helper
  const removeContact = (type, index) => {
    switch (type) {
      case 'social':
        setSocialHandles(socialHandles.filter((_, i) => i !== index));
        break;
      case 'email':
        setEmails(emails.filter((_, i) => i !== index));
        break;
      case 'phone':
        setPhones(phones.filter((_, i) => i !== index));
        break;
      case 'website':
        setWebsites(websites.filter((_, i) => i !== index));
        break;
      default:
        break;
    }
  };

  // Get current background
  const getBackgroundGradient = () => {
    return profile.customBgColor || themes[profile.selectedTheme]?.gradient || themes[0].gradient;
  };

  // LANDING PAGE
  if (currentView === 'landing') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', marginTop: '20px' }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '900',
              color: 'white',
              textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
              margin: 0,
            }}>🔗 Links & DM 💬</h1>
            <button
              onClick={() => user ? setCurrentView('editor') : setCurrentView('auth')}
              style={{
                background: 'white',
                color: '#8B5CF6',
                padding: '14px 32px',
                borderRadius: '50px',
                border: '3px solid #E9D5FF',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
              }}
            >
              {user ? '✏️ Edit' : "Let's Do It!"}
            </button>
          </div>

          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{
              fontSize: '72px',
              fontWeight: '900',
              color: 'white',
              textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
              margin: '0 0 32px 0',
              lineHeight: '1.1',
            }}>One Link. Sorted DMs.</h2>
            <p style={{
              fontSize: '22px',
              fontWeight: '700',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              marginBottom: '16px',
            }}>The Ultimate Link-in-Bio for Creators 🌟</p>
            <p style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
              maxWidth: '600px',
              margin: '0 auto',
            }}>Connect with followers • Organize messages • Manage links • Build your brand</p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '60px',
          }}>
            {[
              { emoji: '💬', title: 'Smart DM Sorting', desc: 'Messages organized by type' },
              { emoji: '🎨', title: '12 Beautiful Themes', desc: 'Stunning designs & colors' },
              { emoji: '📱', title: 'All Socials in One', desc: 'All your platforms linked' },
              { emoji: '📧', title: 'Email Hub', desc: 'Manage all emails easily' },
              { emoji: '📁', title: 'Portfolio & Projects', desc: 'Showcase your best work' },
              { emoji: '🔗', title: 'Contact Central', desc: 'Phone, web, everything' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                textAlign: 'center',
                transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{item.emoji}</div>
                <h3 style={{ fontSize: '18px', color: '#333', fontWeight: '900', margin: '0 0 8px 0' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#666', fontSize: '14px', margin: 0, fontWeight: '600' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* See Demo Button */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <button
              onClick={() => {
                setCurrentView('demo-preview');
              }}
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                color: 'white',
                padding: '16px 48px',
                borderRadius: '50px',
                border: 'none',
                fontWeight: '900',
                fontSize: '18px',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              👀 See Demo
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={() => setCurrentView('auth')}
            style={{
              width: '100%',
              background: 'white',
              color: '#8B5CF6',
              padding: '16px',
              borderRadius: '20px',
              border: '3px solid #E9D5FF',
              fontWeight: '900',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            ✨ Get Started Now
          </button>
        </div>
      </div>
    );
  }

  // DEMO PREVIEW PAGE
  if (currentView === 'demo-preview') {
    const demoProfile = {
      name: 'Demo Creator',
      profession: 'Content Creator',
      bio: '🎯 Amazing content creator | 📸 Photography | ✨ Storytelling',
      selectedTheme: 0,
    };

    return (
      <div style={{
        minHeight: '100vh',
        background: themes[demoProfile.selectedTheme].gradient,
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <button
            onClick={() => setCurrentView('landing')}
            style={{
              background: 'rgba(255,255,255,0.3)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '2px solid white',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '30px',
            }}
          >
            ← Back
          </button>

          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              border: '6px solid white',
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
              margin: '0 auto 20px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '56px',
            }}>
              👤
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              margin: '0 0 8px 0',
            }}>
              {demoProfile.name}
            </h2>
            <p style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: '0 0 12px 0' }}>
              {demoProfile.profession}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '13px', fontWeight: '600', margin: 0 }}>
              {demoProfile.bio}
            </p>
          </div>

          {/* All Demo Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => { setCurrentMessageType('bookMeeting'); setShowMessageForm(true); }}
              style={{
                width: '100%',
                borderRadius: '20px',
                padding: '16px 20px',
                fontWeight: '700',
                fontSize: '15px',
                border: '3px solid rgba(255,255,255,0.4)',
                background: '#B0E0E6',
                color: '#0066cc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s',
              }}
            >
              <span style={{ fontSize: '20px' }}>📅</span>
              <span>Book a Meeting</span>
            </button>

            <button
              onClick={() => { setCurrentMessageType('letsConnect'); setShowMessageForm(true); }}
              style={{
                width: '100%',
                borderRadius: '20px',
                padding: '16px 20px',
                fontWeight: '700',
                fontSize: '15px',
                border: '3px solid rgba(255,255,255,0.4)',
                background: '#DDA0DD',
                color: '#8B008B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '20px' }}>💬</span>
              <span>Let's Connect</span>
            </button>

            <button
              onClick={() => { setCurrentMessageType('collabRequest'); setShowMessageForm(true); }}
              style={{
                width: '100%',
                borderRadius: '20px',
                padding: '16px 20px',
                fontWeight: '700',
                fontSize: '15px',
                border: '3px solid rgba(255,255,255,0.4)',
                background: '#AFEEEE',
                color: '#008B8B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '20px' }}>🤝</span>
              <span>Collab Request</span>
            </button>
          </div>

          {/* Contact Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              border: '3px solid rgba(255,255,255,0.4)',
              color: 'white',
              fontWeight: '900',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>Email</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              border: '3px solid rgba(255,255,255,0.4)',
              color: 'white',
              fontWeight: '900',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📱</div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>Phone</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              border: '3px solid rgba(255,255,255,0.4)',
              color: 'white',
              fontWeight: '900',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔗</div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>Website</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              border: '3px solid rgba(255,255,255,0.4)',
              color: 'white',
              fontWeight: '900',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📸</div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>Portfolio</div>
            </div>
          </div>

          {/* Message Form Modal */}
          {showMessageForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px 24px 0 0',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#333' }}>
                    {currentMessageType === 'bookMeeting' ? '📅 Book a Meeting' : 
                     currentMessageType === 'letsConnect' ? '💬 Let\'s Connect' : 
                     '🤝 Collab Request'}
                  </h3>
                  <button
                    onClick={() => setShowMessageForm(false)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      fontWeight: '900',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={messageForm.name}
                    onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={messageForm.email}
                    onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Message
                  </label>
                  <textarea
                    placeholder="Your message..."
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      minHeight: '100px',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    alert('✅ Message sent (Demo)');
                    setMessageForm({ name: '', email: '', message: '', messageType: 'general' });
                    setShowMessageForm(false);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                    color: 'white',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '14px',
                  }}
                >
                  Send Message ✨
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // AUTH PAGE
  if (currentView === 'auth') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          <h2 style={{ fontSize: '28px', color: '#333', marginBottom: '30px', fontWeight: '900', textAlign: 'center', margin: 0, marginBottom: '30px' }}>
            {authMode === 'signin' ? '🔐 Sign In' : '✨ Create Account'}
          </h2>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                Email
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #A855F7',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                Password
              </label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #A855F7',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {authError && <p style={{ color: '#dc2626', fontSize: '13px', margin: 0, fontWeight: '600' }}>❌ {authError}</p>}

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                color: 'white',
                padding: '14px',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              style={{
                background: 'none',
                border: 'none',
                color: '#A855F7',
                cursor: 'pointer',
                fontWeight: '700',
                textDecoration: 'underline',
                fontSize: '14px',
              }}
            >
              {authMode === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
            </button>
          </div>

          <button
            onClick={() => setCurrentView('landing')}
            style={{
              width: '100%',
              background: 'white',
              color: '#A855F7',
              padding: '12px',
              border: '2px solid #A855F7',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '20px',
              fontSize: '14px',
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  // EDITOR PAGE
  if (currentView === 'editor' && user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '32px', color: 'white', fontWeight: '900', margin: 0 }}>✏️ Edit Profile</h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={saveProfile}
                style={{
                  background: '#10B981',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => { generateShareLink(); setCurrentView('preview'); }}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
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
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📬 Inbox ({messages.length})
              </button>
              <button
                onClick={handleLogout}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: '900', margin: 0, marginBottom: '20px' }}>
              👤 Profile
            </h2>

            {/* Profile Picture */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <label style={{ cursor: 'pointer' }}>
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt="Profile" style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #A855F7',
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
                    border: '4px solid #A855F7',
                    margin: '0 auto',
                  }}>
                    📸
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfile({ ...profile, profilePic: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Profile Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                  Profession
                </label>
                <input
                  type="text"
                  value={profile.profession}
                  onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                Bio
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  minHeight: '80px',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                Username (for share link)
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                placeholder="yourname"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #A855F7',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Theme & Color Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: '900', margin: 0, marginBottom: '20px' }}>
              🎨 Theme & Colors
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px', color: '#333', fontSize: '14px' }}>
                Select Theme
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {themes.map((theme, idx) => (
                  <button
                    key={idx}
                    onClick={() => setProfile({ ...profile, selectedTheme: idx, customBgColor: null })}
                    style={{
                      background: theme.gradient,
                      padding: '20px',
                      borderRadius: '12px',
                      border: profile.selectedTheme === idx && !profile.customBgColor ? '4px solid #333' : '2px solid #ddd',
                      cursor: 'pointer',
                      fontWeight: '700',
                      color: 'white',
                      fontSize: '12px',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                    }}
                  >
                    {profile.selectedTheme === idx && !profile.customBgColor ? '✓' : ''} {theme.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                Custom Background Color
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={profile.customBgColor?.split('(')[1]?.split(',')[0]?.replace(/\s/g, '') || '#40E0D0'}
                  onChange={(e) => {
                    const hex = e.target.value;
                    setProfile({ ...profile, customBgColor: `linear-gradient(135deg, ${hex} 0%, ${hex} 100%)` });
                  }}
                  style={{
                    width: '60px',
                    height: '60px',
                    border: '2px solid #A855F7',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                />
                <div style={{
                  width: '100px',
                  height: '60px',
                  borderRadius: '12px',
                  background: profile.customBgColor || themes[profile.selectedTheme].gradient,
                  border: '2px solid #ddd',
                }}></div>
              </div>
            </div>
          </div>

          {/* DM Buttons Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: '900', margin: 0, marginBottom: '20px' }}>
              💬 DM Buttons
            </h2>

            {/* Book Meeting Button */}
            <div style={{ marginBottom: '20px', padding: '16px', border: '2px solid #ddd', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: '700', color: '#333', fontSize: '14px', margin: 0 }}>
                  📅 Book a Meeting
                </label>
                <input
                  type="checkbox"
                  checked={dmButtons.bookMeeting.enabled}
                  onChange={(e) => setDmButtons({
                    ...dmButtons,
                    bookMeeting: { ...dmButtons.bookMeeting, enabled: e.target.checked }
                  })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
              <input
                type="text"
                value={dmButtons.bookMeeting.label}
                onChange={(e) => setDmButtons({
                  ...dmButtons,
                  bookMeeting: { ...dmButtons.bookMeeting, label: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>BG Color</label>
                  <input
                    type="color"
                    value={buttonColors.bookMeeting.bg}
                    onChange={(e) => setButtonColors({
                      ...buttonColors,
                      bookMeeting: { ...buttonColors.bookMeeting, bg: e.target.value }
                    })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Text Color</label>
                  <input
                    type="color"
                    value={buttonColors.bookMeeting.text}
                    onChange={(e) => setButtonColors({
                      ...buttonColors,
                      bookMeeting: { ...buttonColors.bookMeeting, text: e.target.value }
                    })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Let's Connect Button */}
            <div style={{ marginBottom: '20px', padding: '16px', border: '2px solid #ddd', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: '700', color: '#333', fontSize: '14px', margin: 0 }}>
                  💬 Let's Connect
                </label>
                <input
                  type="checkbox"
                  checked={dmButtons.letsConnect.enabled}
                  onChange={(e) => setDmButtons({
                    ...dmButtons,
                    letsConnect: { ...dmButtons.letsConnect, enabled: e.target.checked }
                  })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
              <input
                type="text"
                value={dmButtons.letsConnect.label}
                onChange={(e) => setDmButtons({
                  ...dmButtons,
                  letsConnect: { ...dmButtons.letsConnect, label: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>BG Color</label>
                  <input
                    type="color"
                    value={buttonColors.letsConnect.bg}
                    onChange={(e) => setButtonColors({
                      ...buttonColors,
                      letsConnect: { ...buttonColors.letsConnect, bg: e.target.value }
                    })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Text Color</label>
                  <input
                    type="color"
                    value={buttonColors.letsConnect.text}
                    onChange={(e) => setButtonColors({
                      ...buttonColors,
                      letsConnect: { ...buttonColors.letsConnect, text: e.target.value }
                    })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Collab Request Button */}
            <div style={{ marginBottom: '20px', padding: '16px', border: '2px solid #ddd', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontWeight: '700', color: '#333', fontSize: '14px', margin: 0 }}>
                  🤝 Collab Request
                </label>
                <input
                  type="checkbox"
                  checked={dmButtons.collabRequest.enabled}
                  onChange={(e) => setDmButtons({
                    ...dmButtons,
                    collabRequest: { ...dmButtons.collabRequest, enabled: e.target.checked }
                  })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>
              <input
                type="text"
                value={dmButtons.collabRequest.label}
                onChange={(e) => setDmButtons({
                  ...dmButtons,
                  collabRequest: { ...dmButtons.collabRequest, label: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>BG Color</label>
                  <input
                    type="color"
                    value={buttonColors.collabRequest.bg}
                    onChange={(e) => setButtonColors({
                      ...buttonColors,
                      collabRequest: { ...buttonColors.collabRequest, bg: e.target.value }
                    })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#666' }}>Text Color</label>
                  <input
                    type="color"
                    value={buttonColors.collabRequest.text}
                    onChange={(e) => setButtonColors({
                      ...buttonColors,
                      collabRequest: { ...buttonColors.collabRequest, text: e.target.value }
                    })}
                    style={{ width: '100%', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Links Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: '900', margin: 0, marginBottom: '20px' }}>
              📱 Social Handles
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="@username"
                  value={inputType === 'social' ? newInputValue : ''}
                  onChange={(e) => {
                    setInputType('social');
                    setNewInputValue(e.target.value);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => addContact('social', newInputValue)}
                  style={{
                    background: '#A855F7',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Add
                </button>
              </div>

              {socialHandles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {socialHandles.map((handle, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#F3F4F6',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {handle}
                      <button
                        onClick={() => removeContact('social', idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontWeight: '900',
                          fontSize: '16px',
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Emails Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: '900', margin: 0, marginBottom: '20px' }}>
              📧 Emails
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={inputType === 'email' ? newInputValue : ''}
                  onChange={(e) => {
                    setInputType('email');
                    setNewInputValue(e.target.value);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => addContact('email', newInputValue)}
                  style={{
                    background: '#A855F7',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Add
                </button>
              </div>

              {emails.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {emails.map((email, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#F3F4F6',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {email}
                      <button
                        onClick={() => removeContact('email', idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontWeight: '900',
                          fontSize: '16px',
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Phones Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: '900', margin: 0, marginBottom: '20px' }}>
              📞 Phone Numbers
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={inputType === 'phone' ? newInputValue : ''}
                  onChange={(e) => {
                    setInputType('phone');
                    setNewInputValue(e.target.value);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => addContact('phone', newInputValue)}
                  style={{
                    background: '#A855F7',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Add
                </button>
              </div>

              {phones.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {phones.map((phone, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#F3F4F6',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {phone}
                      <button
                        onClick={() => removeContact('phone', idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontWeight: '900',
                          fontSize: '16px',
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Websites Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '20px', fontWeight: '900', margin: 0, marginBottom: '20px' }}>
              🌐 Websites
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={inputType === 'website' ? newInputValue : ''}
                  onChange={(e) => {
                    setInputType('website');
                    setNewInputValue(e.target.value);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => addContact('website', newInputValue)}
                  style={{
                    background: '#A855F7',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Add
                </button>
              </div>

              {websites.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {websites.map((website, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#F3F4F6',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={website}
                    >
                      {website.replace(/https?:\/\//, '').substring(0, 15)}...
                      <button
                        onClick={() => removeContact('website', idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontWeight: '900',
                          fontSize: '16px',
                          padding: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', color: '#333', fontWeight: '900', margin: 0 }}>
                📸 Portfolio
              </h2>
              <input
                type="checkbox"
                checked={portfolio.enabled}
                onChange={(e) => setPortfolio({ ...portfolio, enabled: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {portfolio.enabled && (
              <input
                type="url"
                placeholder="https://yourportfolio.com"
                value={portfolio.url}
                onChange={(e) => setPortfolio({ ...portfolio, url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Priority Contacts Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', marginBottom: '16px', fontWeight: '900', margin: 0, marginBottom: '16px' }}>
              ⭐ Priority Contacts (Friends & Family)
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
              Add emails here to mark their messages with a star ⭐
            </p>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input
                type="email"
                placeholder="friend@email.com"
                value={inputType === 'priority' ? newInputValue : ''}
                onChange={(e) => {
                  setInputType('priority');
                  setNewInputValue(e.target.value);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => {
                  if (newInputValue.trim()) {
                    setPriorityContacts([...priorityContacts, newInputValue]);
                    setNewInputValue('');
                  }
                }}
                style={{
                  background: '#A855F7',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Add
              </button>
            </div>

            {priorityContacts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {priorityContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FEF08A',
                      padding: '8px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#333',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    ⭐ {contact}
                    <button
                      onClick={() => setPriorityContacts(priorityContacts.filter((_, i) => i !== idx))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontWeight: '900',
                        fontSize: '16px',
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW PAGE
  if (currentView === 'preview' && user) {
    const bgGradient = getBackgroundGradient();

    return (
      <div style={{
        minHeight: '100vh',
        background: bgGradient,
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <button
            onClick={() => setCurrentView('editor')}
            style={{
              background: 'rgba(255,255,255,0.3)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '2px solid white',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '30px',
            }}
          >
            ← Back
          </button>

          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {profile.profilePic ? (
              <img src={profile.profilePic} alt="Profile" style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '6px solid white',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                margin: '0 auto 20px',
                display: 'block',
                objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '6px solid white',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                margin: '0 auto 20px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
              }}>
                📸
              </div>
            )}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              margin: '0 0 8px 0',
            }}>
              {profile.name}
            </h2>
            <p style={{
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              margin: '0 0 12px 0',
            }}>
              {profile.profession}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: '13px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              fontWeight: '600',
              margin: 0,
            }}>
              {profile.bio}
            </p>
          </div>

          {/* DM Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {dmButtons.bookMeeting.enabled && (
              <button
                onClick={() => { setCurrentMessageType('bookMeeting'); setShowMessageForm(true); }}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: buttonColors.bookMeeting.bg,
                  color: buttonColors.bookMeeting.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '20px' }}>📅</span>
                <span>{dmButtons.bookMeeting.label}</span>
              </button>
            )}

            {dmButtons.letsConnect.enabled && (
              <button
                onClick={() => { setCurrentMessageType('letsConnect'); setShowMessageForm(true); }}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: buttonColors.letsConnect.bg,
                  color: buttonColors.letsConnect.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '20px' }}>💬</span>
                <span>{dmButtons.letsConnect.label}</span>
              </button>
            )}

            {dmButtons.collabRequest.enabled && (
              <button
                onClick={() => { setCurrentMessageType('collabRequest'); setShowMessageForm(true); }}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: buttonColors.collabRequest.bg,
                  color: buttonColors.collabRequest.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '20px' }}>🤝</span>
                <span>{dmButtons.collabRequest.label}</span>
              </button>
            )}
          </div>

          {/* Contact Cards Grid */}
          {(socialHandles.length > 0 || emails.length > 0 || phones.length > 0 || websites.length > 0 || portfolio.enabled) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {socialHandles.length > 0 && (
                <button
                  onClick={() => window.open(`https://instagram.com/${socialHandles[0]}`, '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    transition: 'all 0.2s',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📱</span>
                  <span style={{ fontSize: '13px' }}>Instagram</span>
                </button>
              )}

              {emails.length > 0 && (
                <button
                  onClick={() => window.location.href = `mailto:${emails[0]}`}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📧</span>
                  <span style={{ fontSize: '13px' }}>Email</span>
                </button>
              )}

              {phones.length > 0 && (
                <button
                  onClick={() => window.location.href = `tel:${phones[0].replace(/\D/g, '')}`}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📞</span>
                  <span style={{ fontSize: '13px' }}>Call</span>
                </button>
              )}

              {websites.length > 0 && (
                <button
                  onClick={() => window.open(websites[0], '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>🌐</span>
                  <span style={{ fontSize: '13px' }}>Website</span>
                </button>
              )}

              {portfolio.enabled && portfolio.url && (
                <button
                  onClick={() => window.open(portfolio.url, '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📸</span>
                  <span style={{ fontSize: '13px' }}>Portfolio</span>
                </button>
              )}
            </div>
          )}

          {/* Share Link Section */}
          {shareLink && (
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            }}>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px 0', fontWeight: '600' }}>
                🔗 Your Public Link
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={copyToClipboard}
                  style={{
                    background: copySuccess ? '#10B981' : '#A855F7',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {copySuccess ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Message Form Modal */}
          {showMessageForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px 24px 0 0',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#333' }}>
                    {currentMessageType === 'bookMeeting' ? '📅 Book a Meeting' : 
                     currentMessageType === 'letsConnect' ? '💬 Let\'s Connect' : 
                     '🤝 Collab Request'}
                  </h3>
                  <button
                    onClick={() => setShowMessageForm(false)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      fontWeight: '900',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={messageForm.name}
                    onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={messageForm.email}
                    onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Message
                  </label>
                  <textarea
                    placeholder="Your message..."
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      minHeight: '100px',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  style={{
                    background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                    color: 'white',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '14px',
                  }}
                >
                  Send Message ✨
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // INBOX PAGE
  if (currentView === 'inbox' && user) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentView('editor')}
              style={{
                background: 'rgba(255,255,255,0.3)',
                border: '3px solid white',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: '28px', color: 'white', fontWeight: '900', margin: 0 }}>📬 Messages</h1>
            <div style={{ width: '100px' }} />
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
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            {[
              { id: 'all', emoji: '💬', label: 'All' },
              { id: 'priority', emoji: '⭐', label: 'Priority' },
              { id: 'meeting', emoji: '📅', label: 'Meeting' },
              { id: 'connect', emoji: '💬', label: 'Connect' },
              { id: 'collab', emoji: '🤝', label: 'Collab' },
              { id: 'fans', emoji: '🌸', label: 'Fans' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setInboxFilter(filter.id)}
                style={{
                  padding: '8px 15px',
                  background: inboxFilter === filter.id ? '#A855F7' : '#f0f0f0',
                  color: inboxFilter === filter.id ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '12px',
                  transition: 'all 0.2s',
                }}
              >
                {filter.emoji} {filter.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          {getFilteredMessages().length === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              padding: '60px 40px',
              textAlign: 'center',
              color: '#999',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            }}>
              <div style={{ fontSize: '56px', marginBottom: '15px' }}>📬</div>
              <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '8px', color: '#333' }}>No messages yet</div>
              <div style={{ fontSize: '13px' }}>Messages will appear here when people send you messages!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getFilteredMessages().map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '16px',
                    padding: '16px',
                    borderLeft: `5px solid ${msg.isPriority ? '#FBBF24' : '#9CA3AF'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: '900', color: '#333', fontSize: '14px', marginBottom: '4px' }}>
                          {msg.messageEmoji} {msg.senderName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>{msg.senderEmail}</div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{msg.messageType.split(' ')[0]}</div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.5', marginBottom: '10px' }}>{msg.message}</div>
                    <div style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>
                      {msg.timestamp?.toDate?.()?.toLocaleString?.() || 'Just now'}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '12px',
                      marginLeft: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>Loading Links & DM...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Public Preview (for /user/:username)
  if (currentView === 'public-preview' && publicProfile) {
    const bgGradient = publicProfile.profile?.customBgColor 
      ? publicProfile.profile.customBgColor
      : themes[publicProfile.profile?.selectedTheme || 0]?.gradient || 'linear-gradient(135deg, #40E0D0 0%, #20B2AA 100%)';

    return (
      <div style={{
        minHeight: '100vh',
        background: bgGradient,
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {publicProfile.profile?.profilePic ? (
              <img src={publicProfile.profile.profilePic} alt="Profile" style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '6px solid white',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                margin: '0 auto 20px',
                display: 'block',
                objectFit: 'cover',
              }} />
            ) : (
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '6px solid white',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                margin: '0 auto 20px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '56px',
              }}>
                📸
              </div>
            )}
            <h2 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              margin: '0 0 8px 0',
            }}>
              {publicProfile.profile?.name || 'User Profile'}
            </h2>
            <p style={{
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              margin: '0 0 12px 0',
            }}>
              {publicProfile.profile?.profession || 'Creator'}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: '13px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              fontWeight: '600',
              margin: 0,
            }}>
              {publicProfile.profile?.bio || 'Welcome to my profile'}
            </p>
          </div>

          {/* DM Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {publicProfile.dmButtons?.bookMeeting?.enabled && (
              <button
                onClick={() => { setCurrentMessageType('bookMeeting'); setShowMessageForm(true); }}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: publicProfile.buttonColors?.bookMeeting?.bg || '#B0E0E6',
                  color: publicProfile.buttonColors?.bookMeeting?.text || '#0066cc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '20px' }}>📅</span>
                <span>{publicProfile.dmButtons.bookMeeting.label}</span>
              </button>
            )}

            {publicProfile.dmButtons?.letsConnect?.enabled && (
              <button
                onClick={() => { setCurrentMessageType('letsConnect'); setShowMessageForm(true); }}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: publicProfile.buttonColors?.letsConnect?.bg || '#DDA0DD',
                  color: publicProfile.buttonColors?.letsConnect?.text || '#8B008B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '20px' }}>💬</span>
                <span>{publicProfile.dmButtons.letsConnect.label}</span>
              </button>
            )}

            {publicProfile.dmButtons?.collabRequest?.enabled && (
              <button
                onClick={() => { setCurrentMessageType('collabRequest'); setShowMessageForm(true); }}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: publicProfile.buttonColors?.collabRequest?.bg || '#AFEEEE',
                  color: publicProfile.buttonColors?.collabRequest?.text || '#008B8B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '20px' }}>🤝</span>
                <span>{publicProfile.dmButtons.collabRequest.label}</span>
              </button>
            )}
          </div>

          {/* Contact Cards Grid */}
          {(publicProfile.socialHandles?.length > 0 || publicProfile.emails?.length > 0 || 
            publicProfile.phones?.length > 0 || publicProfile.websites?.length > 0 ||
            publicProfile.portfolio?.enabled) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {publicProfile.socialHandles?.length > 0 && (
                <button
                  onClick={() => window.open(`https://instagram.com/${publicProfile.socialHandles[0]}`, '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    transition: 'all 0.2s',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📱</span>
                  <span style={{ fontSize: '13px' }}>Instagram</span>
                </button>
              )}

              {publicProfile.emails?.length > 0 && (
                <button
                  onClick={() => window.location.href = `mailto:${publicProfile.emails[0]}`}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📧</span>
                  <span style={{ fontSize: '13px' }}>Email</span>
                </button>
              )}

              {publicProfile.phones?.length > 0 && (
                <button
                  onClick={() => window.location.href = `tel:${publicProfile.phones[0].replace(/\D/g, '')}`}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📞</span>
                  <span style={{ fontSize: '13px' }}>Call</span>
                </button>
              )}

              {publicProfile.websites?.length > 0 && (
                <button
                  onClick={() => window.open(publicProfile.websites[0], '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>🌐</span>
                  <span style={{ fontSize: '13px' }}>Website</span>
                </button>
              )}

              {publicProfile.portfolio?.enabled && publicProfile.portfolio?.url && (
                <button
                  onClick={() => window.open(publicProfile.portfolio.url, '_blank')}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>📸</span>
                  <span style={{ fontSize: '13px' }}>Portfolio</span>
                </button>
              )}
            </div>
          )}

          {/* Message Form Modal */}
          {showMessageForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px 24px 0 0',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#333' }}>
                    {currentMessageType === 'bookMeeting' ? '📅 Book a Meeting' : 
                     currentMessageType === 'letsConnect' ? '💬 Let\'s Connect' : 
                     '🤝 Collab Request'}
                  </h3>
                  <button
                    onClick={() => setShowMessageForm(false)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      fontWeight: '900',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={messageForm.name}
                    onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={messageForm.email}
                    onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>
                    Message
                  </label>
                  <textarea
                    placeholder="Your message..."
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                    style={{
                      width: '100%',
                      border: '2px solid #ddd',
                      borderRadius: '12px',
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      minHeight: '100px',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  style={{
                    background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                    color: 'white',
                    padding: '12px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '14px',
                  }}
                >
                  Send Message ✨
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not Found
  if (currentView === 'not-found') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>🔍</div>
          <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '16px', fontWeight: '900' }}>Profile Not Found</h2>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>The profile you're looking for doesn't exist.</p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
              color: 'white',
              padding: '12px 32px',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ← Go Home
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Poppins', sans-serif",
    }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <p style={{ fontSize: '24px', fontWeight: '900' }}>Loading...</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <LinksAndDM />
    </ErrorBoundary>
  );
}
