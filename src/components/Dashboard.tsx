import ChatAssistant from "../components/ChatAssistant";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Incident } from "../types";
import {
  AlertTriangle,
  ClipboardCheck,
  Shield,
  GraduationCap,
  Clock,
  Trash2,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    nearMiss: { total: 0, open: 0, inProgress: 0, closed: 0 },
    incidents: { total: 0, open: 0, inProgress: 0, closed: 0 },
    audits: { total: 0, open: 0, inProgress: 0, closed: 0 },
    riskAssessments: { total: 0, draft: 0, underReview: 0, approved: 0 },
    training: { total: 0, valid: 0, expiringSoon: 0, expired: 0 },
  });

  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadDashboardData();
  }, []);

  const checkAdminStatus = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    const { data: profile } = await supabase
      .from("users_profile")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setIsAdmin(profile?.role === "admin");
  };

  const loadDashboardData = async () => {
    try {
      const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });

      if (incidents) {
        setRecentIncidents(incidents.slice(0, 5));
        setStats((prev) => ({
          ...prev,
          incidents: {
            total: incidents.length,
            open: incidents.filter((i) => i.status === "open").length,
            inProgress: incidents.filter((i) => i.status === "investigating").length,
            closed: incidents.filter(
              (i) => i.status === "closed" || i.status === "resolved"
            ).length,
          },
        }));
      }
    } catch (err) {
      console.error("Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this incident?")) return;
    await supabase.from("incidents").delete().eq("id", id);
    loadDashboardData();
  };

  if (loading) {
    return <div className="text-center text-gray-500">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Key metrics and recent activity</p>
      </div>

      {/* RECENT INCIDENTS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Recent Incidents</h3>
        </div>

        <div className="divide-y">
          {recentIncidents.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">
              No incidents reported
            </div>
          ) : (
            recentIncidents.map((incident) => (
              <div key={incident.id} className="p-4 flex justify-between">
                <div>
                  <h4 className="font-semibold">{incident.title}</h4>
                  <p className="text-sm text-gray-600">{incident.description}</p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-1">
                    <Clock size={14} />
                    {new Date(
                      incident.incident_date
                    ).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 capitalize">
                    {incident.status}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(incident.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ HSSE AI ASSISTANT – FIXED POSITION */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">
          🤖 HSSE AI Assistant
        </h3>
        <ChatAssistant />
      </div>
    </div>
  );
}
