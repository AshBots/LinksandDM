import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, getDoc, setDoc, where } from 'firebase/firestore';

const LinksAndDM = () => {
  // ============ MAIN STATE ============
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

  // ============ PATTERN LOCK STATES ============
  const [masterPattern, setMasterPattern] = useState([]);
  const [patternInput, setPatternInput] = useState([]);
  const [isPatternVerified, setIsPatternVerified] = useState(false);
  const [showPatternSetup, setShowPatternSetup] = useState(false);
  const [patternSetupStep, setPatternSetupStep] = useState('first');
  const [firstPattern, setFirstPattern] = useState([]);
  const [confirmPattern, setConfirmPattern] = useState([]);
  const [patternError, setPatternError] = useState('');
  const [showAccountRecovery, setShowAccountRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // ============ PROFILE STATE ============
  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    businessProfession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    profilePic: null,
    selectedTheme: 0,
    username: '',
    email: '',
    previewLink: '',
  });

  // ============ CUSTOMIZATION STATE ============
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
    bookMeeting: { enabled: true, label: 'Book a Meeting', calendarLink: '', icon: '📅' },
    letsConnect: { enabled: true, label: 'Let\'s Connect', icon: '💬' },
    collabRequest: { enabled: true, label: 'Collab Request', icon: '🤝' },
    supportCause: { enabled: true, label: 'Support a Cause', icon: '❤️' },
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

  // ============ THEMES ============
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

  const patternDots = Array.from({ length: 9 }, (_, i) => i);

  // ============ LOAD PROFILE ON MOUNT ============
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/user/')) {
      const username = path.split('/user/')[1].split('/')[0];
      setIsPublicPreview(true);
      loadProfileByUsername(username);
    } else {
      setIsPublicPreview(false);
      const storedProfileId = localStorage.getItem('linksAndDmProfileId');
      if (storedProfileId) {
        setProfileId(storedProfileId);
        loadProfileFromFirebase(storedProfileId);
      } else {
        const newProfileId = 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('linksAndDmProfileId', newProfileId);
        setProfileId(newProfileId);
      }
    }
  }, []);

  // ============ FIREBASE FUNCTIONS ============
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
          email: data.email || '',
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
      console.error('Error loading profile by username:', error);
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
          email: data.email || '',
          previewLink: data.previewLink || '',
        }));
        setDmButtons(data.dmButtons || dmButtons);
        setCategory(data.categoryButtons || categoryButtons);
        setCharityLinks(data.charityLinks || charityLinks);
        setPortfolio(data.portfolio || portfolio);
        setProjects(data.projects || projects);
        setPriorityContacts(data.priorityContacts || priorityContacts);
        setButtonColors(data.buttonColors || buttonColors);
        if (data.masterPattern) setMasterPattern(data.masterPattern);
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
        email: profile.email,
        previewLink: profile.previewLink,
        dmButtons: dmButtons,
        categoryButtons: categoryButtons,
        charityLinks: charityLinks,
        portfolio: portfolio,
        projects: projects,
        priorityContacts: priorityContacts,
        buttonColors: buttonColors,
        masterPattern: masterPattern,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // ============ PATTERN FUNCTIONS ============
  const handlePatternDotClick = (dotIndex, isSetup = false) => {
    const currentPattern = isSetup ? (patternSetupStep === 'first' ? firstPattern : confirmPattern) : patternInput;
    const setCurrentPattern = isSetup ? (patternSetupStep === 'first' ? setFirstPattern : setConfirmPattern) : setPatternInput;
    if (currentPattern.includes(dotIndex)) {
      setCurrentPattern(currentPattern.filter(d => d !== dotIndex));
    } else {
      setCurrentPattern([...currentPattern, dotIndex]);
    }
  };

  const handleCreatePattern = () => {
    setPatternError('');
    if (firstPattern.length < 4) {
      setPatternError('Pattern must have at least 4 dots');
      return;
    }
    if (patternSetupStep === 'first') {
      setPatternSetupStep('confirm');
    } else {
      if (JSON.stringify(firstPattern) !== JSON.stringify(confirmPattern)) {
        setPatternError('Patterns do not match. Try again.');
        setFirstPattern([]);
        setConfirmPattern([]);
        setPatternSetupStep('first');
        return;
      }
      setMasterPattern(firstPattern);
      localStorage.setItem('linksAndDmMasterPattern', JSON.stringify(firstPattern));
      const profileRef = doc(db, 'profiles', profileId);
      setDoc(profileRef, { masterPattern: firstPattern }, { merge: true });
      setFirstPattern([]);
      setConfirmPattern([]);
      setPatternSetupStep('first');
      setShowPatternSetup(false);
      setPatternError('');
      setCurrentView('editor');
    }
  };

  const verifyPattern = () => {
    setPatternError('');
    if (JSON.stringify(patternInput) === JSON.stringify(masterPattern) && masterPattern.length > 0) {
      setIsPatternVerified(true);
      setPatternInput([]);
    } else {
      setPatternError('❌ Incorrect Pattern');
      setPatternInput([]);
    }
  };

  const handleForgotPattern = () => {
    setShowAccountRecovery(true);
    setShowPatternSetup(false);
  };

  const handleAccountRecovery = async () => {
    if (!recoveryEmail) {
      alert('Please enter your email');
      return;
    }
    try {
      const profileRef = doc(db, 'profiles', profileId);
      await setDoc(profileRef, { email: recoveryEmail }, { merge: true });
      alert('Recovery email saved! Reset your pattern by contacting support.');
      setMasterPattern([]);
      localStorage.removeItem('linksAndDmMasterPattern');
      setShowAccountRecovery(false);
      setRecoveryEmail('');
      setIsPatternVerified(true);
    } catch (error) {
      console.error('Error saving recovery email:', error);
    }
  };

  const handleLogout = () => {
    setIsPatternVerified(false);
    setPatternInput([]);
    setCurrentView('landing');
  };

  // ============ LINK GENERATION ============
  const generatePreviewLink = async () => {
    if (!profile.username) {
      alert('Please set a username first');
      return;
    }
    const link = `https://linksanddms.netlify.app/user/${profile.username}`;
    const profileRef = doc(db, 'profiles', profileId);
    await setDoc(profileRef, { previewLink: link }, { merge: true });
    setProfile(prev => ({ ...prev, previewLink: link }));
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // ============ PATTERN SETUP MODAL ============
  const PatternSetupModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
        <h2 className="text-2xl font-bold mb-4 text-purple-600">
          {patternSetupStep === 'first' ? '🔐 Create Your Pattern' : '✅ Confirm Your Pattern'}
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          {patternSetupStep === 'first' ? 'Connect 4+ dots' : 'Draw the same pattern again'}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-6 rounded-2xl">
          {patternDots.map(dot => {
            const pattern = patternSetupStep === 'first' ? firstPattern : confirmPattern;
            const isSelected = pattern.includes(dot);
            return (
              <button
                key={dot}
                onClick={() => handlePatternDotClick(dot, true)}
                className={`w-16 h-16 rounded-full transition transform ${
                  isSelected ? 'bg-purple-600 scale-110 shadow-lg' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
        </div>
        {patternError && <p className="text-center text-red-600 text-sm mb-4">{patternError}</p>}
        <button
          onClick={handleCreatePattern}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition mb-3"
        >
          {patternSetupStep === 'first' ? 'Next' : 'Confirm Pattern'}
        </button>
        <button
          onClick={() => {
            setShowPatternSetup(false);
            setFirstPattern([]);
            setConfirmPattern([]);
            setPatternSetupStep('first');
            setPatternError('');
          }}
          className="w-full text-purple-600 font-bold hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ============ PATTERN LOCK SCREEN ============
  const PatternLockScreen = ({ targetView }) => (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-300 to-purple-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
        <h1 className="text-3xl font-bold text-center mb-2 text-purple-600">🔐 {targetView}</h1>
        <p className="text-center text-gray-600 text-sm mb-8">Draw your pattern</p>
        <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl">
          {patternDots.map(dot => {
            const isSelected = patternInput.includes(dot);
            return (
              <button
                key={dot}
                onClick={() => handlePatternDotClick(dot, false)}
                className={`w-16 h-16 rounded-full transition transform ${
                  isSelected ? 'bg-purple-600 scale-110 shadow-lg' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
        </div>
        {patternError && <p className="text-center text-red-600 text-sm mb-4">{patternError}</p>}
        <button
          onClick={verifyPattern}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition mb-3"
        >
          Unlock
        </button>
        <button
          onClick={handleForgotPattern}
          className="w-full text-purple-600 font-bold hover:underline text-sm"
        >
          Forgot Pattern?
        </button>
      </div>
    </div>
  );

  // ============ ACCOUNT RECOVERY MODAL ============
  const AccountRecoveryModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
        <h2 className="text-2xl font-bold mb-4 text-purple-600">💭 Account Recovery</h2>
        <p className="text-gray-600 text-sm mb-6">Enter your email to recover</p>
        <input
          type="email"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full border-2 border-purple-300 rounded-xl p-3 mb-4 focus:outline-none focus:border-purple-600"
        />
        <button
          onClick={handleAccountRecovery}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition mb-3"
        >
          Send Recovery Link
        </button>
        <button
          onClick={() => setShowAccountRecovery(false)}
          className="w-full text-purple-600 font-bold hover:underline"
        >
          Back
        </button>
      </div>
    </div>
  );

  // ============ LANDING PAGE ============
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-300 to-blue-400 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white drop-shadow-lg mb-4">🔗 Links & DM</h1>
          <p className="text-2xl text-white drop-shadow-md">Your Link in Bio + DM Sorter</p>
        </div>
        <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-200">
          <button
            onClick={() => {
              if (masterPattern.length > 0) {
                setCurrentView('editor');
              } else {
                setShowPatternSetup(true);
              }
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-bold text-xl hover:shadow-xl transition transform hover:scale-105 mb-4"
          >
            ✨ Get Started
          </button>
          <button
            onClick={() => setCurrentView('preview')}
            className="w-full bg-gray-200 text-gray-800 py-4 rounded-2xl font-bold text-lg hover:bg-gray-300 transition"
          >
            👀 View Preview
          </button>
        </div>
        {showPatternSetup && <PatternSetupModal />}
      </div>
    );
  }

  // ============ EDITOR PAGE ============
  if (currentView === 'editor') {
    if (!isPatternVerified) return <PatternLockScreen targetView="Editor" />;
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-200 to-purple-200 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-purple-600">✏️ Editor</h1>
            <div className="space-x-3">
              <button
                onClick={() => generatePreviewLink()}
                className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-600 transition"
              >
                🔗 Generate Link
              </button>
              <button
                onClick={() => setCurrentView('inbox')}
                className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition"
              >
                📬 Inbox
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-600 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 mb-8 drop-shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-purple-600">👤 Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border-2 border-purple-300 rounded-xl p-3 focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  placeholder="yourname"
                  className="w-full border-2 border-purple-300 rounded-xl p-3 focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full border-2 border-purple-300 rounded-xl p-3 focus:outline-none focus:border-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Profession</label>
                <input
                  type="text"
                  value={profile.businessProfession}
                  onChange={(e) => setProfile({ ...profile, businessProfession: e.target.value })}
                  className="w-full border-2 border-purple-300 rounded-xl p-3 focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full border-2 border-purple-300 rounded-xl p-3 focus:outline-none focus:border-purple-600"
                rows="4"
              />
            </div>
            {profile.previewLink && (
              <div className="mt-6 p-4 bg-green-100 rounded-xl border-2 border-green-300">
                <p className="text-sm text-gray-700">Your Preview Link:</p>
                <p className="text-lg font-bold text-green-700 break-all">{profile.previewLink}</p>
              </div>
            )}
            <button
              onClick={saveProfileToFirebase}
              className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition"
            >
              💾 Save Profile
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 mb-8 drop-shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-purple-600">🎨 Themes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themes.map((theme, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setProfile({ ...profile, selectedTheme: idx });
                    saveProfileToFirebase();
                  }}
                  className={`p-4 rounded-xl border-4 transition transform hover:scale-105 ${
                    profile.selectedTheme === idx ? 'border-purple-600' : 'border-gray-300'
                  }`}
                  style={{ backgroundImage: theme.gradient }}
                >
                  <p className="text-white font-bold text-sm drop-shadow">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 drop-shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-purple-600">🎯 Customize Buttons</h2>
            <div className="space-y-6">
              {Object.entries(dmButtons).map(([key, button]) => (
                <div key={key} className="border-2 border-gray-300 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-lg">{button.label}</p>
                      <p className="text-sm text-gray-600">{button.icon}</p>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={button.enabled}
                        onChange={(e) => setDmButtons({
                          ...dmButtons,
                          [key]: { ...button, enabled: e.target.checked }
                        })}
                        className="w-5 h-5 mr-2"
                      />
                      <span>Enabled</span>
                    </label>
                  </div>
                  {button.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-2">Background</label>
                        <input
                          type="color"
                          value={buttonColors[key].bg}
                          onChange={(e) => setButtonColors({
                            ...buttonColors,
                            [key]: { ...buttonColors[key], bg: e.target.value }
                          })}
                          className="w-full h-10 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-2">Text</label>
                        <input
                          type="color"
                          value={buttonColors[key].text}
                          onChange={(e) => setButtonColors({
                            ...buttonColors,
                            [key]: { ...buttonColors[key], text: e.target.value }
                          })}
                          className="w-full h-10 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={saveProfileToFirebase}
              className="mt-6 w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition"
            >
              💾 Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ PREVIEW PAGE ============
  if (currentView === 'preview' || isPublicPreview) {
    return (
      <div style={{ backgroundImage: themes[profile.selectedTheme].gradient }} className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          {!isPublicPreview && (
            <button
              onClick={() => setCurrentView('landing')}
              className="mb-6 bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl transition"
            >
              ← Back
            </button>
          )}
          <div className="bg-white rounded-3xl p-8 drop-shadow-2xl border-4 border-purple-200 mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{profile.name}</h1>
            <p className="text-xl text-purple-600 font-bold mb-4">{profile.businessProfession}</p>
            <p className="text-gray-700 mb-8">{profile.bio}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dmButtons).map(([key, button]) => button.enabled && (
                <button
                  key={key}
                  style={{
                    backgroundColor: buttonColors[key].bg,
                    color: buttonColors[key].text,
                  }}
                  className="py-4 rounded-2xl font-bold text-lg transition transform hover:scale-105 border-3 border-white"
                >
                  {button.icon} {button.label}
                </button>
              ))}
            </div>
            {categoryButtons.handles[0].handle && (
              <button className="mt-6 w-full bg-pink-200 text-pink-700 py-3 rounded-2xl font-bold border-3 border-white">
                📱 @{categoryButtons.handles[0].handle}
              </button>
            )}
            {categoryButtons.email[0].email && (
              <button className="mt-3 w-full bg-blue-200 text-blue-700 py-3 rounded-2xl font-bold border-3 border-white">
                ✉️ {categoryButtons.email[0].email}
              </button>
            )}
            {profile.previewLink && (
              <p className="text-center text-sm text-gray-600 mt-8">Links & DM • Share this link to get messages</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============ INBOX PAGE ============
  if (currentView === 'inbox') {
    if (!isPatternVerified) return <PatternLockScreen targetView="Inbox" />;
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setCurrentView('editor')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition">← Back</button>
            <h1 className="text-4xl text-white drop-shadow-lg font-bold">📬 Messages</h1>
          </div>
          <div className="bg-white rounded-3xl p-8 drop-shadow-2xl">
            <p className="text-xl font-bold text-gray-600">Messages will appear here!</p>
          </div>
        </div>
      </div>
    );
  }

  // ============ SHARE MODAL ============
  if (showShareModal && !isPublicPreview) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
          <h2 className="text-2xl font-bold mb-4 text-purple-600">🔗 Your Preview Link</h2>
          <p className="text-gray-600 mb-6">Share on Instagram, TikTok, etc:</p>
          <div className="bg-gray-100 rounded-xl p-4 mb-6 break-all">
            <p className="font-mono text-sm text-gray-800">{shareLink}</p>
          </div>
          <button
            onClick={copyToClipboard}
            className={`w-full py-3 rounded-xl font-bold text-lg transition ${
              copySuccess ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
          </button>
          <button
            onClick={() => setShowShareModal(false)}
            className="w-full mt-3 text-purple-600 font-bold hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (showAccountRecovery) return <AccountRecoveryModal />;

  return null;
};

export default LinksAndDM;
