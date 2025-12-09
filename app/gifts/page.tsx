'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

interface GiftItem {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  userName: string;
  userEmail: string;
  turnOrder: number | null;
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [myGifts, setMyGifts] = useState<GiftItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null);
  const [editingGiftId, setEditingGiftId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchParticipation = async () => {
    try {
      const res = await fetch('/api/participants');
      if (res.ok) {
        const data = await res.json();
        setIsParticipating(data.isParticipating);
      }
    } catch (error) {
      console.error('Failed to fetch participation', error);
    }
  };

  const fetchGifts = async () => {
    try {
      const giftsRes = await fetch('/api/gifts');
      if (giftsRes.ok) {
        const data = await giftsRes.json();
        setGifts(data.sort((a: GiftItem, b: GiftItem) => (a.turnOrder || 999) - (b.turnOrder || 999)));
        
        // Filter current user's gifts
        if (currentUser) {
          const userGifts = data.filter((g: GiftItem) => g.userId === currentUser.id);
          setMyGifts(userGifts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch gifts', error);
    }
  };

  const handleShuffle = async () => {
    try {
      const res = await fetch('/api/gifts/shuffle', { method: 'POST' });
      if (res.ok) {
        fetchGifts();
      }
    } catch (error) {
      console.error('Failed to shuffle gifts', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch current user first
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const user = await userRes.json();
          setCurrentUser(user);
          
          // Then fetch participation and gifts in parallel
          await Promise.all([fetchParticipation(), fetchGifts()]);
        }
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Update myGifts when currentUser or gifts change
  useEffect(() => {
    if (currentUser && gifts.length > 0) {
      const userGifts = gifts.filter((g: GiftItem) => g.userId === currentUser.id);
      setMyGifts(userGifts);
    }
  }, [currentUser, gifts]);

  const handleJoin = async () => {
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
      });

      if (res.ok) {
        setIsParticipating(true);
      }
    } catch (error) {
      console.error('Failed to join', error);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave White Elephant? Your gifts will remain but you won\'t be listed as a participant.')) {
      return;
    }

    try {
      const res = await fetch('/api/participants', {
        method: 'DELETE',
      });

      if (res.ok) {
        setIsParticipating(false);
      }
    } catch (error) {
      console.error('Failed to leave', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGiftId) {
        // Update existing gift
        const res = await fetch(`/api/gifts/${editingGiftId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setShowForm(false);
          setEditingGiftId(null);
          setFormData({ name: '', description: '' });
          fetchGifts();
        }
      } else {
        // Create new gift
        const res = await fetch('/api/gifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          setShowForm(false);
          setFormData({ name: '', description: '' });
          fetchGifts();
        }
      }
    } catch (error) {
      console.error('Failed to save gift', error);
    }
  };

  const handleAddGift = () => {
    setEditingGiftId(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  const handleEditGift = (gift: GiftItem) => {
    setEditingGiftId(gift.id);
    setFormData({
      name: gift.name,
      description: gift.description || '',
    });
    setShowForm(true);
  };

  const handleDeleteGift = async (giftId: number) => {
    if (!confirm('Are you sure you want to remove this gift?')) {
      return;
    }

    try {
      const res = await fetch(`/api/gifts/${giftId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchGifts();
      }
    } catch (error) {
      console.error('Failed to delete gift', error);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)] pb-20">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-black/85 backdrop-blur-xl border-b border-black/5 dark:border-white/10 px-5 py-4 pt-[calc(env(safe-area-inset-top)+0.5rem)] flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white leading-snug">🎄 White Elephant</h1>
          </div>
          <div className="flex items-center gap-2">
            {isParticipating && (
              <button
                onClick={handleAddGift}
                className="p-2.5 rounded-full bg-[#34C759] text-black hover:bg-[#2EC254] active:scale-95 transition-all shadow-sm dark:bg-[#30D158] dark:hover:bg-[#2BC451]"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center overflow-hidden p-0 sm:p-4">
          <div className="bg-white dark:bg-neutral-950 w-full h-full sm:h-auto sm:max-w-md sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-black/5 dark:border-white/10 flex flex-col sm:max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 dark:border-white/10">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {editingGiftId ? 'Edit Gift' : 'Add a Gift'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGiftId(null);
                  setFormData({ name: '', description: '' });
                }}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-600 dark:text-neutral-300"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Gift Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                    placeholder="e.g., Coffee Maker"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 dark:text-white text-neutral-900 p-3 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/40 outline-none"
                    rows={3}
                    placeholder="Add any details about your gift..."
                  />
                </div>
              </div>

              <div className="p-5 pb-7 border-t border-black/5 dark:border-white/10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md safe-area-inset-bottom">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#34C759] text-black hover:bg-[#2EC254] dark:bg-[#30D158] dark:hover:bg-[#2BC451] transition-colors font-semibold text-base shadow-lg shadow-black/10"
                >
                  {editingGiftId ? 'Update Gift' : 'Add Gift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-5 space-y-6">
        <div className="bg-white/95 dark:bg-neutral-950 rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Your Participation</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {isParticipating 
                  ? myGifts.length > 0 
                    ? `You're participating with ${myGifts.length} gift${myGifts.length !== 1 ? 's' : ''}`
                    : "You're participating! Add gifts or just enjoy the exchange."
                  : 'Join to participate in the gift exchange. Adding gifts is optional!'}
              </p>
            </div>
          </div>

          {!isParticipating ? (
            <button
              onClick={handleJoin}
              className="w-full py-3 px-4 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors font-semibold flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Join White Elephant
            </button>
          ) : (
            <div className="space-y-3">
              {myGifts.length === 0 ? (
                <div className="p-4 bg-neutral-100/80 dark:bg-neutral-900/60 rounded-2xl text-center border border-black/5 dark:border-white/5">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    You haven't added any gifts yet
                  </p>
                  <button
                    onClick={handleAddGift}
                    className="py-2.5 px-4 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add a Gift
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Your Gifts ({myGifts.length})
                    </h3>
                    {myGifts.map((gift) => (
                      <div
                        key={gift.id}
                        className="p-3 bg-neutral-100/60 dark:bg-neutral-900/70 rounded-xl border border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-neutral-900 dark:text-white">{gift.name}</h4>
                              {gift.turnOrder && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-neutral-900 text-white rounded-full">
                                  #{gift.turnOrder}
                                </span>
                              )}
                            </div>
                            {gift.description && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{gift.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEditGift(gift)}
                              className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGift(gift.id)}
                              className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <button
                onClick={handleLeave}
                className="w-full py-2.5 px-4 rounded-xl border border-black/10 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors font-semibold"
              >
                Leave White Elephant
              </button>
            </div>
          )}
        </div>

        <div className="bg-white/95 dark:bg-neutral-950 rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              All Gifts ({gifts.length})
            </div>
            {gifts.length > 0 && (
              <button
                onClick={handleShuffle}
                className="text-xs px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors border border-black/5 dark:border-white/5"
              >
                Assign Numbers
              </button>
            )}
          </h2>

          {loading ? (
            <div className="text-center py-8 text-neutral-400">Loading gifts...</div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              No one has added gifts yet. Be the first!
            </div>
          ) : (
            <div className="space-y-3">
              {gifts.map((gift) => (
                <div
                  key={gift.id}
                  className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-950 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    {gift.turnOrder && (
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-neutral-900 text-white font-semibold rounded-full shadow-sm text-lg">
                        {gift.turnOrder}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {!gift.turnOrder && (
                          <div className="p-2 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-black/5 dark:border-white/5">
                            <Gift className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-900 dark:text-white">{gift.name}</h3>
                          {gift.description && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{gift.description}</p>
                          )}
                          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                            From {gift.userName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
