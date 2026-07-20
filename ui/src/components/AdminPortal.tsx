/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Users, Package, Heart, AlertTriangle, Search, Bell, LogOut,
  LayoutDashboard, Group, FileText,
  ChevronLeft, ChevronRight, X, Sparkles, CheckCircle,
  Edit3, Trash2, Plus
} from 'lucide-react';
import { User } from '../types';
import {
  ApiDonation, ApiUser, Category, getDonations, createDonation, updateDonation, deleteDonation, getCategories,
  getUsers, updateUser, deleteUser
} from '../api';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

interface AdminPortalProps {
  user: User;
  onLogout: () => void;
}

export default function AdminPortal({ user, onLogout }: AdminPortalProps) {
  // Ministers get the same dashboard as bishopric, but view-only (no edit/update actions)
  const readOnly = user.role !== 'bishopric';

  // Which page of the dashboard is showing
  const [activeView, setActiveView] = useState<'overview' | 'donations' | 'members'>('overview');

  // Modal controls
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Ward donations (Donations page) state
  const [donations, setDonations] = useState<ApiDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donationsError, setDonationsError] = useState('');
  const [donationSearch, setDonationSearch] = useState('');
  const [donationsCurrentPage, setDonationsCurrentPage] = useState(1);
  const donationsPerPage = 5;

  const [categories, setCategories] = useState<Category[]>([]);

  const [editingDonation, setEditingDonation] = useState<ApiDonation | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [rowDeletingId, setRowDeletingId] = useState<number | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);

  const [showAddDonationModal, setShowAddDonationModal] = useState(false);
  const [addDonationName, setAddDonationName] = useState('');
  const [addDonationQuantity, setAddDonationQuantity] = useState('');
  const [addDonationExpiry, setAddDonationExpiry] = useState('');
  const [addDonationCategoryId, setAddDonationCategoryId] = useState('');
  const [addDonationSubmitting, setAddDonationSubmitting] = useState(false);

  // Ward members (Members page) state
  const [members, setMembers] = useState<ApiUser[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [membersCurrentPage, setMembersCurrentPage] = useState(1);
  const membersPerPage = 5;

  const [editingMember, setEditingMember] = useState<ApiUser | null>(null);
  const [editMemberFirstname, setEditMemberFirstname] = useState('');
  const [editMemberLastname, setEditMemberLastname] = useState('');
  const [editMemberGender, setEditMemberGender] = useState('');
  const [editMemberContact, setEditMemberContact] = useState('');
  const [editMemberAddress, setEditMemberAddress] = useState('');
  const [editMemberRole, setEditMemberRole] = useState<'member' | 'ministers' | 'bishopric'>('member');
  const [editMemberSubmitting, setEditMemberSubmitting] = useState(false);
  const [memberDeletingId, setMemberDeletingId] = useState<number | null>(null);
  const [memberTogglingId, setMemberTogglingId] = useState<number | null>(null);

  // Toast alert system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Load ward donations from the API
  useEffect(() => {
    let cancelled = false;
    setDonationsLoading(true);
    getDonations('mine')
      .then((data) => {
        if (!cancelled) setDonations(data);
      })
      .catch((err) => {
        if (!cancelled) setDonationsError(err.message || 'Unable to load donations.');
      })
      .finally(() => {
        if (!cancelled) setDonationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load categories for the edit form
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => triggerToast('Unable to load categories.', 'error'));
  }, []);

  // Add Donation Submit
  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addDonationName.trim()) {
      triggerToast('Please provide item details.', 'error');
      return;
    }
    const qty = parseInt(addDonationQuantity);
    if (isNaN(qty) || qty <= 0) {
      triggerToast('Please provide a valid quantity greater than 0.', 'error');
      return;
    }
    if (!addDonationExpiry) {
      triggerToast('Please provide an expiration date.', 'error');
      return;
    }
    if (!addDonationCategoryId) {
      triggerToast('Please select a category.', 'error');
      return;
    }

    setAddDonationSubmitting(true);
    try {
      const created = await createDonation({
        name: addDonationName,
        count: qty,
        expiration: addDonationExpiry,
        category_id: Number(addDonationCategoryId),
      });
      setDonations((prev) => [created, ...prev]);
      setShowAddDonationModal(false);
      setAddDonationName('');
      setAddDonationQuantity('');
      setAddDonationExpiry('');
      setAddDonationCategoryId('');
      triggerToast('Donation added successfully!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to add donation.', 'error');
    } finally {
      setAddDonationSubmitting(false);
    }
  };

  // Edit Donation Submit
  const handleSaveEditDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonation) return;

    const qty = parseInt(editQuantity);
    if (isNaN(qty) || qty <= 0) {
      triggerToast('Please provide a valid quantity.', 'error');
      return;
    }
    if (!editName.trim()) {
      triggerToast('Please provide item details.', 'error');
      return;
    }
    if (!editExpiry) {
      triggerToast('Please provide an expiration date.', 'error');
      return;
    }
    if (!editCategoryId) {
      triggerToast('Please select a category.', 'error');
      return;
    }

    setEditSubmitting(true);
    try {
      const updated = await updateDonation(editingDonation.id, {
        name: editName,
        count: qty,
        expiration: editExpiry,
        category_id: Number(editCategoryId),
      });
      setDonations((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDonation(null);
      triggerToast('Donation successfully updated!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to update donation.', 'error');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete a donation
  const handleDeleteDonation = async (id: number) => {
    if (!window.confirm('Delete this donation? This cannot be undone.')) return;

    setRowDeletingId(id);
    try {
      await deleteDonation(id);
      setDonations((prev) => prev.filter((d) => d.id !== id));
      triggerToast('Donation deleted.', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to delete donation.', 'error');
    } finally {
      setRowDeletingId(null);
    }
  };

  // Toggle a donation's status between available and donated
  const handleToggleDonationStatus = async (item: ApiDonation) => {
    const nextStatus = item.status === 'donated' ? 'available' : 'donated';
    setTogglingStatusId(item.id);
    try {
      const updated = await updateDonation(item.id, { status: nextStatus });
      setDonations((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      triggerToast(`Marked as ${nextStatus}.`, 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to update status.', 'error');
    } finally {
      setTogglingStatusId(null);
    }
  };

  // Ward donations search
  const filteredDonations = useMemo(() => {
    const query = donationSearch.toLowerCase();
    return donations.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        `${d.user.firstname} ${d.user.lastname}`.toLowerCase().includes(query)
    );
  }, [donations, donationSearch]);

  const paginatedDonations = useMemo(() => {
    const start = (donationsCurrentPage - 1) * donationsPerPage;
    return filteredDonations.slice(start, start + donationsPerPage);
  }, [filteredDonations, donationsCurrentPage]);

  const donationsTotalPages = Math.ceil(filteredDonations.length / donationsPerPage) || 1;

  // Load ward members from the API
  useEffect(() => {
    let cancelled = false;
    setMembersLoading(true);
    getUsers()
      .then((data) => {
        if (!cancelled) setMembers(data);
      })
      .catch((err) => {
        if (!cancelled) setMembersError(err.message || 'Unable to load members.');
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Overview KPI stats, derived from real ward members/donations data
  const totalActiveUsers = useMemo(() => members.filter((m) => m.active).length, [members]);
  const inactiveUsersCount = useMemo(() => members.filter((m) => !m.active).length, [members]);
  const totalDonationsCount = useMemo(() => donations.reduce((sum, d) => sum + d.count, 0), [donations]);
  const totalDonatedCount = useMemo(
    () => donations.filter((d) => d.status === 'donated').reduce((sum, d) => sum + d.count, 0),
    [donations]
  );
  const membersWithDonationsCount = useMemo(() => {
    return new Set(donations.map((d) => d.user_id)).size;
  }, [donations]);

  // Ward members search
  const filteredMembers = useMemo(() => {
    const query = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        `${m.firstname} ${m.lastname}`.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
    );
  }, [members, memberSearch]);

  const paginatedMembers = useMemo(() => {
    const start = (membersCurrentPage - 1) * membersPerPage;
    return filteredMembers.slice(start, start + membersPerPage);
  }, [filteredMembers, membersCurrentPage]);

  const membersTotalPages = Math.ceil(filteredMembers.length / membersPerPage) || 1;

  // Edit Member Submit
  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    if (!editMemberFirstname.trim() || !editMemberLastname.trim()) {
      triggerToast('Please provide first and last name.', 'error');
      return;
    }
    if (!editMemberContact.trim() || !editMemberAddress.trim()) {
      triggerToast('Please provide contact and address.', 'error');
      return;
    }

    setEditMemberSubmitting(true);
    try {
      const updated = await updateUser(editingMember.id, {
        firstname: editMemberFirstname,
        lastname: editMemberLastname,
        gender: editMemberGender,
        contact: editMemberContact,
        address: editMemberAddress,
        role: editMemberRole,
      });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMember(null);
      triggerToast('Member successfully updated!', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to update member.', 'error');
    } finally {
      setEditMemberSubmitting(false);
    }
  };

  // Delete a member
  const handleDeleteMember = async (member: ApiUser) => {
    if (member.email === user.email) {
      triggerToast('You cannot delete your own account.', 'error');
      return;
    }
    if (!window.confirm(`Delete ${member.firstname} ${member.lastname}? This cannot be undone.`)) return;

    setMemberDeletingId(member.id);
    try {
      await deleteUser(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      triggerToast('Member deleted.', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to delete member.', 'error');
    } finally {
      setMemberDeletingId(null);
    }
  };

  // Activate / deactivate a member
  const handleToggleActive = async (member: ApiUser) => {
    const nextActive = !member.active;
    if (!nextActive && !window.confirm(`Deactivate ${member.firstname} ${member.lastname}? They will immediately lose access to their account.`)) {
      return;
    }

    setMemberTogglingId(member.id);
    try {
      const updated = await updateUser(member.id, { active: nextActive });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      triggerToast(nextActive ? 'Member activated.' : 'Member deactivated.', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to update member status.', 'error');
    } finally {
      setMemberTogglingId(null);
    }
  };

  // Donations logged in the past 2 weeks
  const recentDonations = useMemo(() => {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return donations.filter((d) => new Date(d.createdAt) >= twoWeeksAgo);
  }, [donations]);

  const paginatedRecentDonations = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return recentDonations.slice(startIdx, startIdx + itemsPerPage);
  }, [recentDonations, currentPage]);

  const totalPages = Math.ceil(recentDonations.length / itemsPerPage) || 1;

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2d] flex">
      
      {/* --- TOAST --- */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          'bg-indigo-50 border-indigo-200 text-indigo-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> :
           toast.type === 'error' ? <AlertTriangle className="h-5 w-5 text-rose-600" /> :
           <Sparkles className="h-5 w-5 text-indigo-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 focus:outline-none text-[#505f76]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-[280px] bg-[#1e293b] border-r border-[#c5c6cd]/10 flex-col py-8 z-50">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#bcc7de]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white tracking-wide leading-tight">Tugbok Ward</h1>
            <p className="text-xs text-[#bcc7de]/70 font-semibold uppercase tracking-wider">Storehouse Management</p>
          </div>
        </div>

        <nav className="flex-grow space-y-1">
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all text-left ${
              activeView === 'overview'
                ? 'bg-white/10 text-white border-l-4 border-white font-semibold shadow-inner'
                : 'text-[#bcc7de]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard Overview</span>
          </button>
          <button
            onClick={() => setActiveView('members')}
            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all text-left ${
              activeView === 'members'
                ? 'bg-white/10 text-white border-l-4 border-white font-semibold shadow-inner'
                : 'text-[#bcc7de]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Group className="h-5 w-5" />
            <span className="text-sm font-medium">Members</span>
          </button>
          <button
            onClick={() => setActiveView('donations')}
            className={`w-full flex items-center gap-3 px-6 py-3.5 transition-all text-left ${
              activeView === 'donations'
                ? 'bg-white/10 text-white border-l-4 border-white font-semibold shadow-inner'
                : 'text-[#bcc7de]/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Heart className="h-5 w-5" />
            <span className="text-sm font-medium">Donations</span>
          </button>
        </nav>
      </aside>

      {/* --- SIDEBAR MOBILE DRAWER --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 bg-[#091426]/60 backdrop-blur-sm"></div>
          
          <aside className="relative flex flex-col w-[280px] bg-[#1e293b] h-full p-6 text-white z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <Package className="h-4 w-4 text-[#bcc7de]" />
                </div>
                <div>
                  <h1 className="font-display text-sm font-bold tracking-wide">Tugbok Ward</h1>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-grow space-y-1">
              <button
                onClick={() => {
                  setActiveView('overview');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeView === 'overview'
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-[#bcc7de]/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="text-sm font-medium">Dashboard Overview</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('members');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeView === 'members'
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-[#bcc7de]/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Group className="h-5 w-5" />
                <span className="text-sm font-medium">Members</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('donations');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  activeView === 'donations'
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-[#bcc7de]/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Heart className="h-5 w-5" />
                <span className="text-sm font-medium">Donations</span>
              </button>
            </nav>

            <div className="border-t border-white/5 pt-4">
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-300 hover:bg-rose-500/10 rounded-lg text-left">
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* --- MAIN CONTENT CANVAS --- */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
        
        {/* --- HEADER --- */}
        <header className="sticky top-0 bg-white border-b border-[#c5c6cd]/30 h-16 flex justify-between items-center px-4 md:px-10 z-40">
          <div className="flex items-center gap-8 flex-1">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-[#f8f9ff] text-[#091426] rounded-xl focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <span className="font-display text-base md:text-lg font-black text-[#0d1c2d] uppercase tracking-wide hidden md:inline">
              Tugbok Ward Storehouse
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-3 border-r border-[#c5c6cd]/30 pr-4 md:pr-6">
              <button 
                onClick={() => triggerToast('No pending admin warnings.', 'info')}
                className="relative text-[#45474c] hover:text-[#091426] p-1.5 rounded-lg"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
              </button>
              <button 
                onClick={onLogout} 
                className="text-[#45474c] hover:text-red-600 p-1.5 rounded-lg"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-xs text-[#0d1c2d]">{user.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#45474c] font-bold">{user.title}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1e293b]/10 border border-[#c5c6cd] overflow-hidden flex-shrink-0">
                <img src={user.avatar} className="w-full h-full object-cover" alt="Profile avatar" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        {/* --- CORE CONTENT SCROLL CANVAS --- */}
        <main className="flex-grow p-4 md:p-10 max-w-[1440px] w-full mx-auto space-y-8">

          {activeView === 'overview' ? (
          <>
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-[#0d1c2d] tracking-tight">Overview</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Real-time logistics, user audit, and district administrative status.</p>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Total Users */}
            <div className="bg-white border border-[#c5c6cd]/50 p-5 rounded-2xl flex flex-col justify-between h-40 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#eef4ff] rounded-xl text-[#091426]">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  +4% MTD
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Active Users</p>
                <h3 className="font-display text-3xl font-black text-[#0d1c2d] mt-1">{totalActiveUsers.toLocaleString()}</h3>
              </div>
            </div>

            {/* Total Goods */}
            <div className="bg-white border border-[#c5c6cd]/50 p-5 rounded-2xl flex flex-col justify-between h-40 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#eef4ff] rounded-xl text-[#091426]">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Stable
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Members</p>
                <h3 className="font-display text-3xl font-black text-[#0d1c2d] mt-1">{inactiveUsersCount.toLocaleString()}</h3>
              </div>
            </div>

            {/* Total Donations */}
            <div className="bg-white border border-[#c5c6cd]/50 p-5 rounded-2xl flex flex-col justify-between h-40 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-[#eef4ff] rounded-xl text-[#091426]">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  +12% vs LY
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Donations/Donated</p>
                <h3 className="font-display text-3xl font-black text-[#0d1c2d] mt-1">{totalDonationsCount.toLocaleString()}/{totalDonatedCount.toLocaleString()}</h3>
              </div>
            </div>

            {/* Donors */}
            <div className="bg-white border border-[#c5c6cd]/50 p-5 rounded-2xl flex flex-col justify-between h-40 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-700 border border-rose-100">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Donors</p>
                <h3 className="font-display text-3xl font-black text-[#0d1c2d] mt-1 text-red-600">{membersWithDonationsCount.toLocaleString()}</h3>
              </div>
            </div>

          </div>

          {/* Recent Donations Table section */}
          <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 bg-[#f8f9ff]/50">
              <h3 className="font-display text-lg font-bold text-[#0d1c2d]">Recent Donations</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Donations logged in your stake and ward over the past 2 weeks</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expiration</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Donated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRecentDonations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-gray-400 font-medium text-sm">
                        No donations logged in the past 2 weeks.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecentDonations.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8f9ff]/60 transition-colors">
                        <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-[#0d1c2d] leading-normal">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Qty: {item.count}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {item.category.name}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {formatDate(item.expiration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-[#0d1c2d]">{item.user.firstname} {item.user.lastname}</p>
                          <p className="text-[10px] text-gray-400">{item.user.email}</p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Recent Donations Pagination Footer */}
            <div className="px-6 py-4 bg-[#f8f9ff]/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-semibold uppercase">
              <span>Showing {Math.min(recentDonations.length, (currentPage - 1) * itemsPerPage + 1)} of {recentDonations.length} donations</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Footer Stats / Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Inventory Integrity Dark Card */}
            <div className="bg-[#1e293b] p-8 rounded-2xl relative overflow-hidden group text-white border border-white/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <h4 className="font-display text-xl font-bold text-white mb-2">Inventory Integrity</h4>
                <p className="text-sm text-[#bcc7de] leading-relaxed max-w-md font-medium">
                  Current reconciliation score for the last 30 days based on automated Tugbok district warehouse audits.
                </p>
              </div>

              <div className="flex items-end gap-3 mt-4">
                <span className="font-display text-5xl font-black text-white">99.8%</span>
                <span className="text-xs font-bold text-[#bcc7de] uppercase tracking-widest pb-2">Verified</span>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
            </div>

            {/* Community Impact Card */}
            <div className="bg-white border border-[#c5c6cd]/50 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="font-display text-lg font-bold text-[#0d1c2d] mb-2">Community Impact</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Estimated families supported this quarter through the regional Davao West distribution network.
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-[#091426] h-full w-[85%] rounded-full"></div>
                  </div>
                  <span className="text-xs font-bold text-[#0d1c2d] whitespace-nowrap">
                    2,450 Families
                  </span>
                </div>
              </div>

              <div className="w-24 h-24 flex-shrink-0 bg-[#f8f9ff] rounded-xl flex items-center justify-center border border-[#c5c6cd]/20">
                {/* Handshake/Heart Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1e293b]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.757c.724 0 1.418.288 1.93.801a2.728 2.728 0 010 3.858l-3.327 3.327c-.752.752-1.84.97-2.822.617l-1.92-.689a1.597 1.597 0 00-1.244 0l-1.92.689a2.784 2.784 0 01-2.822-.617l-3.327-3.327a2.728 2.728 0 010-3.858c.511-.513 1.205-.8 1.93-.8H14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10V6a2 2 0 00-2-2H8a2 2 0 00-2 2v4M12 14v4M14 14v4" />
                </svg>
              </div>
            </div>

          </div>
          </>
          ) : activeView === 'donations' ? (
          <>
          {/* Donations Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-[#0d1c2d] tracking-tight">Donations</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">All donations logged under your stake and ward.</p>
            </div>
          </div>

          {/* Ward Donations Table */}
          <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#f8f9ff]/50">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0d1c2d]">Ward Donations</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Donations submitted by members in your stake and ward</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search item or member..."
                    className="pl-9 pr-4 py-1.5 w-52 md:w-64 bg-white border border-[#c5c6cd] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#091426] focus:border-[#091426] outline-none text-[#0d1c2d]"
                    value={donationSearch}
                    onChange={(e) => {
                      setDonationSearch(e.target.value);
                      setDonationsCurrentPage(1);
                    }}
                  />
                </div>

                <button
                  onClick={() => setShowAddDonationModal(true)}
                  className="px-4 py-2 bg-[#1e293b] hover:bg-[#091426] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm whitespace-nowrap"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Donation</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expiration</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Donated By</th>
                    {!readOnly && (
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {donationsLoading ? (
                    <tr>
                      <td colSpan={readOnly ? 6 : 7} className="text-center py-20 text-gray-400 font-medium text-sm">
                        Loading donations…
                      </td>
                    </tr>
                  ) : donationsError ? (
                    <tr>
                      <td colSpan={readOnly ? 6 : 7} className="text-center py-20 text-rose-500 font-medium text-sm">
                        {donationsError}
                      </td>
                    </tr>
                  ) : paginatedDonations.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 6 : 7} className="text-center py-20 text-gray-400 font-medium text-sm">
                        No donations found for your stake and ward.
                      </td>
                    </tr>
                  ) : (
                    paginatedDonations.map((item) => (
                      <tr key={item.id} className="hover:bg-[#f8f9ff]/60 transition-colors group">
                        <td className="px-6 py-4 text-xs font-semibold whitespace-nowrap text-gray-500">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-[#0d1c2d] leading-normal">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Qty: {item.count}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {item.category.name}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {formatDate(item.expiration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleDonationStatus(item)}
                            disabled={togglingStatusId === item.id}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              item.status === 'donated'
                                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title="Click to toggle status"
                          >
                            {togglingStatusId === item.id ? 'Updating…' : item.status === 'donated' ? 'Donated' : 'Available'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-[#0d1c2d]">{item.user.firstname} {item.user.lastname}</p>
                          <p className="text-[10px] text-gray-400">{item.user.email}</p>
                        </td>
                        {!readOnly && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                              <button
                                onClick={() => {
                                  setEditingDonation(item);
                                  setEditName(item.name);
                                  setEditQuantity(item.count.toString());
                                  setEditExpiry(item.expiration.slice(0, 10));
                                  setEditCategoryId(item.category_id.toString());
                                }}
                                className="p-1.5 bg-[#f8f9ff] text-[#505f76] hover:text-[#091426] hover:bg-gray-100 rounded-lg transition-all border border-[#c5c6cd]/20"
                                title="Edit Donation"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDonation(item.id)}
                                disabled={rowDeletingId === item.id}
                                className="p-1.5 bg-[#f8f9ff] text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-[#c5c6cd]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Donation"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-[#f8f9ff]/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-semibold uppercase">
              <span>
                Showing {Math.min(filteredDonations.length, (donationsCurrentPage - 1) * donationsPerPage + 1)}-
                {Math.min(filteredDonations.length, donationsCurrentPage * donationsPerPage)} of {filteredDonations.length} donations
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDonationsCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={donationsCurrentPage === 1}
                  className="p-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDonationsCurrentPage((p) => Math.min(donationsTotalPages, p + 1))}
                  disabled={donationsCurrentPage === donationsTotalPages}
                  className="p-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          </>
          ) : (
          <>
          {/* Members Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="font-display text-3xl font-extrabold text-[#0d1c2d] tracking-tight">Members</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">All members registered under your stake and ward.</p>
            </div>
          </div>

          {/* Ward Members Table */}
          <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[#f8f9ff]/50">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0d1c2d]">Ward Members</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Members registered in your stake and ward</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  className="pl-9 pr-4 py-1.5 w-52 md:w-64 bg-white border border-[#c5c6cd] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#091426] focus:border-[#091426] outline-none text-[#0d1c2d]"
                  value={memberSearch}
                  onChange={(e) => {
                    setMemberSearch(e.target.value);
                    setMembersCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Address</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    {!readOnly && (
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {membersLoading ? (
                    <tr>
                      <td colSpan={readOnly ? 6 : 7} className="text-center py-20 text-gray-400 font-medium text-sm">
                        Loading members…
                      </td>
                    </tr>
                  ) : membersError ? (
                    <tr>
                      <td colSpan={readOnly ? 6 : 7} className="text-center py-20 text-rose-500 font-medium text-sm">
                        {membersError}
                      </td>
                    </tr>
                  ) : paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 6 : 7} className="text-center py-20 text-gray-400 font-medium text-sm">
                        No members found for your stake and ward.
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-[#f8f9ff]/60 transition-colors group">
                        <td className="px-6 py-4 text-xs font-bold text-[#0d1c2d] whitespace-nowrap">
                          {m.firstname} {m.lastname}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {m.email}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                          {m.contact}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {m.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold uppercase tracking-wider">
                            {m.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {m.active ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                        </td>
                        {!readOnly && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end items-center gap-1.5 opacity-90 group-hover:opacity-100">
                              <button
                                onClick={() => handleToggleActive(m)}
                                disabled={memberTogglingId === m.id}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                  m.active
                                    ? 'bg-white text-gray-600 border-[#c5c6cd] hover:border-red-300 hover:text-red-600'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {memberTogglingId === m.id ? '…' : m.active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMember(m);
                                  setEditMemberFirstname(m.firstname);
                                  setEditMemberLastname(m.lastname);
                                  setEditMemberGender(m.gender);
                                  setEditMemberContact(m.contact);
                                  setEditMemberAddress(m.address);
                                  setEditMemberRole(m.role);
                                }}
                                className="p-1.5 bg-[#f8f9ff] text-[#505f76] hover:text-[#091426] hover:bg-gray-100 rounded-lg transition-all border border-[#c5c6cd]/20"
                                title="Edit Member"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(m)}
                                disabled={memberDeletingId === m.id || m.email === user.email}
                                className="p-1.5 bg-[#f8f9ff] text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-[#c5c6cd]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                title={m.email === user.email ? 'You cannot delete your own account' : 'Delete Member'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-[#f8f9ff]/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 font-semibold uppercase">
              <span>
                Showing {Math.min(filteredMembers.length, (membersCurrentPage - 1) * membersPerPage + 1)}-
                {Math.min(filteredMembers.length, membersCurrentPage * membersPerPage)} of {filteredMembers.length} members
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMembersCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={membersCurrentPage === 1}
                  className="p-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMembersCurrentPage((p) => Math.min(membersTotalPages, p + 1))}
                  disabled={membersCurrentPage === membersTotalPages}
                  className="p-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          </>
          )}

        </main>
      </div>

      {/* --- ADD DONATION MODAL --- */}
      {showAddDonationModal && (
        <div className="fixed inset-0 bg-[#091426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#c5c6cd] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#1e293b] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#bcc7de]" />
                <h3 className="font-display font-bold text-base">Add Donation</h3>
              </div>
              <button onClick={() => setShowAddDonationModal(false)} className="hover:opacity-80 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDonation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Item Details</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                  value={addDonationName}
                  onChange={(e) => setAddDonationName(e.target.value)}
                  placeholder="e.g. Canned Tuna"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                <select
                  className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                  value={addDonationCategoryId}
                  onChange={(e) => setAddDonationCategoryId(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Quantity units</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={addDonationQuantity}
                    onChange={(e) => setAddDonationQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={addDonationExpiry}
                    onChange={(e) => setAddDonationExpiry(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDonationModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addDonationSubmitting}
                  className="flex-1 py-2.5 bg-[#091426] text-white rounded-lg text-sm font-semibold hover:bg-[#1e293b] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addDonationSubmitting ? 'Adding…' : 'Add Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT DONATION MODAL --- */}
      {editingDonation && (
        <div className="fixed inset-0 bg-[#091426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#c5c6cd] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#1e293b] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#bcc7de]" />
                <h3 className="font-display font-bold text-base">Edit Donation</h3>
              </div>
              <button onClick={() => setEditingDonation(null)} className="hover:opacity-80 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDonation} className="p-6 space-y-4">
              <div className="text-xs text-gray-500 font-medium bg-[#f8f9ff] border border-gray-100 rounded-lg p-2.5">
                Donated by{' '}
                <span className="font-bold text-[#0d1c2d]">
                  {editingDonation.user.firstname} {editingDonation.user.lastname}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Item Details</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Category</label>
                <select
                  className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Quantity units</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingDonation(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 bg-[#091426] text-white rounded-lg text-sm font-semibold hover:bg-[#1e293b] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MEMBER MODAL --- */}
      {editingMember && (
        <div className="fixed inset-0 bg-[#091426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#c5c6cd] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#1e293b] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#bcc7de]" />
                <h3 className="font-display font-bold text-base">Edit Member</h3>
              </div>
              <button onClick={() => setEditingMember(null)} className="hover:opacity-80 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMember} className="p-6 space-y-4">
              <div className="text-xs text-gray-500 font-medium bg-[#f8f9ff] border border-gray-100 rounded-lg p-2.5">
                {editingMember.email}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">First Name</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={editMemberFirstname}
                    onChange={(e) => setEditMemberFirstname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={editMemberLastname}
                    onChange={(e) => setEditMemberLastname(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
                  <select
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={editMemberGender}
                    onChange={(e) => setEditMemberGender(e.target.value)}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Contact</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                    value={editMemberContact}
                    onChange={(e) => setEditMemberContact(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                  value={editMemberAddress}
                  onChange={(e) => setEditMemberAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Role</label>
                <select
                  className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                  value={editMemberRole}
                  onChange={(e) => setEditMemberRole(e.target.value as 'member' | 'ministers' | 'bishopric')}
                >
                  <option value="member">Member</option>
                  <option value="ministers">Ministers</option>
                  <option value="bishopric">Bishopric</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMemberSubmitting}
                  className="flex-1 py-2.5 bg-[#091426] text-white rounded-lg text-sm font-semibold hover:bg-[#1e293b] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editMemberSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
