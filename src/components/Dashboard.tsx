import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Incident, Inspection, RiskAssessment, TrainingRecord } from '../types';
import { AlertTriangle, ClipboardCheck, Shield, GraduationCap, TrendingUp, Clock, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    nearMiss: {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0,
    },
    incidents: {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0,
    },
    audits: {
      total: 0,
      open: 0,
      inProgress: 0,
      closed: 0,
    },
    riskAssessments: {
      total: 0,
      draft: 0,
      underReview: 0,
      approved: 0,
    },
    training: {
      total: 0,
      valid: 0,
      expiringSoon: 0,
      expired: 0,
    },
  });
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadDashboardData();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', user.id)
        .single();
      setIsAdmin(profile?.role === 'admin');
    }
  };

  const loadDashboardData = async () => {
    try {
      const [incidents, inspections, riskAssessments, training] = await Promise.all([
        supabase.from('incidents').select('*').order('created_at', { ascending: false }),
        supabase.from('inspections').select('*'),
        supabase.from('risk_assessments').select('*'),
        supabase.from('training_records').select('*'),
      ]);

      if (incidents.data) {
        const incidentStats = {
          total: incidents.data.length,
          open: incidents.data.filter(i => i.status === 'open').length,
          inProgress: incidents.data.filter(i => i.status === 'investigating').length,
          closed: incidents.data.filter(i => i.status === 'closed' || i.status === 'resolved').length,
        };
        setStats(prev => ({
          ...prev,
          incidents: incidentStats,
        }));
        setRecentIncidents(incidents.data.slice(0, 5));
      }

      if (inspections.data) {
        const nearMissData = inspections.data.filter(i => i.inspection_type !== 'audit');
        const auditData = inspections.data.filter(i => i.inspection_type === 'audit');

        const nearMissStats = {
          total: nearMissData.length,
          open: nearMissData.filter(i => i.status === 'open').length,
          inProgress: nearMissData.filter(i => i.status === 'in_progress').length,
          closed: nearMissData.filter(i => i.status === 'closed').length,
        };

        const auditStats = {
          total: auditData.length,
          open: auditData.filter(i => i.status === 'open').length,
          inProgress: auditData.filter(i => i.status === 'in_progress').length,
          closed: auditData.filter(i => i.status === 'closed').length,
        };

        setStats(prev => ({
          ...prev,
          nearMiss: nearMissStats,
          audits: auditStats,
        }));
      }

      if (riskAssessments.data) {
        const riskStats = {
          total: riskAssessments.data.length,
          draft: riskAssessments.data.filter(r => r.status === 'draft').length,
          underReview: riskAssessments.data.filter(r => r.status === 'under_review').length,
          approved: riskAssessments.data.filter(r => r.status === 'approved').length,
        };
        setStats(prev => ({
          ...prev,
          riskAssessments: riskStats,
        }));
      }

      if (training.data) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const trainingStats = {
          total: training.data.length,
          valid: training.data.filter(t => t.status === 'valid').length,
          expiringSoon: training.data.filter(t => {
            if (!t.expiry_date) return false;
            const expiryDate = new Date(t.expiry_date);
            return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
          }).length,
          expired: training.data.filter(t => t.status === 'expired').length,
        };
        setStats(prev => ({
          ...prev,
          training: trainingStats,
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string, table: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete this ${itemName}?`)) {
      return;
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Failed to delete: ${error.message}`);
    } else {
      loadDashboardData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Key metrics and recent activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Near Miss</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.nearMiss.total}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open</span>
              <span className="text-sm font-semibold text-yellow-600">{stats.nearMiss.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-semibold text-blue-600">{stats.nearMiss.inProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Closed</span>
              <span className="text-sm font-semibold text-green-600">{stats.nearMiss.closed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Incidents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.incidents.total}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open</span>
              <span className="text-sm font-semibold text-yellow-600">{stats.incidents.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-semibold text-blue-600">{stats.incidents.inProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Closed</span>
              <span className="text-sm font-semibold text-green-600">{stats.incidents.closed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Audits</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.audits.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open</span>
              <span className="text-sm font-semibold text-yellow-600">{stats.audits.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-semibold text-blue-600">{stats.audits.inProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Closed</span>
              <span className="text-sm font-semibold text-green-600">{stats.audits.closed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Assessments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.riskAssessments.total}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Draft</span>
              <span className="text-sm font-semibold text-gray-600">{stats.riskAssessments.draft}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Under Review</span>
              <span className="text-sm font-semibold text-blue-600">{stats.riskAssessments.underReview}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="text-sm font-semibold text-green-600">{stats.riskAssessments.approved}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Training</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.training.total}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Valid</span>
              <span className="text-sm font-semibold text-green-600">{stats.training.valid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expiring Soon</span>
              <span className="text-sm font-semibold text-orange-600">{stats.training.expiringSoon}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expired</span>
              <span className="text-sm font-semibold text-red-600">{stats.training.expired}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentIncidents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No incidents reported yet
            </div>
          ) : (
            recentIncidents.map((incident) => (
              <div key={incident.id} className="p-4 sm:p-6 hover:bg-gray-50 transition">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:justify-between">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{incident.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{incident.description}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </span>
                      <span>{incident.location}</span>
                      <span className="capitalize">{incident.incident_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full capitalize whitespace-nowrap ${
                      incident.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      incident.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {incident.status}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(incident.id, 'incidents', 'incident')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete incident"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
