import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from 'firebase/auth';

const LinksAndDM = () => {
  // Auth States
  const [authUser, setAuthUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // App States
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentMessageType, setCurrentMessageType] = useState(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [showModal, setShowModal] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isPublicPreview, setIsPublicPreview] = useState(false);

  // Profile Data
  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    businessProfession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    profilePic: null,
    selectedTheme: 0,
    username: '',
  });

  const [dmButtons, setDmButtons] = useState({
    bookMeeting: { enabled: true, label: 'Book a Meeting', calendarLink: '', icon: '📅', emojiTag: '📅' },
    letsConnect: { enabled: true, label: 'Let\'s Connect', icon: '💬', emojiTag: '💬' },
    collabRequest: { enabled: true, label: 'Collab Request', icon: '🤝', emojiTag: '🤝' },
    supportCause: { enabled: true, label: 'Support a Cause', icon: '❤️', emojiTag: '❤️' },
  });

  const [charityLinks, setCharityLinks] = useState([{ name: '', url: '' }]);
  const [categoryButtons, setCategory] = useState({
    handles: [{ platform: 'Instagram', handle: '' }],
    email: [{ email: '' }],
    contact: [{ phone: '' }],
    website: [{ url: '' }],
  });

  const [portfolio, setPortfolio] = useState({ enabled: true, url: '' });
  const [projects, setProjects] = useState({ enabled: true, list: [{ title: '', url: '' }] });
  const [priorityContacts, setPriorityContacts] = useState([{ handle: '@yourfriend' }]);
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({ name: '', contactInfo: '', message: '' });
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user);
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(prev => ({ ...prev, ...data }));
          setDmButtons(data.dmButtons || dmButtons);
          setCategory(data.categoryButtons || categoryButtons);
          setCharityLinks(data.charityLinks || charityLinks);
          setPortfolio(data.portfolio || portfolio);
          setProjects(data.projects || projects);
          setPriorityContacts(data.priorityContacts || priorityContacts);
          setButtonColors(data.buttonColors || buttonColors);
          setProfileId(user.uid);
          loadMessagesFromFirestore(user.uid);
        }
      } else {
        setAuthUser(null);
        setProfileId(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check public preview
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/user/')) {
      const username = path.split('/user/')[1].split('/')[0];
      setIsPublicPreview(true);
      loadProfileByUsername(username);
    } else {
      setIsPublicPreview(false);
      setCurrentView('landing');
    }
  }, []);

  const loadProfileByUsername = async (username) => {
    try {
      setLoadingProfile(true);
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setProfile(prev => ({ ...prev, ...data }));
        setDmButtons(data.dmButtons || dmButtons);
        setCategory(data.categoryButtons || categoryButtons);
        setCharityLinks(data.charityLinks || charityLinks);
        setPortfolio(data.portfolio || portfolio);
        setProjects(data.projects || projects);
        setPriorityContacts(data.priorityContacts || priorityContacts);
        setButtonColors(data.buttonColors || buttonColors);
        setProfileId(querySnapshot.docs[0].id);
      }
      setLoadingProfile(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoadingProfile(false);
    }
  };

  const loadMessagesFromFirestore = async (uid) => {
    try {
      setLoadingMessages(true);
      const messagesRef = collection(db, 'profiles', uid, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const loadedMessages = [];
      querySnapshot.forEach((docSnapshot) => {
        loadedMessages.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });
      setMessages(loadedMessages);
      setLoadingMessages(false);
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoadingMessages(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      const defaultUsername = `user_${userCredential.user.uid.slice(0, 8)}`;
      await setDoc(doc(db, 'profiles', userCredential.user.uid), {
        name: profile.name,
        businessProfession: profile.businessProfession,
        bio: profile.bio,
        profilePic: null,
        selectedTheme: 0,
        username: defaultUsername,
        email: authEmail,
      });
      setShowAuthModal(false);
      setCurrentView('editor');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setShowAuthModal(false);
      setCurrentView('editor');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!authEmail) {
      setAuthError('Please enter your email');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, authEmail);
      setAuthError('');
      alert('Password reset email sent! Check your inbox.');
      setAuthMode('login');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('landing');
  };

  const getShareLink = () => {
    if (!profile.username) return '';
    return `${window.location.origin}/user/${profile.username}`;
  };

  const copyToClipboard = () => {
    const link = getShareLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const saveProfileToFirebase = async () => {
    if (!authUser) return;
    try {
      await setDoc(doc(db, 'profiles', authUser.uid), {
        name: profile.name,
        businessProfession: profile.businessProfession,
        bio: profile.bio,
        profilePic: profile.profilePic,
        selectedTheme: profile.selectedTheme,
        username: profile.username,
        email: authUser.email,
        dmButtons,
        categoryButtons,
        charityLinks,
        portfolio,
        projects,
        priorityContacts,
        buttonColors,
      }, { merge: true });
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const saveMessageToFirestore = async (newMessage) => {
    if (!authUser) return;
    try {
      const messagesRef = collection(db, 'profiles', authUser.uid, 'messages');
      await addDoc(messagesRef, {
        name: newMessage.name,
        contact: newMessage.contactInfo,
        message: newMessage.message,
        messageType: newMessage.messageType,
        senderTag: newMessage.senderTag,
        timestamp: new Date(newMessage.timestamp),
        starred: newMessage.starred,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateMessageStarInFirestore = async (messageId, starStatus) => {
    if (!authUser) return;
    try {
      const messageRef = doc(db, 'profiles', authUser.uid, 'messages', messageId);
      await updateDoc(messageRef, { starred: starStatus });
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const isPriority = (contactInfo) => {
    return priorityContacts.some(pc => pc.handle.toLowerCase().includes(contactInfo.toLowerCase()) || contactInfo.toLowerCase().includes(pc.handle.toLowerCase()));
  };

  const getSenderTag = (contactInfo) => isPriority(contactInfo) ? '⭐' : '🌸';

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contactInfo || !formData.message) { alert('Please fill in all fields'); return; }
    const newMessage = { name: formData.name, contactInfo: formData.contactInfo, message: formData.message, messageType: currentMessageType.emojiTag, senderTag: getSenderTag(formData.contactInfo), timestamp: new Date().toISOString(), starred: false };
    saveMessageToFirestore(newMessage);
    setMessages([newMessage, ...messages]);
    setFormData({ name: '', contactInfo: '', message: '' });
    setShowMessageForm(false);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const toggleStar = (index) => {
    const message = messages[index];
    const newStarStatus = !message.starred;
    if (message.id) updateMessageStarInFirestore(message.id, newStarStatus);
    const updatedMessages = [...messages];
    updatedMessages[index].starred = newStarStatus;
    setMessages(updatedMessages);
  };

  const filteredMessages = messages.filter(msg => {
    if (inboxFilter === 'all') return true;
    if (inboxFilter === 'priority') return msg.starred || msg.senderTag === '⭐';
    if (inboxFilter === 'collab') return msg.messageType === '🤝';
    if (inboxFilter === 'meeting') return msg.messageType === '📅';
    if (inboxFilter === 'connect') return msg.messageType === '💬';
    if (inboxFilter === 'fans') return msg.senderTag === '🌸' && !msg.starred;
    return true;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const handleProfileChange = (field, value) => setProfile(prev => ({ ...prev, [field]: value }));

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setProfile(prev => ({ ...prev, profilePic: event.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryAdd = (category) => {
    setCategory(prev => {
      const newList = [...prev[category]];
      if (category === 'handles') newList.push({ platform: '', handle: '' });
      if (category === 'email') newList.push({ email: '' });
      if (category === 'contact') newList.push({ phone: '' });
      if (category === 'website') newList.push({ url: '' });
      return { ...prev, [category]: newList };
    });
  };

  const handleCategoryChange = (category, index, field, value) => {
    setCategory(prev => {
      const newList = [...prev[category]];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, [category]: newList };
    });
  };

  const handleCategoryRemove = (category, index) => {
    setCategory(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
  };

  const formatUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('mailto:') || url.startsWith('tel:')) return url;
    return `https://${url}`;
  };

  const getSocialMediaUrl = (platform, handle) => {
    if (!handle) return '';
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    const platformUrls = {
      'Instagram': `https://instagram.com/${cleanHandle}`,
      'TikTok': `https://tiktok.com/@${cleanHandle}`,
      'Twitter': `https://twitter.com/${cleanHandle}`,
      'X': `https://twitter.com/${cleanHandle}`,
      'Facebook': `https://facebook.com/${cleanHandle}`,
      'LinkedIn': `https://linkedin.com/in/${cleanHandle}`,
      'YouTube': `https://youtube.com/@${cleanHandle}`,
      'Pinterest': `https://pinterest.com/${cleanHandle}`,
      'Snapchat': `https://snapchat.com/add/${cleanHandle}`,
      'Discord': `https://discord.com/users/${cleanHandle}`,
      'Twitch': `https://twitch.tv/${cleanHandle}`,
      'Reddit': `https://reddit.com/u/${cleanHandle}`,
      'BeReal': `https://bereal.com/${cleanHandle}`,
      'Bluesky': `https://bsky.app/profile/${cleanHandle}`,
      'Mastodon': `https://${cleanHandle}`,
    };
    return platformUrls[platform] || `https://${cleanHandle}`;
  };

  // Auth Modal Component
  const AuthModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
        <h2 className="text-3xl font-bold mb-6 text-purple-600">{authMode === 'login' ? '🔐 Sign In' : authMode === 'signup' ? '✨ Create Account' : '🔑 Reset Password'}</h2>
        
        {authError && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 font-bold text-sm">{authError}</div>}
        
        <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignUp : (e) => { e.preventDefault(); handlePasswordReset(); }} className="space-y-4">
          <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email" required className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold" />
          {authMode !== 'reset' && <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password" required className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold" />}
          <button type="submit" className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-purple-700">
            {authMode === 'login' ? 'Sign In' : authMode === 'signup' ? 'Create Account' : 'Send Reset Email'}
          </button>
        </form>

        <div className="flex gap-2 mt-4">
          <button onClick={() => setAuthMode('login')} className={`flex-1 py-2 rounded-lg font-bold ${authMode === 'login' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Login</button>
          <button onClick={() => setAuthMode('signup')} className={`flex-1 py-2 rounded-lg font-bold ${authMode === 'signup' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Sign Up</button>
          <button onClick={() => setAuthMode('reset')} className={`flex-1 py-2 rounded-lg font-bold ${authMode === 'reset' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800'}`}>Reset</button>
        </div>

        <button onClick={() => setShowAuthModal(false)} className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold mt-4 hover:bg-gray-400">Close</button>
      </div>
    </div>
  );

  // Share Modal
  const ShareModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-blue-300">
        <h2 className="text-3xl font-bold mb-4 text-blue-600">🔗 Share Link</h2>
        <div className="bg-gray-100 rounded-xl p-4 mb-4 break-all">
          <p className="text-sm font-bold text-gray-700 mb-2">Your Profile Link:</p>
          <p className="text-lg font-bold text-blue-600">{getShareLink()}</p>
        </div>
        <button onClick={copyToClipboard} className={`w-full px-6 py-3 rounded-2xl font-bold text-lg transition ${copySuccess ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
          {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
        </button>
        <button onClick={() => setShowShareModal(false)} className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold mt-4 hover:bg-gray-400">Close</button>
      </div>
    </div>
  );

  if (isAuthLoading) return <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 flex items-center justify-center"><p className="text-3xl font-bold">Loading...</p></div>;

  // LANDING PAGE - PUBLIC
  if (currentView === 'landing' && !isPublicPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&display=swap');`}</style>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-5xl font-black text-white drop-shadow-2xl">🔗 Links & DM 💬</h1>
            <div className="flex gap-4">
              <button onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }} className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold text-lg hover:shadow-xl transition transform hover:scale-110 border-4 border-purple-200">Get Started</button>
              <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold text-lg hover:shadow-xl transition transform hover:scale-110 border-4 border-white">Let's Do It!</button>
            </div>
          </div>

          <div className="text-center mb-20">
            <h1 className="text-8xl font-black text-white drop-shadow-2xl mb-4">One Link. Sorted DMs.</h1>
            <p className="text-2xl font-bold text-white drop-shadow-lg mb-3">The Ultimate Link-in-Bio for Creators 🌟</p>
            <p className="text-xl font-bold text-white drop-shadow-lg">Manage all your links, messages & projects in one beautiful place</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {[{ emoji: '💬', title: 'Smart DM Sorting', desc: 'Organize all messages intelligently', gradient: 'from-pink-500 to-rose-500' }, { emoji: '🎨', title: '12 Beautiful Themes', desc: 'Choose your perfect vibe', gradient: 'from-purple-500 to-indigo-500' }, { emoji: '📱', title: 'All Socials in One', desc: 'Connect all your platforms instantly', gradient: 'from-cyan-500 to-blue-500' }].map((feature, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${feature.gradient} rounded-3xl p-6 hover:shadow-2xl transition transform hover:scale-105 border-4 border-white/30`}>
                <div className="text-6xl mb-3">{feature.emoji}</div>
                <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
                <p className="text-base font-bold text-white">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-white font-bold text-xl drop-shadow-lg">Trusted by Influencers, Celebrities & Brands 💎</p>
          </div>
        </div>
        {showAuthModal && <AuthModal />}
      </div>
    );
  }

  // EDITOR - PRIVATE (requires auth)
  if (currentView === 'editor') {
    if (!authUser) return <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 flex items-center justify-center"><button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-2xl">Sign In to Continue</button>{showAuthModal && <AuthModal />}</div>;

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">✏️ Edit Your Profile</h1>
            <div className="flex gap-3">
              <button onClick={() => setShowShareModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700">🔗 Share</button>
              <button onClick={() => setCurrentView('preview')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl">👁️ Preview</button>
              <button onClick={() => setCurrentView('inbox')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl">📬 Inbox</button>
              <button onClick={handleLogout} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700">Logout</button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 mb-6 shadow-xl border-4 border-purple-300">
            <h2 className="text-2xl font-bold mb-4 text-purple-600">Profile Info</h2>
            <input type="text" value={profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} placeholder="Your Name" className="w-full text-3xl font-bold border-2 border-gray-300 rounded-xl p-4 mb-4" />
            <input type="text" value={profile.businessProfession} onChange={(e) => handleProfileChange('businessProfession', e.target.value)} placeholder="Your Profession" className="w-full text-xl font-bold border-2 border-gray-300 rounded-xl p-4 mb-4" />
            <textarea value={profile.bio} onChange={(e) => handleProfileChange('bio', e.target.value)} placeholder="Your Bio" className="w-full text-lg border-2 border-gray-300 rounded-xl p-4 mb-4 h-24 font-bold" />
            <input type="text" value={profile.username} onChange={(e) => handleProfileChange('username', e.target.value)} placeholder="Username (for share link)" className="w-full text-lg border-2 border-gray-300 rounded-xl p-4 mb-4 font-bold" />
            <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="w-full mb-4" />
            <button onClick={saveProfileToFirebase} className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-purple-700">💾 Save Profile</button>
            {showConfirmation && <p className="text-center text-green-600 font-bold mt-4">✅ Profile saved!</p>}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-purple-300">
            <h2 className="text-2xl font-bold mb-4 text-purple-600">🎨 Choose Theme</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {themes.map((t, idx) => (
                <button key={idx} onClick={() => handleProfileChange('selectedTheme', idx)} className={`h-24 rounded-2xl transition-all font-bold text-white text-xs ${profile.selectedTheme === idx ? 'ring-4 ring-purple-600 scale-110' : 'ring-2 ring-gray-300 hover:scale-105'}`} style={{ background: t.gradient }} title={t.name}>{t.name}</button>
              ))}
            </div>
          </div>
        </div>
        {showShareModal && <ShareModal />}
      </div>
    );
  }

  // INBOX - PRIVATE (requires auth)
  if (currentView === 'inbox') {
    if (!authUser) return <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 flex items-center justify-center"><button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-2xl">Sign In to Continue</button>{showAuthModal && <AuthModal />}</div>;

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setCurrentView('editor')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl">← Back</button>
            <h1 className="text-4xl text-white font-bold">📬 Messages</h1>
          </div>

          <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl">
            <div className="flex flex-wrap gap-2">
              {[{ key: 'all', label: 'All', emoji: '' }, { key: 'priority', label: 'Priority', emoji: '⭐' }, { key: 'collab', label: 'Collab', emoji: '🤝' }, { key: 'meeting', label: 'Meeting', emoji: '📅' }, { key: 'connect', label: 'Connect', emoji: '💬' }, { key: 'fans', label: 'Fans', emoji: '🌸' }].map(filter => (
                <button key={filter.key} onClick={() => setInboxFilter(filter.key)} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${inboxFilter === filter.key ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {filter.emoji} {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loadingMessages ? (
              <div className="bg-white rounded-3xl p-10 text-center"><p className="text-2xl font-bold text-gray-600">Loading messages...</p></div>
            ) : sortedMessages.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center"><p className="text-4xl mb-3">📭</p><p className="text-2xl font-bold text-gray-600">No messages yet</p></div>
            ) : (
              sortedMessages.map((msg, idx) => (
                <div key={msg.id || idx} className="bg-white rounded-2xl p-4 shadow-lg border-4 border-purple-200 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-gray-800">{msg.name}</span>
                        <span className="text-2xl">{msg.messageType}</span>
                        {msg.starred && <span className="text-2xl">⭐</span>}
                      </div>
                      <p className="text-xs text-gray-500">{msg.contact}</p>
                    </div>
                    <button onClick={() => toggleStar(idx)} className="text-2xl hover:scale-125 transition ml-2">
                      {msg.starred ? '⭐' : '☆'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{msg.message}</p>
                  <p className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // PREVIEW - PUBLIC
  if (currentView === 'preview' || isPublicPreview) {
    return (
      <div style={{ background: themes[profile.selectedTheme]?.gradient || themes[0].gradient }} className="min-h-screen p-8">
        {!isPublicPreview && authUser && (
          <div className="max-w-md mx-auto mb-6">
            <button onClick={() => setCurrentView('editor')} className="w-full bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold">← Back to Edit</button>
          </div>
        )}

        <div className="max-w-md mx-auto">
          {profile.profilePic && (
            <div className="flex justify-center mb-6">
              <img src={profile.profilePic} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white object-cover" />
            </div>
          )}

          <div className="bg-white rounded-3xl p-8 text-center mb-6 shadow-xl border-4 border-white/30">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{profile.name}</h1>
            <p className="text-lg font-bold text-gray-600 mb-2">{profile.businessProfession}</p>
            <p className="text-sm text-gray-700 mb-4">{profile.bio}</p>
          </div>

          <div className="space-y-3">
            {dmButtons.bookMeeting.enabled && (
              <button onClick={() => openMessageForm('bookMeeting')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.bookMeeting.bg, color: buttonColors.bookMeeting.text }}>
                📅 {dmButtons.bookMeeting.label}
              </button>
            )}
            {dmButtons.letsConnect.enabled && (
              <button onClick={() => openMessageForm('letsConnect')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.letsConnect.bg, color: buttonColors.letsConnect.text }}>
                💬 {dmButtons.letsConnect.label}
              </button>
            )}
            {dmButtons.collabRequest.enabled && (
              <button onClick={() => openMessageForm('collabRequest')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.collabRequest.bg, color: buttonColors.collabRequest.text }}>
                🤝 {dmButtons.collabRequest.label}
              </button>
            )}
            {dmButtons.supportCause.enabled && (
              <button onClick={() => openMessageForm('supportCause')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.supportCause.bg, color: buttonColors.supportCause.text }}>
                ❤️ {dmButtons.supportCause.label}
              </button>
            )}

            {categoryButtons.handles.length > 0 && (
              <button onClick={() => setShowModal('handles')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.handles.bg, color: buttonColors.handles.text }}>
                🌐 @ Handles
              </button>
            )}

            {categoryButtons.email.length > 0 && (
              <button onClick={() => setShowModal('email')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.email.bg, color: buttonColors.email.text }}>
                📧 Email
              </button>
            )}

            {categoryButtons.contact.length > 0 && (
              <button onClick={() => setShowModal('contact')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.contact.bg, color: buttonColors.contact.text }}>
                📱 Contact
              </button>
            )}

            {categoryButtons.website.length > 0 && (
              <button onClick={() => setShowModal('website')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.website.bg, color: buttonColors.website.text }}>
                🌍 Website
              </button>
            )}

            {portfolio.enabled && portfolio.url && (
              <a href={formatUrl(portfolio.url)} target="_blank" rel="noopener noreferrer" className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition block text-center" style={{ background: buttonColors.portfolio.bg, color: buttonColors.portfolio.text }}>
                🎨 Portfolio
              </a>
            )}

            {projects.enabled && projects.list.some(p => p.url) && (
              <button onClick={() => setShowModal('projects')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition" style={{ background: buttonColors.projects.bg, color: buttonColors.projects.text }}>
                📁 Projects
              </button>
            )}

            {charityLinks.some(c => c.url) && (
              <button onClick={() => setShowModal('charities')} className="w-full text-lg font-bold py-4 rounded-2xl border-4 border-white/30 hover:shadow-xl transition bg-red-500 text-white">
                ❤️ Support a Cause
              </button>
            )}
          </div>

          {showMessageForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
                <h3 className="text-2xl font-bold mb-6 text-purple-600">{currentMessageType?.label}</h3>
                <form onSubmit={handleMessageSubmit} className="space-y-4">
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your Name" required className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold" />
                  <input type="text" value={formData.contactInfo} onChange={(e) => setFormData({...formData, contactInfo: e.target.value})} placeholder="Contact (email/phone/handle)" required className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold" />
                  <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Your message" required className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold h-24" />
                  <button type="submit" className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700">Send Message</button>
                  <button type="button" onClick={() => setShowMessageForm(false)} className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold">Cancel</button>
                </form>
              </div>
            </div>
          )}

          {showConfirmation && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 text-center shadow-2xl border-4 border-purple-300">
                <p className="text-4xl mb-4">✅</p>
                <p className="text-2xl font-bold text-green-600">Message Sent!</p>
              </div>
            </div>
          )}

          {showModal === 'handles' && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
                <h3 className="text-2xl font-bold mb-6">🌐 Handles</h3>
                <div className="space-y-3">
                  {categoryButtons.handles.map((h, idx) => (
                    <a key={idx} href={getSocialMediaUrl(h.platform, h.handle)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-purple-100 transition">
                      <p className="text-lg font-bold text-purple-600">{h.platform}: @{h.handle}</p>
                    </a>
                  ))}
                </div>
                <button onClick={() => setShowModal(null)} className="w-full mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}

          {showModal === 'email' && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
                <h3 className="text-2xl font-bold mb-6">📧 Email</h3>
                <div className="space-y-3">
                  {categoryButtons.email.map((e, idx) => (
                    <a key={idx} href={`mailto:${e.email}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-blue-100 transition">
                      <p className="text-lg font-bold text-blue-600">{e.email}</p>
                    </a>
                  ))}
                </div>
                <button onClick={() => setShowModal(null)} className="w-full mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}

          {showModal === 'contact' && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
                <h3 className="text-2xl font-bold mb-6">📱 Contact</h3>
                <div className="space-y-3">
                  {categoryButtons.contact.map((c, idx) => (
                    <a key={idx} href={`tel:${c.phone}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-green-100 transition">
                      <p className="text-lg font-bold text-green-600">{c.phone}</p>
                    </a>
                  ))}
                </div>
                <button onClick={() => setShowModal(null)} className="w-full mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}

          {showModal === 'website' && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
                <h3 className="text-2xl font-bold mb-6">🌍 Website</h3>
                <div className="space-y-3">
                  {categoryButtons.website.map((w, idx) => (
                    <a key={idx} href={formatUrl(w.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-purple-100 transition">
                      <p className="text-lg font-bold text-purple-600">{w.url}</p>
                    </a>
                  ))}
                </div>
                <button onClick={() => setShowModal(null)} className="w-full mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}

          {showModal === 'projects' && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
                <h3 className="text-2xl font-bold mb-6">📁 Projects</h3>
                <div className="space-y-3">
                  {projects.list.map((p, idx) => (
                    <a key={idx} href={formatUrl(p.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-orange-100 transition">
                      <p className="text-lg font-bold text-orange-600">{p.title}</p>
                    </a>
                  ))}
                </div>
                <button onClick={() => setShowModal(null)} className="w-full mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}

          {showModal === 'charities' && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-purple-300">
                <h3 className="text-2xl font-bold mb-6">❤️ Support a Cause</h3>
                <div className="space-y-3">
                  {charityLinks.filter(c => c.url).map((c, idx) => (
                    <a key={idx} href={formatUrl(c.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-pink-100 transition">
                      <p className="text-lg font-bold text-pink-600">{c.name || 'Charity'}</p>
                    </a>
                  ))}
                </div>
                <button onClick={() => setShowModal(null)} className="w-full mt-6 bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-bold">Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const openMessageForm = (buttonKey) => {
    setCurrentMessageType(dmButtons[buttonKey]);
    setShowMessageForm(true);
  };

  return null;
};

export default LinksAndDM;
