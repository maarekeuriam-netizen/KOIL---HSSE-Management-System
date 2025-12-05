import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Incident, Inspection, RiskAssessment, TrainingRecord } from '../types';
import {
  Search,
  Calendar,
  MapPin,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  GraduationCap,
  Trash2,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Filter,
  X,
  ArrowLeft
} from 'lucide-react';

type RecordType = 'incidents' | 'inspections' | 'risk_assessments' | 'training_records' | 'near_miss' | 'audits';

export default function RecordsViewer() {
  const [activeType, setActiveType] = useState<RecordType | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');

  useEffect(() => {
    checkAdminStatus();
    loadAllRecords();
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

  const loadAllRecords = async () => {
    setLoading(true);
    const [incidentsData, inspectionsData, risksData, trainingData] = await Promise.all([
      supabase.from('incidents').select('*').order('created_at', { ascending: false }),
      supabase.from('inspections').select('*').order('created_at', { ascending: false }),
      supabase.from('risk_assessments').select('*').order('created_at', { ascending: false }),
      supabase.from('training_records').select('*').order('created_at', { ascending: false }),
    ]);

    if (incidentsData.data) setIncidents(incidentsData.data);
    if (inspectionsData.data) setInspections(inspectionsData.data);
    if (risksData.data) setRiskAssessments(risksData.data);
    if (trainingData.data) setTrainingRecords(trainingData.data);

    setLoading(false);
  };

  const getTableName = () => {
    switch (activeType) {
      case 'incidents':
        return 'incidents';
      case 'near_miss':
      case 'audits':
      case 'inspections':
        return 'inspections';
      case 'risk_assessments':
        return 'risk_assessments';
      case 'training_records':
        return 'training_records';
      default:
        return 'inspections';
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected records? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    const idsArray = Array.from(selectedIds);

    try {
      const { error } = await supabase
        .from(getTableName())
        .delete()
        .in('id', idsArray);

      if (error) {
        alert(`Failed to delete records: ${error.message}`);
      } else {
        alert(`Successfully deleted ${selectedIds.size} records`);
        setSelectedIds(new Set());
        loadAllRecords();
      }
    } catch (error) {
      alert('An error occurred during deletion');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    const filteredRecords = getFilteredRecords();
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const updateStatus = async (recordId: string, newStatus: string) => {
    setUpdatingStatus(prev => new Set(prev).add(recordId));

    try {
      const { error } = await supabase
        .from(getTableName())
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) {
        alert(`Failed to update status: ${error.message}`);
      } else {
        loadAllRecords();
      }
    } catch (error) {
      alert('An error occurred while updating status');
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };

  const clearFilters = () => {
    setFilterStatus('');
    setFilterLocation('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSeverity('');
    setSearchTerm('');
  };

  const getUniqueLocations = () => {
    let records: any[] = [];
    switch (activeType) {
      case 'incidents':
        records = incidents.filter(i => i.incident_type !== 'near_miss');
        break;
      case 'near_miss':
        records = inspections.filter(i => i.reporting_type?.toLowerCase() === 'nearmiss');
        break;
      case 'audits':
        records = inspections.filter(i => i.inspection_type?.toLowerCase() === 'audit');
        break;
      case 'inspections':
        records = inspections.filter(i =>
          i.reporting_type?.toLowerCase() !== 'nearmiss' &&
          i.inspection_type?.toLowerCase() !== 'audit'
        );
        break;
      case 'risk_assessments':
        records = riskAssessments;
        break;
      case 'training_records':
        records = trainingRecords;
        break;
    }
    const locations = new Set<string>();
    records.forEach(r => {
      if (r.location) locations.add(r.location);
      if (r.location_id) locations.add(r.location_id);
    });
    return Array.from(locations).sort();
  };

  const getFilteredRecords = () => {
    let records: any[] = [];

    switch (activeType) {
      case 'incidents':
        records = incidents.filter(i => i.incident_type !== 'near_miss');
        break;
      case 'near_miss':
        records = inspections.filter(i => i.reporting_type?.toLowerCase() === 'nearmiss');
        break;
      case 'audits':
        records = inspections.filter(i => i.inspection_type?.toLowerCase() === 'audit');
        break;
      case 'inspections':
        records = inspections.filter(i =>
          i.reporting_type?.toLowerCase() !== 'nearmiss' &&
          i.inspection_type?.toLowerCase() !== 'audit'
        );
        break;
      case 'risk_assessments':
        records = riskAssessments;
        break;
      case 'training_records':
        records = trainingRecords;
        break;
    }

    if (searchTerm) {
      records = records.filter(record =>
        JSON.stringify(record).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus) {
      records = records.filter(record => record.status === filterStatus);
    }

    if (filterLocation) {
      records = records.filter(record =>
        record.location === filterLocation || record.location_id === filterLocation
      );
    }

    if (filterSeverity) {
      records = records.filter(record => record.severity === filterSeverity);
    }

    if (filterDateFrom) {
      records = records.filter(record => {
        const recordDate = record.inspection_date || record.incident_date || record.completion_date;
        if (!recordDate) return false;
        return new Date(recordDate) >= new Date(filterDateFrom);
      });
    }

    if (filterDateTo) {
      records = records.filter(record => {
        const recordDate = record.inspection_date || record.incident_date || record.completion_date;
        if (!recordDate) return false;
        return new Date(recordDate) <= new Date(filterDateTo);
      });
    }

    return records;
  };

  const getCategoryCounts = () => {
    return {
      incidents: incidents.filter(i => i.incident_type !== 'near_miss').length,
      near_miss: inspections.filter(i => i.reporting_type?.toLowerCase() === 'nearmiss').length,
      audits: inspections.filter(i => i.inspection_type?.toLowerCase() === 'audit').length,
      inspections: inspections.filter(i =>
        i.reporting_type?.toLowerCase() !== 'nearmiss' &&
        i.inspection_type?.toLowerCase() !== 'audit'
      ).length,
      risk_assessments: riskAssessments.length,
      training_records: trainingRecords.length,
    };
  };

  const filteredRecords = getFilteredRecords();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'text-green-600';
      case 'resolved': return 'text-green-600';
      case 'investigating':
      case 'in_progress': return 'text-blue-600';
      case 'open': return 'text-yellow-600';
      case 'approved': return 'text-green-600';
      case 'valid': return 'text-green-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusOptions = (currentStatus: string) => {
    switch (activeType) {
      case 'incidents':
        return ['open', 'investigating', 'resolved', 'closed'];
      case 'near_miss':
      case 'audits':
      case 'inspections':
        return ['open', 'in_progress', 'closed'];
      case 'risk_assessments':
        return ['draft', 'under_review', 'approved'];
      case 'training_records':
        return ['valid', 'expiring_soon', 'expired'];
      default:
        return ['open', 'in_progress', 'closed'];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading records...</div>
      </div>
    );
  }

  const counts = getCategoryCounts();

  if (!activeType) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Records - Select Category</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveType('incidents')}
              className="flex items-center gap-4 p-6 rounded-lg font-medium transition bg-white border-2 border-gray-200 hover:border-red-500 hover:shadow-lg group"
            >
              <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">Incidents</div>
                <div className="text-3xl font-bold text-red-600">{counts.incidents}</div>
              </div>
            </button>

            <button
              onClick={() => setActiveType('near_miss')}
              className="flex items-center gap-4 p-6 rounded-lg font-medium transition bg-white border-2 border-gray-200 hover:border-yellow-500 hover:shadow-lg group"
            >
              <div className="p-3 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition">
                <AlertCircle size={32} className="text-yellow-600" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">Near Miss</div>
                <div className="text-3xl font-bold text-yellow-600">{counts.near_miss}</div>
              </div>
            </button>

            <button
              onClick={() => setActiveType('audits')}
              className="flex items-center gap-4 p-6 rounded-lg font-medium transition bg-white border-2 border-gray-200 hover:border-teal-500 hover:shadow-lg group"
            >
              <div className="p-3 bg-teal-50 rounded-lg group-hover:bg-teal-100 transition">
                <FileText size={32} className="text-teal-600" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">Audits</div>
                <div className="text-3xl font-bold text-teal-600">{counts.audits}</div>
              </div>
            </button>

            <button
              onClick={() => setActiveType('inspections')}
              className="flex items-center gap-4 p-6 rounded-lg font-medium transition bg-white border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg group"
            >
              <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition">
                <ClipboardCheck size={32} className="text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">Inspections</div>
                <div className="text-3xl font-bold text-blue-600">{counts.inspections}</div>
              </div>
            </button>

            <button
              onClick={() => setActiveType('risk_assessments')}
              className="flex items-center gap-4 p-6 rounded-lg font-medium transition bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg group"
            >
              <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition">
                <Shield size={32} className="text-orange-600" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">Risk Assessments</div>
                <div className="text-3xl font-bold text-orange-600">{counts.risk_assessments}</div>
              </div>
            </button>

            <button
              onClick={() => setActiveType('training_records')}
              className="flex items-center gap-4 p-6 rounded-lg font-medium transition bg-white border-2 border-gray-200 hover:border-green-500 hover:shadow-lg group"
            >
              <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition">
                <GraduationCap size={32} className="text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-gray-900">Training Records</div>
                <div className="text-3xl font-bold text-green-600">{counts.training_records}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              setActiveType(null);
              setSelectedIds(new Set());
              clearFilters();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {activeType === 'near_miss' ? 'Near Miss Reports' :
             activeType === 'audits' ? 'Audit Reports' :
             activeType === 'incidents' ? 'Incident Reports' :
             activeType === 'inspections' ? 'Inspection Reports' :
             activeType === 'risk_assessments' ? 'Risk Assessment Reports' :
             'Training Records'}
          </h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                showFilters || filterStatus || filterLocation || filterDateFrom || filterDateTo || filterSeverity
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">Filter Options</h3>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <X size={16} />
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {getUniqueLocations().map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Severities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {(filterStatus || filterLocation || filterDateFrom || filterDateTo || filterSeverity) && (
                <div className="pt-2 border-t border-gray-300">
                  <div className="flex flex-wrap gap-2">
                    {filterStatus && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Status: {filterStatus}
                        <button onClick={() => setFilterStatus('')} className="hover:text-blue-900">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {filterLocation && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Location: {filterLocation}
                        <button onClick={() => setFilterLocation('')} className="hover:text-blue-900">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {filterSeverity && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Severity: {filterSeverity}
                        <button onClick={() => setFilterSeverity('')} className="hover:text-blue-900">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {filterDateFrom && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        From: {filterDateFrom}
                        <button onClick={() => setFilterDateFrom('')} className="hover:text-blue-900">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                    {filterDateTo && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        To: {filterDateTo}
                        <button onClick={() => setFilterDateTo('')} className="hover:text-blue-900">
                          <X size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredRecords.length} {activeType.replace('_', ' ')}
            {selectedIds.size > 0 && (
              <span className="ml-2 text-blue-600 font-semibold">
                ({selectedIds.size} selected)
              </span>
            )}
          </div>

          {isAdmin && filteredRecords.length > 0 && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredRecords.length && filteredRecords.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                Select All
              </label>

              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  Delete Selected ({selectedIds.size})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[calc(100vh-300px)]">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No records found
            </div>
          ) : activeType === 'incidents' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                <tr>
                  {isAdmin && (
                    <th className="px-3 py-3 text-left bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredRecords.length && filteredRecords.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Ref No</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Type</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Severity</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[250px]">Description</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Location</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Date</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Time</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Status</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Reporter</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[200px]">Root Cause</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[200px]">Impact</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[200px]">Action Taken</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[200px]">Recommendations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record: any, index) => (
                  <tr
                    key={record.id}
                    className={`hover:bg-gray-50 ${
                      selectedIds.has(record.id) ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    {isAdmin && (
                      <td className={`px-3 py-3 ${
                        selectedIds.has(record.id) ? 'bg-blue-50' : 'bg-white'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className={`px-3 py-3 text-gray-900 font-medium sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                      selectedIds.has(record.id) ? 'bg-blue-50' : 'bg-white'
                    }`}>{record.ref_no || '-'}</td>
                    <td className="px-3 py-3 text-gray-700 capitalize whitespace-nowrap">
                      {record.incident_type?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold text-white ${getSeverityColor(record.severity)}`}>
                        {record.severity || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.description || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{record.location || '-'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {record.incident_date
                        ? new Date(record.incident_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{record.time || '-'}</td>
                    <td className="px-3 py-3">
                      <select
                        value={record.status}
                        onChange={(e) => updateStatus(record.id, e.target.value)}
                        disabled={updatingStatus.has(record.id)}
                        className={`px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          updatingStatus.has(record.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${getStatusColor(record.status)} font-medium whitespace-nowrap`}
                      >
                        {getStatusOptions(record.status).map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ').toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{record.reporter || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.root_cause || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.impact || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.corrective_actions || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.recommendations || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                <tr>
                  {isAdmin && (
                    <th className="px-3 py-3 text-left bg-gray-100">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredRecords.length && filteredRecords.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">MM no.</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Date</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Time</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Reported by</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Loc ID</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Location</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[200px]">Issue</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Types of Reporting</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[200px]">Action Taken</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100 min-w-[200px]">Recommendation</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Responsible Staff</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Target Date</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-700 bg-gray-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    className={`hover:bg-gray-50 ${
                      selectedIds.has(record.id) ? 'bg-blue-50' : 'bg-white'
                    }`}
                  >
                    {isAdmin && (
                      <td className={`px-3 py-3 ${
                        selectedIds.has(record.id) ? 'bg-blue-50' : 'bg-white'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelect(record.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className={`px-3 py-3 text-gray-900 font-medium sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${
                      selectedIds.has(record.id) ? 'bg-blue-50' : 'bg-white'
                    }`}>{index + 1}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {record.inspection_date || record.incident_date || record.completion_date
                        ? new Date(record.inspection_date || record.incident_date || record.completion_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{record.time || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">{record.reported_by || record.inspector || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">{record.location_id || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">{record.location || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.issue || record.description || record.title || record.hazard_identified || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {record.reporting_type || record.inspection_type || record.incident_type || record.training_type || '-'}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.action_taken || record.corrective_actions || record.control_measures || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="max-w-xs">
                        {record.recommendation || record.findings || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{record.responsible_staff || '-'}</td>
                    <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                      {record.target_date ? new Date(record.target_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 py-3">
                      {record.status && (
                        <select
                          value={record.status}
                          onChange={(e) => updateStatus(record.id, e.target.value)}
                          disabled={updatingStatus.has(record.id)}
                          className={`px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            updatingStatus.has(record.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          } ${getStatusColor(record.status)} font-medium whitespace-nowrap`}
                        >
                          {getStatusOptions(record.status).map((status) => (
                            <option key={status} value={status}>
                              {status.replace('_', ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
