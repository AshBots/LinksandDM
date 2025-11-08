import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, setDoc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
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
            <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '16px', fontWeight: '900' }}>Oops! Something went wrong</h2>
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
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration incomplete. Check .env.local file with REACT_APP_FIREBASE_* variables');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
  });

  // Buttons & Links States
  const [dmButtons, setDmButtons] = useState({
    bookMeeting: { enabled: true, label: 'Book a Meeting', icon: '📅' },
    letsConnect: { enabled: true, label: "Let's Connect", icon: '💬' },
    collabRequest: { enabled: true, label: 'Collab Request', icon: '🤝' },
    supportCause: { enabled: false, label: 'Support a Cause', icon: '❤️' },
  });

  const [buttonColors, setButtonColors] = useState({
    bookMeeting: { bg: '#B0E0E6', text: '#0066cc' },
    letsConnect: { bg: '#DDA0DD', text: '#8B008B' },
    collabRequest: { bg: '#AFEEEE', text: '#008B8B' },
    supportCause: { bg: '#FFB6D9', text: '#C71585' },
  });

  const [charityLinks, setCharityLinks] = useState([]);
  const [socialHandles, setSocialHandles] = useState([]);
  const [emails, setEmails] = useState([]);
  const [phones, setPhones] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [portfolio, setPortfolio] = useState({ enabled: false, url: '' });
  const [projects, setProjects] = useState({ enabled: false, list: [] });
  const [priorityContacts, setPriorityContacts] = useState([]);

  // Messages States
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ name: '', contact: '', message: '' });
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [currentMessageType, setCurrentMessageType] = useState(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [shareLink, setShareLink] = useState('');
  // Add loading state for save operations
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show notification helper
  const showNotify = (message, duration = 3000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), duration);
  };

  // Modal States
  const [showCharityModal, setShowCharityModal] = useState(false);
  const [showHandlesModal, setShowHandlesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  // UI States
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState(null);
  const [showThemeCustomizer, setShowThemeCustomizer] = useState(false);
  
  // Public profile route state
  const [publicUsername, setPublicUsername] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);

  // Check if viewing public profile via URL
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
            // Query for profile by username (check both nested and top-level)
            const q = query(
              collection(db, 'users'),
              where('username', '==', username)
            );
            const querySnapshot = await getDocs(q);
            if (querySnapshot.docs.length > 0) {
              const userData = querySnapshot.docs[0].data();
              setPublicProfile(userData);
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
    });
    return unsubscribe;
  }, []);

  // Real-time message listener
  useEffect(() => {
    if (user && currentView === 'inbox') {
      try {
        const q = query(
          collection(db, `users/${user.uid}/messages`),
          orderBy('timestamp', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMessages(msgs);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error setting up message listener:', error);
      }
    }
  }, [user, currentView]);

  // Load user profile
  const loadUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data.profile || profile);
        setDmButtons(data.dmButtons || dmButtons);
        setButtonColors(data.buttonColors || buttonColors);
        setCharityLinks(data.charityLinks || []);
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
        collection(db, `users/${uid}/messages`),
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

  // Save profile to Firebase
  const saveProfile = async (silent = false) => {
    if (!user || !profile.username.trim()) {
      showNotify('⚠️ Please enter a username');
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        profile,
        dmButtons,
        buttonColors,
        charityLinks,
        socialHandles,
        emails,
        phones,
        websites,
        portfolio,
        projects,
        priorityContacts,
        username: profile.username.trim(),
        email: user.email,
        lastUpdated: new Date(),
      });
      if (!silent) {
        showNotify('✅ Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotify('❌ Error saving profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle authentication
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    // Validate inputs
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
      console.error('Auth error:', error);
      // Provide user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        setAuthError('❌ User not found. Create an account first.');
      } else if (error.code === 'auth/wrong-password') {
        setAuthError('❌ Incorrect password.');
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError('❌ Email already in use.');
      } else if (error.code === 'auth/invalid-email') {
        setAuthError('❌ Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        setAuthError('❌ Password is too weak. Use 6+ characters.');
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
  const generateShareLink = async () => {
    if (!profile.username.trim()) {
      showNotify('⚠️ Please set a username first!');
      return;
    }
    
    // Save profile first before generating link
    try {
      await setDoc(doc(db, 'users', user.uid), {
        profile,
        dmButtons,
        buttonColors,
        charityLinks,
        emails,
        phones,
        websites,
        portfolio,
        projects,
        socialHandles,
        priorityContacts,
        userId: user.uid,
        email: user.email,
      });
      
      // Now generate the link
      if (typeof window !== 'undefined' && window.location) {
        const link = `${window.location.origin}/user/${profile.username}`;
        setShareLink(link);
      } else {
        const link = `https://linksanddms.netlify.app/user/${profile.username}`;
        setShareLink(link);
      }
      
      showNotify('✅ Profile saved! Link generated.');
    } catch (error) {
      console.error('Error saving and generating link:', error);
      showNotify('❌ Error saving profile');
    }
  };

  // Copy to clipboard with fallback
  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      showNotify('❌ Failed to copy link. Please try again.');
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageForm.name || !messageForm.contact || !messageForm.message) {
      showNotify('Please fill all fields');
      return;
    }
    try {
      // If on public preview, find the recipient by username
      let recipientId = user?.uid;
      if (!recipientId && publicUsername) {
        const q = query(
          collection(db, 'users'),
          where('username', '==', publicUsername)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.docs.length === 0) {
          showNotify('Recipient not found');
          return;
        }
        recipientId = querySnapshot.docs[0].id;
      }

      if (!recipientId) {
        showNotify('Error: Recipient not found');
        return;
      }

      // Check if sender is in priority contacts (by email)
      const recipientData = (await getDoc(doc(db, 'users', recipientId))).data();
      const isPriority = recipientData?.priorityContacts?.some(c => 
        (typeof c === 'string' ? c === messageForm.contact : 
         c.email === messageForm.contact)
      ) || false;

      // Get message type label
      let messageTypeLabel = currentMessageType?.label || currentMessageType || 'Message';
      if (currentMessageType?.icon && currentMessageType?.label) {
        messageTypeLabel = `${currentMessageType.icon} ${currentMessageType.label}`;
      }

      // Store in recipient's private subcollection
      await addDoc(collection(db, `users/${recipientId}/messages`), {
        senderName: messageForm.name,
        senderContact: messageForm.contact,
        message: messageForm.message,
        messageType: messageTypeLabel,
        timestamp: new Date(),
        isPriority: isPriority,
      });
      setMessageForm({ name: '', contact: '', message: '' });
      setShowMessageForm(false);
      showNotify('✅ Message sent successfully!');
      if (user) {
        loadMessages(user.uid);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotify('Error sending message');
    }
  };

  // Filter messages
  const getFilteredMessages = () => {
    let filtered = messages;
    if (inboxFilter === 'all') return filtered;
    if (inboxFilter === 'priority') return filtered.filter(m => m.isPriority);
    if (inboxFilter === 'meeting') return filtered.filter(m => m.messageType?.includes('📅') || m.messageType?.includes('Book a Meeting'));
    if (inboxFilter === 'connect') return filtered.filter(m => m.messageType?.includes('💬') || m.messageType?.includes("Let's Connect"));
    if (inboxFilter === 'collab') return filtered.filter(m => m.messageType?.includes('🤝') || m.messageType?.includes('Collab'));
    if (inboxFilter === 'fans') return filtered.filter(m => m.messageType?.includes('❤️') || m.messageType?.includes('Support'));
    return filtered;
  };

  const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://${url}`;
  };

  // Delete message
  const deleteMessage = async (msgId) => {
    try {
      if (user) {
        await deleteDoc(doc(db, `users/${user.uid}/messages`, msgId));
        loadMessages(user.uid);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      showNotify('Error deleting message');
    }
  };

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

  // PUBLIC PROFILE PAGE (via /user/:username)
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
                margin: '0 auto 20px auto',
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
                margin: '0 auto 20px auto',
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
                onClick={() => { setCurrentMessageType(publicProfile.dmButtons.bookMeeting); setShowMessageForm(true); }}
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
                onClick={() => { setCurrentMessageType(publicProfile.dmButtons.letsConnect); setShowMessageForm(true); }}
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
                onClick={() => { setCurrentMessageType(publicProfile.dmButtons.collabRequest); setShowMessageForm(true); }}
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

            {publicProfile.dmButtons?.supportCause?.enabled && (
              <button
                onClick={() => { setCurrentMessageType(publicProfile.dmButtons.supportCause); setShowMessageForm(true); }}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: publicProfile.buttonColors?.supportCause?.bg || '#FFB6D9',
                  color: publicProfile.buttonColors?.supportCause?.text || '#C71585',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ fontSize: '20px' }}>❤️</span>
                <span>{publicProfile.dmButtons.supportCause.label}</span>
              </button>
            )}
          </div>

          {/* Contact Cards Grid */}
          {(publicProfile.socialHandles?.length > 0 || publicProfile.emails?.length > 0 || 
            publicProfile.phones?.length > 0 || publicProfile.websites?.length > 0 ||
            publicProfile.portfolio?.enabled || publicProfile.projects?.enabled) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px',
            }}>
              {publicProfile.socialHandles?.length > 0 && (
                <button
                  onClick={() => setShowHandlesModal(true)}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '32px' }}>🌐</div>
                  <div style={{ fontSize: '12px' }}>@ Socials</div>
                </button>
              )}

              {publicProfile.emails?.length > 0 && (
                <button
                  onClick={() => setShowEmailModal(true)}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '32px' }}>📧</div>
                  <div style={{ fontSize: '12px' }}>@ Email</div>
                </button>
              )}

              {publicProfile.phones?.length > 0 && (
                <button
                  onClick={() => window.location.href = `tel:${publicProfile.phones[0]}`}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '32px' }}>📱</div>
                  <div style={{ fontSize: '12px' }}>Call</div>
                </button>
              )}

              {publicProfile.websites?.length > 0 && (
                <button
                  onClick={() => setShowWebsiteModal(true)}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '32px' }}>🌍</div>
                  <div style={{ fontSize: '12px' }}>Website</div>
                </button>
              )}

              {publicProfile.portfolio?.enabled && (
                <button
                  onClick={() => setShowPortfolioModal(true)}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '32px' }}>🎨</div>
                  <div style={{ fontSize: '12px' }}>Portfolio</div>
                </button>
              )}

              {publicProfile.projects?.enabled && (
                <button
                  onClick={() => setShowProjectsModal(true)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    border: '3px solid rgba(255,255,255,0.4)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ fontSize: '32px' }}>📁</div>
                  <div style={{ fontSize: '12px' }}>Projects</div>
                </button>
              )}
            </div>
          )}

          {/* Charity Links */}
          {publicProfile.charityLinks?.length > 0 && (
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              border: '3px solid rgba(255,255,255,0.3)',
            }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '12px' }}>
                ❤️ Charity Links
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {publicProfile.charityLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => window.open(formatUrl(link), '_blank')}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.3)',
                      color: 'white',
                      border: '2px solid white',
                      borderRadius: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.5)';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255,255,255,0.3)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    🔗 {link}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Social Handles Modal */}
          {showHandlesModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000, padding: '20px',
            }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>🌐 Social Handles</h3>
                  <button onClick={() => setShowHandlesModal(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {publicProfile.socialHandles?.map((handle, idx) => (
                    <a key={idx} href={`https://${handle.platform.toLowerCase()}.com/${handle.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#1E90FF', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      {handle.platform}: {handle.handle}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Email Modal */}
          {showEmailModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000, padding: '20px',
            }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>📧 Email</h3>
                  <button onClick={() => setShowEmailModal(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {publicProfile.emails?.map((email, idx) => (
                    <a key={idx} href={`mailto:${email}`}
                      style={{
                        background: '#F3F4F6', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#1E90FF', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      {email}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Phone Modal */}
          {showPhoneModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000, padding: '20px',
            }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>☎️ Phone</h3>
                  <button onClick={() => setShowPhoneModal(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {publicProfile.phones?.map((phone, idx) => (
                    <a key={idx} href={`tel:${phone}`}
                      style={{
                        background: '#F3F4F6', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#1E90FF', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Website Modal */}
          {showWebsiteModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000, padding: '20px',
            }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>🌍 Website</h3>
                  <button onClick={() => setShowWebsiteModal(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {publicProfile.websites?.map((website, idx) => (
                    <a key={idx} href={website} target="_blank" rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#1E90FF', fontWeight: '700', cursor: 'pointer', wordBreak: 'break-all'
                      }}
                    >
                      {website}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Modal */}
          {showPortfolioModal && publicProfile.portfolio?.enabled && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000, padding: '20px',
            }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>🎨 Portfolio</h3>
                  <button onClick={() => setShowPortfolioModal(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <a href={formatUrl(publicProfile.portfolio.url)} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'block', background: '#A855F7', color: 'white', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  🔗 View Portfolio
                </a>
              </div>
            </div>
          )}

          {/* Projects Modal */}
          {showProjectsModal && publicProfile.projects?.enabled && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000, padding: '20px',
            }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>📁 Projects</h3>
                  <button onClick={() => setShowProjectsModal(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {publicProfile.projects?.list?.map((project, idx) => (
                    <a key={idx} href={formatUrl(project.url)} target="_blank" rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#1E90FF', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      {project.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Charity Modal */}
          {showCharityModal && publicProfile.charityLinks?.length > 0 && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 1000, padding: '20px',
            }}>
              <div style={{ background: 'white', borderRadius: '20px', padding: '30px', maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>❤️ Support a Cause</h3>
                  <button onClick={() => setShowCharityModal(false)} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {publicProfile.charityLinks?.map((charity, idx) => (
                    <a key={idx} href={charity.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: '#1E90FF', fontWeight: '700', cursor: 'pointer'
                      }}
                    >
                      {charity.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              zIndex: 1000,
            }}>
              <div style={{
                background: 'white',
                borderRadius: '24px',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '20px', color: '#333', fontWeight: '900', margin: 0 }}>
                    Send Message {currentMessageType.icon}
                  </h3>
                  <button
                    onClick={() => setShowMessageForm(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#999',
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12px', color: '#333' }}>Name</label>
                    <input
                      type="text"
                      value={messageForm.name}
                      onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                      placeholder="Your name"
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

                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12px', color: '#333' }}>Email or Contact</label>
                    <input
                      type="text"
                      value={messageForm.contact}
                      onChange={(e) => setMessageForm({ ...messageForm, contact: e.target.value })}
                      placeholder="email@example.com"
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

                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12px', color: '#333' }}>Message</label>
                    <textarea
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      placeholder="Your message..."
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
                      marginTop: '10px',
                      fontSize: '14px',
                    }}
                  >
                    Send Message ✨
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // NOT FOUND PAGE
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
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
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

  // LANDING PAGE
  if (currentView === 'landing') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #E83E8C 0%, #D946A6 15%, #FF6B35 30%, #FFA500 50%, #FFD700 70%, #00FF9F 100%)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            zIndex: '9999',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.3s ease-out',
          }}>
            {notification}
            <style>{`@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
          </div>
        )}
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', marginTop: '20px' }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: '900',
              color: 'white',
              textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
              margin: 0,
            }}>🔗 Links & DM 💬</h1>
            <button
              onClick={() => user ? setCurrentView('editor') : setCurrentView('auth')}
              style={{
                background: 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
                color: 'white',
                padding: '28px 70px',
                borderRadius: '50px',
                border: 'none',
                fontWeight: '900',
                fontSize: '28px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 15px 50px rgba(255, 140, 0, 0.5)',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)'; e.target.style.boxShadow = '0 20px 60px rgba(255, 140, 0, 0.7)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = '0 15px 50px rgba(255, 140, 0, 0.5)'; }}
            >
              Let's Do It!
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{
              fontSize: '92px',
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '60px',
          }}>
            {[
              { emoji: '💬', title: 'Smart DM Sorting', desc: 'Messages organized by type', color: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)' },
              { emoji: '🎨', title: '12 Beautiful Themes', desc: 'Stunning designs & colors', color: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)' },
              { emoji: '📱', title: 'All Socials in One', desc: 'All your platforms linked', color: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' },
              { emoji: '📧', title: 'Email Hub', desc: 'Manage all emails easily', color: 'linear-gradient(135deg, #3B82F6 0%, #06E0FF 100%)' },
              { emoji: '📁', title: 'Portfolio & Projects', desc: 'Showcase your best work', color: 'linear-gradient(135deg, #F97316 0%, #FBBF24 100%)' },
              { emoji: '🔗', title: 'Contact Central', desc: 'Phone, web, everything', color: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' },
            ].map((item, idx) => (
              <div key={idx} style={{
                background: item.color,
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: '3px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>{item.emoji}</div>
                <h3 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 8px 0', textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '14px', margin: 0, fontWeight: '600' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentView('auth')}
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                color: 'white',
                padding: '20px 60px',
                borderRadius: '50px',
                border: '3px solid white',
                fontWeight: '900',
                fontSize: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                minWidth: '300px',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              Let's Get Organized 🎉
            </button>
            <button
              onClick={() => setCurrentView('demo-preview')}
              style={{
                background: 'white',
                color: '#A855F7',
                padding: '20px 60px',
                borderRadius: '50px',
                border: '3px solid white',
                fontWeight: '900',
                fontSize: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                minWidth: '300px',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              See Demo Preview ✨
            </button>
          </div>

          <div style={{ textAlign: 'center', color: 'white', fontWeight: '700', fontSize: '16px' }}>
            <p>Trusted by Influencers • Celebrities • Entrepreneurs 💎</p>
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
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          border: '3px solid #E9D5FF',
        }}>
          <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '30px', fontSize: '24px', fontWeight: '900', margin: 0, marginBottom: '30px' }}>
            {authMode === 'signin' ? '🔐 Sign In' : '📝 Sign Up'}
          </h2>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>Email</label>
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
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', color: '#333', fontSize: '14px' }}>Password</label>
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
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
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
          {/* Professional Header */}
          <h1 style={{ 
            fontSize: '52px', 
            fontWeight: '900', 
            color: 'white', 
            textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
            textAlign: 'center',
            marginBottom: '40px',
            marginTop: '30px',
          }}>
            Build your<br/>digital presence
          </h1>
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '40px',
          }}>
            <button
              onClick={() => setCurrentView('preview')}
              style={{
                background: 'white',
                color: '#10B981',
                padding: '16px 40px',
                borderRadius: '24px',
                border: '4px solid #10B981',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 10px 30px rgba(16, 185, 129, 0.3)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
            >
              👁️ Preview
            </button>
            <button
              onClick={() => setCurrentView('inbox')}
              style={{
                background: 'white',
                color: '#3B82F6',
                padding: '16px 40px',
                borderRadius: '24px',
                border: '4px solid #3B82F6',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 10px 30px rgba(59, 130, 246, 0.3)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
            >
              📬 Inbox ({messages.length})
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '16px 40px',
                borderRadius: '24px',
                border: '2px solid white',
                fontWeight: '800',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
            >
              🚪 Logout
            </button>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '28px',
            padding: '30px',
            marginBottom: '30px',
            borderLeft: '5px solid rgba(168, 85, 247, 0.8)',
          }}>
            <h2 style={{ fontSize: '24px', color: '#A855F7', fontWeight: '900', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              👤 Profile
            </h2>

            {/* Profile Picture */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                {profile.profilePic ? (
                  <img src={profile.profilePic} alt="Profile" style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '6px solid #A855F7',
                    boxShadow: '0 15px 35px rgba(168, 85, 247, 0.3)',
                  }} />
                ) : (
                  <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: '#F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '64px',
                    border: '6px solid #A855F7',
                    boxShadow: '0 15px 35px rgba(168, 85, 247, 0.3)',
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
                        setProfile(prev => ({ ...prev, profilePic: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '800', marginBottom: '8px', fontSize: '16px', color: '#333' }}>Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', marginBottom: '8px', fontSize: '16px', color: '#333' }}>Profession</label>
                <input
                  type="text"
                  value={profile.profession}
                  onChange={(e) => setProfile(prev => ({ ...prev, profession: e.target.value }))}
                  style={{
                    width: '100%',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '800', marginBottom: '8px', fontSize: '16px', color: '#333' }}>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  style={{
                    width: '100%',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '14px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                    minHeight: '100px',
                    resize: 'vertical',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '14px', color: '#333' }}>📱 Username (for shareable link)</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="e.g., john_doe"
                  style={{
                    width: '100%',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '10px',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                    fontSize: '14px',
                    marginBottom: '12px',
                  }}
                />
                {profile.username && (
                  <div style={{
                    background: '#F3F4F6',
                    padding: '12px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666', fontWeight: '700' }}>Note: Generate link at bottom</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Smart DM Buttons */}
          <div style={{
            background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: 0 }}>💌 Smart DM Buttons</h2>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{
                  background: 'white',
                  color: '#EC4899',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🎨 Colors
              </button>
            </div>

            {showColorPicker && (
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}>
                {Object.entries(dmButtons).map(([key, btn]) => (
                  <div key={key} style={{
                    background: '#F3F4F6',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        background: buttonColors[key].bg,
                        color: buttonColors[key].text,
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '20px',
                      }}>
                        {btn.icon}
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#333', flex: 1 }}>{btn.label}</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {/* Background Color */}
                      <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', minWidth: '70px' }}>🎨 BG:</label>
                        <input
                          type="color"
                          value={buttonColors[key].bg}
                          onChange={(e) => setButtonColors(prev => ({
                            ...prev,
                            [key]: { ...prev[key], bg: e.target.value }
                          }))}
                          style={{ width: '50px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </div>
                      
                      {/* Font Color */}
                      <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ fontSize: '12px', fontWeight: '700', color: '#666', minWidth: '70px' }}>📝 Font:</label>
                        <input
                          type="color"
                          value={buttonColors[key].text}
                          onChange={(e) => setButtonColors(prev => ({
                            ...prev,
                            [key]: { ...prev[key], text: e.target.value }
                          }))}
                          style={{ width: '50px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(dmButtons).map(([key, btn]) => (
                <div key={key} style={{
                  background: 'rgba(255,255,255,0.95)',
                  padding: '12px',
                  borderRadius: '12px',
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
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '14px',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Charity Links */}
          <div style={{
            background: 'linear-gradient(135deg, #EC4899 0%, #F87171 100%)',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 16px 0' }}>❤️ Charity / Cause Links</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {charityLinks.map((charity, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={charity.name}
                    onChange={(e) => {
                      const newList = [...charityLinks];
                      newList[idx].name = e.target.value;
                      setCharityLinks(newList);
                    }}
                    placeholder="Cause name"
                    style={{
                      flex: 0.3,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
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
                    placeholder="https://..."
                    style={{
                      flex: 0.7,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setCharityLinks(charityLinks.filter((_, i) => i !== idx))}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      color: 'white',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setCharityLinks([...charityLinks, { name: '', url: '' }])}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px',
                border: '2px dashed white',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add Charity Link
            </button>
          </div>

          {/* Social Handles */}
          <div style={{
            background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 16px 0' }}>🌐 Social Handles</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {socialHandles.map((handle, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
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
                      flex: 0.6,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setSocialHandles(socialHandles.filter((_, i) => i !== idx))}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      color: 'white',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSocialHandles([...socialHandles, { platform: '', handle: '' }])}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px',
                border: '2px dashed white',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add Handle
            </button>
          </div>

          {/* Emails */}
          <div style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 16px 0' }}>📧 Email Addresses</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {emails.map((email, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setEmails(emails.filter((_, i) => i !== idx))}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      color: 'white',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setEmails([...emails, ''])}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px',
                border: '2px dashed white',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add Email
            </button>
          </div>

          {/* Phones */}
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 16px 0' }}>📱 Contact Numbers</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {phones.map((phone, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setPhones(phones.filter((_, i) => i !== idx))}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      color: 'white',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPhones([...phones, ''])}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px',
                border: '2px dashed white',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add Phone
            </button>
          </div>

          {/* Websites */}
          <div style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 16px 0' }}>🌍 Website / Store</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {websites.map((website, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setWebsites(websites.filter((_, i) => i !== idx))}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      color: 'white',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setWebsites([...websites, ''])}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px',
                border: '2px dashed white',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add Website
            </button>
          </div>

          {/* Portfolio */}
          <div style={{
            background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 20px 0' }}>🎨 Portfolio</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={portfolio.enabled}
                onChange={(e) => setPortfolio(prev => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label style={{ fontWeight: '700', cursor: 'pointer', color: 'white' }}>Enable Portfolio</label>
            </div>
            {portfolio.enabled && (
              <input
                type="url"
                value={portfolio.url}
                onChange={(e) => setPortfolio(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://yourportfolio.com"
                style={{
                  width: '100%',
                  border: '1px solid #fff',
                  borderRadius: '12px',
                  padding: '10px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            )}
          </div>

          {/* Projects */}
          <div style={{
            background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 20px 0' }}>📁 Latest Projects</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                checked={projects.enabled}
                onChange={(e) => setProjects(prev => ({ ...prev, enabled: e.target.checked }))}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label style={{ fontWeight: '700', cursor: 'pointer', color: 'white' }}>Enable Projects</label>
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
                          border: '1px solid #fff',
                          borderRadius: '8px',
                          padding: '8px',
                          fontWeight: '600',
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
                          border: '1px solid #fff',
                          borderRadius: '8px',
                          padding: '8px',
                          fontWeight: '600',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        onClick={() => {
                          const newList = projects.list.filter((_, i) => i !== idx);
                          setProjects(prev => ({ ...prev, list: newList }));
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          color: 'white',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setProjects(prev => ({ ...prev, list: [...prev.list, { title: '', url: '' }] }))}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '10px',
                    border: '2px dashed white',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  + Add Project
                </button>
              </>
            )}
          </div>

          {/* Choose Theme */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', fontWeight: '900', margin: '0 0 20px 0' }}>🎨 Choose Theme</h2>
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
                    border: 'none',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '11px',
                    color: 'white',
                    textShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                    boxShadow: profile.selectedTheme === idx ? '0 0 0 4px #A855F7, 0 8px 16px rgba(168, 85, 247, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Background Color */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', color: '#333', fontWeight: '900', margin: '0 0 20px 0' }}>🎯 Custom Background Color</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px', fontWeight: '600' }}>Create your unique look with a custom background color</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="color"
                value={profile.customBgColor || '#FFB347'}
                onChange={(e) => setProfile(prev => ({ ...prev, customBgColor: e.target.value }))}
                style={{
                  width: '80px',
                  height: '80px',
                  border: '3px solid #ddd',
                  borderRadius: '16px',
                  cursor: 'pointer',
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '700', color: '#333' }}>Selected Color</p>
                <div style={{
                  background: profile.customBgColor || '#FFB347',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                }}>
                  {profile.customBgColor || '#FFB347'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setProfile(prev => ({ ...prev, customBgColor: null }))}
              style={{
                marginTop: '12px',
                background: '#f0f0f0',
                color: '#333',
                border: '2px solid #ddd',
                borderRadius: '12px',
                padding: '10px 16px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reset to Theme Colors
            </button>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
            borderRadius: '20px',
            padding: '18px',
            marginBottom: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            <h2 style={{ fontSize: '20px', color: 'white', fontWeight: '900', margin: '0 0 12px 0' }}>⭐ Friends & Family (Priority)</h2>
            <p style={{ color: 'white', fontWeight: '600', marginBottom: '16px', fontSize: '13px' }}>Add email addresses from friends & family. Messages from these emails show ⭐</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
              {priorityContacts.map((contact, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="email"
                    value={typeof contact === 'string' ? contact : (contact.email || '')}
                    onChange={(e) => {
                      const newContacts = [...priorityContacts];
                      if (typeof newContacts[idx] === 'string') {
                        newContacts[idx] = { email: e.target.value };
                      } else {
                        newContacts[idx].email = e.target.value;
                      }
                      setPriorityContacts(newContacts);
                    }}
                    placeholder="friend@email.com"
                    style={{
                      flex: 1,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px',
                      fontWeight: '600',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => setPriorityContacts(priorityContacts.filter((_, i) => i !== idx))}
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      color: 'white',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPriorityContacts([...priorityContacts, { email: '' }])}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '10px',
                border: '2px dashed white',
                borderRadius: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + Add Contact
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={saveProfile}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '16px',
              border: 'none',
              fontWeight: '900',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '40px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
          >
            💾 Save All Changes
          </button>

          {/* Save & Generate Link Buttons at Bottom */}
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              onClick={async () => {
                await saveProfile(true);
                generateShareLink();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: '900',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
              }}
              onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)'; }}
              onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)'; }}
            >
              🔗 Generate Shareable Link
            </button>
            {shareLink && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '2px solid #3B82F6',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666', fontWeight: '700' }}>✅ Link Generated!</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    style={{
                      flex: 1,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={copyToClipboard}
                    style={{
                      background: copySuccess ? '#10B981' : '#3B82F6',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copySuccess ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW PAGE
  if (currentView === 'preview') {
    const [previewData, setPreviewData] = useState(null);
    const [previewModal, setPreviewModal] = useState(null);
    const [previewMessageForm, setPreviewMessageForm] = useState({ name: '', contact: '', message: '' });

    // Load user profile data
    useEffect(() => {
      const loadPreviewProfile = async () => {
        if (user) {
          try {
            const userData = (await getDoc(doc(db, 'users', user.uid))).data();
            setPreviewData(userData);
          } catch (err) {
            console.error('Error loading preview:', err);
          }
        }
      };
      loadPreviewProfile();
    }, [user]);

    if (!previewData) return <div style={{ minHeight: '100vh', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

    const displayProfile = previewData?.profile || profile;
    const displayEmails = previewData?.emails || emails;
    const displayPhones = previewData?.phones || phones;
    const displayWebsites = previewData?.websites || websites;
    const displaySocialHandles = previewData?.socialHandles || socialHandles;
    const displayPortfolio = previewData?.portfolio || portfolio;
    const displayProjects = previewData?.projects || projects;
    const displayDmButtons = previewData?.dmButtons || dmButtons;
    const displayButtonColors = previewData?.buttonColors || buttonColors;
    const displayTheme = themes[displayProfile?.selectedTheme || 0];

    const handleSendMessage = async (messageType) => {
      if (!previewMessageForm.name || !previewMessageForm.contact || !previewMessageForm.message) {
        showNotify('Please fill in all fields');
        return;
      }

      try {
        let messageTypeLabel = messageType?.label || messageType || 'Message';
        if (messageType?.icon && messageType?.label) {
          messageTypeLabel = `${messageType.icon} ${messageType.label}`;
        }

        await addDoc(collection(db, `users/${user.uid}/messages`), {
          senderName: previewMessageForm.name,
          senderContact: previewMessageForm.contact,
          message: previewMessageForm.message,
          messageType: messageTypeLabel,
          timestamp: new Date(),
          isPriority: previewData?.priorityContacts?.some(c => 
            (typeof c === 'string' ? c === previewMessageForm.contact : 
             c.email === previewMessageForm.contact)
          ) || false,
        });

        setPreviewMessageForm({ name: '', contact: '', message: '' });
        setPreviewModal(null);
        showNotify('✅ Message sent!');
      } catch (error) {
        console.error('Error sending message:', error);
        showNotify('Error sending message');
      }
    };

    return (
      <div style={{
        minHeight: '100vh',
        background: displayProfile.customBgColor ? displayProfile.customBgColor : displayTheme.gradient,
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* User Navigation Buttons (only for logged-in user) */}
          {user && (
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => setCurrentView('editor')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid white',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setCurrentView('inbox')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '2px solid white',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
                onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.2)'; }}
              >
                📬 Inbox
              </button>
            </div>
          )}
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: 'white',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
              margin: '0 0 8px 0',
            }}>🔗 Links & DM 💬</h1>
            <p style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '700',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              margin: 0,
            }}>Connect • Collaborate • Create</p>
          </div>

          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            {displayProfile.profilePic ? (
              <img src={displayProfile.profilePic} alt="Profile" style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '6px solid white',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                margin: '0 auto 20px auto',
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
                margin: '0 auto 20px auto',
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
              {displayProfile.name}
            </h2>
            <p style={{
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              margin: '0 0 12px 0',
            }}>
              {displayProfile.profession}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: '13px',
              textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
              fontWeight: '600',
              margin: 0,
            }}>
              {displayProfile.bio}
            </p>
          </div>

          {/* DM Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {displayDmButtons.bookMeeting.enabled && (
              <button
                onClick={() => setPreviewModal({ type: 'message', buttonType: displayDmButtons.bookMeeting })}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: displayButtonColors.bookMeeting.bg,
                  color: displayButtonColors.bookMeeting.text,
                  cursor: 'pointer',
                }}
              >
                📅 Book a Meeting
              </button>
            )}
            {displayDmButtons.letsConnect.enabled && (
              <button
                onClick={() => setPreviewModal({ type: 'message', buttonType: displayDmButtons.letsConnect })}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: displayButtonColors.letsConnect.bg,
                  color: displayButtonColors.letsConnect.text,
                  cursor: 'pointer',
                }}
              >
                💬 Let's Connect
              </button>
            )}
            {displayDmButtons.collabRequest.enabled && (
              <button
                onClick={() => setPreviewModal({ type: 'message', buttonType: displayDmButtons.collabRequest })}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: displayButtonColors.collabRequest.bg,
                  color: displayButtonColors.collabRequest.text,
                  cursor: 'pointer',
                }}
              >
                🤝 Collab Request
              </button>
            )}
            {displayDmButtons.supportCause.enabled && (
              <button
                onClick={() => setPreviewModal({ type: 'message', buttonType: displayDmButtons.supportCause })}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: displayButtonColors.supportCause.bg,
                  color: displayButtonColors.supportCause.text,
                  cursor: 'pointer',
                }}
              >
                ❤️ Support a Cause
              </button>
            )}
          </div>

          {/* Link Buttons Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px',
          }}>
            {displaySocialHandles?.length > 0 && (
              <button
                onClick={() => setPreviewModal({ type: 'handles', data: displaySocialHandles })}
                style={{
                  background: '#A855F7',
                  color: 'white',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🌐<br/>@ Handles
              </button>
            )}
            {displayEmails?.length > 0 && (
              <button
                onClick={() => setPreviewModal({ type: 'emails', data: displayEmails })}
                style={{
                  background: '#06B6D4',
                  color: 'white',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📧<br/>@ Email
              </button>
            )}
            {displayPhones?.length > 0 && (
              <button
                onClick={() => setPreviewModal({ type: 'phones', data: displayPhones })}
                style={{
                  background: '#10B981',
                  color: 'white',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📱<br/>Contact
              </button>
            )}
            {displayWebsites?.length > 0 && (
              <button
                onClick={() => setPreviewModal({ type: 'websites', data: displayWebsites })}
                style={{
                  background: '#EC4899',
                  color: 'white',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🌍<br/>Website
              </button>
            )}
            {displayPortfolio?.enabled && displayPortfolio?.url && (
              <button
                onClick={() => window.open(displayPortfolio.url, '_blank')}
                style={{
                  background: '#F59E0B',
                  color: 'white',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🎨<br/>Portfolio
              </button>
            )}
            {displayProjects?.enabled && displayProjects?.list?.length > 0 && (
              <button
                onClick={() => setPreviewModal({ type: 'projects', data: displayProjects.list })}
                style={{
                  background: '#F97316',
                  color: 'white',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📁<br/>Projects
              </button>
            )}
          </div>

          <button
            onClick={() => setCurrentView('landing')}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.3)',
              border: '3px solid white',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← Back
          </button>
        </div>

        {/* Modals */}
        {previewModal && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000',
            padding: '20px',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>
                  {previewModal.type === 'message' && `${previewModal.buttonType.icon} ${previewModal.buttonType.label}`}
                  {previewModal.type === 'handles' && '🌐 Social Handles'}
                  {previewModal.type === 'emails' && '📧 Email'}
                  {previewModal.type === 'phones' && '📱 Contact'}
                  {previewModal.type === 'websites' && '🌍 Website'}
                  {previewModal.type === 'projects' && '📁 Projects'}
                </h3>
                <button
                  onClick={() => setPreviewModal(null)}
                  style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                >
                  ×
                </button>
              </div>

              {/* Message Form */}
              {previewModal.type === 'message' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={previewMessageForm.name}
                    onChange={(e) => setPreviewMessageForm({...previewMessageForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Your Email or Handle"
                    value={previewMessageForm.contact}
                    onChange={(e) => setPreviewMessageForm({...previewMessageForm, contact: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                    }}
                  />
                  <textarea
                    placeholder="Your Message"
                    value={previewMessageForm.message}
                    onChange={(e) => setPreviewMessageForm({...previewMessageForm, message: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                      minHeight: '100px',
                      fontFamily: "'Poppins', sans-serif",
                      resize: 'none',
                    }}
                  />
                  <button
                    onClick={() => handleSendMessage(previewModal.buttonType)}
                    style={{
                      background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                      color: 'white',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Send Message ✨
                  </button>
                </div>
              )}

              {/* Handles */}
              {previewModal.type === 'handles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewModal.data.map((handle, idx) => (
                    <a
                      key={idx}
                      href={`https://${handle.platform.toLowerCase()}.com/${handle.handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: '700', margin: '0 0 4px 0' }}>{handle.platform}</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0066cc', margin: 0 }}>{handle.handle}</p>
                    </a>
                  ))}
                </div>
              )}

              {/* Emails */}
              {previewModal.type === 'emails' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewModal.data.map((email, idx) => (
                    <a
                      key={idx}
                      href={`mailto:${email}`}
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                      }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E90FF', margin: 0 }}>{email}</p>
                    </a>
                  ))}
                </div>
              )}

              {/* Phones */}
              {previewModal.type === 'phones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewModal.data.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${phone}`}
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                      }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#228B22', margin: 0 }}>{phone}</p>
                    </a>
                  ))}
                </div>
              )}

              {/* Websites */}
              {previewModal.type === 'websites' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewModal.data.map((website, idx) => (
                    <a
                      key={idx}
                      href={formatUrl(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                      }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#663399', margin: 0 }}>{website}</p>
                    </a>
                  ))}
                </div>
              )}

              {/* Projects */}
              {previewModal.type === 'projects' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {previewModal.data.map((project, idx) => (
                    <a
                      key={idx}
                      href={formatUrl(project.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                      }}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: '700', margin: '0 0 4px 0' }}>Project</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#FF8C00', margin: 0 }}>{project.title}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
              <button
                onClick={() => { setCurrentMessageType(dmButtons.bookMeeting); setShowMessageForm(true); }}
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
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: '20px' }}>📅</span>
                <span>{dmButtons.bookMeeting.label}</span>
              </button>
            )}

            {dmButtons.letsConnect.enabled && (
              <button
                onClick={() => { setCurrentMessageType(dmButtons.letsConnect); setShowMessageForm(true); }}
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
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: '20px' }}>💬</span>
                <span>{dmButtons.letsConnect.label}</span>
              </button>
            )}

            {dmButtons.collabRequest.enabled && (
              <button
                onClick={() => { setCurrentMessageType(dmButtons.collabRequest); setShowMessageForm(true); }}
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
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: '20px' }}>🤝</span>
                <span>{dmButtons.collabRequest.label}</span>
              </button>
            )}

            {dmButtons.supportCause.enabled && charityLinks.length > 0 && (
              <button
                onClick={() => setCurrentView('charities-modal')}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  padding: '16px 20px',
                  fontWeight: '700',
                  fontSize: '15px',
                  border: '3px solid rgba(255,255,255,0.4)',
                  background: buttonColors.supportCause.bg,
                  color: buttonColors.supportCause.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: '20px' }}>❤️</span>
                <span>{dmButtons.supportCause.label}</span>
              </button>
            )}
          </div>

          {/* Category Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '30px',
          }}>
            {socialHandles.length > 0 && (
              <button
                onClick={() => setCurrentView('handles-modal')}
                style={{
                  borderRadius: '16px',
                  padding: '16px',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: '#FFB6C1',
                  color: '#C71585',
                  border: '3px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: '24px' }}>🌐</span>
                <span>@ Handles</span>
              </button>
            )}

            {emails.length > 0 && (
              <button
                onClick={() => setCurrentView('email-modal')}
                style={{
                  borderRadius: '16px',
                  padding: '16px',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: '#B0E0E6',
                  color: '#1E90FF',
                  border: '3px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: '24px' }}>📧</span>
                <span>@ Email</span>
              </button>
            )}

            {phones.length > 0 && (
              <button
                onClick={() => setCurrentView('contact-modal')}
                style={{
                  borderRadius: '16px',
                  padding: '16px',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: '#B4F8C8',
                  color: '#228B22',
                  border: '3px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: '24px' }}>📱</span>
                <span>Contact</span>
              </button>
            )}

            {websites.length > 0 && (
              <button
                onClick={() => setCurrentView('website-modal')}
                style={{
                  borderRadius: '16px',
                  padding: '16px',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: '#DDA0DD',
                  color: '#663399',
                  border: '3px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: '24px' }}>🌍</span>
                <span>Website</span>
              </button>
            )}

            {portfolio.enabled && portfolio.url && (
              <button
                onClick={() => window.open(formatUrl(portfolio.url), '_blank')}
                style={{
                  borderRadius: '16px',
                  padding: '16px',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: '#B0E0E6',
                  color: '#1E90FF',
                  border: '3px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: '24px' }}>🎨</span>
                <span>Portfolio</span>
              </button>
            )}

            {projects.enabled && projects.list.length > 0 && (
              <button
                onClick={() => setCurrentView('projects-modal')}
                style={{
                  borderRadius: '16px',
                  padding: '16px',
                  fontWeight: '700',
                  fontSize: '12px',
                  background: '#FFDAB9',
                  color: '#FF8C00',
                  border: '3px solid rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span style={{ fontSize: '24px' }}>📁</span>
                <span>Projects</span>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', margin: 0 }}>Ready to connect! 🚀</p>
            <button
              onClick={() => setCurrentView('landing')}
              style={{
                background: 'rgba(255,255,255,0.3)',
                border: '3px solid white',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
            >
              ← Back
            </button>
            {user && (
              <>
                <button
                  onClick={() => setCurrentView('editor')}
                  style={{
                    background: 'rgba(255,255,255,0.3)',
                    border: '3px solid white',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
                >
                  ✏️ Editor
                </button>
                <button
                  onClick={() => setCurrentView('inbox')}
                  style={{
                    background: 'rgba(255,255,255,0.3)',
                    border: '3px solid white',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.5)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.3)'; }}
                >
                  📬 Inbox ({messages.length})
                </button>
              </>
            )}
          </div>

          {/* Modals */}
          {currentView === 'handles-modal' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>🌐 Handles</h3>
                  <button
                    onClick={() => setCurrentView('preview')}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {socialHandles.map((handle, idx) => (
                    <a
                      key={idx}
                      href={`https://${handle.platform.toLowerCase()}.com/${handle.handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E7EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: '700', margin: '0 0 4px 0' }}>{handle.platform}</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#0066cc', margin: 0 }}>{handle.handle}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'email-modal' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>📧 Email</h3>
                  <button
                    onClick={() => setCurrentView('preview')}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {emails.map((email, idx) => (
                    <a
                      key={idx}
                      href={`mailto:${email}`}
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E7EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E90FF', margin: 0 }}>{email}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'contact-modal' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>📱 Contact</h3>
                  <button
                    onClick={() => setCurrentView('preview')}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {phones.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${phone}`}
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E7EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#228B22', margin: 0 }}>{phone}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'website-modal' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>🌍 Website</h3>
                  <button
                    onClick={() => setCurrentView('preview')}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {websites.map((website, idx) => (
                    <a
                      key={idx}
                      href={formatUrl(website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E7EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                    >
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#663399', margin: 0 }}>{website}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'projects-modal' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>📁 Projects</h3>
                  <button
                    onClick={() => setCurrentView('preview')}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
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
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E7EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: '700', margin: '0 0 4px 0' }}>Project</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#FF8C00', margin: 0 }}>{project.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'charities-modal' && (
            <div style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>❤️ Support a Cause</h3>
                  <button
                    onClick={() => setCurrentView('preview')}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
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
                        padding: '14px',
                        textDecoration: 'none',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#E5E7EB'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#F3F4F6'; }}
                    >
                      <p style={{ fontSize: '12px', color: '#666', fontWeight: '700', margin: '0 0 4px 0' }}>{charity.name || 'Charity'}</p>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#EC4899', margin: 0 }}>{charity.url}</p>
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
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: '1000',
              padding: '20px',
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>Send Message</h3>
                  <button
                    onClick={() => setShowMessageForm(false)}
                    style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12px', color: '#333' }}>Name</label>
                    <input
                      type="text"
                      value={messageForm.name}
                      onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
                      placeholder="Your name"
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

                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12px', color: '#333' }}>Email or Contact</label>
                    <input
                      type="text"
                      value={messageForm.contact}
                      onChange={(e) => setMessageForm({ ...messageForm, contact: e.target.value })}
                      placeholder="email@example.com or @handle"
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

                  <div>
                    <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', fontSize: '12px', color: '#333' }}>Message</label>
                    <textarea
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      placeholder="Your message..."
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
                      marginTop: '10px',
                      fontSize: '14px',
                    }}
                  >
                    Send Message ✨
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DEMO PREVIEW PAGE
  if (currentView === 'demo-preview') {
    const [demoModal, setDemoModal] = useState(null);
    const [demoMessageForm, setDemoMessageForm] = useState({ name: '', contact: '', message: '' });

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF69B4 0%, #FF8FC7 100%)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button
            onClick={() => setCurrentView('landing')}
            style={{
              background: 'rgba(255,255,255,0.4)',
              border: '3px solid white',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            ← Back
          </button>

          <div style={{
            background: 'linear-gradient(135deg, #FFB6E1 0%, #E0D5FF 100%)',
            borderRadius: '28px',
            padding: '40px 30px',
            textAlign: 'center',
          }}>
            {/* Logo as Profile Pic */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '60px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              border: '5px solid white',
            }}>
              🔗
            </div>

            <h1 style={{ fontSize: '32px', color: 'white', fontWeight: '900', margin: '0 0 8px 0', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              Links & DM
            </h1>
            <p style={{ fontSize: '16px', color: 'white', fontWeight: '700', margin: '0 0 20px 0' }}>
              Link in bio plus DM sorter tool
            </p>

            {/* Message Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => setDemoModal('📅')}
                style={{
                  background: '#B0E0E6',
                  color: '#0066cc',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                📅 Book a Meeting
              </button>
              <button
                onClick={() => setDemoModal('💬')}
                style={{
                  background: '#FFFF99',
                  color: '#FF0000',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                💬 Let's Connect
              </button>
              <button
                onClick={() => setDemoModal('🤝')}
                style={{
                  background: '#AFEEEE',
                  color: '#008B8B',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                🤝 Collab Request
              </button>
              <button
                onClick={() => setDemoModal('❤️')}
                style={{
                  background: '#FFB6D9',
                  color: '#C71585',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ❤️ Support a Cause
              </button>
            </div>

            {/* Link Buttons Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <button
                onClick={() => setDemoModal('handles')}
                style={{
                  background: '#FFB6D9',
                  color: '#C71585',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🌐<br/>@ Handles
              </button>
              <button
                onClick={() => setDemoModal('email')}
                style={{
                  background: '#AFEEEE',
                  color: '#0066cc',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📧<br/>@ Email
              </button>
              <button
                onClick={() => setDemoModal('phone')}
                style={{
                  background: '#98FF98',
                  color: '#228B22',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📱<br/>Contact
              </button>
              <button
                onClick={() => setDemoModal('website')}
                style={{
                  background: '#DDA0DD',
                  color: '#663399',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🌍<br/>Website
              </button>
              <button
                onClick={() => setDemoModal('portfolio')}
                style={{
                  background: '#AFEEEE',
                  color: '#0066cc',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🎨<br/>Portfolio
              </button>
              <button
                onClick={() => setDemoModal('projects')}
                style={{
                  background: '#FFE4B5',
                  color: '#FF8C00',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                📁<br/>Projects
              </button>
            </div>

            <p style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginTop: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
              Ready to connect! 🚀
            </p>
          </div>
        </div>

        {/* Modals - Blank for all */}
        {demoModal && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000',
            padding: '20px',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>
                  {demoModal === '📅' && '📅 Book a Meeting'}
                  {demoModal === '💬' && '💬 Let\'s Connect'}
                  {demoModal === '🤝' && '🤝 Collab Request'}
                  {demoModal === '❤️' && '❤️ Support a Cause'}
                  {demoModal === 'email' && '📧 Email'}
                  {demoModal === 'phone' && '📱 Contact'}
                  {demoModal === 'website' && '🌍 Website'}
                  {demoModal === 'handles' && '🌐 Social Handles'}
                  {demoModal === 'portfolio' && '🎨 Portfolio'}
                  {demoModal === 'projects' && '📁 Projects'}
                </h3>
                <button
                  onClick={() => setDemoModal(null)}
                  style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                >
                  ×
                </button>
              </div>

              {/* Message Forms */}
              {['📅', '💬', '🤝', '❤️'].includes(demoModal) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={demoMessageForm.name}
                    onChange={(e) => setDemoMessageForm({...demoMessageForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Your Email or Handle"
                    value={demoMessageForm.contact}
                    onChange={(e) => setDemoMessageForm({...demoMessageForm, contact: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                    }}
                  />
                  <textarea
                    placeholder="Your Message"
                    value={demoMessageForm.message}
                    onChange={(e) => setDemoMessageForm({...demoMessageForm, message: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                      minHeight: '100px',
                      fontFamily: "'Poppins', sans-serif",
                      resize: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      setDemoModal(null);
                      setDemoMessageForm({ name: '', contact: '', message: '' });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                      color: 'white',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Send Message ✨
                  </button>
                </div>
              )}

              {/* Blank modals for links */}
              {['email', 'phone', 'website', 'handles', 'portfolio', 'projects'].includes(demoModal) && (
                <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#999', fontSize: '16px', fontWeight: '600', textAlign: 'center' }}>
                    Your contacts will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

            {/* Message Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => setDemoModal('📅')}
                style={{
                  background: '#B0E0E6',
                  color: '#0066cc',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                📅 Book a Meeting
              </button>
              <button
                onClick={() => setDemoModal('💬')}
                style={{
                  background: '#FFFF99',
                  color: '#FF0000',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                💬 Let's Connect
              </button>
              <button
                onClick={() => setDemoModal('🤝')}
                style={{
                  background: '#AFEEEE',
                  color: '#008B8B',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                🤝 Collab Request
              </button>
              <button
                onClick={() => setDemoModal('❤️')}
                style={{
                  background: '#FFB6D9',
                  color: '#C71585',
                  padding: '16px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                ❤️ Support a Cause
              </button>
            </div>

            {/* Link Buttons Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '24px',
            }}>
              <button
                onClick={() => setDemoModal('socials')}
                style={{
                  background: '#FFB6D9',
                  color: '#C71585',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                🌐<br/>@ Handles
              </button>
              <button
                onClick={() => setDemoModal('email')}
                style={{
                  background: '#AFEEEE',
                  color: '#0066cc',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                📧<br/>@ Email
              </button>
              <button
                onClick={() => setDemoModal('phone')}
                style={{
                  background: '#98FF98',
                  color: '#228B22',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                📱<br/>Contact
              </button>
              <button
                onClick={() => setDemoModal('website')}
                style={{
                  background: '#DDA0DD',
                  color: '#663399',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                🌍<br/>Website
              </button>
              <button
                onClick={() => setDemoModal('portfolio')}
                style={{
                  background: '#AFEEEE',
                  color: '#0066cc',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                🎨<br/>Portfolio
              </button>
              <button
                onClick={() => setDemoModal('projects')}
                style={{
                  background: '#FFE4B5',
                  color: '#FF8C00',
                  padding: '20px',
                  border: '3px solid white',
                  borderRadius: '16px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                📁<br/>Projects
              </button>
            </div>

            <p style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginTop: '16px', textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
              Ready to connect! 🚀
            </p>
          </div>
        </div>

        {/* Modals */}
        {demoModal && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000',
            padding: '20px',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>
                  {demoModal === '📅' && '📅 Book a Meeting'}
                  {demoModal === '💬' && '💬 Let\'s Connect'}
                  {demoModal === '🤝' && '🤝 Collab Request'}
                  {demoModal === '❤️' && '❤️ Support a Cause'}
                  {demoModal === 'email' && '📧 Email'}
                  {demoModal === 'phone' && '📱 Contact'}
                  {demoModal === 'website' && '🌍 Website'}
                  {demoModal === 'socials' && '🌐 Social Handles'}
                  {demoModal === 'portfolio' && '🎨 Portfolio'}
                  {demoModal === 'projects' && '📁 Projects'}
                </h3>
                <button
                  onClick={() => setDemoModal(null)}
                  style={{ fontSize: '28px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#333' }}
                >
                  ×
                </button>
              </div>

              {/* Message Forms */}
              {['📅', '💬', '🤝', '❤️'].includes(demoModal) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={demoMessageForm.name}
                    onChange={(e) => setDemoMessageForm({...demoMessageForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Your Contact (email/phone)"
                    value={demoMessageForm.contact}
                    onChange={(e) => setDemoMessageForm({...demoMessageForm, contact: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                    }}
                  />
                  <textarea
                    placeholder="Your Message"
                    value={demoMessageForm.message}
                    onChange={(e) => setDemoMessageForm({...demoMessageForm, message: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #E5E7EB',
                      borderRadius: '12px',
                      fontWeight: '600',
                      boxSizing: 'border-box',
                      fontSize: '14px',
                      minHeight: '100px',
                      fontFamily: "'Poppins', sans-serif",
                      resize: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      setDemoModal(null);
                      setDemoMessageForm({ name: '', contact: '', message: '' });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
                      color: 'white',
                      padding: '12px',
                      border: 'none',
                      borderRadius: '12px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    Send Message ✨
                  </button>
                </div>
              )}

              {/* Link Modals */}
              {demoModal === 'email' && <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#1E90FF' }}>📧 Email will open in user's email client</p>}
              {demoModal === 'phone' && <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#228B22' }}>📱 Phone will open dialer or WhatsApp</p>}
              {demoModal === 'website' && <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#663399' }}>🌍 Website links will open in new tab</p>}
              {demoModal === 'socials' && <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#C71585' }}>🌐 All social handles in one place</p>}
              {demoModal === 'portfolio' && <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#0066cc' }}>🎨 Showcase your best work</p>}
              {demoModal === 'projects' && <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#FF8C00' }}>📁 Display your projects</p>}
            </div>
          </div>
        )}
      </div>
    );
  }
                    +1 234-455-6789
                  </p>
                )}
                {demoModal === 'website' && (
                  <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#1E90FF' }}>
                    https://ashworldco.com
                  </p>
                )}
                {demoModal === 'social' && (
                  <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#1E90FF' }}>
                    @ashworldco
                  </p>
                )}
                {(demoModal === '📅' || demoModal === '💬' || demoModal === '🤝' || demoModal === '❤️') && (
                  <p style={{ background: '#F3F4F6', borderRadius: '12px', padding: '14px', margin: 0, fontWeight: '700', color: '#333' }}>
                    ✅ Modal opened successfully! In real app, users would see a message form here.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
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
        {notification && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '14px',
            zIndex: '9999',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          }}>
            {notification}
          </div>
        )}
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
            }}>
              <div style={{ fontSize: '56px', marginBottom: '15px' }}>📬</div>
              <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '8px', color: '#333' }}>No messages yet</div>
              <div style={{ fontSize: '13px' }}>Messages will appear here when you share your profile!</div>
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
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: '900', color: '#333', fontSize: '14px', marginBottom: '4px' }}>
                          {msg.isPriority ? '⭐' : '🌸'} {msg.senderName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>{msg.senderContact}</div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700' }}>{msg.messageType}</div>
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

  // Error/Fallback Page
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
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontSize: '72px', marginBottom: '20px' }}>🤔</div>
        <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '16px', fontWeight: '900' }}>Page Not Found</h2>
        <p style={{ color: '#666', marginBottom: '30px', fontSize: '16px' }}>The page you're looking for doesn't exist or there was an error.</p>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)',
            color: 'white',
            padding: '14px 32px',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '900',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          ← Go Home
        </button>
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
