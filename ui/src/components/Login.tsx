/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, BookOpen, Shield, HelpCircle, Heart } from 'lucide-react';
import { User } from '../types';
import { login as apiLogin, toSessionUser } from '../api';

interface LoginProps {
  onLogin: (user: User, token?: string) => void;
  onShowSignup: () => void;
}

export default function Login({ onLogin, onShowSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please fill in your email address.');
      return;
    }
    if (!password) {
      setError('Please fill in your password.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const { access_token, user } = await apiLogin(email, password);
      onLogin(toSessionUser(user), access_token);
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8f9ff] text-[#0d1c2d] flex flex-col justify-between items-center p-4 md:p-8 overflow-hidden select-none">
      {/* Subtle background blur blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#dbe9ff] rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#d0e1fb] rounded-full blur-[120px]"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[480px] my-auto flex flex-col items-center">
        {/* Brand identity header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e293b] text-white rounded-2xl mb-4 shadow-md transition-transform hover:scale-105 duration-300">
            {/* Box/Storehouse icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#bcc7de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-[#091426] tracking-tight">Tugbok Ward</h1>
          <p className="font-sans text-sm text-[#45474c] mt-1.5 font-medium tracking-wide">Storehouse Management System</p>
        </div>

        {/* Auth Card */}
        <div className="w-full bg-white border border-[#c5c6cd]/50 rounded-2xl p-6 md:p-10 shadow-sm transition-all duration-300">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-[#091426]">Sign In</h2>
            <p className="font-sans text-xs text-[#45474c] mt-1">Access your inventory and request dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#091426]" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45474c] group-focus-within:text-[#091426] transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] transition-all placeholder:text-gray-400 text-[#0d1c2d]"
                  placeholder="name@organization.org"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-[#091426]" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-xs text-[#505f76] hover:text-[#091426] transition-colors font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45474c] group-focus-within:text-[#091426] transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] transition-all placeholder:text-gray-400 text-[#0d1c2d]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45474c] hover:text-[#091426] transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#091426] border-[#c5c6cd] rounded focus:ring-[#091426]"
              />
              <label htmlFor="remember" className="ml-2 text-xs text-[#45474c] font-medium cursor-pointer">
                Stay signed in for 30 days
              </label>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1e293b] text-white font-semibold text-sm py-3 rounded-lg hover:bg-[#091426] transition-colors duration-200 shadow-md flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{submitting ? 'SIGNING IN…' : 'SIGN IN'}</span>
              {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-[#45474c] font-medium">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onShowSignup}
                className="text-[#091426] font-bold hover:underline transition-all"
              >
                Join the team
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="w-full max-w-[480px] text-center mt-6">
        <div className="flex justify-center gap-4 text-xs font-medium text-[#505f76] mb-2">
          <a href="#" className="hover:text-[#091426] transition-colors">Help Center</a>
          <span className="text-[#c5c6cd]">•</span>
          <a href="#" className="hover:text-[#091426] transition-colors">Privacy Policy</a>
          <span className="text-[#c5c6cd]">•</span>
          <a href="#" className="hover:text-[#091426] transition-colors">Terms of Service</a>
        </div>
        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          © 2026 Tugbok Ward Storehouse. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
