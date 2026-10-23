import React, { useState, useEffect, useRef } from 'react';
import { X, Receipt, Check, AlertCircle, Camera, Upload, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { rupeesToPaise } from '../../lib/formatCurrency';
import toast from 'react-hot-toast';

export default function AddExpenseModal({ isOpen, onClose, onExpenseCreated, defaultGroupId }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId || '');
  const [currentGroup, setCurrentGroup] = useState(null);

  // Form State
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, CUSTOM, PERCENTAGE
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [customShares, setCustomShares] = useState({}); // userId -> rupees string
  const [percentageShares, setPercentageShares] = useState({}); // userId -> percentage string
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // OCR Scan State
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedFilename, setScannedFilename] = useState('');
  const fileInputRef = useRef(null);

  // Fetch groups
  useEffect(() => {
    if (isOpen) {
      loadGroups();
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      const res = await api.get('/groups');
      const grps = res.data.data.groups || [];
      setGroups(grps);
      if (grps.length > 0 && !selectedGroupId) {
        setSelectedGroupId(defaultGroupId || grps[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load groups');
    }
  };

  // When selectedGroupId changes, update currentGroup and participant defaults
  useEffect(() => {
    if (!selectedGroupId || groups.length === 0) return;
    const grp = groups.find((g) => g._id === selectedGroupId);
    if (grp) {
      setCurrentGroup(grp);
      setPaidBy(user?.id || (grp.members[0]?.user?._id || ''));
      // Default all members as participants
      const memberIds = grp.members.map((m) => m.user._id);
      setSelectedParticipants(memberIds);

      // Reset custom and percentage shares
      const initCustom = {};
      const initPct = {};
      const equalPct = memberIds.length > 0 ? (100 / memberIds.length).toFixed(1) : 0;
      memberIds.forEach((id) => {
        initCustom[id] = '';
        initPct[id] = equalPct;
      });
      setCustomShares(initCustom);
      setPercentageShares(initPct);
    }
  }, [selectedGroupId, groups]);

  if (!isOpen) return null;

  const handleReceiptFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt image exceeds 5MB limit. Please upload a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(file.type)) {
      toast.error('Please upload an image file (JPEG, PNG, or WebP)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setScanning(true);
      setScanSuccess(false);
      setScannedFilename(file.name);

      const formData = new FormData();
      formData.append('receipt', file);

      const res = await api.post('/expenses/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const {
        description: ocrMerchant,
        amountRupees: ocrAmount,
        expenseDate: ocrDate,
        category: ocrCat,
      } = res.data.data;

      if (ocrMerchant) setDescription(ocrMerchant);
      if (ocrAmount > 0) setAmountRupees(String(ocrAmount));
      if (ocrDate) setExpenseDate(ocrDate);
      if (ocrCat) setCategory(ocrCat);

      setScanSuccess(true);
      toast.success('Receipt scanned! Form fields auto-populated for review.');
    } catch (err) {
      toast.error(err.message || 'Failed to scan receipt image');
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleParticipant = (userId) => {
    if (selectedParticipants.includes(userId)) {
      if (selectedParticipants.length === 1) {
        toast.error('At least one participant is required');
        return;
      }
      setSelectedParticipants(selectedParticipants.filter((id) => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleCustomShareChange = (userId, val) => {
    setCustomShares({ ...customShares, [userId]: val });
  };

  const handlePercentageChange = (userId, val) => {
    setPercentageShares({ ...percentageShares, [userId]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) {
      toast.error('Please select a group');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter an expense description');
      return;
    }
    const numAmount = parseFloat(amountRupees);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    const amountPaise = rupeesToPaise(numAmount);

    let payloadParticipants = [];
    let percentagePayload = null;

    if (splitType === 'EQUAL') {
      payloadParticipants = selectedParticipants.map((id) => ({ userId: id }));
    } else if (splitType === 'CUSTOM') {
      let customTotalPaise = 0;
      payloadParticipants = selectedParticipants.map((id) => {
        const shareRupees = parseFloat(customShares[id] || 0);
        const sharePaise = rupeesToPaise(shareRupees);
        customTotalPaise += sharePaise;
        return { userId: id, sharePaise };
      });

      if (customTotalPaise !== amountPaise) {
        toast.error(
          `Custom shares (₹${(customTotalPaise / 100).toFixed(2)}) must equal total (₹${numAmount.toFixed(2)})`
        );
        return;
      }
    } else if (splitType === 'PERCENTAGE') {
      let totalPct = 0;
      percentagePayload = {};
      selectedParticipants.forEach((id) => {
        const pct = parseFloat(percentageShares[id] || 0);
        totalPct += pct;
        percentagePayload[id] = pct;
      });

      if (Math.abs(totalPct - 100) > 0.05) {
        toast.error(`Percentages must total 100%. Current: ${totalPct.toFixed(1)}%`);
        return;
      }

      payloadParticipants = selectedParticipants.map((id) => ({ userId: id }));
    }

    try {
      setLoading(true);
      await api.post(`/groups/${selectedGroupId}/expenses`, {
        description: description.trim(),
        amountPaise,
        paidBy,
        splitType,
        category,
        notes: notes.trim(),
        expenseDate,
        participants: payloadParticipants,
        ...(splitType === 'PERCENTAGE' && { percentageShares: percentagePayload }),
      });

      toast.success('Expense added successfully!');
      if (onExpenseCreated) onExpenseCreated();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Expense</h3>
              <p className="text-xs text-slate-500">Record a shared expense in integer paise</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* OCR Quick Scan Section */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Scan Receipt with OCR</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                    Smart Fill
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Upload an image (up to 5MB) to extract merchant, total & date automatically
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleReceiptFileChange}
                className="hidden"
                id="receipt-file-input"
              />
              <label
                htmlFor="receipt-file-input"
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs ${
                  scanning
                    ? 'bg-slate-200 text-slate-500 pointer-events-none'
                    : 'bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 active:scale-95'
                }`}
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Receipt</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Scan Result Notification */}
          {scanSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-800 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Receipt auto-filled!</strong> {scannedFilename ? `"${scannedFilename}"` : 'Image'} processed. Please review and modify any field before saving.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setScanSuccess(false)}
                className="text-emerald-600 hover:text-emerald-800 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Select Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              required
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name} ({g.members.length} members)
                </option>
              ))}
            </select>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g. Seafood Dinner, Uber Cab, Flat Wifi"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full pl-7 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Category & Payer & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Food">Food</option>
                <option value="Travel">Travel</option>
                <option value="Accommodation">Accommodation</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Groceries">Groceries</option>
                <option value="Rent">Rent</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {currentGroup?.members.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} {m.user._id === user?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Split Method Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Splitting Method
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'EQUAL', label: 'Split Equally' },
                { id: 'CUSTOM', label: 'Custom Shares (₹)' },
                { id: 'PERCENTAGE', label: 'Percentage (%)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSplitType(tab.id)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    splitType === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Participants Selection & Custom Amounts */}
          <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Included Members ({selectedParticipants.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Click to include/exclude members
              </span>
            </div>

            <div className="space-y-2">
              {currentGroup?.members.map((m) => {
                const isSelected = selectedParticipants.includes(m.user._id);
                return (
                  <div
                    key={m.user._id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-white border-blue-200 shadow-xs'
                        : 'bg-transparent border-transparent opacity-60'
                    }`}
                  >
                    <div
                      onClick={() => toggleParticipant(m.user._id)}
                      className="flex items-center gap-2.5 cursor-pointer flex-1"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <img
                        src={
                          m.user.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${m.user.name}`
                        }
                        alt={m.user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-slate-800">
                        {m.user.name} {m.user._id === user?.id ? '(You)' : ''}
                      </span>
                    </div>

                    {/* Custom Split Inputs */}
                    {isSelected && splitType === 'CUSTOM' && (
                      <div className="flex items-center gap-1 w-28">
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={customShares[m.user._id] || ''}
                          onChange={(e) => handleCustomShareChange(m.user._id, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 font-semibold"
                        />
                      </div>
                    )}

                    {/* Percentage Split Inputs */}
                    {isSelected && splitType === 'PERCENTAGE' && (
                      <div className="flex items-center gap-1 w-24">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={percentageShares[m.user._id] || ''}
                          onChange={(e) => handlePercentageChange(m.user._id, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 font-semibold"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    )}

                    {isSelected && splitType === 'EQUAL' && (
                      <span className="text-[11px] text-slate-500 font-medium">
                        {amountRupees
                          ? `₹${(parseFloat(amountRupees) / selectedParticipants.length).toFixed(2)}`
                          : 'Equal share'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optional Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Receipt invoice #102, paid via GPay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
