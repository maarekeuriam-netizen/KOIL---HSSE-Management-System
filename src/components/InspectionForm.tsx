import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface InspectionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function InspectionForm({ onClose, onSuccess }: InspectionFormProps) {
  const [loading, setLoading] = useState(false);
  const [reportedBy, setReportedBy] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    location_id: '',
    location: '',
    inspection_date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    issue: '',
    recommendation: '',
  });

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      setReportedBy(profile?.full_name || user.email || 'Unknown User');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('inspections').insert({
        ...formData,
        user_id: user.id,
        reported_by: reportedBy,
        reporting_type: 'nearmiss',
        inspection_type: 'routine',
        status: 'open',
      });

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error creating near miss report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Report Near Miss</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reported By
            </label>
            <input
              type="text"
              value={reportedBy}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location ID
              </label>
              <input
                type="text"
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                placeholder="e.g., BLDG-A-101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                placeholder="e.g., Production Floor - Zone A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title / Summary
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              placeholder="Brief description of the near miss"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description / Issue
            </label>
            <textarea
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              rows={4}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              placeholder="Detailed description of what happened, conditions observed, and potential hazards..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendation
            </label>
            <textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              rows={3}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              placeholder="Suggested actions or preventive measures to avoid future incidents..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Near Miss Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
