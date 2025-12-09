'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Mail } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import ThemeToggle from '@/components/ThemeToggle';

interface UserInfo {
  id: number;
  email: string;
  name: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)] pb-20">
        <div className="p-5">
          <div className="text-center py-12 text-neutral-400">Loading...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)] pb-20">
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-black/85 border-b border-black/5 dark:border-white/10 px-5 py-4 flex items-center justify-between backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white leading-snug">🎄 Profile</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="p-5 space-y-6">
        <div className="bg-white/95 dark:bg-neutral-950 rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center border border-black/5 dark:border-white/5">
              <User className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{user?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                <Mail className="w-4 h-4" />
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-neutral-950 rounded-3xl border border-black/5 dark:border-white/10 overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors text-neutral-900 dark:text-white"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold">Log Out</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
