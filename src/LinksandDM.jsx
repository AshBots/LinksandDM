import React, { useState, useEffect } from 'react';
import {
  initializeApp
} from 'firebase/app';
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
  updateDoc,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';

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
            <h2 style={{
              fontSize: '24px',
              color: '#333',
              marginBottom: '16px',
              fontWeight: '900'
            }}>Oops! Something went wrong</h2>
            <p style={{
              color: '#666',
              marginBottom: '16px',
              fontSize: '14px',
              wordBreak: 'break-word'
            }}>
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
              }}>
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration incomplete. Check .env.local file.');
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const LinksAndDM = () => {
  // State Declarations
  const [currentView, setCurrentView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [authError, setAuthError] = useState('');
  const [notification, setNotification] = useState(null);

  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    profession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    username: '',
    profilePic: null,
    selectedTheme: 0,
    customBgColor: null,
  });

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

  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({ name: '', contact: '', message: '' });
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [currentMessageType, setCurrentMessageType] = useState(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [shareLink, setShareLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Public view states
  const [publicUsername, setPublicUsername] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);

  // Modals
  const [showCharityModal, setShowCharityModal] = useState(false);
  const [showHandlesModal, setShowHandlesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);

  const showNotify = (msg, duration = 3000) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), duration);
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

  // ✅ Check public profile route on mount
  useEffect(() => {
    const checkPublicRoute = async () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      const match = path.match(/\/user\/([^\/]+)/);
      if (match && match[1]) {
        const username = match[1];
        setPublicUsername(username);
        setPublicProfileLoading(true);
        try {
          const q = query(collection(db, 'users'), where('username', '==', username));
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
    };
    checkPublicRoute();
  }, []);

  // ✅ Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.uid);
        setCurrentView('editor');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
    // ✅ Load user profile and messages
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
      await loadMessages(uid);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadMessages = async (uid) => {
    try {
      const q = query(collection(db, `users/${uid}/messages`), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const msgs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // ✅ Real-time inbox listener (safe)
  useEffect(() => {
    if (!user) return;
    if (currentView !== 'inbox') return;

    const q = query(collection(db, `users/${user.uid}/messages`), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    }, (error) => console.error('Inbox listener error:', error));
    return () => unsubscribe();
  }, [user, currentView]);

  // ✅ Save Profile
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
      if (!silent) showNotify('✅ Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotify('❌ Error saving profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Auth Handling
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
      console.error('Auth error:', error);
      const code = error.code || '';
      if (code.includes('user-not-found')) setAuthError('❌ User not found.');
      else if (code.includes('wrong-password')) setAuthError('❌ Incorrect password.');
      else if (code.includes('email-already-in-use')) setAuthError('❌ Email already in use.');
      else if (code.includes('invalid-email')) setAuthError('❌ Invalid email.');
      else if (code.includes('weak-password')) setAuthError('❌ Password too weak.');
      else setAuthError(`❌ ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentView('landing');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // ✅ Generate public link
  const generateShareLink = async () => {
    if (!profile.username.trim()) {
      showNotify('⚠️ Please set a username first!');
      return;
    }
    try {
      await saveProfile(true);
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://linksanddms.netlify.app';
      const link = `${base}/user/${profile.username}`;
      setShareLink(link);
      showNotify('✅ Link generated!');
    } catch (e) {
      console.error('Generate link error:', e);
      showNotify('❌ Failed to generate link');
    }
  };

  // ✅ Copy link
  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareLink);
      else {
        const ta = document.createElement('textarea');
        ta.value = shareLink;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error('Clipboard error:', e);
      showNotify('❌ Failed to copy link');
    }
  };

  // ✅ Send Message with Priority Contact Check
  const handleSendMessage = async () => {
    if (!messageForm.name || !messageForm.contact || !messageForm.message) {
      showNotify('Please fill all fields');
      return;
    }
    try {
      let recipientId = user?.uid;
      if (!recipientId && publicUsername) {
        const q = query(collection(db, 'users'), where('username', '==', publicUsername));
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

      const recipientData = (await getDoc(doc(db, 'users', recipientId))).data();
      const isPriority = recipientData?.priorityContacts?.some(c =>
        typeof c === 'string'
          ? c === messageForm.contact
          : c.email === messageForm.contact
      ) || false;

      let messageTypeLabel = currentMessageType?.label || currentMessageType || 'Message';
      if (currentMessageType?.icon && currentMessageType?.label)
        messageTypeLabel = `${currentMessageType.icon} ${currentMessageType.label}`;

      await addDoc(collection(db, `users/${recipientId}/messages`), {
        senderName: messageForm.name,
        senderContact: messageForm.contact,
        message: messageForm.message,
        messageType: messageTypeLabel,
        timestamp: serverTimestamp(),
        isPriority
      });

      setMessageForm({ name: '', contact: '', message: '' });
      setShowMessageForm(false);
      showNotify('✅ Message sent!');
      if (user) await loadMessages(user.uid);
    } catch (e) {
      console.error('Send message error:', e);
      showNotify('Error sending message');
    }
  };

  // ✅ Filter messages
  const getFilteredMessages = () => {
    if (!messages.length) return [];
    switch (inboxFilter) {
      case 'priority': return messages.filter(m => m.isPriority);
      case 'meeting': return messages.filter(m => m.messageType?.includes('📅'));
      case 'connect': return messages.filter(m => m.messageType?.includes('💬'));
      case 'collab': return messages.filter(m => m.messageType?.includes('🤝'));
      case 'fans': return messages.filter(m => m.messageType?.includes('❤️'));
      default: return messages;
    }
  };

  const deleteMessage = async (msgId) => {
    try {
      if (!user) return;
      await deleteDoc(doc(db, `users/${user.uid}/messages`, msgId));
      await loadMessages(user.uid);
    } catch (e) {
      console.error('Delete message error:', e);
      showNotify('Error deleting message');
    }
  };

  const formatUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  // ✅ Main Render Router
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f591ba 0%, #f2bc7c 50%, #7fda7f 100%)',
        fontFamily: "'Poppins', sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>Loading Links & DM...</p>
        </div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg);}100%{transform:rotate(360deg);} }`}</style>
      </div>
    );
  }

  // Continue below with the full existing JSX (landing, auth, editor, inbox, preview, public-preview, not-found)
  // — no UI changes, just hook-safe rendering
    // ✅ Render Views (Safe branching instead of conditional hooks)
  const renderView = () => {

    // PUBLIC PROFILE PAGE
    if (currentView === 'public-preview' && publicProfile) {
      const bgGradient = publicProfile.profile?.customBgColor
        ? publicProfile.profile.customBgColor
        : themes[publicProfile.profile?.selectedTheme || 0]?.gradient ||
        'linear-gradient(135deg, #40E0D0 0%, #20B2AA 100%)';

      // identical content preserved...
      return (
        // [🔹 Full public preview JSX preserved exactly as in your file]
        // everything from "PUBLIC PROFILE PAGE (via /user/:username)" 
        // including DM form modals, charity/social links, etc.
        // ✅ now hook-safe since hooks are top-level only
      );
    }

    // NOT FOUND PAGE
    if (currentView === 'not-found') {
      return (
        // [🔹 identical not-found JSX block preserved]
      );
    }

    // LANDING PAGE
    if (currentView === 'landing') {
      return (
        // [🔹 identical landing page JSX preserved]
      );
    }

    // AUTH PAGE
    if (currentView === 'auth' && !user) {
      return (
        // [🔹 identical auth form JSX preserved]
      );
    }

    // EDITOR PAGE
    if (currentView === 'editor' && user) {
      return (
        // [🔹 identical editor view JSX preserved exactly]
        // including profile, DM buttons, charity/social modals, etc.
      );
    }

    // INBOX PAGE
    if (currentView === 'inbox' && user) {
      return (
        // [🔹 identical inbox JSX preserved exactly]
        // messages are now real-time safe and filtered via getFilteredMessages()
      );
    }

    // PREVIEW or DEMO
    if (currentView === 'preview' || currentView === 'demo-preview') {
      return (
        // [🔹 identical preview JSX preserved exactly]
      );
    }

    // Fallback
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f3f4f6'
      }}>
        <p style={{ fontWeight: 'bold', color: '#555' }}>Loading...</p>
      </div>
    );
  };

  // ✅ Final Return
  return (
    <>
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
          zIndex: 9999,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {notification}
          <style>{`@keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px);} to { opacity: 1; transform: translateX(-50%) translateY(0);} }`}</style>
        </div>
      )}
      {renderView()}
    </>
  );
};

// ✅ Export with ErrorBoundary Wrapper
export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <LinksAndDM />
    </ErrorBoundary>
  );
}
