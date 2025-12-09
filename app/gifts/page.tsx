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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">White Elephant</h1>
        <div className="flex items-center gap-2">
          {isParticipating && (
            <button
              onClick={handleAddGift}
              className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingGiftId ? 'Edit Gift' : 'Add a Gift'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gift Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="e.g., Coffee Maker"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border p-2 focus:ring-2 focus:ring-red-500 outline-none"
                  rows={3}
                  placeholder="Add any details about your gift..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGiftId(null);
                    setFormData({ name: '', description: '' });
                  }}
                  className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  {editingGiftId ? 'Update Gift' : 'Add Gift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Participation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
              className="w-full py-3 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Join White Elephant
            </button>
          ) : (
            <div className="space-y-3">
              {myGifts.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    You haven't added any gifts yet
                  </p>
                  <button
                    onClick={handleAddGift}
                    className="py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add a Gift
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your Gifts ({myGifts.length})
                    </h3>
                    {myGifts.map((gift) => (
                      <div
                        key={gift.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">{gift.name}</h4>
                              {gift.turnOrder && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                                  #{gift.turnOrder}
                                </span>
                              )}
                            </div>
                            {gift.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{gift.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEditGift(gift)}
                              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteGift(gift.id)}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
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
                className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Leave White Elephant
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              All Gifts ({gifts.length})
            </div>
            {gifts.length > 0 && (
              <button
                onClick={handleShuffle}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Assign Numbers
              </button>
            )}
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading gifts...</div>
          ) : gifts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No one has added gifts yet. Be the first!
            </div>
          ) : (
            <div className="space-y-3">
              {gifts.map((gift) => (
                <div
                  key={gift.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    {gift.turnOrder && (
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-600 text-white font-bold rounded-full shadow-sm text-lg">
                        {gift.turnOrder}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {!gift.turnOrder && (
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Gift className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{gift.name}</h3>
                          {gift.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{gift.description}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
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
