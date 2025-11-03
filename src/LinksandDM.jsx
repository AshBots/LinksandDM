import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, getDoc, setDoc, where } from 'firebase/firestore';

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
  
  // IMPROVED PIN STATES - Simple and Clean
  const [masterPin, setMasterPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupStep, setPinSetupStep] = useState('first'); // 'first' or 'confirm'
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    businessProfession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    profilePic: null,
    selectedTheme: 0,
    username: '',
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
  ];

  // ============ INITIALIZE PROFILE & LOAD FROM FIREBASE ============
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

  // ============ FIREBASE OPERATIONS ============
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
        }));
        setDmButtons(data.dmButtons || dmButtons);
        setCategory(data.categoryButtons || categoryButtons);
        setCharityLinks(data.charityLinks || charityLinks);
        setPortfolio(data.portfolio || portfolio);
        setProjects(data.projects || projects);
        setPriorityContacts(data.priorityContacts || priorityContacts);
        setButtonColors(data.buttonColors || buttonColors);
        if (data.masterPin) setMasterPin(data.masterPin);
      }
      setLoadingProfile(false);
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoadingProfile(false);
    }
  };

  // ============ SIMPLE PIN SETUP FUNCTIONS ============
  const handleCreatePin = () => {
    setPinError('');
    
    if (!firstPin.trim()) {
      setPinError('PIN cannot be empty');
      return;
    }
    
    if (firstPin.length < 4 || firstPin.length > 6) {
      setPinError('PIN must be 4-6 digits');
      return;
    }
    
    if (pinSetupStep === 'first') {
      setPinSetupStep('confirm');
    } else {
      if (firstPin !== confirmPin) {
        setPinError('PINs do not match. Try again.');
        setFirstPin('');
        setConfirmPin('');
        setPinSetupStep('first');
        return;
      }
      
      // Save PIN to Firebase and localStorage
      setMasterPin(firstPin);
      localStorage.setItem('linksAndDmMasterPin', firstPin);
      
      const profileRef = doc(db, 'profiles', profileId);
      setDoc(profileRef, { masterPin: firstPin }, { merge: true });
      
      setFirstPin('');
      setConfirmPin('');
      setPinSetupStep('first');
      setShowPinSetup(false);
      setPinError('');
    }
  };

  const handleVerifyPin = () => {
    setPinError('');
    
    if (pinInput === masterPin && masterPin !== '') {
      setIsPinVerified(true);
      setPinInput('');
    } else {
      setPinError('❌ Incorrect PIN');
      setPinInput('');
    }
  };

  const handleForgotPin = () => {
    setMasterPin('');
    localStorage.removeItem('linksAndDmMasterPin');
    const profileRef = doc(db, 'profiles', profileId);
    setDoc(profileRef, { masterPin: '' }, { merge: true });
    setShowForgotPin(false);
    setPinInput('');
    setIsPinVerified(false);
  };

  const handleLogout = () => {
    setIsPinVerified(false);
    setPinInput('');
    setCurrentView('landing');
  };

  // ============ GENERATE SHARE LINK ============
  const generateShareLink = async () => {
    if (!profile.username) {
      alert('Please set a username first');
      return;
    }
    
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/user/${profile.username}`;
    
    // Save to Firebase
    const profileRef = doc(db, 'profiles', profileId);
    await setDoc(profileRef, { shareLink: link }, { merge: true });
    
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // ============ PIN LOCK SCREEN COMPONENT ============
  const PinLockScreen = ({ targetView }) => (
    <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-600">🔒 Access Required</h2>
        <p className="text-center text-gray-600 mb-6">Enter your PIN to access {targetView}</p>
        
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value.slice(0, 6))}
          placeholder="Enter 4-6 digit PIN"
          maxLength="6"
          className="w-full border-2 border-purple-300 rounded-xl p-3 text-2xl text-center font-bold mb-4 tracking-widest"
          onKeyPress={(e) => e.key === 'Enter' && handleVerifyPin()}
        />
        
        {pinError && <p className="text-center text-red-600 text-sm mb-4">{pinError}</p>}
        
        <button
          onClick={handleVerifyPin}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition mb-3"
        >
          Unlock
        </button>
        
        <button
          onClick={() => setShowForgotPin(true)}
          className="w-full text-purple-600 text-sm font-bold hover:underline"
        >
          Forgot PIN?
        </button>
        
        {showForgotPin && (
          <div className="mt-4 p-3 bg-yellow-100 rounded-xl">
            <p className="text-sm text-gray-700 mb-2">Reset your PIN?</p>
            <button
              onClick={handleForgotPin}
              className="w-full bg-yellow-500 text-white py-2 rounded-lg font-bold text-sm"
            >
              Yes, Reset PIN
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ============ PIN SETUP MODAL ============
  const PinSetupModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
        <h2 className="text-2xl font-bold mb-4 text-purple-600">
          {pinSetupStep === 'first' ? '🔐 Create Your PIN' : '✅ Confirm Your PIN'}
        </h2>
        
        <p className="text-gray-600 text-sm mb-4">
          {pinSetupStep === 'first' 
            ? 'Set a 4-6 digit PIN to protect your editor' 
            : 'Enter the same PIN again to confirm'}
        </p>
        
        <input
          type="password"
          value={pinSetupStep === 'first' ? firstPin : confirmPin}
          onChange={(e) => {
            const val = e.target.value.slice(0, 6);
            if (pinSetupStep === 'first') setFirstPin(val);
            else setConfirmPin(val);
          }}
          placeholder="Enter PIN (4-6 digits)"
          maxLength="6"
          className="w-full border-2 border-purple-300 rounded-xl p-3 text-2xl text-center font-bold mb-4 tracking-widest"
          onKeyPress={(e) => e.key === 'Enter' && handleCreatePin()}
        />
        
        {pinError && <p className="text-center text-red-600 text-sm mb-4">{pinError}</p>}
        
        <button
          onClick={handleCreatePin}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700 transition mb-3"
        >
          {pinSetupStep === 'first' ? 'Next' : 'Confirm PIN'}
        </button>
        
        <button
          onClick={() => {
            setShowPinSetup(false);
            setFirstPin('');
            setConfirmPin('');
            setPinSetupStep('first');
            setPinError('');
          }}
          className="w-full text-purple-600 font-bold hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ============ LANDING PAGE ============
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Outfit:wght@600;700&display=swap');
          .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 900; }
          .heading-lg { font-family: 'Poppins', sans-serif; font-weight: 800; }
          .text-lg { font-family: 'Outfit', sans-serif; font-weight: 600; }
        `}</style>
        
        <div className="max-w-md mx-auto">
          {/* Header with Let's Do It button */}
          <div className="flex justify-between items-center mb-12">
            <h1 className="heading-lg text-4xl text-white drop-shadow-2xl">🔗 Links & DM 💬</h1>
            <button
              onClick={() => {
                if (!masterPin) {
                  setShowPinSetup(true);
                } else {
                  setCurrentView('editor');
                }
              }}
              className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold text-lg hover:shadow-2xl transition transform hover:scale-110 drop-shadow-lg border-4 border-purple-200 whitespace-nowrap"
            >
              Let's Do It! ✨
            </button>
          </div>

          {/* Main CTA Section */}
          <div className="bg-gradient-to-b from-purple-500 to-pink-500 rounded-3xl p-8 mb-8 text-center drop-shadow-2xl border-4 border-white">
            <p className="text-6xl mb-4">🚀</p>
            <h2 className="heading-lg text-4xl text-white mb-4">Transform Your Link-in-Bio Today</h2>
            <p className="text-white text-lg font-bold mb-4">Connect • Collaborate • Create</p>
            <p className="text-white/90 text-sm mb-6">For celebrities, influencers & creators</p>
            
            {/* Contact Central Section */}
            <div className="bg-green-400 rounded-2xl p-6 mb-6">
              <p className="text-2xl mb-2">📞</p>
              <h3 className="text-2xl font-bold text-white">Contact Central</h3>
              <p className="text-white/90 text-sm">Phone, web, everything connected</p>
            </div>
            
            {/* Get Started Now Button */}
            <button
              onClick={() => setShowPinSetup(true)}
              className="w-full bg-white text-purple-600 py-4 rounded-2xl font-bold text-xl hover:shadow-2xl transition transform hover:scale-105 drop-shadow-lg border-4 border-purple-200"
            >
              Get Started Now 👇
            </button>
          </div>

          {/* Social Proof */}
          <div className="text-center">
            <p className="text-white font-bold drop-shadow-lg">✨ Trusted by Influencers, Celebrities & Brands ✨</p>
          </div>
        </div>

        {/* PIN Setup Modal */}
        {showPinSetup && <PinSetupModal />}
      </div>
    );
  }

  // ============ PUBLIC PREVIEW PAGE ============
  if (isPublicPreview) {
    if (loadingProfile) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">⏳</p>
            <p className="text-2xl font-bold text-white">Loading...</p>
          </div>
        </div>
      );
    }

    const theme = themes[profile.selectedTheme];
    const bgStyle = { background: theme.gradient };

    return (
      <div className="min-h-screen p-8" style={bgStyle}>
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="heading-xl text-4xl text-white drop-shadow-lg mb-2">🔗 Links & DM 💬</h1>
            <p className="text-white text-lg font-bold drop-shadow-lg">Connect • Collaborate • Create</p>
          </div>

          {/* Public content sections */}
          {/* [Include all public profile sections from original code] */}
          
        </div>
      </div>
    );
  }

  // ============ EDITOR PAGE (Protected) ============
  if (currentView === 'editor') {
    if (!isPinVerified) return <PinLockScreen targetView="Editor" />;

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl text-white drop-shadow-lg font-bold">✏️ Editor</h1>
            <div className="flex gap-3">
              <button
                onClick={() => generateShareLink()}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition"
              >
                🔗 Generate Link
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Username input */}
          <div className="bg-white rounded-3xl p-6 mb-6 drop-shadow-lg border-4 border-purple-200">
            <label className="block font-bold mb-2 text-gray-700">Username (for share link)</label>
            <input
              type="text"
              value={profile.username}
              onChange={(e) => setProfile({...profile, username: e.target.value})}
              placeholder="yourname (no spaces)"
              className="w-full border-2 border-purple-300 rounded-xl p-3 font-bold"
            />
            <p className="text-sm text-gray-600 mt-2">Link: linksanddms.netlify.app/user/{profile.username}</p>
          </div>

          {/* [Include all editor form fields from original code] */}

          {/* Share Link Modal */}
          {showShareModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">🔗 Your Share Link</h2>
                <div className="bg-gray-100 rounded-xl p-4 mb-4 break-all">
                  <p className="font-mono text-sm">{shareLink}</p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition mb-3"
                >
                  {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full text-purple-600 font-bold hover:underline"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ INBOX PAGE (Protected) ============
  if (currentView === 'inbox') {
    if (!isPinVerified) return <PinLockScreen targetView="Inbox" />;

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => setCurrentView('editor')}
              className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:shadow-xl transition"
            >
              ← Back
            </button>
            <h1 className="text-4xl text-white drop-shadow-lg font-bold">📬 Messages</h1>
            <button
              onClick={handleLogout}
              className="ml-auto bg-red-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>

          {/* [Include message filtering and display from original code] */}
        </div>
      </div>
    );
  }

  return null;
};

export default LinksAndDM;
