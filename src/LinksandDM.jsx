import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, getDoc, setDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const LinksAndDM = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentMessageType, setCurrentMessageType] = useState(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [showModal, setShowModal] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [isPublicPreview, setIsPublicPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  
  // Auth states
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    businessProfession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    profilePic: null,
    selectedTheme: 0,
    username: '',
    customTheme: { start: '#40E0D0', end: '#20B2AA' }
  });

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
    { name: 'Custom', gradient: `linear-gradient(135deg, ${profile.customTheme.start} 0%, ${profile.customTheme.end} 100%)` },
  ];

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !profileId) {
        const uid = currentUser.uid;
        setProfileId(uid);
        loadProfileFromFirebase(uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check URL for public preview
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/user/')) {
      const username = path.split('/user/')[1].split('/')[0];
      setIsPublicPreview(true);
      loadProfileByUsername(username);
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setProfileId(userCredential.user.uid);
      }
      setShowAuth(false);
      setCurrentView('editor');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setProfileId(null);
    setCurrentView('landing');
  };

  const loadProfileByUsername = async (username) => {
    try {
      setLoadingProfile(true);
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          businessProfession: data.businessProfession || prev.businessProfession,
          bio: data.bio || prev.bio,
          profilePic: data.profilePic || prev.profilePic,
          selectedTheme: data.selectedTheme || 0,
          username: data.username || '',
          customTheme: data.customTheme || prev.customTheme
        }));
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

  const loadProfileFromFirebase = async (id) => {
    try {
      setLoadingProfile(true);
      const profileRef = doc(db, 'profiles', id);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        setProfile(prev => ({
          ...prev,
          name: data.name || prev.name,
          businessProfession: data.businessProfession || prev.businessProfession,
          bio: data.bio || prev.bio,
          profilePic: data.profilePic || prev.profilePic,
          selectedTheme: data.selectedTheme || 0,
          username: data.username || '',
          customTheme: data.customTheme || prev.customTheme
        }));
        setDmButtons(data.dmButtons || dmButtons);
        setCategory(data.categoryButtons || categoryButtons);
        setCharityLinks(data.charityLinks || charityLinks);
        setPortfolio(data.portfolio || portfolio);
        setProjects(data.projects || projects);
        setPriorityContacts(data.priorityContacts || priorityContacts);
        setButtonColors(data.buttonColors || buttonColors);
      }
      setLoadingProfile(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoadingProfile(false);
    }
  };

  const saveProfileToFirebase = async () => {
    if (!profileId) return;
    try {
      const profileRef = doc(db, 'profiles', profileId);
      await setDoc(profileRef, {
        name: profile.name,
        businessProfession: profile.businessProfession,
        bio: profile.bio,
        profilePic: profile.profilePic,
        selectedTheme: profile.selectedTheme,
        username: profile.username,
        customTheme: profile.customTheme,
        dmButtons: dmButtons,
        categoryButtons: categoryButtons,
        charityLinks: charityLinks,
        portfolio: portfolio,
        projects: projects,
        priorityContacts: priorityContacts,
        buttonColors: buttonColors,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const generateShareLink = async () => {
    if (!profile.username) {
      alert('Please set a username first');
      return;
    }
    await saveProfileToFirebase();
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/user/${profile.username}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  useEffect(() => {
    if (!profileId) return;
    const loadMessagesFromFirestore = async () => {
      try {
        setLoadingMessages(true);
        const messagesRef = collection(db, 'profiles', profileId, 'messages');
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
    loadMessagesFromFirestore();
  }, [profileId]);

  const saveMessageToFirestore = async (newMessage) => {
    if (!profileId) return;
    try {
      const messagesRef = collection(db, 'profiles', profileId, 'messages');
      await addDoc(messagesRef, {
        name: newMessage.name,
        contact: newMessage.contact,
        message: newMessage.message,
        messageType: newMessage.messageType,
        senderTag: newMessage.senderTag,
        starred: false,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const isPriority = (contactInfo) => {
    return priorityContacts.some(pc => 
      pc.handle.toLowerCase().includes(contactInfo.toLowerCase()) || 
      contactInfo.toLowerCase().includes(pc.handle.toLowerCase())
    );
  };

  const getSenderTag = (contactInfo) => {
    return isPriority(contactInfo) ? '⭐' : '🌸';
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contactInfo || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    const newMessage = {
      name: formData.name,
      contact: formData.contactInfo,
      message: formData.message,
      messageType: currentMessageType.emojiTag,
      senderTag: getSenderTag(formData.contactInfo),
      timestamp: new Date().toISOString(),
      starred: false,
    };

    saveMessageToFirestore(newMessage);
    setMessages([newMessage, ...messages]);
    setFormData({ name: '', contactInfo: '', message: '' });
    setShowMessageForm(false);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const toggleStar = async (index) => {
    const msg = messages[index];
    const updatedMessages = [...messages];
    updatedMessages[index].starred = !updatedMessages[index].starred;
    setMessages(updatedMessages);

    if (msg.id) {
      const messageRef = doc(db, 'profiles', profileId, 'messages', msg.id);
      await updateDoc(messageRef, { starred: updatedMessages[index].starred });
    }
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

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfile(prev => ({ ...prev, profilePic: event.target.result }));
      };
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
      newList[index][field] = value;
      return { ...prev, [category]: newList };
    });
  };

  const handleCategoryRemove = (category, index) => {
    setCategory(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const getSocialUrl = (platform, handle) => {
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
    const urls = {
      'Instagram': `https://instagram.com/${cleanHandle}`,
      'TikTok': `https://tiktok.com/@${cleanHandle}`,
      'Twitter': `https://twitter.com/${cleanHandle}`,
      'X': `https://twitter.com/${cleanHandle}`,
      'Facebook': `https://facebook.com/${cleanHandle}`,
      'LinkedIn': `https://linkedin.com/in/${cleanHandle}`,
      'YouTube': `https://youtube.com/@${cleanHandle}`,
      'Pinterest': `https://pinterest.com/${cleanHandle}`,
      'Snapchat': `https://snapchat.com/add/${cleanHandle}`,
    };
    return urls[platform] || `https://${cleanHandle}`;
  };

  // AUTH MODAL
  const AuthModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-purple-600 mb-6">{isLogin ? '🔓 Login' : '🎉 Sign Up'}</h2>
        {authError && <p className="text-red-500 mb-4 text-sm">{authError}</p>}
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border-2 border-purple-300 rounded-xl" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)" className="w-full p-3 border-2 border-purple-300 rounded-xl" required />
          <button type="submit" className="w-full bg-purple-600 text-white p-3 rounded-xl font-bold hover:bg-purple-700">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-purple-600 font-bold">
          {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
        </button>
        <button onClick={() => setShowAuth(false)} className="w-full mt-2 text-gray-500">Cancel</button>
      </div>
    </div>
  );

  // SHARE MODAL
  const ShareModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-purple-600 mb-4">🔗 Your Share Link</h2>
        <div className="bg-gray-100 p-4 rounded-xl mb-4 break-all text-sm">{shareLink}</div>
        <button onClick={copyToClipboard} className="w-full bg-purple-600 text-white p-3 rounded-xl font-bold hover:bg-purple-700 mb-2">
          {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
        </button>
        <button onClick={() => setShowShareModal(false)} className="w-full bg-gray-300 text-gray-700 p-3 rounded-xl font-bold">Close</button>
      </div>
    </div>
  );

  // COLOR SETTINGS MODAL
  const ColorSettingsModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full my-8 max-h-[80vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-purple-600 mb-6">🎨 Custom Colors</h2>
        <div className="space-y-6">
          {Object.keys(buttonColors).map(key => (
            <div key={key} className="space-y-2">
              <h3 className="font-bold capitalize text-lg">{key.replace(/([A-Z])/g, ' $1')}</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Background</label>
                  <input type="color" value={buttonColors[key].bg} onChange={(e) => setButtonColors(prev => ({ ...prev, [key]: { ...prev[key], bg: e.target.value } }))} className="w-full h-10 rounded cursor-pointer" />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600">Text</label>
                  <input type="color" value={buttonColors[key].text} onChange={(e) => setButtonColors(prev => ({ ...prev, [key]: { ...prev[key], text: e.target.value } }))} className="w-full h-10 rounded cursor-pointer" />
                </div>
              </div>
              <div style={{ backgroundColor: buttonColors[key].bg, color: buttonColors[key].text }} className="p-3 rounded-xl text-center font-bold">Preview</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { saveProfileToFirebase(); setShowColorSettings(false); }} className="flex-1 bg-purple-600 text-white p-3 rounded-xl font-bold">Save</button>
          <button onClick={() => setShowColorSettings(false)} className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-xl font-bold">Close</button>
        </div>
      </div>
    </div>
  );

  // CUSTOM THEME MODAL
  const CustomThemeModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-purple-600 mb-6">🎨 Custom Theme</h2>
        <div className="space-y-4">
          <div>
            <label className="font-bold">Start Color</label>
            <input type="color" value={profile.customTheme.start} onChange={(e) => setProfile(prev => ({ ...prev, customTheme: { ...prev.customTheme, start: e.target.value } }))} className="w-full h-12 rounded cursor-pointer mt-2" />
          </div>
          <div>
            <label className="font-bold">End Color</label>
            <input type="color" value={profile.customTheme.end} onChange={(e) => setProfile(prev => ({ ...prev, customTheme: { ...prev.customTheme, end: e.target.value } }))} className="w-full h-12 rounded cursor-pointer mt-2" />
          </div>
          <div style={{ background: `linear-gradient(135deg, ${profile.customTheme.start} 0%, ${profile.customTheme.end} 100%)` }} className="h-24 rounded-xl"></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => { handleProfileChange('selectedTheme', 12); saveProfileToFirebase(); setShowCustomTheme(false); }} className="flex-1 bg-purple-600 text-white p-3 rounded-xl font-bold">Apply</button>
          <button onClick={() => setShowCustomTheme(false)} className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-xl font-bold">Cancel</button>
        </div>
      </div>
    </div>
  );

  // LANDING PAGE
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-400 via-blue-300 to-purple-400 p-4 overflow-y-auto relative">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 800; }`}</style>
        
        {/* Top Left Logo */}
        <div className="absolute top-4 left-4">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">🔗 Links&Dm</h1>
        </div>

        {/* Top Right Button */}
        <div className="absolute top-4 right-4">
          <button onClick={() => { user ? setCurrentView('editor') : setShowAuth(true); }} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-110 drop-shadow-lg border-4 border-purple-200">
            Let's Do It! ✨
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8 pb-8 pt-20">
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl p-8 text-center shadow-xl border-4 border-white/20">
            <div className="text-6xl mb-4">📱</div>
            <h2 className="heading-xl text-4xl text-white mb-3">Contact Central</h2>
            <p className="text-white text-xl font-bold">Phone, web, everything connected</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-3xl p-12 text-center shadow-xl border-4 border-white/20">
            <h1 className="heading-xl text-5xl text-white mb-6 drop-shadow-lg">Transform Your Link-in-Bio Today 🚀</h1>
            
            <button onClick={() => { user ? setCurrentView('editor') : setShowAuth(true); }} className="bg-white text-purple-600 px-12 py-4 rounded-2xl font-bold text-2xl hover:shadow-2xl transition transform hover:scale-110 mb-4 drop-shadow-lg border-4 border-purple-200">
              Get Started Now
            </button>

            <div className="mt-4">
              <button onClick={() => setCurrentView('preview')} className="bg-white/90 text-blue-600 px-8 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105 border-4 border-blue-200">
                See Demo
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white text-2xl font-bold drop-shadow-lg">Trusted by Influencers, Celebrities & Brands 💎</p>
          </div>
        </div>

        {showAuth && <AuthModal />}
      </div>
    );
  }

  // EDITOR PAGE
  if (currentView === 'editor') {
    if (!user) {
      setShowAuth(true);
      return null;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-4 overflow-y-auto">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 800; } .heading-md { font-family: 'Poppins', sans-serif; font-weight: 700; }`}</style>
        
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          <div className="flex gap-3 mb-6 flex-wrap">
            <button onClick={() => setCurrentView('landing')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl">← Landing</button>
            <button onClick={() => setCurrentView('preview')} className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl">👁️ Preview</button>
            <button onClick={() => setCurrentView('inbox')} className="bg-white text-green-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl">📬 Inbox</button>
            <button onClick={handleSignOut} className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-xl">Logout</button>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-3xl border-4 border-purple-500 p-8 shadow-xl">
            <h2 className="heading-md text-3xl mb-6 text-purple-600">✏️ Edit Profile</h2>
            
            <div className="space-y-4">
              <div>
                <label className="font-bold text-lg">Name</label>
                <input type="text" value={profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} className="w-full p-3 border-2 border-gray-300 rounded-xl mt-1" />
              </div>

              <div>
                <label className="font-bold text-lg">Profession</label>
                <input type="text" value={profile.businessProfession} onChange={(e) => handleProfileChange('businessProfession', e.target.value)} className="w-full p-3 border-2 border-gray-300 rounded-xl mt-1" />
              </div>

              <div>
                <label className="font-bold text-lg">Bio</label>
                <textarea value={profile.bio} onChange={(e) => handleProfileChange('bio', e.target.value)} maxLength="200" className="w-full p-3 border-2 border-gray-300 rounded-xl mt-1 h-24" />
                <p className="text-sm text-gray-500 mt-1">{profile.bio.length}/200 characters</p>
              </div>

              <div>
                <label className="font-bold text-lg">Profile Picture</label>
                <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="w-full p-3 border-2 border-gray-300 rounded-xl mt-1" />
                {profile.profilePic && <img src={profile.profilePic} alt="Profile" className="w-24 h-24 rounded-full mt-2 border-4 border-purple-300" />}
              </div>

              <div className="bg-blue-100 border-4 border-blue-400 rounded-2xl p-6">
                <label className="font-bold text-lg flex items-center gap-2">📱 Username</label>
                <p className="text-sm text-gray-600 mb-2">Choose a unique username for your link</p>
                <input type="text" value={profile.username} onChange={(e) => handleProfileChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))} placeholder="yourname" className="w-full p-3 border-2 border-blue-300 rounded-xl mt-2 font-bold" />
                <button onClick={generateShareLink} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-2xl font-bold text-lg mt-3 hover:shadow-xl transition">
                  🔗 Generate Share Link
                </button>
              </div>
            </div>
          </div>

          {/* DM Buttons */}
          <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="heading-md text-3xl text-white">📬 Smart DM Buttons</h2>
              <button onClick={() => setShowColorSettings(true)} className="bg-white text-pink-600 px-4 py-2 rounded-xl font-bold hover:shadow-lg">🎨 Colors</button>
            </div>

            <div className="space-y-4">
              {Object.entries(dmButtons).map(([key, button]) => (
                <div key={key} className="bg-white/95 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <input type="checkbox" checked={button.enabled} onChange={(e) => setDmButtons(prev => ({ ...prev, [key]: { ...prev[key], enabled: e.target.checked } }))} className="w-6 h-6" />
                    <span className="text-2xl">{button.icon}</span>
                    <input type="text" value={button.label} onChange={(e) => setDmButtons(prev => ({ ...prev, [key]: { ...prev[key], label: e.target.value } }))} className="flex-1 font-bold p-2 border-2 border-gray-300 rounded-lg" />
                  </div>
                  {key === 'bookMeeting' && button.enabled && (
                    <input type="url" value={button.calendarLink} onChange={(e) => setDmButtons(prev => ({ ...prev, bookMeeting: { ...prev.bookMeeting, calendarLink: e.target.value } }))} placeholder="Calendly, Zoom, etc." className="w-full p-2 border-2 border-gray-300 rounded-lg text-sm mt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Charity Links */}
          {dmButtons.supportCause.enabled && (
            <div className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="heading-md text-3xl text-white mb-6">❤️ Charity Links (Up to 5)</h2>
              <div className="space-y-3">
                {charityLinks.map((charity, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input type="text" value={charity.name} onChange={(e) => { const newLinks = [...charityLinks]; newLinks[idx].name = e.target.value; setCharityLinks(newLinks); }} placeholder="Charity Name" className="flex-1 p-2 rounded-lg font-bold text-sm" />
                    <input type="url" value={charity.url} onChange={(e) => { const newLinks = [...charityLinks]; newLinks[idx].url = e.target.value; setCharityLinks(newLinks); }} placeholder="https://..." className="flex-1 p-2 rounded-lg font-bold text-sm" />
                    {charityLinks.length > 1 && (
                      <button onClick={() => setCharityLinks(charityLinks.filter((_, i) => i !== idx))} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">✕</button>
                    )}
                  </div>
                ))}
              </div>
              {charityLinks.length < 5 && (
                <button onClick={() => setCharityLinks([...charityLinks, { name: '', url: '' }])} className="w-full bg-white text-pink-600 px-4 py-2 rounded-lg font-bold mt-3">+ Add Charity</button>
              )}
            </div>
          )}

          {/* Social Handles */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6">🔗 @Handles (Instagram, TikTok, X, etc.)</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.handles.map((h, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={h.platform} onChange={(e) => handleCategoryChange('handles', idx, 'platform', e.target.value)} placeholder="Instagram" className="w-32 p-2 rounded-lg font-bold text-sm" />
                  <input type="text" value={h.handle} onChange={(e) => handleCategoryChange('handles', idx, 'handle', e.target.value)} placeholder="@yourhandle" className="flex-1 p-2 rounded-lg font-bold text-sm" />
                  {categoryButtons.handles.length > 1 && (
                    <button onClick={() => handleCategoryRemove('handles', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">✕</button>
                  )}
                </div>
              ))}
            </div>
            {categoryButtons.handles.length < 8 && (
              <button onClick={() => handleCategoryAdd('handles')} className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg font-bold">+ Add Handle</button>
            )}
          </div>

          {/* Email */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6">📧 Email (Up to 5)</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.email.map((e, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="email" value={e.email} onChange={(ev) => handleCategoryChange('email', idx, 'email', ev.target.value)} placeholder="your@email.com" className="flex-1 p-2 rounded-lg font-bold text-sm" />
                  {categoryButtons.email.length > 1 && (
                    <button onClick={() => handleCategoryRemove('email', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">✕</button>
                  )}
                </div>
              ))}
            </div>
            {categoryButtons.email.length < 5 && (
              <button onClick={() => handleCategoryAdd('email')} className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">+ Add Email</button>
            )}
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6">📱 Contact (Up to 5)</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.contact.map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="tel" value={c.phone} onChange={(e) => handleCategoryChange('contact', idx, 'phone', e.target.value)} placeholder="+1 (555) 123-4567" className="flex-1 p-2 rounded-lg font-bold text-sm" />
                  {categoryButtons.contact.length > 1 && (
                    <button onClick={() => handleCategoryRemove('contact', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">✕</button>
                  )}
                </div>
              ))}
            </div>
            {categoryButtons.contact.length < 5 && (
              <button onClick={() => handleCategoryAdd('contact')} className="w-full bg-white text-green-600 px-4 py-2 rounded-lg font-bold">+ Add Number</button>
            )}
          </div>

          {/* Website */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6">🌍 Website / Store (Up to 5)</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.website.map((w, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="url" value={w.url} onChange={(e) => handleCategoryChange('website', idx, 'url', e.target.value)} placeholder="https://yourwebsite.com" className="flex-1 p-2 rounded-lg font-bold text-sm" />
                  {categoryButtons.website.length > 1 && (
                    <button onClick={() => handleCategoryRemove('website', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">✕</button>
                  )}
                </div>
              ))}
            </div>
            {categoryButtons.website.length < 5 && (
              <button onClick={() => handleCategoryAdd('website')} className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">+ Add Website</button>
            )}
          </div>

          {/* Portfolio */}
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6">🎨 Portfolio</h2>
            <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 mb-4">
              <input type="checkbox" checked={portfolio.enabled} onChange={(e) => setPortfolio(prev => ({ ...prev, enabled: e.target.checked }))} className="w-7 h-7" />
              <label className="font-bold text-lg flex-1">Enable Portfolio</label>
            </div>
            {portfolio.enabled && (
              <input type="url" value={portfolio.url} onChange={(e) => setPortfolio(prev => ({ ...prev, url: e.target.value }))} placeholder="https://yourportfolio.com" className="w-full p-3 rounded-xl font-bold" />
            )}
          </div>

          {/* Projects */}
          <div className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6">📁 Projects (Up to 5)</h2>
            <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 mb-4">
              <input type="checkbox" checked={projects.enabled} onChange={(e) => setProjects(prev => ({ ...prev, enabled: e.target.checked }))} className="w-7 h-7" />
              <label className="font-bold text-lg flex-1">Enable Projects</label>
            </div>
            {projects.enabled && (
              <>
                <div className="space-y-2 mb-4">
                  {projects.list.map((proj, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" value={proj.title} onChange={(e) => { const newList = [...projects.list]; newList[idx].title = e.target.value; setProjects(prev => ({ ...prev, list: newList })); }} placeholder="Project Title" className="flex-1 p-2 rounded-lg font-bold text-sm" />
                      <input type="url" value={proj.url} onChange={(e) => { const newList = [...projects.list]; newList[idx].url = e.target.value; setProjects(prev => ({ ...prev, list: newList })); }} placeholder="https://..." className="flex-1 p-2 rounded-lg font-bold text-sm" />
                      {projects.list.length > 1 && (
                        <button onClick={() => { setProjects(prev => ({ ...prev, list: prev.list.filter((_, i) => i !== idx) })); }} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">✕</button>
                      )}
                    </div>
                  ))}
                </div>
                {projects.list.length < 5 && (
                  <button onClick={() => { setProjects(prev => ({ ...prev, list: [...prev.list, { title: '', url: '' }] })); }} className="w-full bg-white text-orange-600 px-4 py-2 rounded-lg font-bold">+ Add Project</button>
                )}
              </>
            )}
          </div>

          {/* Themes */}
          <div className="bg-white rounded-3xl border-4 border-purple-500 p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="heading-md text-3xl text-purple-600">🎨 Choose Theme</h2>
              <button onClick={() => setShowCustomTheme(true)} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:shadow-lg">✨ Custom</button>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {themes.map((t, idx) => (
                <button key={idx} onClick={() => handleProfileChange('selectedTheme', idx)} className={`h-24 rounded-2xl font-bold text-white text-xs ${profile.selectedTheme === idx ? 'ring-4 ring-purple-600 ring-offset-2 scale-110' : 'ring-2 ring-gray-300 hover:scale-105'} transition`} style={{ background: idx === 12 ? `linear-gradient(135deg, ${profile.customTheme.start} 0%, ${profile.customTheme.end} 100%)` : t.gradient }} title={t.name}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Contacts */}
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-3">⭐ Friends & Family (Priority Contacts)</h2>
            <p className="text-white font-bold text-sm mb-4">These contacts will be automatically starred in your inbox (Up to 20)</p>
            <div className="space-y-2 mb-4">
              {priorityContacts.map((contact, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={contact.handle} onChange={(e) => { const newList = [...priorityContacts]; newList[idx].handle = e.target.value; setPriorityContacts(newList); }} placeholder="@handle or email" className="flex-1 p-2 rounded-lg font-bold text-sm" />
                  {priorityContacts.length > 1 && (
                    <button onClick={() => setPriorityContacts(priorityContacts.filter((_, i) => i !== idx))} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold">✕</button>
                  )}
                </div>
              ))}
            </div>
            {priorityContacts.length < 20 && (
              <button onClick={() => setPriorityContacts([...priorityContacts, { handle: '' }])} className="w-full bg-white text-yellow-600 px-4 py-2 rounded-lg font-bold">+ Add Contact</button>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={saveProfileToFirebase} className="flex-1 bg-green-500 text-white px-6 py-4 rounded-2xl font-bold text-xl hover:shadow-xl">💾 Save All</button>
          </div>

          <div className="text-center text-white font-bold">
            <p className="text-sm">Powered by Links & DM 💎</p>
          </div>
        </div>

        {showShareModal && <ShareModal />}
        {showColorSettings && <ColorSettingsModal />}
        {showCustomTheme && <CustomThemeModal />}
      </div>
    );
  }

  // PREVIEW PAGE
  if (currentView === 'preview') {
    const selectedTheme = themes[profile.selectedTheme];
    const themeGradient = profile.selectedTheme === 12 ? `linear-gradient(135deg, ${profile.customTheme.start} 0%, ${profile.customTheme.end} 100%)` : selectedTheme?.gradient || themes[0].gradient;

    return (
      <div style={{ background: themeGradient }} className="min-h-screen p-8">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 800; }`}</style>
        
        <div className="max-w-2xl mx-auto">
          {!isPublicPreview && user && (
            <button onClick={() => setCurrentView('editor')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold mb-6 hover:shadow-xl">← Back to Editor</button>
          )}
          
          <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-white/50">
            {profile.profilePic && <img src={profile.profilePic} alt="Profile" className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-purple-500" />}
            <h1 className="text-4xl font-bold text-center mb-2">{profile.name}</h1>
            <p className="text-xl text-center text-gray-600 mb-2">{profile.businessProfession}</p>
            <p className="text-center text-gray-700 mb-6">{profile.bio}</p>

            <div className="space-y-3">
              {/* 1. Book a Meeting */}
              {dmButtons.bookMeeting.enabled && dmButtons.bookMeeting.calendarLink && (
                <a href={formatUrl(dmButtons.bookMeeting.calendarLink)} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: buttonColors.bookMeeting.bg, color: buttonColors.bookMeeting.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  {dmButtons.bookMeeting.icon} {dmButtons.bookMeeting.label}
                </a>
              )}

              {/* 2. Let's Connect */}
              {dmButtons.letsConnect.enabled && (
                <button onClick={() => { setCurrentMessageType(dmButtons.letsConnect); setShowMessageForm(true); }} style={{ backgroundColor: buttonColors.letsConnect.bg, color: buttonColors.letsConnect.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  {dmButtons.letsConnect.icon} {dmButtons.letsConnect.label}
                </button>
              )}

              {/* 3. Collab Request */}
              {dmButtons.collabRequest.enabled && (
                <button onClick={() => { setCurrentMessageType(dmButtons.collabRequest); setShowMessageForm(true); }} style={{ backgroundColor: buttonColors.collabRequest.bg, color: buttonColors.collabRequest.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  {dmButtons.collabRequest.icon} {dmButtons.collabRequest.label}
                </button>
              )}

              {/* 4. Support a Cause */}
              {dmButtons.supportCause.enabled && charityLinks.some(c => c.url) && (
                <button onClick={() => setShowModal('charities')} style={{ backgroundColor: buttonColors.supportCause.bg, color: buttonColors.supportCause.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  {dmButtons.supportCause.icon} {dmButtons.supportCause.label}
                </button>
              )}

              {/* 5. @Handles */}
              {categoryButtons.handles.some(h => h.handle) && (
                <button onClick={() => setShowModal('handles')} style={{ backgroundColor: buttonColors.handles.bg, color: buttonColors.handles.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  🔗 @Handles
                </button>
              )}

              {/* 6. Email */}
              {categoryButtons.email.some(e => e.email) && (
                <button onClick={() => setShowModal('email')} style={{ backgroundColor: buttonColors.email.bg, color: buttonColors.email.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  📧 Email
                </button>
              )}

              {/* 7. Contact */}
              {categoryButtons.contact.some(c => c.phone) && (
                <button onClick={() => setShowModal('contact')} style={{ backgroundColor: buttonColors.contact.bg, color: buttonColors.contact.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  📱 Contact
                </button>
              )}

              {/* 8. Website */}
              {categoryButtons.website.some(w => w.url) && (
                <button onClick={() => setShowModal('website')} style={{ backgroundColor: buttonColors.website.bg, color: buttonColors.website.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  🌍 Website
                </button>
              )}

              {/* 9. Portfolio */}
              {portfolio.enabled && portfolio.url && (
                <a href={formatUrl(portfolio.url)} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: buttonColors.portfolio.bg, color: buttonColors.portfolio.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  🎨 Portfolio
                </a>
              )}

              {/* 10. Projects */}
              {projects.enabled && projects.list.some(p => p.url) && (
                <button onClick={() => setShowModal('projects')} style={{ backgroundColor: buttonColors.projects.bg, color: buttonColors.projects.text }} className="block w-full p-4 rounded-2xl font-bold text-center text-lg hover:shadow-xl transition">
                  📁 Projects
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message Form Modal */}
        {showMessageForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold mb-4">{currentMessageType?.icon} {currentMessageType?.label}</h3>
              <form onSubmit={handleMessageSubmit} className="space-y-4">
                <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Your Name" className="w-full p-3 border-2 border-gray-300 rounded-xl" required />
                <input type="text" value={formData.contactInfo} onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))} placeholder="Email or @handle" className="w-full p-3 border-2 border-gray-300 rounded-xl" required />
                <textarea value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} placeholder="Your message..." className="w-full p-3 border-2 border-gray-300 rounded-xl h-32" required />
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-purple-600 text-white p-3 rounded-xl font-bold">Send</button>
                  <button type="button" onClick={() => setShowMessageForm(false)} className="flex-1 bg-gray-300 text-gray-700 p-3 rounded-xl font-bold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
              <p className="text-gray-600">Thank you for reaching out.</p>
            </div>
          </div>
        )}

        {/* All Modals */}
        {showModal === 'handles' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">🔗 @Handles</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.handles.filter(h => h.handle).map((handle, idx) => (
                  <a key={idx} href={getSocialUrl(handle.platform, handle.handle)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-purple-100">
                    <p className="text-sm text-gray-600 font-bold">{handle.platform}</p>
                    <p className="text-lg font-bold text-purple-600">{handle.handle}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'email' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📧 Email</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.email.filter(e => e.email).map((item, idx) => (
                  <a key={idx} href={`mailto:${item.email}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-blue-100">
                    <p className="text-lg font-bold text-blue-600 break-all">{item.email}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'contact' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📱 Contact</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.contact.filter(c => c.phone).map((item, idx) => (
                  <a key={idx} href={`tel:${item.phone}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-green-100">
                    <p className="text-lg font-bold text-green-600 break-all">{item.phone}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'website' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">🌍 Website</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.website.filter(w => w.url).map((item, idx) => (
                  <a key={idx} href={formatUrl(item.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-purple-100">
                    <p className="text-lg font-bold text-purple-600 break-all">{item.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'projects' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📁 Projects</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl">×</button>
              </div>
              <div className="space-y-3">
                {projects.list.filter(p => p.url).map((proj, idx) => (
                  <a key={idx} href={formatUrl(proj.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-orange-100">
                    <p className="text-sm text-gray-600 font-bold">Project</p>
                    <p className="text-lg font-bold text-orange-600 break-all">{proj.title}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'charities' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full my-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">❤️ Support a Cause</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl">×</button>
              </div>
              <div className="space-y-3">
                {charityLinks.filter(c => c.url).map((charity, idx) => (
                  <a key={idx} href={formatUrl(charity.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-pink-100">
                    <p className="text-sm text-gray-600 font-bold">{charity.name || 'Charity'}</p>
                    <p className="text-lg font-bold text-pink-600 break-all">{charity.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // INBOX PAGE
  if (currentView === 'inbox') {
    if (!user) {
      setShowAuth(true);
      return null;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 800; }`}</style>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setCurrentView('editor')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl">← Back</button>
            <h1 className="text-4xl text-white font-bold">📬 Messages</h1>
          </div>

          <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', emoji: '' }, 
                { key: 'priority', label: 'Priority', emoji: '⭐' }, 
                { key: 'collab', label: 'Collab', emoji: '🤝' }, 
                { key: 'meeting', label: 'Meeting', emoji: '📅' }, 
                { key: 'connect', label: 'Connect', emoji: '💬' }, 
                { key: 'fans', label: 'Fans', emoji: '🌸' }
              ].map(filter => (
                <button key={filter.key} onClick={() => setInboxFilter(filter.key)} className={`px-4 py-2 rounded-xl font-bold text-sm ${inboxFilter === filter.key ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {filter.emoji} {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loadingMessages ? (
              <div className="bg-white rounded-3xl p-10 text-center"><p className="text-2xl font-bold text-gray-600">Loading...</p></div>
            ) : sortedMessages.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center"><p className="text-4xl mb-3">📭</p><p className="text-2xl font-bold text-gray-600">No messages yet</p><p className="text-sm text-gray-500 mt-2">Share your link to get messages!</p></div>
            ) : (
              sortedMessages.map((msg, idx) => (
                <div key={msg.id || idx} className="bg-white rounded-2xl p-4 shadow-lg border-4 border-purple-200">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{msg.name}</span>
                        <span className="text-2xl">{msg.messageType}</span>
                        {msg.starred && <span className="text-2xl">⭐</span>}
                        <span className="text-xl">{msg.senderTag}</span>
                      </div>
                      <p className="text-xs text-gray-500">{msg.contact}</p>
                    </div>
                    <button onClick={() => toggleStar(idx)} className="text-2xl hover:scale-125">
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

  return null;
};

export default LinksAndDM;
