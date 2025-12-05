import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface TrainingFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrainingForm({ onClose, onSuccess }: TrainingFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    training_name: '',
    training_type: 'safety',
    completion_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    certificate_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('training_records').insert({
        ...formData,
        user_id: user.id,
        expiry_date: formData.expiry_date || null,
      });

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error creating training record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Training Record</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Training Name
            </label>
            <input
              type="text"
              value={formData.training_name}
              onChange={(e) => setFormData({ ...formData, training_name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Fire Safety Training Level 2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Training Type
            </label>
            <select
              value={formData.training_type}
              onChange={(e) => setFormData({ ...formData, training_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="safety">Safety</option>
              <option value="environmental">Environmental</option>
              <option value="security">Security</option>
              <option value="health">Health</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion Date
              </label>
              <input
                type="date"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Number (Optional)
            </label>
            <input
              type="text"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., CERT-2024-12345"
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Training Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
