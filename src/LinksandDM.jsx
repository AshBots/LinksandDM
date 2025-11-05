import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAAFqbEIL3TOAcFmsxoqltJfrtfE2sOXVs",
  authDomain: "links-dm-pro.firebaseapp.com",
  projectId: "links-dm-pro",
  storageBucket: "links-dm-pro.firebasestorage.app",
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
    customTheme: { bg: '#40E0D0', accent: '#20B2AA' }
  });

  const [dmButtons, setDmButtons] = useState({
    bookMeeting: { enabled: true, link: '' },
    letsConnect: { enabled: true },
    collabRequest: { enabled: true },
    supportCause: { enabled: false },
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
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageType, setMessageType] = useState(null);
  const [messageForm, setMessageForm] = useState({ name: '', contact: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [inboxFilter, setInboxFilter] = useState('all');

  // Theme picker state
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [customBg, setCustomBg] = useState('#40E0D0');
  const [customAccent, setCustomAccent] = useState('#20B2AA');

  const themes = [
    { name: 'Turquoise Dream', bg: '#40E0D0', accent: '#20B2AA' },
    { name: 'Ice Blue', bg: '#B0E0E6', accent: '#87CEEB' },
    { name: 'Pastel Mint', bg: '#98FF98', accent: '#AFEEEE' },
    { name: 'Soft Lavender', bg: '#E6D5F0', accent: '#D8BFD8' },
    { name: 'Peach Cream', bg: '#FFDAB9', accent: '#FFE4B5' },
    { name: 'Rose Quartz', bg: '#FF69B4', accent: '#FFB6C1' },
    { name: 'Aquamarine', bg: '#7FFFD4', accent: '#5F9EA0' },
    { name: 'Powder Blue', bg: '#B0E0E6', accent: '#ADD8E6' },
    { name: 'Honeydew', bg: '#F0FFF0', accent: '#E0FFE0' },
    { name: 'Misty Rose', bg: '#FFE4E1', accent: '#F5F5DC' },
    { name: 'Sky', bg: '#87CEEB', accent: '#00BFFF' },
    { name: 'Orchid Dream', bg: '#DA70D6', accent: '#FF1493' },
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
      customTheme: { bg: '#40E0D0', accent: '#20B2AA' }
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
    alert(`Your link: ${link}\nCopy this to your bio!`);
  };

  // Message handlers
  const handleSendMessage = async () => {
    if (!messageForm.name || !messageForm.message) {
      alert('Please fill all fields');
      return;
    }

    try {
      const emojiMap = {
        booking: '📅',
        connect: '💬',
        collab: '🤝',
        support: '❤️',
        fans: '🌸',
      };

      const priority = priorityContacts.some(c => c.handle.toLowerCase() === messageForm.contact.toLowerCase());

      await addDoc(collection(db, 'messages'), {
        recipientId: user.uid,
        senderName: messageForm.name,
        senderContact: messageForm.contact,
        message: messageForm.message,
        type: messageType,
        emoji: emojiMap[messageType] || '💬',
        isPriority: priority && messageType === 'connect',
        timestamp: new Date(),
      });

      setMessageForm({ name: '', contact: '', message: '' });
      setShowMessageForm(false);
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  // Add/Delete handlers
  const addCharity = () => setCharityLinks([...charityLinks, { name: '', url: '' }]);
  const deleteCharity = (idx) => setCharityLinks(charityLinks.filter((_, i) => i !== idx));
  
  const addHandle = () => setSocialHandles([...socialHandles, { platform: 'Instagram', handle: '' }]);
  const deleteHandle = (idx) => setSocialHandles(socialHandles.filter((_, i) => i !== idx));
  const addEmail = () => setEmails([...emails, { email: '' }]);
  const deleteEmail = (idx) => setEmails(emails.filter((_, i) => i !== idx));
  const addPhone = () => setPhones([...phones, { phone: '' }]);
  const deletePhone = (idx) => setPhones(phones.filter((_, i) => i !== idx));
  const addWebsite = () => setWebsites([...websites, { url: '' }]);
  const deleteWebsite = (idx) => setWebsites(websites.filter((_, i) => i !== idx));
  const addProject = () => setProjects({ ...projects, list: [...projects.list, { title: '', url: '' }] });
  const deleteProject = (idx) => setProjects({ ...projects, list: projects.list.filter((_, i) => i !== idx) });
  const addPriority = () => setPriorityContacts([...priorityContacts, { handle: '' }]);
  const deletePriority = (idx) => setPriorityContacts(priorityContacts.filter((_, i) => i !== idx));

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter messages
  const getFilteredMessages = () => {
    if (inboxFilter === 'all') return messages;
    if (inboxFilter === 'priority') return messages.filter(m => m.isPriority);
    if (inboxFilter === 'collab') return messages.filter(m => m.type === 'collab');
    if (inboxFilter === 'booking') return messages.filter(m => m.type === 'booking');
    if (inboxFilter === 'connect') return messages.filter(m => m.type === 'connect');
    if (inboxFilter === 'fans') return messages.filter(m => m.isPriority === false && m.type === 'connect');
    return messages;
  };

  // Theme picker handlers
  const handleCustomTheme = () => {
    setProfile({
      ...profile,
      selectedTheme: -1,
      customTheme: { bg: customBg, accent: customAccent }
    });
    setShowThemePicker(false);
  };

  // Loading screen
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        fontSize: '24px',
        color: 'white',
      }}>
        Loading...
      </div>
    );
  }

  // LANDING PAGE
  if (currentView === 'landing') {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
        minHeight: '100vh', 
        padding: '20px', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Outfit:wght@600;700&display=swap');
            .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 900; }
            .heading-lg { font-family: 'Poppins', sans-serif; font-weight: 800; }
            .heading-md { font-family: 'Poppins', sans-serif; font-weight: 700; }
            .text-lg { font-family: 'Outfit', sans-serif; font-weight: 600; }
          `}
        </style>
        
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '40px',
            marginTop: '20px'
          }}>
            <h1 className="heading-lg" style={{ 
              fontSize: '3.5rem', 
              color: 'white', 
              fontWeight: '900',
              textShadow: '3px 3px 0px rgba(0,0,0,0.2)',
              letterSpacing: '-2px',
              lineHeight: '1'
            }}>
              🔗 Links & DM 💬
            </h1>
            <button
              onClick={() => setCurrentView('editor')}
              style={{
                backgroundColor: 'white',
                color: '#667eea',
                padding: '15px 30px',
                borderRadius: '50px',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                border: '4px solid #667eea',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                textShadow: '1px 1px 0px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Let's Do It!
            </button>
          </div>

          {/* Center Hero Section */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '60px',
            padding: '20px'
          }}>
            <h1 className="heading-xl" style={{ 
              fontSize: '6rem', 
              color: 'white', 
              fontWeight: '900',
              textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
              letterSpacing: '-2px',
              lineHeight: '1',
              marginBottom: '10px'
            }}>
              One Link.
            </h1>
            <h1 className="heading-xl" style={{ 
              fontSize: '6rem', 
              color: 'white', 
              fontWeight: '900',
              textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
              letterSpacing: '-2px',
              lineHeight: '1',
              marginBottom: '20px'
            }}>
              Sorted DMs.
            </h1>
            <p className="text-lg" style={{ 
              fontSize: '1.8rem', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '10px',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
            }}>
              The Ultimate Link-in-Bio for Creators 🌟
            </p>
            <p className="text-lg" style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: 'white',
              textShadow: '1px 1px 0px rgba(0,0,0,0.2)'
            }}>
              Manage all your links, messages & projects in one beautiful place
            </p>
          </div>

          {/* Feature Cards - 2x3 Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px',
            marginBottom: '40px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {[
              { emoji: '💬', title: 'Smart DM Sorting', desc: 'Organize all messages intelligently', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
              { emoji: '🎨', title: '12 Beautiful Themes', desc: 'Choose your perfect vibe', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
              { emoji: '📱', title: 'All Socials in One', desc: 'Connect all your platforms instantly', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
              { emoji: '📧', title: 'Email Hub', desc: 'Never miss important emails', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
              { emoji: '📁', title: 'Portfolio & Projects', desc: 'Showcase your incredible work', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
              { emoji: '📞', title: 'Contact Central', desc: 'Phone, web, everything connected', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
            ].map((feature, idx) => (
              <div key={idx} style={{ 
                background: feature.gradient,
                borderRadius: '24px',
                padding: '30px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                border: '4px solid white',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '15px', textAlign: 'center' }}>{feature.emoji}</div>
                <h3 className="heading-md" style={{ 
                  fontSize: '2rem', 
                  marginBottom: '10px', 
                  color: 'white',
                  textAlign: 'center',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.2)'
                }}>{feature.title}</h3>
                <p style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  color: 'white',
                  textAlign: 'center',
                  textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            border: '4px solid white',
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h3 className="heading-md" style={{ 
              fontSize: '3rem', 
              color: 'white', 
              marginBottom: '20px',
              textShadow: '2px 2px 0px rgba(0,0,0,0.2)'
            }}>
              Transform Your Link-in-Bio Today 🚀
            </h3>
            <button
              onClick={() => setCurrentView('editor')}
              style={{
                width: '100%',
                backgroundColor: 'white',
                color: '#667eea',
                padding: '20px 0',
                borderRadius: '16px',
                fontSize: '2rem',
                fontWeight: 'bold',
                border: '4px solid #667eea',
                cursor: 'pointer',
                marginBottom: '15px',
                transition: 'all 0.3s',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
              }}
            >
              Get Started Now
            </button>
            <button
              onClick={() => setCurrentView('demopreview')}
              style={{
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                padding: '20px 0',
                borderRadius: '16px',
                fontSize: '2rem',
                fontWeight: 'bold',
                border: '4px solid white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              See Demo ✨
            </button>
          </div>

          <div style={{ 
            textAlign: 'center', 
            marginTop: '40px',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textShadow: '1px 1px 0px rgba(0,0,0,0.2)'
          }}>
            Trusted by Influencers, Celebrities & Brands 💎
          </div>
        </div>
      </div>
    );
  }

  // SIGNIN PAGE
  if (currentView === 'signin') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{
          background: 'white',
          borderRadius: '25px',
          padding: '30px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px', color: '#667eea', textAlign: 'center' }}>🔗 Links & DM</div>
          
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #667eea',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #667eea',
                  borderRadius: '10px',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            {authError && <div style={{ color: 'red', marginBottom: '15px', fontSize: '12px' }}>{authError}</div>}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '10px',
              }}
            >
              {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <button
            onClick={() => {
              setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
              setAuthError('');
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f0f0f0',
              color: '#333',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '15px',
            }}
          >
            {authMode === 'signin' ? "Don't have account? Sign Up" : 'Already have account? Sign In'}
          </button>

          <button
            onClick={() => setCurrentView('landing')}
            style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '10px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // EDITOR PAGE
  if (currentView === 'editor' && user) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #f5a6c5 0%, #a8d8ea 100%)', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>🔗 Links & DM</div>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#ff6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>

          {/* Profile Section */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>👤 Profile</div>
            
            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: '#ddd',
                margin: '0 auto 10px',
                backgroundImage: profile.profilePic ? `url(${profile.profilePic})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ marginBottom: '10px' }}
              />
            </div>

            <input
              type="text"
              placeholder="Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '2px solid #ddd',
                borderRadius: '10px',
                boxSizing: 'border-box',
              }}
            />

            <input
              type="text"
              placeholder="Profession"
              value={profile.profession}
              onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '2px solid #ddd',
                borderRadius: '10px',
                boxSizing: 'border-box',
              }}
            />

            <textarea
              placeholder="Bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '2px solid #ddd',
                borderRadius: '10px',
                boxSizing: 'border-box',
                minHeight: '80px',
              }}
            />

            <input
              type="text"
              placeholder="Username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '10px',
                border: '2px solid #ddd',
                borderRadius: '10px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Smart DM Buttons */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px', color: '#e74c3c' }}>💌 Smart DM Buttons</div>
            
            {['bookMeeting', 'letsConnect', 'collabRequest', 'supportCause'].map((btn) => (
              <div key={btn} style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #ddd' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={dmButtons[btn].enabled}
                    onChange={(e) => setDmButtons({
                      ...dmButtons,
                      [btn]: { ...dmButtons[btn], enabled: e.target.checked }
                    })}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold', color: '#333' }}>
                    {btn === 'bookMeeting' && '📅 Book a Meeting'}
                    {btn === 'letsConnect' && "💬 Let's Connect"}
                    {btn === 'collabRequest' && '🤝 Collab Request'}
                    {btn === 'supportCause' && '❤️ Support a Cause'}
                  </span>
                </label>
                {dmButtons[btn].enabled && (
                  <div>
                    <input
                      type="text"
                      placeholder={btn === 'bookMeeting' ? 'Link (Calendly, Zoom, etc.)' : 'Additional info'}
                      value={dmButtons[btn].link || ''}
                      onChange={(e) => setDmButtons({
                        ...dmButtons,
                        [btn]: { ...dmButtons[btn], link: e.target.value }
                      })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Charity Links */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>❤️ Charity/Cause Links</div>
            {charityLinks.map((charity, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Cause name"
                  value={charity.name}
                  onChange={(e) => {
                    const updated = [...charityLinks];
                    updated[idx].name = e.target.value;
                    setCharityLinks(updated);
                  }}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={charity.url}
                  onChange={(e) => {
                    const updated = [...charityLinks];
                    updated[idx].url = e.target.value;
                    setCharityLinks(updated);
                  }}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => deleteCharity(idx)}
                  style={{
                    padding: '8px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              onClick={addCharity}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f0f0f0',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#e74c3c',
              }}
            >
              + Add Charity Link
            </button>
          </div>

          {/* Social Handles */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>🌍 Social Handles</div>
            {socialHandles.map((handle, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <select
                  value={handle.platform}
                  onChange={(e) => {
                    const updated = [...socialHandles];
                    updated[idx].platform = e.target.value;
                    setSocialHandles(updated);
                  }}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                >
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>Twitter</option>
                  <option>YouTube</option>
                  <option>Snapchat</option>
                  <option>Pinterest</option>
                  <option>LinkedIn</option>
                </select>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  value={handle.handle}
                  onChange={(e) => {
                    const updated = [...socialHandles];
                    updated[idx].handle = e.target.value;
                    setSocialHandles(updated);
                  }}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => deleteHandle(idx)}
                  style={{
                    padding: '8px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              onClick={addHandle}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f0f0f0',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#667eea',
              }}
            >
              + Add Handle
            </button>
          </div>

          {/* Emails */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>📧 Email Addresses</div>
            {emails.map((email, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email.email}
                  onChange={(e) => {
                    const updated = [...emails];
                    updated[idx].email = e.target.value;
                    setEmails(updated);
                  }}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => deleteEmail(idx)}
                  style={{
                    padding: '8px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              onClick={addEmail}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f0f0f0',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#3498db',
              }}
            >
              + Add Email
            </button>
          </div>

          {/* Phone Numbers */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>📱 Contact Numbers</div>
            {phones.map((phone, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone.phone}
                  onChange={(e) => {
                    const updated = [...phones];
                    updated[idx].phone = e.target.value;
                    setPhones(updated);
                  }}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => deletePhone(idx)}
                  style={{
                    padding: '8px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              onClick={addPhone}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f0f0f0',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#27ae60',
              }}
            >
              + Add Number
            </button>
          </div>

          {/* Websites */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>🌐 Website/Store</div>
            {websites.map((website, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={website.url}
                  onChange={(e) => {
                    const updated = [...websites];
                    updated[idx].url = e.target.value;
                    setWebsites(updated);
                  }}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => deleteWebsite(idx)}
                  style={{
                    padding: '8px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              onClick={addWebsite}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f0f0f0',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#8e44ad',
              }}
            >
              + Add Website
            </button>
          </div>

          {/* Portfolio */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>🎨 Portfolio</div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={portfolio.enabled}
                onChange={(e) => setPortfolio({ ...portfolio, enabled: e.target.checked })}
                style={{ marginRight: '10px', cursor: 'pointer' }}
              />
              <span>Enable Portfolio</span>
            </label>
            {portfolio.enabled && (
              <input
                type="url"
                placeholder="https://yourportfolio.com"
                value={portfolio.url}
                onChange={(e) => setPortfolio({ ...portfolio, url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>

          {/* Projects */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>📂 Latest Projects</div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={projects.enabled}
                onChange={(e) => setProjects({ ...projects, enabled: e.target.checked })}
                style={{ marginRight: '10px', cursor: 'pointer' }}
              />
              <span>Enable Projects</span>
            </label>
            {projects.enabled && (
              <>
                {projects.list.map((project, idx) => (
                  <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Project title"
                      value={project.title}
                      onChange={(e) => {
                        const updated = { ...projects, list: [...projects.list] };
                        updated.list[idx].title = e.target.value;
                        setProjects(updated);
                      }}
                      style={{
                        flex: '1',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                      }}
                    />
                    <input
                      type="url"
                      placeholder="Project URL"
                      value={project.url}
                      onChange={(e) => {
                        const updated = { ...projects, list: [...projects.list] };
                        updated.list[idx].url = e.target.value;
                        setProjects(updated);
                      }}
                      style={{
                        flex: '1',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                      }}
                    />
                    <button
                      onClick={() => deleteProject(idx)}
                      style={{
                        padding: '8px 12px',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  onClick={addProject}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#f0f0f0',
                    border: '2px solid #ddd',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#f39c12',
                  }}
                >
                  + Add Project
                </button>
              </>
            )}
          </div>

          {/* Priority Contacts */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>⭐ Friends & Family (Priority Contacts)</div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Add real handles - these will be marked as priority in inbox</div>
            {priorityContacts.map((contact, idx) => (
              <div key={idx} style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="@yourfriend"
                  value={contact.handle}
                  onChange={(e) => {
                    const updated = [...priorityContacts];
                    updated[idx].handle = e.target.value;
                    setPriorityContacts(updated);
                  }}
                  style={{
                    flex: '1',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                  }}
                />
                <button
                  onClick={() => deletePriority(idx)}
                  style={{
                    padding: '8px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
            <button
              onClick={addPriority}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f0f0f0',
                border: '2px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: '#f1c40f',
              }}
            >
              + Add Contact
            </button>
          </div>

          {/* Theme Selection */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>🎨 Choose Theme</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
              {themes.map((theme, idx) => (
                <button
                  key={idx}
                  onClick={() => setProfile({ ...profile, selectedTheme: idx })}
                  style={{
                    padding: '20px 10px',
                    background: `linear-gradient(135deg, ${theme.bg} 0%, ${theme.accent} 100%)`,
                    border: profile.selectedTheme === idx ? '3px solid #333' : '1px solid #ddd',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: 'white',
                    fontSize: '12px',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  {theme.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setCustomBg(profile.customTheme.bg || '#40E0D0');
                  setCustomAccent(profile.customTheme.accent || '#20B2AA');
                  setShowThemePicker(true);
                }}
                style={{
                  padding: '20px 10px',
                  background: profile.selectedTheme === -1 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'rgba(255,255,255,0.9)',
                  border: profile.selectedTheme === -1 ? '3px solid #333' : '1px solid #ddd',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '12px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={saveProfile}
              style={{
                padding: '15px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              💾 Save All
            </button>
            <button
              onClick={generateShareLink}
              style={{
                padding: '15px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🔗 Generate Share Link
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => {
                setPreviewUsername(profile.username || currentUsername);
                setCurrentView('preview');
              }}
              style={{
                padding: '15px',
                background: '#9b59b6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              👁️ Preview
            </button>
            <button
              onClick={() => setCurrentView('inbox')}
              style={{
                padding: '15px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              📬 Inbox ({messages.length})
            </button>
          </div>
        </div>

        {/* Theme Picker Modal */}
        {showThemePicker && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '25px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#333',
                }}>Custom Theme</h2>
                <button
                  onClick={() => setShowThemePicker(false)}
                  style={{
                    fontSize: '24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ff6b6b',
                  }}
                >
                  &times;
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Primary Color</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      marginLeft: '10px',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Accent Color</label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      marginLeft: '10px',
                    }}
                  />
                </div>
              </div>

              <div style={{ 
                height: '100px', 
                background: `linear-gradient(135deg, ${customBg} 0%, ${customAccent} 100%)`,
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}>
                Preview
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setShowThemePicker(false)}
                  style={{
                    padding: '12px',
                    background: '#e0e0e0',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomTheme}
                  style={{
                    padding: '12px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PREVIEW PAGE
  if ((currentView === 'preview' || currentView === 'demopreview') && (currentView === 'preview' ? user : true)) {
    const themeData = profile.selectedTheme === -1 
      ? profile.customTheme 
      : themes[profile.selectedTheme];
    const bgGradient = themeData 
      ? `linear-gradient(135deg, ${themeData.bg} 0%, ${themeData.accent} 100%)` 
      : 'linear-gradient(135deg, #40E0D0 0%, #20B2AA 100%)';

    return (
      <div style={{ background: bgGradient, minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '10px' }}>🔗 Links & DM</div>
            <div style={{ fontSize: '12px', color: '#999' }}>Connect • Collaborate • Create</div>
          </div>

          {/* Profile Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
            {profile.profilePic && (
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'white',
                margin: '0 auto 15px',
                backgroundImage: `url(${profile.profilePic})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '3px solid white',
              }} />
            )}
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{profile.name}</div>
            <div style={{ fontSize: '16px', opacity: 0.9 }}>{profile.profession}</div>
            <div style={{ fontSize: '14px', opacity: 0.85, marginTop: '10px' }}>{profile.bio}</div>
          </div>

          {/* Smart DM Buttons */}
          {dmButtons.bookMeeting.enabled && (
            <button
              onClick={() => {
                setMessageType('booking');
                setShowMessageForm(true);
              }}
              style={{
                width: '100%',
                padding: '15px',
                background: 'rgba(255,255,255,0.9)',
                color: '#3498db',
                border: 'none',
                borderRadius: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
            >
              📅 Book a Meeting
            </button>
          )}

          {dmButtons.letsConnect.enabled && (
            <button
              onClick={() => {
                setMessageType('connect');
                setShowMessageForm(true);
              }}
              style={{
                width: '100%',
                padding: '15px',
                background: 'rgba(255,255,255,0.9)',
                color: '#9b59b6',
                border: 'none',
                borderRadius: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
            >
              💬 Let's Connect
            </button>
          )}

          {dmButtons.collabRequest.enabled && (
            <button
              onClick={() => {
                setMessageType('collab');
                setShowMessageForm(true);
              }}
              style={{
                width: '100%',
                padding: '15px',
                background: 'rgba(255,255,255,0.9)',
                color: '#2ecc71',
                border: 'none',
                borderRadius: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
            >
              🤝 Collab Request
            </button>
          )}

          {charityLinks.length > 0 && dmButtons.supportCause.enabled && (
            <button
              style={{
                width: '100%',
                padding: '15px',
                background: 'rgba(255,255,255,0.9)',
                color: '#e74c3c',
                border: 'none',
                borderRadius: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '10px',
                cursor: 'pointer',
              }}
            >
              ❤️ Support a Cause
            </button>
          )}

          {/* Contact Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {socialHandles.length > 0 && (
              <button
                onClick={() => {
                  // In demo version, we'll show all buttons
                  // In production, we'd navigate to a social handles section
                }}
                style={{
                  padding: '15px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#e75480',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                🌍 @ Handles
              </button>
            )}

            {emails.length > 0 && (
              <a
                href={emails.length > 0 ? `mailto:${emails[0].email}` : ''}
                style={{
                  padding: '15px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#3498db',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                📧 @ Email
              </a>
            )}

            {phones.length > 0 && (
              <a
                href={phones.length > 0 ? `tel:${phones[0].phone}` : ''}
                style={{
                  padding: '15px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#27ae60',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                📱 Contact
              </a>
            )}

            {websites.length > 0 && (
              <a
                href={websites.length > 0 ? websites[0].url : ''}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '15px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#8e44ad',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                🌐 Website
              </a>
            )}

            {portfolio.enabled && portfolio.url && (
              <a
                href={portfolio.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '15px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#f39c12',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                🎨 Portfolio
              </a>
            )}

            {projects.enabled && projects.list.length && (
              <a
                href={projects.list.length > 0 ? projects.list[0].url : ''}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '15px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#e67e22',
                  border: 'none',
                  borderRadius: '15px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                📂 Projects
              </a>
            )}
          </div>

          {/* Charity Section */}
          {charityLinks.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {charityLinks.map((charity, idx) => (
                <a
                  key={idx}
                  href={charity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#e74c3c',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  ❤️ {charity.name}
                </a>
              ))}
            </div>
          )}

          {/* Ready to connect message */}
          <div style={{
            textAlign: 'center',
            color: 'white',
            marginBottom: '20px',
            fontSize: '18px',
            fontWeight: 'bold',
          }}>
            Ready to connect! 🚀
          </div>

          {/* Bottom Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {currentView === 'preview' && user && (
              <>
                <button
                  onClick={() => setCurrentView('editor')}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setCurrentView('inbox')}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#333',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  📬 Inbox ({messages.length})
                </button>
              </>
            )}
            {currentView === 'demopreview' && (
              <button
                onClick={() => setCurrentView('landing')}
                style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#333',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  gridColumn: '1 / -1',
                }}
              >
                ← Back to Landing
              </button>
            )}
          </div>

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
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '20px',
                maxWidth: '400px',
                width: '90%',
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                  Send Message
                </div>

                <input
                  type="text"
                  placeholder="Your name"
                  value={messageForm.name}
                  onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })}
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
                  placeholder="Your handle or contact"
                  value={messageForm.contact}
                  onChange={(e) => setMessageForm({ ...messageForm, contact: e.target.value })}
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
                  placeholder="Your message"
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box',
                    minHeight: '100px',
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => setShowMessageForm(false)}
                    style={{
                      padding: '10px',
                      background: '#ccc',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendMessage}
                    style={{
                      padding: '10px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Send
                  </button>
                </div>
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
      <div style={{ background: 'linear-gradient(135deg, #f5a6c5 0%, #a8d8ea 100%)', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentView('editor')}
              style={{
                padding: '10px 20px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
            >
              ← Back
            </button>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>📬 Messages</div>
            <div style={{ width: '80px' }} />
          </div>

          {/* Filter Buttons */}
          <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '15px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {['all', 'priority', 'booking', 'connect', 'collab', 'fans'].map((filter) => (
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
                {filter === 'booking' && '📅 Meeting'}
                {filter === 'connect' && '💬 Connect'}
                {filter === 'collab' && '🤝 Collab'}
                {filter === 'fans' && '🌸 Fans'}
              </button>
            ))}
          </div>

          {/* Messages */}
          {getFilteredMessages().length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#999' }}>
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
                    <div style={{ fontSize: '18px' }}>{msg.emoji}</div>
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
