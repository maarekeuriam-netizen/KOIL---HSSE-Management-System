import ChatAssistant from "../components/ChatAssistant";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AlertTriangle, ClipboardCheck, GraduationCap } from "lucide-react";

type StatGroup = {
  total: number;
  open: number;
  inProgress: number;
  closed: number;
};

type TrainingStatGroup = {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
};

type DashboardStats = {
  nearMiss: StatGroup;
  incidents: StatGroup;
  audits: StatGroup;
  training: TrainingStatGroup;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    nearMiss: { total: 0, open: 0, inProgress: 0, closed: 0 },
    incidents: { total: 0, open: 0, inProgress: 0, closed: 0 },
    audits: { total: 0, open: 0, inProgress: 0, closed: 0 },
    training: { total: 0, valid: 0, expiringSoon: 0, expired: 0 },
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [incidents, inspections, training] = await Promise.all([
        supabase.from("incidents").select("*"),
        supabase.from("inspections").select("*"),
        supabase.from("training_records").select("*"),
      ]);

      // Incidents stats
      if (incidents.data) {
        const incidentStats: StatGroup = {
          total: incidents.data.length,
          open: incidents.data.filter((i: any) => i.status === "open").length,
          inProgress: incidents.data.filter(
            (i: any) => i.status === "investigating"
          ).length,
          closed: incidents.data.filter(
            (i: any) => i.status === "closed" || i.status === "resolved"
          ).length,
        };

        setStats((prev) => ({
          ...prev,
          incidents: incidentStats,
        }));
      }

      // Near Miss & Audits stats (from inspections)
      if (inspections.data) {
        const nearMissData = inspections.data.filter(
          (i: any) => i.inspection_type !== "audit"
        );
        const auditData = inspections.data.filter(
          (i: any) => i.inspection_type === "audit"
        );

        const nearMissStats: StatGroup = {
          total: nearMissData.length,
          open: nearMissData.filter((i: any) => i.status === "open").length,
          inProgress: nearMissData.filter(
            (i: any) => i.status === "in_progress"
          ).length,
          closed: nearMissData.filter((i: any) => i.status === "closed").length,
        };

        const auditStats: StatGroup = {
          total: auditData.length,
          open: auditData.filter((i: any) => i.status === "open").length,
          inProgress: auditData.filter(
            (i: any) => i.status === "in_progress"
          ).length,
          closed: auditData.filter((i: any) => i.status === "closed").length,
        };

        setStats((prev) => ({
          ...prev,
          nearMiss: nearMissStats,
          audits: auditStats,
        }));
      }

      // Training stats
      if (training.data) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        const trainingStats: TrainingStatGroup = {
          total: training.data.length,
          valid: training.data.filter((t: any) => t.status === "valid").length,
          expiringSoon: training.data.filter((t: any) => {
            if (!t.expiry_date) return false;
            const expiryDate = new Date(t.expiry_date);
            return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
          }).length,
          expired: training.data.filter(
            (t: any) => t.status === "expired"
          ).length,
        };

        setStats((prev) => ({
          ...prev,
          training: trainingStats,
        }));
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">
          Status of incidents, near misses, audits and training
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Near Miss */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Near Miss</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.nearMiss.total}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open</span>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.nearMiss.open}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.nearMiss.inProgress}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Closed</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.nearMiss.closed}
              </span>
            </div>
          </div>
        </div>

        {/* Incidents */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Incidents</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.incidents.total}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open</span>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.incidents.open}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.incidents.inProgress}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Closed</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.incidents.closed}
              </span>
            </div>
          </div>
        </div>

        {/* Audits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Audits</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.audits.total}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ClipboardCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Open</span>
              <span className="text-sm font-semibold text-yellow-600">
                {stats.audits.open}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-semibold text-blue-600">
                {stats.audits.inProgress}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Closed</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.audits.closed}
              </span>
            </div>
          </div>
        </div>

        {/* Training */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Training</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.training.total}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Valid</span>
              <span className="text-sm font-semibold text-green-600">
                {stats.training.valid}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expiring Soon</span>
              <span className="text-sm font-semibold text-orange-600">
                {stats.training.expiringSoon}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expired</span>
              <span className="text-sm font-semibold text-red-600">
                {stats.training.expired}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HSSE AI Assistant */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            HSSE AI Assistant
          </h3>
          <p className="text-gray-600 mt-1 text-sm">
            Ask questions about incidents, near misses, audits and training.
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <ChatAssistant />
        </div>
      </div>
    </div>
  );
}
