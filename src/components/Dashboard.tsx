import React, { useEffect, useState } from "react";
import { HSSEAssistant } from "@/components/HSSEAssistant";
import { supabase } from "../lib/supabase";
import {
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  Activity,
  RefreshCcw,
} from "lucide-react";

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

type DashboardState = {
  incidents: StatGroup;
  nearMisses: StatGroup;
  audits: StatGroup;
  training: TrainingStatGroup;
};

const emptyStatGroup: StatGroup = {
  total: 0,
  open: 0,
  inProgress: 0,
  closed: 0,
};

const emptyTrainingStats: TrainingStatGroup = {
  total: 0,
  valid: 0,
  expiringSoon: 0,
  expired: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardState>({
    incidents: emptyStatGroup,
    nearMisses: emptyStatGroup,
    audits: emptyStatGroup,
    training: emptyTrainingStats,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    void loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // NOTE:
      // Adjust table names & columns to match your Supabase schema.
      const [
        { data: incidentRows, error: incidentError },
        { data: nearMissRows, error: nearMissError },
        { data: auditRows, error: auditError },
        { data: trainingRows, error: trainingError },
      ] = await Promise.all([
        supabase.from("incidents").select("status"),
        supabase.from("near_misses").select("status"),
        supabase.from("audits").select("status"),
        supabase.from("training_records").select("status, valid_until"),
      ]);

      if (incidentError || nearMissError || auditError || trainingError) {
        console.error(
          "Dashboard stats errors:",
          incidentError,
          nearMissError,
          auditError,
          trainingError
        );
        throw new Error("Unable to load HSSE statistics from Supabase.");
      }

      const computeStatusGroup = (rows: any[] | null): StatGroup => {
        const group: StatGroup = { ...emptyStatGroup };
        if (!rows || rows.length === 0) return group;

        group.total = rows.length;
        for (const row of rows) {
          const status = String(row.status || "").toLowerCase();
          if (status === "open") group.open += 1;
          else if (status === "in_progress" || status === "in progress")
            group.inProgress += 1;
          else if (status === "closed" || status === "completed")
            group.closed += 1;
        }
        return group;
      };

      const now = new Date();
      const trainingStats: TrainingStatGroup = { ...emptyTrainingStats };
      if (trainingRows && trainingRows.length > 0) {
        trainingStats.total = trainingRows.length;

        for (const row of trainingRows as any[]) {
          const status = String(row.status || "").toLowerCase();
          if (status === "valid") {
            trainingStats.valid += 1;
          } else if (status === "expired") {
            trainingStats.expired += 1;
          } else if (status === "expiring_soon" || status === "expiring soon") {
            trainingStats.expiringSoon += 1;
          } else {
            // Fallback using valid_until if you don’t store status explicitly
            if (row.valid_until) {
              const validUntil = new Date(row.valid_until);
              const diffDays =
                (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
              if (diffDays < 0) trainingStats.expired += 1;
              else if (diffDays <= 30) trainingStats.expiringSoon += 1;
              else trainingStats.valid += 1;
            }
          }
        }
      }

      setStats({
        incidents: computeStatusGroup(incidentRows || []),
        nearMisses: computeStatusGroup(nearMissRows || []),
        audits: computeStatusGroup(auditRows || []),
        training: trainingStats,
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while loading HSSE stats.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleString();
  };

  const renderStatCard = (
    title: string,
    icon: React.ReactNode,
    group: StatGroup | TrainingStatGroup,
    accentClass: string
  ) => {
    const total = "total" in group ? group.total : 0;

    const getPercent = (value: number) =>
      total > 0 ? Math.round((value / total) * 100) : 0;

    return (
      <div className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${accentClass}`}
            >
              {icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {title}
              </p>
              <p className="text-2xl font-semibold text-slate-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
          {"open" in group && (
            <div>
              <p className="font-medium text-slate-600">Open</p>
              <p className="text-slate-900">
                {group.open}{" "}
                <span className="text-slate-400">
                  ({getPercent(group.open)}%)
                </span>
              </p>
            </div>
          )}
          {"inProgress" in group && (
            <div>
              <p className="font-medium text-slate-600">In progress</p>
              <p className="text-slate-900">
                {group.inProgress}{" "}
                <span className="text-slate-400">
                  ({getPercent(group.inProgress)}%)
                </span>
              </p>
            </div>
          )}
          {"closed" in group && (
            <div>
              <p className="font-medium text-slate-600">Closed</p>
              <p className="text-slate-900">
                {group.closed}{" "}
                <span className="text-slate-400">
                  ({getPercent(group.closed)}%)
                </span>
              </p>
            </div>
          )}

          {"valid" in group && (
            <div>
              <p className="font-medium text-slate-600">Valid</p>
              <p className="text-slate-900">
                {group.valid}{" "}
                <span className="text-slate-400">
                  ({getPercent(group.valid)}%)
                </span>
              </p>
            </div>
          )}
          {"expiringSoon" in group && (
            <div>
              <p className="font-medium text-slate-600">Expiring soon</p>
              <p className="text-slate-900">
                {group.expiringSoon}{" "}
                <span className="text-slate-400">
                  ({getPercent(group.expiringSoon)}%)
                </span>
              </p>
            </div>
          )}
          {"expired" in group && (
            <div>
              <p className="font-medium text-slate-600">Expired</p>
              <p className="text-slate-900">
                {group.expired}{" "}
                <span className="text-slate-400">
                  ({getPercent(group.expired)}%)
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            KOIL HSSE Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Overview of incidents, near misses, audits, training & AI assistant.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Activity className="h-4 w-4" />
            <span>Last updated: {formatDateTime(lastUpdated)}</span>
          </div>
          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: metrics */}
        <div className="xl:col-span-2 space-y-4">
          {/* Top summary cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            {renderStatCard(
              "Incidents",
              <AlertTriangle className="h-4 w-4 text-amber-700" />,
              stats.incidents,
              "bg-amber-50"
            )}
            {renderStatCard(
              "Near Misses",
              <AlertTriangle className="h-4 w-4 text-orange-700" />,
              stats.nearMisses,
              "bg-orange-50"
            )}
            {renderStatCard(
              "Audits",
              <ClipboardCheck className="h-4 w-4 text-sky-700" />,
              stats.audits,
              "bg-sky-50"
            )}
            {renderStatCard(
              "Training Records",
              <GraduationCap className="h-4 w-4 text-emerald-700" />,
              stats.training,
              "bg-emerald-50"
            )}
          </div>

          {/* Placeholder for future charts / tables */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-2">
              HSSE Status
            </h2>
            <p className="text-xs text-slate-500">
              This section is intentionally simple for now. You can later add
              charts (e.g., incidents over time, audit completion, training
              expiry trends) using the same data source.
            </p>
          </div>
        </div>

        {/* Right: HSSE AI Assistant */}
        <div className="xl:col-span-1 h-[600px]">
          <HSSEAssistant />
        </div>
      </div>
    </div>
  );
}
