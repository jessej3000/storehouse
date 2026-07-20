/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  PlusCircle, Search, Bell, LogOut,
  Package, Heart,
  CheckCircle, Clock, ShieldAlert, FileText, Lock,
  Edit3, Trash2, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { User } from '../types';
import {
  ApiDonation, Category, getDonations, createDonation, updateDonation, deleteDonation, getCategories
} from '../api';

interface MemberPortalProps {
  user: User;
  onLogout: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function MemberPortal({ user, onLogout }: MemberPortalProps) {
  // State for donations list (loaded from the API)
  const [donations, setDonations] = useState<ApiDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donationsError, setDonationsError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Categories (loaded from the API)
  const [categories, setCategories] = useState<Category[]>([]);

  // Form states
  const [formName, setFormName] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal for Viewing Receipt details
  const [activeReceipt, setActiveReceipt] = useState<ApiDonation | null>(null);

  // Modal for Editing a donation
  const [editingDonation, setEditingDonation] = useState<ApiDonation | null>(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Row selection & delete states
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [rowDeletingId, setRowDeletingId] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Notification/toast states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load donations from the API on mount
  useEffect(() => {
    let cancelled = false;
    setDonationsLoading(true);
    getDonations()
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

  // Load categories from the API on mount
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => triggerToast('Unable to load categories.', 'error'));
  }, []);

  // Form Submission for New Donation
  const handleRegisterDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      triggerToast('Please provide item details (e.g., brand, package size)', 'error');
      return;
    }
    const qty = parseInt(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      triggerToast('Please provide a valid quantity greater than 0', 'error');
      return;
    }
    if (!formExpiry) {
      triggerToast('Please provide an expiration date', 'error');
      return;
    }
    if (!formCategoryId) {
      triggerToast('Please select a category', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      const created = await createDonation({
        name: formName,
        count: qty,
        expiration: formExpiry,
        category_id: Number(formCategoryId),
      });
      setDonations((prev) => [created, ...prev]);
      triggerToast(`Thank you! Successfully added ${qty}x ${formName}.`, 'success');
      setFormName('');
      setFormExpiry('');
      setFormQuantity('');
      setFormCategoryId('');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to register donation.', 'error');
    } finally {
      setFormSubmitting(false);
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

  // Delete a single donation
  const handleDeleteDonation = async (id: number) => {
    if (!window.confirm('Delete this donation? This cannot be undone.')) return;

    setRowDeletingId(id);
    try {
      await deleteDonation(id);
      setDonations((prev) => prev.filter((d) => d.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      triggerToast('Donation deleted.', 'success');
    } catch (err: any) {
      triggerToast(err.message || 'Unable to delete donation.', 'error');
    } finally {
      setRowDeletingId(null);
    }
  };

  // Delete all selected donations
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected donation(s)? This cannot be undone.`)) return;

    setBulkDeleting(true);
    const ids: number[] = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map((id) => deleteDonation(id)));
    const deletedIds = ids.filter((_, i) => results[i].status === 'fulfilled');
    const failedCount = ids.length - deletedIds.length;

    setDonations((prev) => prev.filter((d) => !deletedIds.includes(d.id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);

    if (failedCount > 0) {
      triggerToast(`Deleted ${deletedIds.length}, but failed to delete ${failedCount}.`, 'error');
    } else {
      triggerToast(`Deleted ${deletedIds.length} donation(s).`, 'success');
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Search Logic
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [donations, searchQuery]);

  // Paginated Donations
  const paginatedDonations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDonations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDonations, currentPage]);

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage) || 1;

  const allSelectedOnPage =
    paginatedDonations.length > 0 && paginatedDonations.every((d) => selectedIds.has(d.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectedOnPage) {
        paginatedDonations.forEach((d) => next.delete(d.id));
      } else {
        paginatedDonations.forEach((d) => next.add(d.id));
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2d] flex">
      
      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> :
           toast.type === 'error' ? <ShieldAlert className="h-5 w-5 text-rose-600" /> :
           <Clock className="h-5 w-5 text-blue-600" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 focus:outline-none">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* --- MAIN PORTAL CANVAS --- */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* --- HEADER --- */}
        <header className="sticky top-0 bg-white border-b border-[#c5c6cd]/30 h-16 flex justify-between items-center px-4 md:px-10 z-40">
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs md:max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#45474c]" />
              <input 
                type="text" 
                placeholder="Search contributions..." 
                className="pl-9 pr-4 py-1.5 w-60 md:w-80 bg-[#f8f9ff] border border-[#c5c6cd] rounded-full text-xs font-medium focus:ring-1 focus:ring-[#091426] focus:border-[#091426] outline-none text-[#0d1c2d]"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-3 border-r border-[#c5c6cd]/30 pr-4 md:pr-6">
              <button 
                onClick={() => triggerToast('You have 2 pending notifications.', 'info')}
                className="relative text-[#45474c] hover:text-[#091426] transition-colors p-1.5 rounded-lg hover:bg-gray-100"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
              </button>
              <button 
                onClick={onLogout} 
                className="text-[#45474c] hover:text-[#091426] transition-colors p-1.5 rounded-lg hover:bg-gray-100"
                title="Sign out of system"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Info */}
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

        {/* --- MAIN SCROLL CONTENT --- */}
        <main className="flex-grow p-4 md:p-10 max-w-[1440px] w-full mx-auto space-y-6 md:space-y-10">
          
          {/* Hero Welcome banner */}
          <div className="bg-[#1e293b] rounded-2xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-center min-h-[200px] text-white shadow-sm border border-white/5">
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-3 leading-tight">Welcome back, Sister Miller.</h2>
              <p className="text-sm md:text-base text-[#bcc7de] max-w-xl leading-relaxed">
                Your contributions last month provided <strong className="text-white underline decoration-wavy decoration-indigo-400">124 meals</strong> for families in the Tugbok district. Thank you for your continued devoted service and generosity.
              </p>
            </div>
          </div>

          {/* Core Portal Grid: Left (Add & Pickup) & Right (Table) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
            
            {/* Left Column (Forms & pickup) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Form Card */}
              <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
                  <PlusCircle className="h-5 w-5 text-[#091426]" />
                  <h3 className="font-display text-lg font-bold text-[#091426]">Add New Donation</h3>
                </div>

                <form onSubmit={handleRegisterDonation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0d1c2d] mb-1.5">Item Details</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-[#c5c6cd] rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#091426] focus:border-[#091426] outline-none placeholder:text-gray-400 text-[#0d1c2d]"
                      placeholder="e.g., 400g Corned Beef"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0d1c2d] mb-1.5">Category</label>
                    <select
                      className="w-full p-2.5 bg-white border border-[#c5c6cd] rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#091426] focus:border-[#091426] outline-none text-[#0d1c2d]"
                      value={formCategoryId}
                      onChange={(e) => setFormCategoryId(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#0d1c2d] mb-1.5">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full p-2.5 bg-white border border-[#c5c6cd] rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#091426] focus:border-[#091426] outline-none text-[#0d1c2d]"
                        value={formExpiry}
                        onChange={(e) => setFormExpiry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#0d1c2d] mb-1.5">Quantity</label>
                      <input
                        type="number"
                        className="w-full p-2.5 bg-white border border-[#c5c6cd] rounded-xl text-xs font-medium focus:ring-1 focus:ring-[#091426] focus:border-[#091426] outline-none placeholder:text-gray-400 text-[#0d1c2d]"
                        placeholder="0"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-3 bg-[#091426] hover:bg-[#1e293b] text-white font-semibold text-xs rounded-xl shadow-sm transition-all duration-150 active:scale-[0.98] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {formSubmitting ? 'Adding…' : 'Add Donation'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (My Donations Table) */}
            <div className="lg:col-span-8">
              <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between min-h-[580px]">
                
                {/* Table Header Controls */}
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-[#f8f9ff]/50">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#0d1c2d]">My Donations</h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Your lifetime logged storehouse items</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      disabled={paginatedDonations.length === 0}
                      className="px-3 py-1.5 bg-white border border-[#c5c6cd] hover:border-[#091426] text-xs font-semibold text-[#1e293b] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {allSelectedOnPage ? 'Unselect All' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={selectedIds.size === 0 || bulkDeleting}
                      className="px-3 py-1.5 bg-white border border-[#c5c6cd] hover:border-red-400 hover:text-red-600 text-xs font-semibold text-[#1e293b] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{bulkDeleting ? 'Deleting…' : selectedIds.size > 0 ? `Delete (${selectedIds.size})` : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* Table container */}
                <div className="overflow-x-auto flex-grow">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#f8f9ff] border-b border-gray-100">
                        <th className="px-6 py-3.5 w-10"></th>
                        <th className="px-6 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expiration</th>
                        <th className="px-6 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ward</th>
                        <th className="px-6 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[#0d1c2d]">
                      {donationsLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-20 text-gray-400 font-medium text-sm">
                            Loading donations…
                          </td>
                        </tr>
                      ) : donationsError ? (
                        <tr>
                          <td colSpan={8} className="text-center py-20 text-rose-500 font-medium text-sm">
                            {donationsError}
                          </td>
                        </tr>
                      ) : paginatedDonations.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-20 text-gray-400 font-medium text-sm">
                            No donations found.
                          </td>
                        </tr>
                      ) : (
                        paginatedDonations.map((item) => (
                          <tr key={item.id} className="hover:bg-[#f8f9ff]/60 transition-colors group">
                            <td className="px-6 py-4.5">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(item.id)}
                                onChange={() => toggleSelectOne(item.id)}
                                className="w-4 h-4 rounded border-[#c5c6cd] text-[#091426] focus:ring-[#091426]"
                              />
                            </td>
                            <td className="px-6 py-4.5 text-xs font-semibold whitespace-nowrap text-gray-500">
                              {formatDate(item.createdAt)}
                            </td>
                            <td className="px-6 py-4.5">
                              <p className="text-xs font-bold text-[#0d1c2d] leading-normal">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Qty: {item.count}</p>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-xs font-medium text-gray-500">
                              {item.category.name}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-xs font-medium text-gray-500">
                              {formatDate(item.expiration)}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  item.status === 'donated'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-emerald-50 text-emerald-600'
                                }`}
                              >
                                {item.status === 'donated' ? 'Donated' : 'Available'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-xs font-medium text-gray-500">
                              {item.ward.name}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap text-right">
                              <div className="flex justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                                {/* Print receipt/View details icon */}
                                <button
                                  onClick={() => setActiveReceipt(item)}
                                  className="p-1.5 bg-[#f8f9ff] text-gray-500 hover:text-[#091426] hover:bg-gray-100 rounded-lg transition-all border border-[#c5c6cd]/20"
                                  title="View Details & Receipt"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </button>

                                {item.status === 'donated' ? (
                                  <span
                                    className="p-1.5 bg-[#f8f9ff] text-gray-300 rounded-lg border border-[#c5c6cd]/20 cursor-not-allowed"
                                    title="Already donated — cannot be edited"
                                  >
                                    <Lock className="h-3.5 w-3.5" />
                                  </span>
                                ) : (
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
                                )}

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
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer with pagination */}
                <div className="p-4 border-t border-gray-100 bg-[#f8f9ff]/50 flex justify-between items-center text-xs font-medium text-gray-500">
                  <span>
                    Showing {Math.min(filteredDonations.length, (currentPage - 1) * itemsPerPage + 1)}-
                    {Math.min(filteredDonations.length, currentPage * itemsPerPage)} of {filteredDonations.length} donations
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[#0d1c2d]"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span>Prev</span>
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-white border border-[#c5c6cd] hover:border-[#091426] rounded-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-[#0d1c2d]"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Secondary Bento Grid Row: Community metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Community Health */}
            <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#091426] flex-shrink-0">
                <Heart className="h-6 w-6 text-[#091426]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Community Health Needs</p>
                <p className="text-xl font-extrabold text-[#0d1c2d] mt-1">High Need Category</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Focus on high-protein canned goods for critical local family shelf-stocking this season.
                </p>
              </div>
            </div>

            {/* Current Inventory Capacity */}
            <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#091426] flex-shrink-0">
                <Package className="h-6 w-6 text-[#091426]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tugbok Storage Level</p>
                <p className="text-xl font-extrabold text-[#0d1c2d] mt-1">82% Total Capacity</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Main hall is nearing full safe storage limit. Preparing to divert new arrivals to annex building.
                </p>
              </div>
            </div>

            {/* Compliance Score */}
            <div className="bg-white border border-[#c5c6cd]/50 rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#091426] flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-[#091426]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quality Audit Score</p>
                <p className="text-xl font-extrabold text-[#0d1c2d] mt-1">Platinum Tier</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Tugbok Ward maintains top-tier safety, sanitation, and hygiene standards.
                </p>
              </div>
            </div>

          </div>

        </main>
      </div>


      {/* --- RECEIPT DETAILS MODAL --- */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-[#091426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#c5c6cd] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-[#091426] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#bcc7de]" />
                <span className="font-mono text-xs text-gray-300 font-bold">{activeReceipt.id}</span>
                <span className="text-xs px-2 py-0.5 bg-white/10 rounded uppercase font-bold text-gray-300">Receipt</span>
              </div>
              <button onClick={() => setActiveReceipt(null)} className="hover:opacity-80 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Print Simulation Layout) */}
            <div className="p-6 space-y-6">
              
              {/* Logo / Org details */}
              <div className="text-center pb-4 border-b border-dashed border-gray-200">
                <h4 className="font-display font-extrabold text-lg text-[#091426]">Tugbok Ward Storehouse</h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Latter-day Saints Storehouse Network</p>
                <p className="text-[10px] text-gray-400 font-mono mt-1">DAVAO CITY WEST DISTRICT, PHILIPPINES</p>
              </div>

              {/* Donation Data */}
              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Date Registered</span>
                  <span className="font-bold text-[#0d1c2d]">{formatDate(activeReceipt.createdAt)}</span>
                </div>

                <div className="flex justify-between items-start text-xs">
                  <span className="text-gray-400 font-medium">Item Donated</span>
                  <span className="font-bold text-[#0d1c2d] text-right max-w-xs">{activeReceipt.name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Category</span>
                  <span className="font-bold text-[#091426]">{activeReceipt.category.name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Quantity units</span>
                  <span className="font-bold text-[#0d1c2d] font-mono">{activeReceipt.count}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Item Expiry</span>
                  <span className="font-bold text-red-600 font-mono">{formatDate(activeReceipt.expiration)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Status</span>
                  <span className="font-bold text-[#0d1c2d] capitalize">{activeReceipt.status}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Ward</span>
                  <span className="font-bold text-[#0d1c2d]">{activeReceipt.ward.name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Stake</span>
                  <span className="font-bold text-[#0d1c2d]">{activeReceipt.stake.name}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Submitted By</span>
                  <span className="font-bold text-[#0d1c2d]">{activeReceipt.user.firstname} {activeReceipt.user.lastname}</span>
                </div>
              </div>

              {/* Details narrative block */}
              <div className="bg-[#f8f9ff] p-4 rounded-xl border border-gray-100">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Administrative Notes</h5>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Item receipt for logged storehouse inventory replenishment. Status is checked and vetted by Tugbok Ward Logistics supervisors.
                </p>
              </div>

              {/* Bottom Print / Share Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    triggerToast('Receipt sent to municipal print queue.', 'success');
                    setActiveReceipt(null);
                  }}
                  className="flex-1 py-2.5 bg-[#091426] hover:bg-[#1e293b] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setActiveReceipt(null)}
                  className="py-2.5 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT PENDING DONATION MODAL --- */}
      {editingDonation && (
        <div className="fixed inset-0 bg-[#091426]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-[#c5c6cd] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#1e293b] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#bcc7de]" />
                <h3 className="font-display font-bold text-base">Edit Donation Details</h3>
              </div>
              <button onClick={() => setEditingDonation(null)} className="hover:opacity-80 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDonation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Item Details</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-[#c5c6cd] rounded-lg text-sm text-[#0d1c2d]"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Canned Tuna"
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

    </div>
  );
}
