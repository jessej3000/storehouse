/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Mail, Lock, User as UserIcon, MapPin, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signup as apiSignup, getStakes, getWards, Stake, Ward } from '../api';

interface SignupProps {
  onBackToLogin: () => void;
}

export default function Signup({ onBackToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [gender, setGender] = useState('female');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [stakeId, setStakeId] = useState('');
  const [wardId, setWardId] = useState('');

  const [stakes, setStakes] = useState<Stake[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingStakes, setLoadingStakes] = useState(true);
  const [loadingWards, setLoadingWards] = useState(false);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    getStakes()
      .then(setStakes)
      .catch(() => setError('Unable to load stakes. Please refresh and try again.'))
      .finally(() => setLoadingStakes(false));
  }, []);

  useEffect(() => {
    if (!stakeId) {
      setWards([]);
      setWardId('');
      return;
    }
    setLoadingWards(true);
    setWardId('');
    getWards(Number(stakeId))
      .then(setWards)
      .catch(() => setError('Unable to load wards for the selected stake.'))
      .finally(() => setLoadingWards(false));
  }, [stakeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !firstname || !lastname || !address || !contact) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!stakeId || !wardId) {
      setError('Please select your Stake and Ward.');
      return;
    }

    setSubmitting(true);
    try {
      await apiSignup({
        email,
        password,
        firstname,
        lastname,
        gender,
        address,
        contact,
        stake_id: Number(stakeId),
        ward_id: Number(wardId),
      });
      setSignupSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unable to create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8f9ff] text-[#0d1c2d] flex flex-col justify-between items-center p-4 md:p-8 overflow-hidden">
      {/* Subtle background blur blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#dbe9ff] rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#d0e1fb] rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[560px] my-auto flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1e293b] text-white rounded-2xl mb-4 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#bcc7de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-[#091426] tracking-tight">Tugbok Ward</h1>
          <p className="font-sans text-sm text-[#45474c] mt-1.5 font-medium tracking-wide">Storehouse Management System</p>
        </div>

        <div className="w-full bg-white border border-[#c5c6cd]/50 rounded-2xl p-6 md:p-10 shadow-sm">
          {signupSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-[#091426]">Account Created</h2>
                <p className="font-sans text-sm text-[#45474c] mt-2 max-w-sm mx-auto">
                  Your account is pending activation by your bishopric. You'll be able to sign in once it's approved.
                </p>
              </div>
              <button
                type="button"
                onClick={onBackToLogin}
                className="mt-2 w-full bg-[#1e293b] text-white font-semibold text-sm py-3 rounded-lg hover:bg-[#091426] transition-colors duration-200 shadow-md"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
          <>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-[#091426]">Create Account</h2>
            <p className="font-sans text-xs text-[#45474c] mt-1">Register to start logging donations for your ward.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#45474c]" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    placeholder="Jane"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">Last Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#091426]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#45474c]" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#45474c]" />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#45474c]" />
                  <input
                    type="password"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">Gender</label>
                <select
                  className="w-full p-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#45474c]" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="09171234567"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#091426]">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#45474c]" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Barangay, City"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">Stake</label>
                <select
                  className="w-full p-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d]"
                  value={stakeId}
                  onChange={(e) => setStakeId(e.target.value)}
                  disabled={loadingStakes}
                >
                  <option value="">{loadingStakes ? 'Loading…' : 'Select a stake'}</option>
                  {stakes.map((stake) => (
                    <option key={stake.id} value={stake.id}>{stake.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#091426]">Ward</label>
                <select
                  className="w-full p-2.5 bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#091426] focus:border-[#091426] text-[#0d1c2d] disabled:opacity-60"
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  disabled={!stakeId || loadingWards}
                >
                  <option value="">
                    {!stakeId ? 'Select a stake first' : loadingWards ? 'Loading…' : 'Select a ward'}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#1e293b] text-white font-semibold text-sm py-3 rounded-lg hover:bg-[#091426] transition-colors duration-200 shadow-md flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{submitting ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}</span>
              {!submitting && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-[#45474c] font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-[#091426] font-bold hover:underline transition-all"
              >
                Sign in
              </button>
            </p>
          </div>
          </>
          )}
        </div>
      </div>

      <footer className="w-full max-w-[560px] text-center mt-6">
        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          © 2026 Tugbok Ward Storehouse. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
