import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import LinksAndDM from './LinksandDM';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [previewUsername, setPreviewUsername] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/preview/')) {
      const username = path.split('/preview/')[1];
      setPreviewUsername(username);
      setLoading(false);
    } else {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email already in use');
      else if (err.code === 'auth/invalid-email') setError('Invalid email');
      else setError(err.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('User not found');
      else if (err.code === 'auth/wrong-password') setError('Wrong password');
      else setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 flex items-center justify-center">
        <p className="text-4xl font-bold text-white drop-shadow-lg">Loading...</p>
      </div>
    );
  }

  // PUBLIC PREVIEW - no auth needed
  if (previewUsername) {
    return <LinksAndDM isPreview={true} previewUsername={previewUsername} />;
  }

  // NOT LOGGED IN - show auth form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-orange-300 to-green-400 p-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full drop-shadow-2xl border-4 border-purple-300">
          <h1 className="text-4xl font-bold text-center text-purple-600 mb-8">🔗 Links & DM</h1>

          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4 mb-6">
            <div>
              <label className="block font-bold text-gray-800 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-2 border-purple-300 rounded-lg p-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-800 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-2 border-purple-300 rounded-lg p-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                placeholder="••••••"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block font-bold text-gray-800 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border-2 border-purple-300 rounded-lg p-3 font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="••••••"
                />
              </div>
            )}

            {error && <p className="text-red-600 font-bold text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold text-lg hover:bg-purple-700"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setEmail('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-2xl font-bold hover:bg-gray-400"
          >
            {isSignUp ? 'Already have account? Sign In' : "Don't have account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  // LOGGED IN - dashboard
  return (
    <div>
      <div className="flex justify-end p-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <LinksAndDM user={user} />
    </div>
  );
}

export default App;
