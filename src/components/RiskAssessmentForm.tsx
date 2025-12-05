import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface RiskAssessmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RiskAssessmentForm({ onClose, onSuccess }: RiskAssessmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    activity: '',
    hazard_identified: '',
    likelihood: 1,
    consequence: 1,
    control_measures: '',
  });

  const riskLevel = formData.likelihood * formData.consequence;
  const getRiskColor = () => {
    if (riskLevel >= 15) return 'bg-red-500';
    if (riskLevel >= 10) return 'bg-orange-500';
    if (riskLevel >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskLabel = () => {
    if (riskLevel >= 15) return 'Critical Risk';
    if (riskLevel >= 10) return 'High Risk';
    if (riskLevel >= 5) return 'Medium Risk';
    return 'Low Risk';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('risk_assessments').insert({
        ...formData,
        user_id: user.id,
      });

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Error creating risk assessment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">New Risk Assessment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Working at Heights - Building Maintenance"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity
            </label>
            <input
              type="text"
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Describe the work activity"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hazard Identified
            </label>
            <textarea
              value={formData.hazard_identified}
              onChange={(e) => setFormData({ ...formData, hazard_identified: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="What are the potential hazards?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Likelihood (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.likelihood}
                onChange={(e) => setFormData({ ...formData, likelihood: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Rare</span>
                <span className="font-semibold text-gray-900">{formData.likelihood}</span>
                <span>Certain</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consequence (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.consequence}
                onChange={(e) => setFormData({ ...formData, consequence: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Minor</span>
                <span className="font-semibold text-gray-900">{formData.consequence}</span>
                <span>Catastrophic</span>
              </div>
            </div>
          </div>

          <div className={`${getRiskColor()} text-white rounded-lg p-4 text-center`}>
            <div className="text-sm font-medium opacity-90">Risk Level</div>
            <div className="text-3xl font-bold mt-1">{riskLevel}</div>
            <div className="text-sm font-medium mt-1">{getRiskLabel()}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Control Measures
            </label>
            <textarea
              value={formData.control_measures}
              onChange={(e) => setFormData({ ...formData, control_measures: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="What measures are in place to control this risk?"
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
              {loading ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
