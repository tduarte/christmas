'use client';

import { useState, useEffect } from 'react';
import { Calendar, Utensils, User, Gift, Sparkles } from 'lucide-react';

interface Dinner {
  date: string;
  host: string;
  dish: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dinners' | 'white-elephant'>('dinners');
  const [dinners, setDinners] = useState<Dinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ date: '', host: '', dish: '' });

  useEffect(() => {
    fetchDinners();
  }, []);

  const fetchDinners = async () => {
    try {
      const res = await fetch('/api/dinners');
      if (res.ok) {
        const data = await res.json();
        setDinners(data);
      }
    } catch (error) {
      console.error('Failed to fetch dinners', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.host || !formData.dish) return;

    try {
      const res = await fetch('/api/dinners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ date: '', host: '', dish: '' });
        fetchDinners();
      }
    } catch (error) {
      console.error('Failed to add dinner', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-red-700 tracking-tight flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-500" />
            Family Christmas
            <Sparkles className="text-yellow-500" />
          </h1>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('dinners')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'dinners'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-red-50'
              }`}
            >
              Dinners
            </button>
            <button
              onClick={() => setActiveTab('white-elephant')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'white-elephant'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-green-50'
              }`}
            >
              White Elephant
            </button>
          </div>
        </header>

        {activeTab === 'dinners' ? (
          <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Dinner List */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <Utensils className="w-6 h-6 text-red-500" />
                Upcoming Dinners
              </h2>
              
              {loading ? (
                <div className="text-center py-8 text-gray-400">Loading festive plans...</div>
              ) : dinners.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No dinners planned yet!</div>
              ) : (
                <div className="space-y-4">
                  {dinners.map((dinner, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-red-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2 sm:mb-0">
                        <div className="bg-red-100 p-2 rounded-full">
                          <Calendar className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="font-medium text-gray-900">{dinner.date}</span>
                      </div>
                      <div className="flex flex-col sm:text-right">
                        <span className="font-semibold text-gray-800 flex items-center sm:justify-end gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {dinner.host}
                        </span>
                        <span className="text-sm text-gray-500">{dinner.dish}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Add Dinner Form */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add New Dinner</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
                  <input
                    type="text"
                    placeholder="Who is hosting?"
                    className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    value={formData.host}
                    onChange={e => setFormData({ ...formData, host: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Dish</label>
                  <input
                    type="text"
                    placeholder="What are we eating?"
                    className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    value={formData.dish}
                    onChange={e => setFormData({ ...formData, dish: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm active:scale-[0.98]"
                >
                  Add Dinner
                </button>
              </form>
            </section>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Gift className="w-16 h-16 text-green-600 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-gray-800 mb-2">White Elephant Exchange</h2>
             <p className="text-gray-600 mb-8">Ready to draw names? (Coming soon!)</p>
             <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 rounded-full transition-colors shadow-lg active:scale-[0.98]">
               Start Drawing
             </button>
          </div>
        )}
      </div>
    </main>
  );
}
