/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User } from './types';
import Login from './components/Login';
import Signup from './components/Signup';
import MemberPortal from './components/MemberPortal';
import AdminPortal from './components/AdminPortal';
import { getStoredSession, saveSession, clearSession } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const stored = getStoredSession();
    if (stored) {
      setCurrentUser(stored.user);
    }
  }, []);

  const handleLogin = (user: User, token?: string) => {
    if (token) {
      saveSession(token, user);
    }
    setCurrentUser(user);
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setAuthView('login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col relative font-sans">

      {/* --- RENDER PORTALS --- */}
      <div className="flex-1 flex flex-col">
        {currentUser === null ? (
          authView === 'signup' ? (
            <Signup onBackToLogin={() => setAuthView('login')} />
          ) : (
            <Login onLogin={handleLogin} onShowSignup={() => setAuthView('signup')} />
          )
        ) : currentUser.role === 'bishopric' || currentUser.role === 'ministers' ? (
          <AdminPortal
            user={currentUser}
            onLogout={handleLogout}
          />
        ) : (
          <MemberPortal
            user={currentUser}
            onLogout={handleLogout}
          />
        )}
      </div>

    </div>
  );
}
