import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, getDoc, setDoc, where } from 'firebase/firestore';

const LinksAndDM = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [showPinSetup, setShowPinSetup] = useState(false);
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
  
  // PIN states - IMPROVED SIMPLE VERSION (4-6 digits, easy to type)
  const [masterPin, setMasterPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupStep, setPinSetupStep] = useState('first');
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

  // Color Customization
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

  // Check if viewing public preview via URL
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
        
        if (data.masterPin) {
          setMasterPin(data.masterPin);
        }
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
        dmButtons: dmButtons,
        categoryButtons: categoryButtons,
        charityLinks: charityLinks,
        portfolio: portfolio,
        projects: projects,
        priorityContacts: priorityContacts,
        buttonColors: buttonColors,
        masterPin: masterPin,
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
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/user/${profile.username}`;
    
    // SAVE TO FIREBASE
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

  // IMPROVED PIN FUNCTIONS - Simple & Clean (4-6 digits)
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
      setMasterPin(firstPin);
      localStorage.setItem('linksAndDmMasterPin', firstPin);
      const profileRef = doc(db, 'profiles', profileId);
      setDoc(profileRef, { masterPin: firstPin }, { merge: true });
      setFirstPin('');
      setConfirmPin('');
      setPinSetupStep('first');
      setShowPinSetup(false);
      setPinError('');
      setCurrentView('editor');
    }
  };

  const verifyPin = () => {
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

  // IMPROVED PIN SETUP MODAL - Simple & Clean
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
        </button>
      </div>
    );
  };

  // PIN Setup Modal with Smooth Pad
  const PinSetupModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-2 text-center text-purple-600">🔐 Create PIN</h2>
        <p className="text-sm text-gray-600 text-center mb-6">4-10 digits. Keep it simple to remember.</p>

        <div className="space-y-6">
          <PinPad 
            value={newPin} 
            onChange={setNewPin}
            onBackspace={handlePinBackspace}
            title="Enter PIN"
          />
          
          {newPin.length >= 4 && (
            <PinPad 
              value={confirmPin} 
              onChange={setConfirmPin}
              onBackspace={handleConfirmPinBackspace}
              title="Confirm PIN"
            />
          )}
        </div>

        {newPin && confirmPin && (
          <button
            onClick={handleCreatePin}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl mt-6 transition transform hover:scale-105"
          >
            ✅ Confirm PIN
          </button>
        )}
      </div>
    </div>
  );

  // PIN Lock Screen with Smooth Pad
  const PinLockScreen = ({ targetView }) => (
    <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-2 text-center text-purple-600">🔒 Enter PIN</h2>
        <p className="text-sm text-gray-500 text-center mb-6">{targetView}</p>

        <div className="space-y-6">
          <div>
            <div className="bg-gray-100 rounded-xl p-4 mb-4 text-center">
              <p className="text-3xl font-bold tracking-widest text-gray-800">
                {'●'.repeat(pinInput.length)}
                {pinInput.length > 0 && pinInput.length < 10 && <span className="text-gray-400">○</span>}
              </p>
            </div>
          </div>

          {/* PIN Pad Grid */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map(digit => (
              <button
                key={digit}
                onClick={() => handlePinLockDigit(digit)}
                className="bg-gradient-to-br from-purple-400 to-purple-500 text-white font-bold text-2xl py-4 rounded-xl hover:shadow-lg transition transform hover:scale-105"
              >
                {digit}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePinLockBackspace()}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition mb-2"
          >
            ← Delete
          </button>

          <button
            onClick={verifyPin}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105"
          >
            Unlock
          </button>

          <button
            onClick={() => setCurrentView('editor')}
            className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold text-lg hover:bg-gray-400"
          >
            Back
          </button>

          <button
            onClick={() => setShowForgotPin(true)}
            className="w-full text-purple-600 font-bold text-sm hover:underline"
          >
            Forgot PIN?
          </button>

          {showForgotPin && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-xl">
              <p className="text-sm text-gray-700 mb-3 font-bold">Reset PIN?</p>
              <button
                onClick={handleForgotPin}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600 mb-2"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowForgotPin(false)}
                className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Share Modal
  const ShareModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
        <h2 className="text-3xl font-bold mb-2 text-center text-purple-600">📱 Share Link</h2>

        <div className="bg-gray-100 rounded-2xl p-4 mb-4 break-all">
          <p className="font-bold text-sm text-blue-600">{shareLink}</p>
        </div>

        <button
          onClick={copyToClipboard}
          className={`w-full px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105 mb-3 text-white ${
            copySuccess
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}
        >
          {copySuccess ? '✅ Copied!' : '📋 Copy Link'}
        </button>

        <button
          onClick={() => setShowShareModal(false)}
          className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold text-lg hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Color Settings Modal
  const ColorSettingsModal = () => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-600">🎨 Custom Colors</h2>

        <div className="space-y-6">
          {Object.entries(buttonColors).map(([key, colors]) => (
            <div key={key} className="space-y-2">
              <p className="font-bold text-lg text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Background</label>
                  <input
                    type="color"
                    value={colors.bg}
                    onChange={(e) => setButtonColors(prev => ({
                      ...prev,
                      [key]: { ...prev[key], bg: e.target.value }
                    }))}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Text</label>
                  <input
                    type="color"
                    value={colors.text}
                    onChange={(e) => setButtonColors(prev => ({
                      ...prev,
                      [key]: { ...prev[key], text: e.target.value }
                    }))}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div
                className="w-full py-3 rounded-lg font-bold text-center"
                style={{ backgroundColor: colors.bg, color: colors.text }}
              >
                Preview
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowColorSettings(false)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl mt-6 transition transform hover:scale-105"
        >
          Done
        </button>
      </div>
    </div>
  );

  const isPriority = (contactInfo) => {
    return priorityContacts.some(pc => pc.handle.toLowerCase().includes(contactInfo.toLowerCase()) || contactInfo.toLowerCase().includes(pc.handle.toLowerCase()));
  };

  const getSenderTag = (contactInfo) => isPriority(contactInfo) ? '⭐' : '🌸';

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.contactInfo || !formData.message) { alert('Please fill in all fields'); return; }
    const newMessage = { name: formData.name, contact: formData.contactInfo, message: formData.message, messageType: currentMessageType.emojiTag, senderTag: getSenderTag(formData.contactInfo), timestamp: new Date().toISOString(), starred: false };
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
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Outfit:wght@600&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 800; } .text-lg { font-family: 'Outfit', sans-serif; font-weight: 600; }`}</style>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="heading-xl text-4xl text-white drop-shadow-lg mb-2">🔗 Links&Dm 💬</h1>
            <p className="text-white text-lg font-bold drop-shadow-lg">Connect • Collaborate • Create</p>
          </div>

          <div className="text-center mb-10">
            {profile.profilePic ? <img src={profile.profilePic} alt="Profile" className="w-44 h-44 rounded-full border-8 border-white shadow-2xl mx-auto mb-6 object-cover drop-shadow-lg" /> : <div className="w-44 h-44 rounded-full border-8 border-white shadow-2xl mx-auto mb-6 bg-white/20 flex items-center justify-center text-7xl drop-shadow-lg">📸</div>}
            <h2 className="heading-xl text-4xl text-white drop-shadow-lg mb-1">{profile.name}</h2>
            <p className="text-white font-bold text-xl drop-shadow-lg mb-3">{profile.businessProfession}</p>
            <p className="text-white/95 text-base drop-shadow-lg font-semibold">{profile.bio}</p>
          </div>

          <div className="space-y-3 mb-5">
            {dmButtons.bookMeeting.enabled && <button onClick={() => openMessageForm('bookMeeting')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg text-white hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.bookMeeting.bg, color: buttonColors.bookMeeting.text }}><span className="text-4xl drop-shadow-lg">📅</span><span className="font-bold">{dmButtons.bookMeeting.label}</span></button>}
            {dmButtons.letsConnect.enabled && <button onClick={() => openMessageForm('letsConnect')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg text-white hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.letsConnect.bg, color: buttonColors.letsConnect.text }}><span className="text-4xl drop-shadow-lg">💬</span><span className="font-bold">{dmButtons.letsConnect.label}</span></button>}
            {dmButtons.collabRequest.enabled && <button onClick={() => openMessageForm('collabRequest')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg text-white hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.collabRequest.bg, color: buttonColors.collabRequest.text }}><span className="text-4xl drop-shadow-lg">🤝</span><span className="font-bold">{dmButtons.collabRequest.label}</span></button>}
            {dmButtons.supportCause.enabled && charityLinks.length > 0 && charityLinks.some(c => c.url) && <button onClick={() => setShowModal('charities')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg text-white hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.supportCause.bg, color: buttonColors.supportCause.text }}><span className="text-4xl drop-shadow-lg">❤️</span><span className="font-bold">{dmButtons.supportCause.label}</span></button>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {categoryButtons.handles.length > 0 && <button onClick={() => setShowModal('handles')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.handles.bg, color: buttonColors.handles.text }}><span className="text-4xl drop-shadow-lg">🌐</span><span className="text-xs leading-tight">@ Handles</span></button>}
            {categoryButtons.email.length > 0 && <button onClick={() => setShowModal('email')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.email.bg, color: buttonColors.email.text }}><span className="text-4xl drop-shadow-lg">📧</span><span className="text-xs leading-tight">@ Email</span></button>}
            {categoryButtons.contact.length > 0 && <button onClick={() => setShowModal('contact')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.contact.bg, color: buttonColors.contact.text }}><span className="text-4xl drop-shadow-lg">📱</span><span className="text-xs leading-tight">Contact</span></button>}
            {categoryButtons.website.length > 0 && <button onClick={() => setShowModal('website')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.website.bg, color: buttonColors.website.text }}><span className="text-4xl drop-shadow-lg">🌍</span><span className="text-xs leading-tight">Website</span></button>}
            {portfolio.enabled && <button onClick={() => { if (portfolio.url) window.open(formatUrl(portfolio.url), '_blank'); }} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.portfolio.bg, color: buttonColors.portfolio.text }}><span className="text-4xl drop-shadow-lg">🎨</span><span className="text-xs leading-tight">Portfolio</span></button>}
            {projects.enabled && <button onClick={() => setShowModal('projects')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.projects.bg, color: buttonColors.projects.text }}><span className="text-4xl drop-shadow-lg">📁</span><span className="text-xs leading-tight">Projects</span></button>}
          </div>
        </div>

        {/* Message Form Modal */}
        {showMessageForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Send Message</h3>
                <button onClick={() => setShowMessageForm(false)} className="text-4xl font-black">×</button>
              </div>
              <form onSubmit={handleMessageSubmit} className="space-y-4">
                <div><label className="block font-bold text-sm mb-2">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your name" className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-sm" /></div>
                <div><label className="block font-bold text-sm mb-2">Email or Handle</label><input type="text" value={formData.contactInfo} onChange={(e) => setFormData({...formData, contactInfo: e.target.value})} placeholder="email@example.com or @handle" className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-sm" /></div>
                <div><label className="block font-bold text-sm mb-2">Message</label><textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Your message..." className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-sm h-24 resize-none" /></div>
                <div className="bg-purple-100 rounded-xl p-3 text-center"><p className="text-sm font-bold text-gray-700">Message Type: <span className="text-2xl">{currentMessageType?.emojiTag}</span></p></div>
                <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105">Send Message</button>
              </form>
            </div>
          </div>
        )}

        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-3xl p-8 drop-shadow-2xl border-4 border-green-400 animate-bounce">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-xl font-bold text-gray-800">Message Sent!</p>
            </div>
          </div>
        )}

        {showModal === 'handles' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">🌐 Handles</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.handles.map((item, idx) => (
                  <a key={idx} href={getSocialMediaUrl(item.platform, item.handle)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-blue-100 transition cursor-pointer">
                    <p className="text-sm text-gray-600 font-bold">{item.platform}</p>
                    <p className="text-lg font-bold text-blue-600 break-all hover:underline">{item.handle}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'email' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📧 Email</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.email.map((item, idx) => (
                  <a key={idx} href={`mailto:${item.email}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-blue-100 transition">
                    <p className="text-lg font-bold text-blue-600 break-all">{item.email}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'contact' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📱 Contact</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.contact.map((item, idx) => (
                  <a key={idx} href={`tel:${item.phone}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-green-100 transition">
                    <p className="text-lg font-bold text-green-600 break-all">{item.phone}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'website' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">🌍 Website</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.website.map((item, idx) => (
                  <a key={idx} href={formatUrl(item.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-purple-100 transition cursor-pointer">
                    <p className="text-lg font-bold text-purple-600 break-all hover:underline">{item.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'projects' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📁 Projects</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {projects.list.map((proj, idx) => (
                  <a key={idx} href={formatUrl(proj.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-orange-100 transition cursor-pointer">
                    <p className="text-sm text-gray-600 font-bold">Project</p>
                    <p className="text-lg font-bold text-orange-600 break-all hover:underline">{proj.title}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'charities' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">❤️ Support a Cause</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {charityLinks.filter(c => c.url).map((charity, idx) => (
                  <a key={idx} href={formatUrl(charity.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-pink-100 transition cursor-pointer">
                    <p className="text-sm text-gray-600 font-bold">{charity.name || 'Charity'}</p>
                    <p className="text-lg font-bold text-pink-600 break-all hover:underline">{charity.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ LANDING PAGE - IMPROVED LAYOUT ============
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Outfit:wght@600;700&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 900; } .heading-lg { font-family: 'Poppins', sans-serif; font-weight: 800; } .text-lg { font-family: 'Outfit', sans-serif; font-weight: 600; }`}</style>
        <div className="max-w-md mx-auto">
          {/* Header with Let's Do It button - TOP RIGHT */}
          <div className="flex justify-between items-center mb-12">
            <h1 className="heading-lg text-4xl text-white drop-shadow-2xl">🔗 Links & DM 💬</h1>
            <button
              onClick={() => {
                if (!masterPin) {
                  setShowPinSetup(true);
                } else {
                  setIsPinVerified(false);
                  setPinInput('');
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
            
            {/* Get Started Now Button - BOTTOM */}
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

        {showPinSetup && <PinSetupModal />}
      </div>
    );
  }

  // ============ EDITOR PAGE ============
  if (currentView === 'editor') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Outfit:wght@600;700&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 900; } .heading-md { font-family: 'Poppins', sans-serif; font-weight: 700; }`}</style>
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <h1 className="heading-xl text-5xl text-white drop-shadow-2xl mb-8">✏️ Edit Your Profile</h1>
            <div className="flex justify-center gap-4 flex-wrap">
              <button
                onClick={() => setCurrentView('landing')}
                className="bg-white text-purple-600 px-8 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-110 drop-shadow-lg border-4 border-purple-200"
              >
                ← Back
              </button>
              <button
                onClick={() => { saveProfileToFirebase(); setCurrentView('preview'); }}
                className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-110 drop-shadow-lg border-4 border-blue-200"
              >
                👁️ Preview
              </button>
              <button
                onClick={navigateToInbox}
                className="bg-white text-green-600 px-8 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-110 drop-shadow-lg border-4 border-green-200"
              >
                📬 Inbox ({messages.length})
              </button>
            </div>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-3xl border-4 border-purple-500 p-8 mb-6 max-w-2xl mx-auto shadow-xl">
            <h2 className="heading-md text-4xl mb-6 text-purple-600">👤 Profile</h2>
            <div className="flex justify-center mb-6">
              <label className="cursor-pointer relative">
                {profile.profilePic ? <img src={profile.profilePic} alt="Profile" className="w-40 h-40 rounded-full object-cover border-4 border-purple-300 hover:border-purple-600 transition" /> : <div className="w-40 h-40 rounded-full bg-purple-100 flex items-center justify-center border-4 border-purple-300 text-6xl hover:bg-purple-200 transition">📷</div>}
                <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
              </label>
            </div>
            <div className="space-y-5">
              <div><label className="block font-bold text-2xl mb-2">Name</label><input type="text" value={profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} className="w-full bg-gray-100 border-0 rounded-2xl p-3 font-bold text-lg" maxLength="50" /></div>
              <div><label className="block font-bold text-2xl mb-2">Profession</label><input type="text" value={profile.businessProfession} onChange={(e) => handleProfileChange('businessProfession', e.target.value)} className="w-full bg-gray-100 border-0 rounded-2xl p-3 font-bold text-lg" maxLength="50" /></div>
              <div><label className="block font-bold text-2xl mb-2">Bio</label><textarea value={profile.bio} onChange={(e) => handleProfileChange('bio', e.target.value)} className="w-full bg-gray-100 border-0 rounded-2xl p-3 font-bold text-lg h-24 resize-none" maxLength="200" /></div>
              
              <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-300">
                <label className="block font-bold text-2xl mb-2 text-blue-900">📱 Username</label>
                <input 
                  type="text" 
                  value={profile.username} 
                  onChange={(e) => handleProfileChange('username', e.target.value)} 
                  placeholder="e.g., john_doe" 
                  className="w-full bg-white border-0 rounded-2xl p-3 font-bold text-lg mb-3" 
                  maxLength="30" 
                />
                {profile.username && (
                  <button
                    onClick={generateShareLink}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105"
                  >
                    🔗 Generate Share Link
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DM Buttons Section */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <div className="flex justify-between items-center mb-8">
              <h2 className="heading-md text-3xl text-white" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>💌 Smart DM Buttons</h2>
              <button
                onClick={() => setShowColorSettings(true)}
                className="bg-white/20 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/30"
              >
                🎨 Colors
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(dmButtons).map(([key, btn]) => (
                <div key={key} className="bg-white/95 rounded-2xl p-5 border-2 border-white/50">
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" checked={btn.enabled} onChange={() => setDmButtons(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }))} className="w-7 h-7 cursor-pointer" />
                    <span className="text-4xl flex-shrink-0">{btn.icon}</span>
                    <input type="text" value={btn.label} onChange={(e) => setDmButtons(prev => ({ ...prev, [key]: { ...prev[key], label: e.target.value } }))} className="flex-1 border-0 bg-transparent font-bold text-lg min-w-0 truncate" maxLength="25" />
                  </div>
                  {key === 'bookMeeting' && (<><label className="block font-bold text-sm mb-1 text-gray-600">Calendar Link</label><input type="text" placeholder="Calendly, Zoom, etc." value={btn.calendarLink} onChange={(e) => setDmButtons(prev => ({ ...prev, [key]: { ...prev[key], calendarLink: e.target.value } }))} className="w-full border-2 border-gray-300 rounded-xl p-2 font-bold text-sm" /></>)}
                </div>
              ))}
            </div>
          </div>

          {/* Charity Links */}
          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>❤️ Charity / Cause Links</h2>
            <div className="space-y-2 mb-4">
              {charityLinks.map((charity, idx) => (
                <div key={idx} className="flex gap-2 w-full">
                  <input type="text" value={charity.name} onChange={(e) => { const newList = [...charityLinks]; newList[idx].name = e.target.value; setCharityLinks(newList); }} placeholder="Cause name" className="w-24 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs flex-shrink-0" />
                  <input type="url" value={charity.url} onChange={(e) => { const newList = [...charityLinks]; newList[idx].url = e.target.value; setCharityLinks(newList); }} placeholder="https://charity.org" className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0 truncate" />
                  {charityLinks.length > 1 && (<button onClick={() => setCharityLinks(charityLinks.filter((_, i) => i !== idx))} className="bg-red-700 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-800">✕</button>)}
                </div>
              ))}
            </div>
            {charityLinks.length < 5 && (<button onClick={() => setCharityLinks([...charityLinks, { name: '', url: '' }])} className="w-full bg-white text-red-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg">+ Add Charity Link</button>)}
          </div>

          {/* Social Handles */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>🌐 Social Handles</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.handles.map((h, idx) => (
                <div key={idx} className="flex gap-2 w-full">
                  <input type="text" value={h.platform} onChange={(e) => handleCategoryChange('handles', idx, 'platform', e.target.value)} placeholder="Instagram" className="w-24 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs flex-shrink-0" />
                  <input type="text" value={h.handle} onChange={(e) => handleCategoryChange('handles', idx, 'handle', e.target.value)} placeholder="@yourhandle" className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0 truncate" />
                  {categoryButtons.handles.length > 1 && (<button onClick={() => handleCategoryRemove('handles', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600">✕</button>)}
                </div>
              ))}
            </div>
            {categoryButtons.handles.length < 8 && (<button onClick={() => handleCategoryAdd('handles')} className="w-full bg-white text-purple-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg">+ Add Handle</button>)}
          </div>

          {/* Email Addresses */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>📧 Email Addresses</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.email.map((e, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="email" value={e.email} onChange={(ev) => handleCategoryChange('email', idx, 'email', ev.target.value)} placeholder="your@email.com" className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0" />
                  {categoryButtons.email.length > 1 && (<button onClick={() => handleCategoryRemove('email', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600">✕</button>)}
                </div>
              ))}
            </div>
            {categoryButtons.email.length < 5 && (<button onClick={() => handleCategoryAdd('email')} className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg">+ Add Email</button>)}
          </div>

          {/* Contact Numbers */}
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>📱 Contact Numbers</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.contact.map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="tel" value={c.phone} onChange={(e) => handleCategoryChange('contact', idx, 'phone', e.target.value)} placeholder="+1 (555) 123-4567" className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0" />
                  {categoryButtons.contact.length > 1 && (<button onClick={() => handleCategoryRemove('contact', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600">✕</button>)}
                </div>
              ))}
            </div>
            {categoryButtons.contact.length < 5 && (<button onClick={() => handleCategoryAdd('contact')} className="w-full bg-white text-green-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg">+ Add Number</button>)}
          </div>

          {/* Website */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>🌍 Website / Store</h2>
            <div className="space-y-2 mb-4">
              {categoryButtons.website.map((w, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="url" value={w.url} onChange={(e) => handleCategoryChange('website', idx, 'url', e.target.value)} placeholder="https://yourwebsite.com" className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0" />
                  {categoryButtons.website.length > 1 && (<button onClick={() => handleCategoryRemove('website', idx)} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600">✕</button>)}
                </div>
              ))}
            </div>
            {categoryButtons.website.length < 5 && (<button onClick={() => handleCategoryAdd('website')} className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg">+ Add Website</button>)}
          </div>

          {/* Portfolio */}
          <div className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>🎨 Portfolio</h2>
            <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 mb-4">
              <input type="checkbox" checked={portfolio.enabled} onChange={(e) => setPortfolio(prev => ({ ...prev, enabled: e.target.checked }))} className="w-7 h-7 cursor-pointer" />
              <label className="font-bold text-lg flex-1">Enable Portfolio</label>
            </div>
            {portfolio.enabled && (<input type="url" value={portfolio.url} onChange={(e) => setPortfolio(prev => ({ ...prev, url: e.target.value }))} placeholder="https://yourportfolio.com" className="w-full bg-white/95 border-0 rounded-xl p-3 font-bold text-sm" />)}
          </div>

          {/* Projects */}
          <div className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-6" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>📁 Latest Projects</h2>
            <div className="flex items-center gap-3 bg-white/95 rounded-xl px-4 py-3 mb-4">
              <input type="checkbox" checked={projects.enabled} onChange={(e) => setProjects(prev => ({ ...prev, enabled: e.target.checked }))} className="w-7 h-7 cursor-pointer" />
              <label className="font-bold text-lg flex-1">Enable Projects</label>
            </div>
            {projects.enabled && (<><div className="space-y-2 mb-4">{projects.list.map((proj, idx) => (<div key={idx} className="flex gap-2 w-full"><input type="text" value={proj.title} onChange={(e) => { const newList = [...projects.list]; newList[idx].title = e.target.value; setProjects(prev => ({ ...prev, list: newList })); }} placeholder="Title" className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0" /><input type="url" value={proj.url} onChange={(e) => { const newList = [...projects.list]; newList[idx].url = e.target.value; setProjects(prev => ({ ...prev, list: newList })); }} placeholder="https://..." className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0" />{projects.list.length > 1 && (<button onClick={() => { const newList = projects.list.filter((_, i) => i !== idx); setProjects(prev => ({ ...prev, list: newList })); }} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600">✕</button>)}</div>))}</div>{projects.list.length < 5 && (<button onClick={() => { setProjects(prev => ({ ...prev, list: [...prev.list, { title: '', url: '' }] })); }} className="w-full bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg">+ Add Project</button>)}</>)}
          </div>

          {/* Themes */}
          <div className="bg-white rounded-3xl border-4 border-purple-500 p-8 mb-6 max-w-3xl mx-auto shadow-xl">
            <h2 className="heading-md text-3xl mb-6 text-purple-600">🎨 Choose Theme</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {themes.map((t, idx) => (
                <button key={idx} onClick={() => handleProfileChange('selectedTheme', idx)} className={`h-24 rounded-2xl transition-all cursor-pointer font-bold text-white text-xs drop-shadow-lg ${profile.selectedTheme === idx ? 'ring-4 ring-purple-600 ring-offset-2 scale-110' : 'ring-2 ring-gray-300 hover:scale-105'}`} style={{ background: t.gradient, textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }} title={t.name}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Contacts */}
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-8 mb-6 max-w-2xl mx-auto shadow-xl border-4 border-white/20">
            <h2 className="heading-md text-3xl text-white mb-3" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2)' }}>⭐ Friends & Family</h2>
            <p className="text-white font-bold text-sm mb-4">Auto-starred in your inbox</p>
            <div className="space-y-2 mb-4">
              {priorityContacts.map((contact, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={contact.handle} onChange={(e) => { const newList = [...priorityContacts]; newList[idx].handle = e.target.value; setPriorityContacts(newList); }} placeholder="@handle or email" className="flex-1 bg-white/95 border-0 rounded-lg p-2 font-bold text-xs min-w-0" />
                  {priorityContacts.length > 1 && (<button onClick={() => setPriorityContacts(priorityContacts.filter((_, i) => i !== idx))} className="bg-red-500 text-white px-3 py-2 rounded-lg font-bold text-sm flex-shrink-0 hover:bg-red-600">✕</button>)}
                </div>
              ))}
            </div>
            {priorityContacts.length < 20 && (<button onClick={() => setPriorityContacts([...priorityContacts, { handle: '' }])} className="w-full bg-white text-yellow-600 px-4 py-2 rounded-lg font-bold text-sm hover:shadow-lg">+ Add Contact</button>)}
          </div>

          <div className="text-center mb-6 text-white drop-shadow-lg">
            <p className="font-bold text-xl drop-shadow-lg">Powered by Links & DM 💎</p>
          </div>
        </div>

        {showColorSettings && <ColorSettingsModal />}
      </div>
    );
  }

  // ============ PREVIEW PAGE ============
  if (currentView === 'preview') {
    const theme = themes[profile.selectedTheme];
    const bgStyle = { background: theme.gradient };

    return (
      <div className="min-h-screen p-8" style={bgStyle}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Outfit:wght@600&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 800; } .text-lg { font-family: 'Outfit', sans-serif; font-weight: 600; }`}</style>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h1 className="heading-xl text-4xl text-white drop-shadow-lg mb-2">🔗 Links&Dm 💬</h1>
            <p className="text-white text-lg font-bold drop-shadow-lg">Connect • Collaborate • Create</p>
          </div>

          <div className="text-center mb-10">
            {profile.profilePic ? <img src={profile.profilePic} alt="Profile" className="w-44 h-44 rounded-full border-8 border-white shadow-2xl mx-auto mb-6 object-cover drop-shadow-lg" /> : <div className="w-44 h-44 rounded-full border-8 border-white shadow-2xl mx-auto mb-6 bg-white/20 flex items-center justify-center text-7xl drop-shadow-lg">📸</div>}
            <h2 className="heading-xl text-4xl text-white drop-shadow-lg mb-1">{profile.name}</h2>
            <p className="text-white font-bold text-xl drop-shadow-lg mb-3">{profile.businessProfession}</p>
            <p className="text-white/95 text-base drop-shadow-lg font-semibold">{profile.bio}</p>
          </div>

          <div className="space-y-3 mb-5">
            {dmButtons.bookMeeting.enabled && <button onClick={() => openMessageForm('bookMeeting')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.bookMeeting.bg, color: buttonColors.bookMeeting.text }}><span className="text-4xl drop-shadow-lg">📅</span><span className="font-bold">{dmButtons.bookMeeting.label}</span></button>}
            {dmButtons.letsConnect.enabled && <button onClick={() => openMessageForm('letsConnect')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.letsConnect.bg, color: buttonColors.letsConnect.text }}><span className="text-4xl drop-shadow-lg">💬</span><span className="font-bold">{dmButtons.letsConnect.label}</span></button>}
            {dmButtons.collabRequest.enabled && <button onClick={() => openMessageForm('collabRequest')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.collabRequest.bg, color: buttonColors.collabRequest.text }}><span className="text-4xl drop-shadow-lg">🤝</span><span className="font-bold">{dmButtons.collabRequest.label}</span></button>}
            {dmButtons.supportCause.enabled && charityLinks.length > 0 && charityLinks.some(c => c.url) && <button onClick={() => setShowModal('charities')} className="w-full rounded-3xl py-5 px-6 font-bold text-lg hover:shadow-2xl transform hover:scale-105 transition drop-shadow-xl border-4 border-white/50 flex items-center gap-3" style={{ backgroundColor: buttonColors.supportCause.bg, color: buttonColors.supportCause.text }}><span className="text-4xl drop-shadow-lg">❤️</span><span className="font-bold">{dmButtons.supportCause.label}</span></button>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {categoryButtons.handles.length > 0 && <button onClick={() => setShowModal('handles')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.handles.bg, color: buttonColors.handles.text }}><span className="text-4xl drop-shadow-lg">🌐</span><span className="text-xs leading-tight">@ Handles</span></button>}
            {categoryButtons.email.length > 0 && <button onClick={() => setShowModal('email')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.email.bg, color: buttonColors.email.text }}><span className="text-4xl drop-shadow-lg">📧</span><span className="text-xs leading-tight">@ Email</span></button>}
            {categoryButtons.contact.length > 0 && <button onClick={() => setShowModal('contact')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.contact.bg, color: buttonColors.contact.text }}><span className="text-4xl drop-shadow-lg">📱</span><span className="text-xs leading-tight">Contact</span></button>}
            {categoryButtons.website.length > 0 && <button onClick={() => setShowModal('website')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.website.bg, color: buttonColors.website.text }}><span className="text-4xl drop-shadow-lg">🌍</span><span className="text-xs leading-tight">Website</span></button>}
            {portfolio.enabled && <button onClick={() => { if (portfolio.url) window.open(formatUrl(portfolio.url), '_blank'); }} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.portfolio.bg, color: buttonColors.portfolio.text }}><span className="text-4xl drop-shadow-lg">🎨</span><span className="text-xs leading-tight">Portfolio</span></button>}
            {projects.enabled && <button onClick={() => setShowModal('projects')} className="rounded-3xl py-5 px-3 font-bold text-sm hover:shadow-2xl transform hover:scale-105 transition drop-shadow-lg border-4 border-white/50 flex flex-col items-center gap-1" style={{ backgroundColor: buttonColors.projects.bg, color: buttonColors.projects.text }}><span className="text-4xl drop-shadow-lg">📁</span><span className="text-xs leading-tight">Projects</span></button>}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => { saveProfileToFirebase(); setCurrentView('editor'); }} className="bg-white/40 backdrop-blur border-4 border-white text-white px-6 py-2 rounded-2xl font-bold text-base hover:bg-white/60 transition drop-shadow-lg">← Back to Edit</button>
          </div>
        </div>

        {/* Message Form Modal */}
        {showMessageForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Send Message</h3>
                <button onClick={() => setShowMessageForm(false)} className="text-4xl font-black">×</button>
              </div>
              <form onSubmit={handleMessageSubmit} className="space-y-4">
                <div><label className="block font-bold text-sm mb-2">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your name" className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-sm" /></div>
                <div><label className="block font-bold text-sm mb-2">Email or Handle</label><input type="text" value={formData.contactInfo} onChange={(e) => setFormData({...formData, contactInfo: e.target.value})} placeholder="email@example.com or @handle" className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-sm" /></div>
                <div><label className="block font-bold text-sm mb-2">Message</label><textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Your message..." className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-sm h-24 resize-none" /></div>
                <div className="bg-purple-100 rounded-xl p-3 text-center"><p className="text-sm font-bold text-gray-700">Message Type: <span className="text-2xl">{currentMessageType?.emojiTag}</span></p></div>
                <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105">Send Message</button>
              </form>
            </div>
          </div>
        )}

        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-3xl p-8 drop-shadow-2xl border-4 border-green-400 animate-bounce">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-xl font-bold text-gray-800">Message Sent!</p>
            </div>
          </div>
        )}

        {showModal === 'handles' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">🌐 Handles</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.handles.map((item, idx) => (
                  <a key={idx} href={getSocialMediaUrl(item.platform, item.handle)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-blue-100 transition cursor-pointer">
                    <p className="text-sm text-gray-600 font-bold">{item.platform}</p>
                    <p className="text-lg font-bold text-blue-600 break-all hover:underline">{item.handle}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'email' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📧 Email</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.email.map((item, idx) => (
                  <a key={idx} href={`mailto:${item.email}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-blue-100 transition">
                    <p className="text-lg font-bold text-blue-600 break-all">{item.email}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'contact' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📱 Contact</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.contact.map((item, idx) => (
                  <a key={idx} href={`tel:${item.phone}`} className="block bg-gray-100 rounded-xl p-4 hover:bg-green-100 transition">
                    <p className="text-lg font-bold text-green-600 break-all">{item.phone}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'website' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">🌍 Website</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {categoryButtons.website.map((item, idx) => (
                  <a key={idx} href={formatUrl(item.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-purple-100 transition cursor-pointer">
                    <p className="text-lg font-bold text-purple-600 break-all hover:underline">{item.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'projects' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">📁 Projects</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {projects.list.map((proj, idx) => (
                  <a key={idx} href={formatUrl(proj.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-orange-100 transition cursor-pointer">
                    <p className="text-sm text-gray-600 font-bold">Project</p>
                    <p className="text-lg font-bold text-orange-600 break-all hover:underline">{proj.title}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal === 'charities' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full drop-shadow-2xl border-4 border-purple-300 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">❤️ Support a Cause</h3>
                <button onClick={() => setShowModal(null)} className="text-4xl font-black">×</button>
              </div>
              <div className="space-y-3">
                {charityLinks.filter(c => c.url).map((charity, idx) => (
                  <a key={idx} href={formatUrl(charity.url)} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded-xl p-4 hover:bg-pink-100 transition cursor-pointer">
                    <p className="text-sm text-gray-600 font-bold">{charity.name || 'Charity'}</p>
                    <p className="text-lg font-bold text-pink-600 break-all hover:underline">{charity.url}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ INBOX PAGE ============
  if (currentView === 'inbox') {
    if (!isPinVerified) return <PinLockScreen targetView="Inbox" />;

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap'); .heading-xl { font-family: 'Poppins', sans-serif; font-weight: 800; }`}</style>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setCurrentView('editor')} className="bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold text-lg hover:shadow-xl transition transform hover:scale-110 drop-shadow-lg border-4 border-purple-200">← Back</button>
            <h1 className="text-4xl text-white drop-shadow-lg font-bold">📬 Messages</h1>
          </div>

          <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl">
            <div className="flex flex-wrap gap-2">
              {[{ key: 'all', label: 'All', emoji: '' }, { key: 'priority', label: 'Priority', emoji: '⭐' }, { key: 'collab', label: 'Collab', emoji: '🤝' }, { key: 'meeting', label: 'Meeting', emoji: '📅' }, { key: 'connect', label: 'Connect', emoji: '💬' }, { key: 'fans', label: 'Fans', emoji: '🌸' }].map(filter => (
                <button key={filter.key} onClick={() => setInboxFilter(filter.key)} className={`px-4 py-2 rounded-xl font-bold text-sm transition transform hover:scale-105 ${inboxFilter === filter.key ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {filter.emoji} {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loadingMessages ? (
              <div className="bg-white rounded-3xl p-10 text-center"><p className="text-2xl font-bold text-gray-600">Loading messages...</p></div>
            ) : sortedMessages.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center"><p className="text-4xl mb-3">📭</p><p className="text-2xl font-bold text-gray-600">No messages yet</p><p className="text-sm text-gray-500 mt-2">Share your link to get messages!</p></div>
            ) : (
              sortedMessages.map((msg, idx) => (
                <div key={msg.id || idx} className="bg-white rounded-2xl p-4 shadow-lg border-4 border-purple-200 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-gray-800">{msg.name}</span>
                        <span className="text-2xl">{msg.messageType}</span>
                        {msg.starred && <span className="text-2xl">⭐</span>}
                        <span className="text-xl">{msg.senderTag}</span>
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

  // Share Modal
  if (showShareModal && !isPublicPreview) {
    return <ShareModal />;
  }

  // Color Settings Modal
  if (showColorSettings) {
    return <ColorSettingsModal />;
  }

  return null;
};

export default LinksAndDM;
