'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';

interface GiftItem {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  userName: string;
  userEmail: string;
}

export default function GiftsPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [myGift, setMyGift] = useState<GiftItem | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const fetchGifts = async () => {
    try {
      const giftsRes = await fetch('/api/gifts');
      if (giftsRes.ok) {
        const data = await giftsRes.json();
        setGifts(data);
        
        // Check if current user has a gift (only if user is already loaded)
        if (currentUser) {
          const myGiftData = data.find((g: GiftItem) => g.userId === currentUser.id);
          setIsParticipating(!!myGiftData);
          setMyGift(myGiftData || null);
          if (myGiftData) {
            setFormData({
              name: myGiftData.name,
              description: myGiftData.description || '',
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch gifts', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // Fetch current user first
      try {
        const userRes = await fetch('/api/user');
        if (userRes.ok) {
          const user = await userRes.json();
          setCurrentUser(user);
          
          // Then fetch gifts
          const giftsRes = await fetch('/api/gifts');
          if (giftsRes.ok) {
            const data = await giftsRes.json();
            setGifts(data);
            
            // Check if current user has a gift
            const myGiftData = data.find((g: GiftItem) => g.userId === user.id);
            setIsParticipating(!!myGiftData);
            setMyGift(myGiftData || null);
            if (myGiftData) {
              setFormData({
                name: myGiftData.name,
                description: myGiftData.description || '',
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load data', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        fetchGifts();
      }
    } catch (error) {
      console.error('Failed to save gift', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to opt out of White Elephant?')) {
      return;
    }

    try {
      const res = await fetch('/api/gifts', {
        method: 'DELETE',
      });

      if (res.ok) {
        setIsParticipating(false);
        setMyGift(null);
        setFormData({ name: '', description: '' });
        fetchGifts();
      }
    } catch (error) {
      console.error('Failed to delete gift', error);
    }
  };

  const toggleParticipation = () => {
    if (isParticipating) {
      handleDelete();
    } else {
      setShowForm(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">White Elephant</h1>
        <ThemeToggle />
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Participation</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isParticipating ? 'You are participating' : 'You are not participating'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isParticipating}
                onChange={toggleParticipation}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
            </label>
          </div>

          {isParticipating && myGift && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{myGift.name}</h3>
                  {myGift.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{myGift.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {myGift ? 'Edit Your Gift' : 'Add Your Gift'}
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
                    if (!myGift) {
                      setFormData({ name: '', description: '' });
                    }
                  }}
                  className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  {myGift ? 'Update' : 'Add Gift'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            All Gifts ({gifts.length})
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
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Gift className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
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
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

