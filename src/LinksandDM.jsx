import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';

const LinksAndDM = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [profileId, setProfileId] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [masterPattern, setMasterPattern] = useState('');
  const [patternInput, setPatternInput] = useState([]);
  const [isPatternVerified, setIsPatternVerified] = useState(false);
  const [showForgotPattern, setShowForgotPattern] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentMessageType, setCurrentMessageType] = useState(null);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({ name: '', contactInfo: '', message: '' });
  const [showColorModal, setShowColorModal] = useState(null);
  const [showThemeColorModal, setShowThemeColorModal] = useState(false);
  const [customThemeColors, setCustomThemeColors] = useState({
    background: '#40E0D0',
    text: '#000000',
  });

  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    businessProfession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    profilePic: null,
    selectedTheme: 0,
    customTheme: null,
    username: '',
  });

  const [dmButtons, setDmButtons] = useState({
    bookMeeting: { enabled: true, label: 'Book a Meeting', calendarLink: '', icon: '📅', emojiTag: '📅', bgColor: '#ADD8E6', textColor: '#0066cc' },
    letsConnect: { enabled: true, label: 'Let\'s Connect', icon: '💬', emojiTag: '💬', bgColor: '#DDA0DD', textColor: '#8B008B' },
    collabRequest: { enabled: true, label: 'Collab Request', icon: '🤝', emojiTag: '🤝', bgColor: '#AFEEEE', textColor: '#008B8B' },
    supportCause: { enabled: true, label: 'Support a Cause', icon: '❤️', emojiTag: '❤️', bgColor: '#FFB6D9', textColor: '#C71585' },
  });

  const [categoryButtons, setCategory] = useState({
    handles: [{ platform: 'Instagram', handle: '', bgColor: '#FFB6C1', textColor: '#C71585' }],
    email: [{ email: '', bgColor: '#B0E0E6', textColor: '#1E90FF' }],
    contact: [{ phone: '', bgColor: '#B4F8C8', textColor: '#228B22' }],
    website: [{ url: '', bgColor: '#DDA0DD', textColor: '#663399' }],
  });

  const [charityLinks, setCharityLinks] = useState([{ name: '', url: '' }]);
  const [portfolio, setPortfolio] = useState({ enabled: true, url: '', bgColor: '#B0E0E6', textColor: '#1E90FF' });
  const [projects, setProjects] = useState({ enabled: true, list: [{ title: '', url: '' }], bgColor: '#FFDAB9', textColor: '#FF8C00' });
  const [priorityContacts, setPriorityContacts] = useState([{ handle: '@yourfriend' }]);

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

  const patternGridSize = 3;
  const patternDots = Array.from({ length: patternGridSize * patternGridSize }, (_, i) => i);

  useEffect(() => {
    const storedProfileId = localStorage.getItem('linksAndDmProfileId');
    if (storedProfileId) {
      setProfileId(storedProfileId);
      loadUserData(storedProfileId);
    } else {
      const newProfileId = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('linksAndDmProfileId', newProfileId);
      setProfileId(newProfileId);
    }
  }, []);

  useEffect(() => {
    if (!profileId) return;
    loadMessagesFromFirestore();
  }, [profileId]);

  const loadUserData = async (pid) => {
    try {
      const userRef = doc(db, 'profiles', pid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfile(prev => ({ ...prev, ...data.profile }));
        setMasterPattern(data.masterPattern || '');
        setDmButtons(data.dmButtons || dmButtons);
        setCategory(data.categoryButtons || categoryButtons);
        setPortfolio(data.portfolio || portfolio);
        setProjects(data.projects || projects);
        setPriorityContacts(data.priorityContacts || priorityContacts);
        setCustomThemeColors(data.customThemeColors || customThemeColors);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserData = async () => {
    if (!profileId) return;
    try {
      await setDoc(doc(db, 'profiles', profileId), {
        profile,
        masterPattern,
        dmButtons,
        categoryButtons,
        portfolio,
        projects,
        priorityContacts,
        customThemeColors,
        createdAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

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
        timestamp: new Date(newMessage.timestamp),
        starred: newMessage.starred,
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateMessageStarInFirestore = async (messageId, starStatus) => {
    if (!profileId) return;
    try {
      const messageRef = doc(db, 'profiles', profileId, 'messages', messageId);
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
      starred: false
    };
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
      if (category === 'handles') newList.push({ platform: '', handle: '', bgColor: '#FFB6C1', textColor: '#C71585' });
      if (category === 'email') newList.push({ email: '', bgColor: '#B0E0E6', textColor: '#1E90FF' });
      if (category === 'contact') newList.push({ phone: '', bgColor: '#B4F8C8', textColor: '#228B22' });
      if (category === 'website') newList.push({ url: '', bgColor: '#DDA0DD', textColor: '#663399' });
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

  const openMessageForm = (buttonKey) => {
    setCurrentMessageType(dmButtons[buttonKey]);
    setShowMessageForm(true);
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

  const PatternLock = ({ isSetup = false, onUnlock = null, onSetupComplete = null }) => {
    const [localPattern, setLocalPattern] = useState([]);
    const [confirmPattern, setConfirmPattern] = useState(null);
    const [step, setStep] = useState('draw');

    const handleDotClick = (dotIndex) => {
      if (isSetup && confirmPattern !== null) {
        // Confirming pattern
        const newConfirmPattern = [...confirmPattern, dotIndex];
        setConfirmPattern(newConfirmPattern);
        if (newConfirmPattern.length >= 4 && JSON.stringify(newConfirmPattern) === JSON.stringify(localPattern)) {
          setMasterPattern(localPattern.join(','));
          onSetupComplete?.(localPattern.join(','));
        } else if (newConfirmPattern.length === localPattern.length && JSON.stringify(newConfirmPattern) !== JSON.stringify(localPattern)) {
          alert('Patterns do not match. Try again.');
          setConfirmPattern(null);
        }
      } else if (isSetup && confirmPattern === null) {
        // Setting pattern
        const newPattern = [...localPattern, dotIndex];
        setLocalPattern(newPattern);
        if (newPattern.length >= 4) {
          setConfirmPattern([]);
          setStep('confirm');
        }
      } else {
        // Verifying pattern
        const newPattern = [...localPattern, dotIndex];
        setLocalPattern(newPattern);
        if (newPattern.length === masterPattern.split(',').length) {
          if (JSON.stringify(newPattern) === JSON.stringify(masterPattern.split(',').map(Number))) {
            setIsPatternVerified(true);
            onUnlock?.();
          } else {
            alert('Wrong pattern');
            setLocalPattern([]);
          }
        }
      }
    };

    const getPatternLine = () => {
      if (localPattern.length < 2) return null;
      const positions = localPattern.map(i => ({
        x: (i % patternGridSize) * 33.33 + 16.67,
        y: Math.floor(i / patternGridSize) * 33.33 + 16.67,
      }));
      const points = positions.map(p => `${p.x},${p.y}`).join(' ');
      return points;
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
          <h2 className="text-3xl font-bold mb-2 text-purple-600 text-center">🔒 Pattern Lock</h2>
          <p className="text-gray-600 text-center mb-6">
            {isSetup ? (step === 'draw' ? 'Draw a pattern (minimum 4 dots)' : 'Confirm your pattern') : 'Draw your pattern to unlock'}
          </p>

          <div className="mb-6 flex justify-center">
            <svg width="200" height="200" className="bg-gray-100 rounded-lg" style={{ touchAction: 'none' }}>
              {getPatternLine() && (
                <polyline points={getPatternLine()} stroke="#9333ea" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {patternDots.map((dot) => (
                <circle
                  key={dot}
                  cx={(dot % patternGridSize) * 66.67 + 33.33}
                  cy={Math.floor(dot / patternGridSize) * 66.67 + 33.33}
                  r="20"
                  fill={localPattern.includes(dot) ? '#9333ea' : '#e0e7ff'}
                  stroke="#9333ea"
                  strokeWidth="2"
                  onClick={() => handleDotClick(dot)}
                  style={{ cursor: 'pointer' }}
                  className="hover:fill-purple-200 transition"
                />
              ))}
            </svg>
          </div>

          {localPattern.length > 0 && (
            <button
              onClick={() => {
                setLocalPattern([]);
                if (confirmPattern !== null) setConfirmPattern(null);
              }}
              className="w-full bg-red-500 text-white px-6 py-3 rounded-2xl font-bold mb-3 hover:bg-red-600"
            >
              Clear Pattern
            </button>
          )}

          {!isSetup && (
            <button
              onClick={() => setCurrentView('preview')}
              className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-400"
            >
              Back to Preview
            </button>
          )}

          {isSetup && (
            <button
              onClick={() => onSetupComplete?.(null)}
              className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleEditorAccess = () => {
    if (masterPattern === '') {
      alert('Please set a pattern first. Go to Settings.');
      return;
    }
    setCurrentView('editor');
    setIsPatternVerified(false);
    setPatternInput([]);
  };

  const handleInboxAccess = () => {
    if (masterPattern === '') {
      alert('Please set a pattern first. Go to Settings.');
      return;
    }
    setCurrentView('inbox');
    setIsPatternVerified(false);
    setPatternInput([]);
  };

  const generateShareLink = () => {
    if (!profile.username) {
      alert('Please set a username first');
      return;
    }
    const shareUrl = `https://linksanddms.netlify.app/preview/${profileId}/${profile.username}`;
    alert('Share link: ' + shareUrl);
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Outfit:wght@600;700&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 900; } .heading-lg { font-family: 'Poppins', sans-serif; font-weight: 800; } .heading-md { font-family: 'Poppins', sans-serif; font-weight: 700; } .text-lg { font-family: 'Outfit', sans-serif; font-weight: 600; }`}</style>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h1 className="heading-lg text-5xl text-white drop-shadow-2xl" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}>🔗 Links & DM 💬</h1>
            <button
              onClick={handleEditorAccess}
              className="bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-xl hover:shadow-2xl transition transform hover:scale-110 drop-shadow-lg border-4 border-purple-200"
            >
              Get Started Now
            </button>
          </div>

          <div className="text-center mb-20">
            <h1 className="heading-xl text-8xl text-white drop-shadow-2xl mb-2" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.3)', letterSpacing: '-2px', lineHeight: '1' }}>One Link.</h1>
            <h1 className="heading-xl text-8xl text-white drop-shadow-2xl mb-8" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.3)', letterSpacing: '-2px', lineHeight: '1' }}>Sorted DMs.</h1>
            <p className="text-2xl font-bold text-white drop-shadow-lg mb-3" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>The Ultimate Link-in-Bio for Creators 🌟</p>
            <p className="text-xl font-bold text-white drop-shadow-lg" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>Manage all your links, messages & projects in one beautiful place</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {[
              { emoji: '💬', title: 'Smart DM Sorting', desc: 'Organize all messages intelligently', gradient: 'from-pink-500 to-rose-500' },
              { emoji: '🎨', title: '12 Beautiful Themes', desc: 'Choose your perfect vibe', gradient: 'from-purple-500 to-indigo-500' },
              { emoji: '📱', title: 'All Socials in One', desc: 'Connect all your platforms instantly', gradient: 'from-cyan-500 to-blue-500' },
              { emoji: '📧', title: 'Email Hub', desc: 'Never miss important emails', gradient: 'from-blue-500 to-cyan-400' },
              { emoji: '📁', title: 'Portfolio & Projects', desc: 'Showcase your incredible work', gradient: 'from-orange-500 to-yellow-500' },
              { emoji: '📞', title: 'Contact Central', desc: 'Phone, web, everything connected', gradient: 'from-green-500 to-emerald-500' }
            ].map((feature, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${feature.gradient} rounded-3xl p-6 hover:shadow-2xl transition transform hover:scale-105 drop-shadow-xl border-4 border-white/30 cursor-pointer`}>
                <div className="text-6xl mb-3 drop-shadow-lg">{feature.emoji}</div>
                <h3 className="heading-md text-2xl mb-2 text-white drop-shadow-lg" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>{feature.title}</h3>
                <p className="text-base font-bold text-white drop-shadow-md" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/95 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl border-4 border-purple-300 mb-12">
            <h2 className="heading-md text-3xl text-purple-600 mb-6 text-center">Trusted by Influencers, Celebrities & Brands 💎</h2>
            <p className="text-center text-gray-700 font-bold">Join thousands of creators managing their links and DMs like pros</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'preview') {
    return (
      <div className={`min-h-screen p-8`} style={{ background: profile.customTheme ? profile.customTheme.background : themes[profile.selectedTheme].gradient }}>
        <div className="max-w-2xl mx-auto">
          {/* Navigation */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentView('landing')}
              className="bg-white/80 text-purple-600 px-6 py-3 rounded-full font-bold hover:shadow-lg"
            >
              ← Back
            </button>
            <button
              onClick={handleEditorAccess}
              className="bg-white/80 text-purple-600 px-6 py-3 rounded-full font-bold hover:shadow-lg"
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white/90 rounded-3xl p-8 shadow-2xl mb-8 border-4 border-white/50 text-center">
            {profile.profilePic && <img src={profile.profilePic} alt="Profile" className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-purple-300" />}
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{profile.name}</h1>
            <p className="text-xl font-bold text-purple-600 mb-4">{profile.businessProfession}</p>
            <p className="text-gray-700 font-bold text-lg">{profile.bio}</p>
          </div>

          {/* DM Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {Object.entries(dmButtons).map(([key, btn]) => btn.enabled && (
              <button
                key={key}
                onClick={() => openMessageForm(key)}
                className="rounded-2xl p-4 font-bold text-white transition transform hover:scale-105 drop-shadow-lg"
                style={{ backgroundColor: btn.bgColor, color: btn.textColor }}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          {/* Handles */}
          <div className="bg-white/90 rounded-2xl p-6 mb-6 shadow-lg border-2 border-white/50">
            <h3 className="font-bold text-lg mb-4 text-gray-800">📱 Connect</h3>
            <div className="grid grid-cols-2 gap-3">
              {categoryButtons.handles.map((h, idx) => h.handle && (
                <a
                  key={idx}
                  href={getSocialMediaUrl(h.platform, h.handle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-3 font-bold text-center transition transform hover:scale-105"
                  style={{ backgroundColor: h.bgColor, color: h.textColor }}
                >
                  {h.platform}
                </a>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-8">
            {portfolio.enabled && portfolio.url && (
              <a
                href={formatUrl(portfolio.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-4 font-bold text-center transition transform hover:scale-105 drop-shadow-lg text-white"
                style={{ backgroundColor: portfolio.bgColor, color: portfolio.textColor }}
              >
                🎨 Portfolio
              </a>
            )}
            {projects.enabled && projects.list.some(p => p.url) && (
              <a
                href={projects.list.find(p => p.url)?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-4 font-bold text-center transition transform hover:scale-105 drop-shadow-lg text-white"
                style={{ backgroundColor: projects.bgColor, color: projects.textColor }}
              >
                📁 Latest Projects
              </a>
            )}
          </div>

          {/* Inbox and Editor Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleInboxAccess}
              className="bg-white/90 text-purple-600 px-6 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105 border-2 border-purple-300"
            >
              📬 My Inbox
            </button>
            <button
              onClick={generateShareLink}
              className="bg-white/90 text-purple-600 px-6 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105 border-2 border-purple-300"
            >
              🔗 Share Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'inbox') {
    if (!isPatternVerified) {
      return <PatternLock onUnlock={() => setIsPatternVerified(true)} />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">📬 My Inbox</h1>
            <button
              onClick={() => setCurrentView('preview')}
              className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:shadow-lg"
            >
              ← Back
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white/90 rounded-2xl p-4 mb-8 shadow-lg">
            <div className="flex flex-wrap gap-2">
              {['all', 'priority', 'meeting', 'collab', 'connect', 'fans'].map((f) => (
                <button
                  key={f}
                  onClick={() => setInboxFilter(f)}
                  className={`px-4 py-2 rounded-full font-bold transition ${
                    inboxFilter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {loadingMessages ? (
              <p className="text-center text-white font-bold text-lg">Loading messages...</p>
            ) : sortedMessages.length === 0 ? (
              <div className="bg-white/90 rounded-2xl p-8 text-center shadow-lg">
                <p className="text-2xl font-bold text-gray-800">📭 No messages yet</p>
              </div>
            ) : (
              sortedMessages.map((msg, idx) => (
                <div key={idx} className="bg-white/90 rounded-2xl p-6 shadow-lg border-l-4 border-purple-600">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{msg.name} {msg.senderTag}</h3>
                      <p className="text-sm text-gray-600">{msg.contact}</p>
                    </div>
                    <button
                      onClick={() => toggleStar(idx)}
                      className="text-2xl cursor-pointer transition transform hover:scale-125"
                    >
                      {msg.starred ? '⭐' : '☆'}
                    </button>
                  </div>
                  <p className="text-gray-700 font-bold mb-2">{msg.message}</p>
                  <p className="text-xs text-gray-500">{msg.messageType} • {new Date(msg.timestamp).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'editor') {
    if (!isPatternVerified) {
      return <PatternLock onUnlock={() => setIsPatternVerified(true)} />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">✏️ Editor</h1>
            <button
              onClick={() => { saveUserData(); setCurrentView('preview'); }}
              className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:shadow-lg"
            >
              ✓ Save & Back
            </button>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setCurrentView('settings')}
            className="w-full bg-yellow-400 text-gray-800 px-6 py-4 rounded-2xl font-bold text-lg hover:shadow-lg mb-8 border-2 border-yellow-600"
          >
            ⚙️ Security Settings (Pattern Lock)
          </button>

          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-white/90 rounded-3xl p-8 shadow-xl border-4 border-purple-300">
              <h2 className="text-3xl font-bold text-purple-600 mb-6">👤 Your Profile</h2>

              <div className="mb-6">
                <label className="block font-bold text-lg mb-2 text-gray-800">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full bg-gray-100 border-2 border-purple-300 rounded-xl p-3 font-bold"
                />
              </div>

              <div className="mb-6">
                <label className="block font-bold text-lg mb-2 text-gray-800">Profession</label>
                <input
                  type="text"
                  value={profile.businessProfession}
                  onChange={(e) => handleProfileChange('businessProfession', e.target.value)}
                  className="w-full bg-gray-100 border-2 border-purple-300 rounded-xl p-3 font-bold"
                />
              </div>

              <div className="mb-6">
                <label className="block font-bold text-lg mb-2 text-gray-800">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  className="w-full bg-gray-100 border-2 border-purple-300 rounded-xl p-3 font-bold h-24"
                />
              </div>

              <div className="mb-6">
                <label className="block font-bold text-lg mb-2 text-gray-800">Username (for sharing)</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => handleProfileChange('username', e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-gray-100 border-2 border-purple-300 rounded-xl p-3 font-bold"
                />
              </div>

              <div className="mb-6">
                <label className="block font-bold text-lg mb-2 text-gray-800">Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="w-full"
                />
                {profile.profilePic && <img src={profile.profilePic} alt="Profile" className="w-24 h-24 rounded-lg mt-4 border-2 border-purple-300" />}
              </div>
            </div>

            {/* DM Buttons */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>💬 Smart DM Buttons</h2>
              {Object.entries(dmButtons).map(([key, btn]) => (
                <div key={key} className="bg-white/95 rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="checkbox"
                      checked={btn.enabled}
                      onChange={(e) => setDmButtons(prev => ({ ...prev, [key]: { ...btn, enabled: e.target.checked } }))}
                      className="w-6 h-6 cursor-pointer"
                    />
                    <span className="font-bold text-lg text-gray-800 flex-1">{btn.label}</span>
                  </div>
                  {btn.enabled && (
                    <>
                      <input
                        type="text"
                        value={btn.label}
                        onChange={(e) => setDmButtons(prev => ({ ...prev, [key]: { ...btn, label: e.target.value } }))}
                        className="w-full bg-gray-100 border-2 border-purple-300 rounded-lg p-2 font-bold mb-3"
                        placeholder="Button Label"
                      />
                      {key === 'bookMeeting' && (
                        <input
                          type="url"
                          value={btn.calendarLink}
                          onChange={(e) => setDmButtons(prev => ({ ...prev, [key]: { ...btn, calendarLink: e.target.value } }))}
                          className="w-full bg-gray-100 border-2 border-purple-300 rounded-lg p-2 font-bold mb-3"
                          placeholder="Calendar Link (Calendly, Zoom, etc)"
                        />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block font-bold text-sm mb-2 text-gray-800">Background</label>
                          <button
                            onClick={() => setShowColorModal(key)}
                            className="w-full h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                            style={{ backgroundColor: btn.bgColor }}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block font-bold text-sm mb-2 text-gray-800">Text</label>
                          <button
                            onClick={() => setShowColorModal(`${key}-text`)}
                            className="w-full h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                            style={{ backgroundColor: btn.textColor }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Handles */}
            <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>📱 Social Media Handles</h2>
              <div className="space-y-3 mb-4">
                {categoryButtons.handles.map((h, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={h.platform}
                      onChange={(e) => handleCategoryChange('handles', idx, 'platform', e.target.value)}
                      placeholder="Platform"
                      className="w-32 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={h.handle}
                      onChange={(e) => handleCategoryChange('handles', idx, 'handle', e.target.value)}
                      placeholder="@handle"
                      className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs"
                    />
                    {categoryButtons.handles.length > 1 && (
                      <button
                        onClick={() => handleCategoryRemove('handles', idx)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {categoryButtons.handles.length < 8 && (
                <button
                  onClick={() => handleCategoryAdd('handles')}
                  className="w-full bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg"
                >
                  + Add Handle
                </button>
              )}
            </div>

            {/* Email Addresses */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>📧 Email Addresses</h2>
              <div className="space-y-2 mb-4">
                {categoryButtons.email.map((e, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="email"
                      value={e.email}
                      onChange={(ev) => handleCategoryChange('email', idx, 'email', ev.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs"
                    />
                    {categoryButtons.email.length > 1 && (
                      <button
                        onClick={() => handleCategoryRemove('email', idx)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {categoryButtons.email.length < 5 && (
                <button
                  onClick={() => handleCategoryAdd('email')}
                  className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg"
                >
                  + Add Email
                </button>
              )}
            </div>

            {/* Contact Numbers */}
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>📱 Contact Numbers</h2>
              <div className="space-y-2 mb-4">
                {categoryButtons.contact.map((c, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="tel"
                      value={c.phone}
                      onChange={(e) => handleCategoryChange('contact', idx, 'phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs"
                    />
                    {categoryButtons.contact.length > 1 && (
                      <button
                        onClick={() => handleCategoryRemove('contact', idx)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {categoryButtons.contact.length < 5 && (
                <button
                  onClick={() => handleCategoryAdd('contact')}
                  className="w-full bg-white text-green-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg"
                >
                  + Add Number
                </button>
              )}
            </div>

            {/* Websites */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>🌍 Website / Store</h2>
              <div className="space-y-2 mb-4">
                {categoryButtons.website.map((w, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="url"
                      value={w.url}
                      onChange={(e) => handleCategoryChange('website', idx, 'url', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs"
                    />
                    {categoryButtons.website.length > 1 && (
                      <button
                        onClick={() => handleCategoryRemove('website', idx)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {categoryButtons.website.length < 5 && (
                <button
                  onClick={() => handleCategoryAdd('website')}
                  className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg"
                >
                  + Add Website
                </button>
              )}
            </div>

            {/* Portfolio */}
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>🎨 Portfolio</h2>
              <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 mb-4">
                <input
                  type="checkbox"
                  checked={portfolio.enabled}
                  onChange={(e) => setPortfolio(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-7 h-7 cursor-pointer"
                />
                <label className="font-bold text-lg flex-1 text-gray-800">Enable Portfolio</label>
              </div>
              {portfolio.enabled && (
                <input
                  type="url"
                  value={portfolio.url}
                  onChange={(e) => setPortfolio(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://yourportfolio.com"
                  className="w-full bg-white/95 border-0 rounded-xl p-3 font-bold text-sm"
                />
              )}
            </div>

            {/* Projects */}
            <div className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>📁 Latest Projects</h2>
              <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 mb-4">
                <input
                  type="checkbox"
                  checked={projects.enabled}
                  onChange={(e) => setProjects(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-7 h-7 cursor-pointer"
                />
                <label className="font-bold text-lg flex-1 text-gray-800">Enable Projects</label>
              </div>
              {projects.enabled && (
                <>
                  <div className="space-y-2 mb-4">
                    {projects.list.map((proj, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const newList = [...projects.list];
                            newList[idx].title = e.target.value;
                            setProjects(prev => ({ ...prev, list: newList }));
                          }}
                          placeholder="Title"
                          className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs"
                        />
                        <input
                          type="url"
                          value={proj.url}
                          onChange={(e) => {
                            const newList = [...projects.list];
                            newList[idx].url = e.target.value;
                            setProjects(prev => ({ ...prev, list: newList }));
                          }}
                          placeholder="https://..."
                          className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs"
                        />
                        {projects.list.length > 1 && (
                          <button
                            onClick={() => {
                              const newList = projects.list.filter((_, i) => i !== idx);
                              setProjects(prev => ({ ...prev, list: newList }));
                            }}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {projects.list.length < 5 && (
                    <button
                      onClick={() => {
                        setProjects(prev => ({ ...prev, list: [...prev.list, { title: '', url: '' }] }));
                      }}
                      className="w-full bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg"
                    >
                      + Add Project
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Themes */}
            <div className="bg-white rounded-3xl border-4 border-purple-500 p-8 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-purple-600">🎨 Choose Theme</h2>
                <button
                  onClick={() => setShowThemeColorModal(true)}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800 px-6 py-3 rounded-full font-bold hover:shadow-lg"
                >
                  🎨 Colors
                </button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                {themes.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleProfileChange('selectedTheme', idx)}
                    className={`h-24 rounded-2xl transition-all cursor-pointer font-bold text-white text-xs drop-shadow-lg ${
                      profile.selectedTheme === idx ? 'ring-4 ring-purple-600 ring-offset-2 scale-110' : 'ring-2 ring-gray-300 hover:scale-105'
                    }`}
                    style={{ background: t.gradient, textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}
                    title={t.name}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Contacts */}
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 shadow-xl border-4 border-white/20">
              <h2 className="text-3xl font-bold text-white mb-3" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>⭐ Friends & Family</h2>
              <p className="text-white font-bold text-sm mb-4">These will be starred as ⭐ in your inbox</p>
              <div className="space-y-2 mb-4">
                {priorityContacts.map((contact, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={contact.handle}
                      onChange={(e) => {
                        const newList = [...priorityContacts];
                        newList[idx].handle = e.target.value;
                        setPriorityContacts(newList);
                      }}
                      placeholder="@handle or email"
                      className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs"
                    />
                    {priorityContacts.length > 1 && (
                      <button
                        onClick={() => setPriorityContacts(priorityContacts.filter((_, i) => i !== idx))}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {priorityContacts.length < 20 && (
                <button
                  onClick={() => setPriorityContacts([...priorityContacts, { handle: '' }])}
                  className="w-full bg-white text-yellow-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg"
                >
                  + Add Contact
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Color Modal */}
        {showColorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-center text-purple-600">🎨 Pick Color</h2>
              <input
                type="color"
                onChange={(e) => {
                  if (showColorModal.includes('-text')) {
                    const key = showColorModal.replace('-text', '');
                    setDmButtons(prev => ({ ...prev, [key]: { ...prev[key], textColor: e.target.value } }));
                  } else {
                    setDmButtons(prev => ({ ...prev, [showColorModal]: { ...prev[showColorModal], bgColor: e.target.value } }));
                  }
                }}
                className="w-full h-32 cursor-pointer mb-4"
              />
              <button
                onClick={() => setShowColorModal(null)}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Theme Color Modal */}
        {showThemeColorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-center text-purple-600">🎨 Custom Theme</h2>
              <div className="mb-6">
                <label className="block font-bold text-gray-800 mb-2">Background Color</label>
                <input
                  type="color"
                  value={customThemeColors.background}
                  onChange={(e) => setCustomThemeColors(prev => ({ ...prev, background: e.target.value }))}
                  className="w-full h-12 cursor-pointer"
                />
              </div>
              <div className="mb-6">
                <label className="block font-bold text-gray-800 mb-2">Text Color</label>
                <input
                  type="color"
                  value={customThemeColors.text}
                  onChange={(e) => setCustomThemeColors(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full h-12 cursor-pointer"
                />
              </div>
              <button
                onClick={() => {
                  handleProfileChange('customTheme', customThemeColors);
                  setShowThemeColorModal(false);
                }}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 mb-3"
              >
                Apply Theme
              </button>
              <button
                onClick={() => setShowThemeColorModal(false)}
                className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">⚙️ Security Settings</h1>
            <button
              onClick={() => setCurrentView('editor')}
              className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:shadow-lg"
            >
              ← Back
            </button>
          </div>

          <div className="bg-white/90 rounded-3xl p-8 shadow-xl border-4 border-purple-300">
            <h2 className="text-2xl font-bold text-purple-600 mb-6 text-center">🔒 Pattern Lock Setup</h2>

            {masterPattern === '' ? (
              <div className="text-center">
                <p className="text-gray-800 font-bold mb-6 text-lg">Set up your pattern lock to secure your editor and inbox</p>
                <button
                  onClick={() => {
                    const newPattern = '';
                    setCurrentView('patternSetup');
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transform hover:scale-105"
                >
                  🔐 Set Pattern Lock
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-green-600 font-bold mb-6 text-lg">✓ Pattern Lock is active</p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset your pattern lock?')) {
                      setMasterPattern('');
                      alert('Pattern reset. Set a new one to continue.');
                    }
                  }}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl"
                >
                  🔓 Reset Pattern Lock
                </button>
                <button
                  onClick={() => setShowForgotPattern(true)}
                  className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold mt-4 hover:bg-gray-400"
                >
                  Forgot Pattern?
                </button>
              </div>
            )}
          </div>

          {showForgotPattern && (
            <div className="mt-8 bg-white/90 rounded-3xl p-8 shadow-xl border-4 border-purple-300">
              <h2 className="text-2xl font-bold text-purple-600 mb-4">Forgot Pattern?</h2>
              <p className="text-gray-800 font-bold mb-4">This feature is for account recovery. Enter a recovery email:</p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="recovery@email.com"
                className="w-full bg-gray-100 border-2 border-purple-300 rounded-lg p-3 font-bold mb-4"
              />
              <button
                onClick={() => {
                  alert('Recovery email saved. Check your email for recovery instructions.');
                  setShowForgotPattern(false);
                  setForgotEmail('');
                }}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 mb-3"
              >
                Send Recovery Link
              </button>
              <button
                onClick={() => setShowForgotPattern(false)}
                className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'patternSetup') {
    return (
      <PatternLock
        isSetup={true}
        onSetupComplete={(pattern) => {
          saveUserData();
          setCurrentView('settings');
        }}
      />
    );
  }

  return null;
};

export default LinksAndDM;
