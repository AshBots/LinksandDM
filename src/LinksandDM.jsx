import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';

const LinksAndDM = () => {
  // ---------- STATE ----------
  const [currentView, setCurrentView] = useState('landing');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [masterPin, setMasterPin] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // load saved pin
  useEffect(() => {
    const savedPin = localStorage.getItem('linksAndDmMasterPin');
    if (savedPin) setMasterPin(savedPin);
  }, []);

  // ---------- BASIC DATA (same as before, shortened for brevity) ----------
  const [profileId, setProfileId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({ name: '', contactInfo: '', message: '' });
  const [profile, setProfile] = useState({
    name: 'Your Name Here',
    businessProfession: 'Your Profession',
    bio: 'Add your bio here! 🌟',
    profilePic: null,
    selectedTheme: 0,
  });

  useEffect(() => {
    const storedProfileId = localStorage.getItem('linksAndDmProfileId');
    if (storedProfileId) setProfileId(storedProfileId);
    else {
      const newId = 'profile_' + Date.now();
      localStorage.setItem('linksAndDmProfileId', newId);
      setProfileId(newId);
    }
  }, []);

  // ---------- FIREBASE LOAD ----------
  useEffect(() => {
    if (!profileId) return;
    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const q = query(collection(db, 'profiles', profileId, 'messages'), orderBy('timestamp', 'desc'));
        const qs = await getDocs(q);
        const loaded = [];
        qs.forEach((d) => loaded.push({ id: d.id, ...d.data() }));
        setMessages(loaded);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [profileId]);

  // ---------- PIN SCREENS ----------
  const PinLockScreen = ({ onUnlock, target }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center drop-shadow-2xl border-4 border-purple-300">
        <h2 className="text-3xl font-bold mb-6 text-purple-600">🔒 Access Required</h2>
        <input
          type="password"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && verifyPin(target)}
          placeholder="Enter PIN"
          className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-lg mb-4"
        />
        <button
          onClick={() => verifyPin(target)}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-purple-700 mb-3"
        >
          Unlock
        </button>
        <button
          onClick={resetPin}
          className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold text-lg hover:bg-gray-400"
        >
          Forgot PIN?
        </button>
      </div>
    </div>
  );

  const verifyPin = (target) => {
    const saved = localStorage.getItem('linksAndDmMasterPin');
    if (pinInput === saved && saved) {
      setIsPinVerified(true);
      setCurrentView(target);
      setPinInput('');
    } else {
      alert('Wrong PIN');
      setPinInput('');
    }
  };

  const resetPin = () => {
    localStorage.removeItem('linksAndDmMasterPin');
    setMasterPin('');
    setIsPinVerified(false);
    alert('PIN cleared. Set a new one.');
    setCurrentView('setPin');
  };

  // ---------- LANDING ----------
  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 text-center">
        <h1 className="text-6xl font-extrabold text-white mb-10 drop-shadow-lg">🔗 Links & DM 💬</h1>
        <p className="text-white font-bold mb-10">One Link. Sorted DMs.</p>
        <button
          onClick={() => setCurrentView('setPin')}
          className="bg-white text-purple-600 px-10 py-5 rounded-full font-bold text-2xl hover:scale-110 transition"
        >
          Get Started Now
        </button>
      </div>
    );
  }

  // ---------- SET PIN SCREEN ----------
  if (currentView === 'setPin') {
    const handleSavePin = () => {
      if (!pinInput) return alert('Enter a PIN first');
      localStorage.setItem('linksAndDmMasterPin', pinInput);
      setMasterPin(pinInput);
      setPinInput('');
      alert('PIN Saved ✅');
      setCurrentView('editor');
    };
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center border-4 border-purple-300 drop-shadow-2xl">
          <h2 className="text-3xl font-bold text-purple-600 mb-6">🔑 Set Your PIN</h2>
          <p className="text-gray-600 mb-4 font-semibold">
            Create a PIN to secure your Editor and Inbox.
          </p>
          <input
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Choose a PIN"
            className="w-full border-2 border-gray-300 rounded-xl p-3 font-bold text-lg mb-4"
          />
          <button
            onClick={handleSavePin}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-purple-700 mb-3"
          >
            Save PIN & Continue
          </button>
          <button
            onClick={() => setCurrentView('landing')}
            className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-bold text-lg hover:bg-gray-300"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ---------- if PIN required for editor/inbox ----------
  if ((currentView === 'editor' || currentView === 'inbox') && !isPinVerified) {
    return <PinLockScreen target={currentView} />;
  }
    // ---------- EDITOR ----------
  if (currentView === 'editor') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-300 to-yellow-300 p-8">
        <h1 className="text-4xl font-extrabold text-center text-white mb-8 drop-shadow-lg">
          ✏️ Edit Your Profile
        </h1>

        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border-4 border-purple-300 drop-shadow-xl">
          <label className="block mb-3 font-bold text-gray-700">Name</label>
          <input
            className="w-full border-2 border-gray-300 rounded-xl p-3 mb-5"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />

          <label className="block mb-3 font-bold text-gray-700">Profession</label>
          <input
            className="w-full border-2 border-gray-300 rounded-xl p-3 mb-5"
            value={profile.businessProfession}
            onChange={(e) => setProfile({ ...profile, businessProfession: e.target.value })}
          />

          <label className="block mb-3 font-bold text-gray-700">Bio</label>
          <textarea
            className="w-full border-2 border-gray-300 rounded-xl p-3 mb-5"
            rows="3"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
            <button
              onClick={() => setCurrentView('preview')}
              className="flex-1 bg-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-pink-600"
            >
              Preview Page
            </button>
            <button
              onClick={() => {
                setIsPinVerified(false);
                setCurrentView('inbox');
              }}
              className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700"
            >
              View Inbox
            </button>
          </div>

          <button
            onClick={() => setCurrentView('landing')}
            className="w-full mt-8 bg-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-300"
          >
            ← Back to Landing
          </button>
        </div>
      </div>
    );
  }

  // ---------- PREVIEW (PUBLIC) ----------
  if (currentView === 'preview') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-teal-300 to-green-300 p-8 flex flex-col items-center">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center border-4 border-blue-200 drop-shadow-xl">
          <h2 className="text-4xl font-extrabold text-blue-600 mb-4">{profile.name}</h2>
          <p className="text-xl text-gray-700 font-semibold mb-2">{profile.businessProfession}</p>
          <p className="text-gray-600 mb-6">{profile.bio}</p>

          <button
            onClick={() => setCurrentView('landing')}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-300 mb-3 w-full"
          >
            ← Home
          </button>

          <button
            onClick={() => setCurrentView('editor')}
            className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-purple-700 w-full"
          >
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  // ---------- INBOX (LOCKED) ----------
  if (currentView === 'inbox') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-400 via-blue-300 to-teal-300 p-8">
        <h1 className="text-4xl font-extrabold text-white text-center mb-8 drop-shadow-lg">📬 Inbox</h1>

        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 border-4 border-blue-300 drop-shadow-xl">
          {loadingMessages ? (
            <p className="text-center font-bold text-gray-500">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-center font-bold text-gray-500">No messages yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {messages.map((m) => (
                <li key={m.id} className="py-4">
                  <p className="font-bold text-gray-800">{m.name}</p>
                  <p className="text-sm text-gray-600">{m.contactInfo}</p>
                  <p className="mt-2 text-gray-700">{m.message}</p>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
            <button
              onClick={() => setCurrentView('editor')}
              className="flex-1 bg-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-pink-600"
            >
              ← Back to Editor
            </button>
            <button
              onClick={resetPin}
              className="flex-1 bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-400"
            >
              Forgot PIN / Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- FALLBACK ----------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-white mb-4">Links & DM 💬</h1>
        <p className="text-white text-lg">Unexpected view. Go back to start.</p>
        <button
          onClick={() => setCurrentView('landing')}
          className="mt-6 bg-white text-purple-600 px-6 py-3 rounded-2xl font-bold hover:scale-110 transition"
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default LinksAndDM;
