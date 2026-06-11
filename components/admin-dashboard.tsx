"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Check, CheckCheck, CheckCircle2, Database, Layers, MessageSquare, RefreshCw, ShieldAlert, Trash2, X } from "lucide-react";
import {
  deleteSample,
  loadAdminData,
  updateSampleReviewStatus,
  updateSampleReviewStatuses,
  type AdminCount,
  type AdminData,
  type AdminStats,
  type SampleReviewStatus,
} from "@/lib/supabase";
import { signs } from "@/lib/signs";

const qualityOptions = ["clean", "low_quality", "rejected"];
const reviewOptions = ["pending", "approved", "rejected"];
const chartColors = ["#0F766E", "#D65F4C", "#64748B", "#14B8A6"];
const emptyStats: AdminStats = {
  sampleTotal: 0,
  feedbackTotal: 0,
  modelVersionTotal: 0,
  datasetVersionTotal: 0,
  qualityCounts: qualityOptions.map((label) => ({ label, count: 0 })),
  reviewCounts: reviewOptions.map((label) => ({ label, count: 0 })),
  feedbackCounts: ["correct", "wrong", "unmarked"].map((label) => ({ label, count: 0 })),
  modelStatusCounts: ["draft", "testing", "active", "archived"].map((label) => ({ label, count: 0 })),
  topSignCounts: [],
};

export function AdminDashboard() {
  const [signId, setSignId] = useState("");
  const [qualityStatus, setQualityStatus] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [message, setMessage] = useState("Loading admin data...");
  const [loading, setLoading] = useState(false);
  const [deletingSampleId, setDeletingSampleId] = useState<string | null>(null);
  const [reviewingSampleId, setReviewingSampleId] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const stats = adminData?.stats ?? emptyStats;
  const latestModel = adminData?.modelVersions[0];
  const latestDataset = adminData?.datasetVersions[0];
  const sampleQualityRate = useMemo(() => {
    const cleanSamples = stats.qualityCounts.find((item) => item.label === "clean")?.count ?? 0;
    return stats.sampleTotal === 0 ? 0 : Math.round((cleanSamples / stats.sampleTotal) * 100);
  }, [stats.qualityCounts, stats.sampleTotal]);
  const feedbackCorrectRate = useMemo(() => {
    const correct = stats.feedbackCounts.find((item) => item.label === "correct")?.count ?? 0;
    const wrong = stats.feedbackCounts.find((item) => item.label === "wrong")?.count ?? 0;
    return correct + wrong === 0 ? 0 : Math.round((correct / (correct + wrong)) * 100);
  }, [stats.feedbackCounts]);

  async function refreshAdminData() {
    setLoading(true);
    const result = await loadAdminData({
      signId: signId || undefined,
      qualityStatus: qualityStatus || undefined,
      reviewStatus: reviewStatus || undefined,
    });
    setAdminData(result.data);
    setMessage(result.message);
    setLoading(false);
  }

  async function handleDeleteSample(sampleId: string, signId: string) {
    const confirmed = window.confirm(`Delete this ${signId} sample permanently?`);

    if (!confirmed) {
      return;
    }

    setDeletingSampleId(sampleId);
    const result = await deleteSample(sampleId);
    setMessage(result.message);

    if (result.ok) {
      await refreshAdminData();
      setMessage(result.message);
    }

    setDeletingSampleId(null);
  }

  async function handleReviewSample(sampleId: string, status: Exclude<SampleReviewStatus, "pending">) {
    setReviewingSampleId(sampleId);
    const result = await updateSampleReviewStatus(sampleId, status);
    setMessage(result.message);

    if (result.ok) {
      await refreshAdminData();
      setMessage(result.message);
    }

    setReviewingSampleId(null);
  }

  async function handleApproveAllSamples() {
    const confirmed = window.confirm(
      "Approve all samples matching the current filters? If no filters are selected, this approves every sample.",
    );

    if (!confirmed) {
      return;
    }

    setApprovingAll(true);
    const result = await updateSampleReviewStatuses({
      reviewStatus: "approved",
      signId: signId || undefined,
      qualityStatus: qualityStatus || undefined,
      currentReviewStatus: reviewStatus || undefined,
    });
    setMessage(result.message);

    if (result.ok) {
      await refreshAdminData();
      setMessage(result.message);
    }

    setApprovingAll(false);
  }

  useEffect(() => {
    refreshAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signId, qualityStatus, reviewStatus]);

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Admin Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={refreshAdminData}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line px-4 text-sm font-semibold text-teal disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Database} label="Samples" value={stats.sampleTotal} detail={`${sampleQualityRate}% clean`} />
        <StatCard icon={MessageSquare} label="Feedback" value={stats.feedbackTotal} detail={`${feedbackCorrectRate}% correct`} />
        <StatCard icon={Layers} label="Dataset versions" value={stats.datasetVersionTotal} detail={latestDataset?.version_name ?? "No dataset"} />
        <StatCard icon={BarChart3} label="Model versions" value={stats.modelVersionTotal} detail={latestModel?.status ?? "No model"} />
      </div>

      <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Sample filters</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <select
            value={signId}
            onChange={(event) => setSignId(event.target.value)}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">All signs</option>
            {signs.map((sign) => (
              <option key={sign.label} value={sign.label}>
                {sign.displayName} - {sign.type}
              </option>
            ))}
          </select>
          <select
            value={qualityStatus}
            onChange={(event) => setQualityStatus(event.target.value)}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">All quality statuses</option>
            {qualityOptions.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
          <select
            value={reviewStatus}
            onChange={(event) => setReviewStatus(event.target.value)}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">All review statuses</option>
            {reviewOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <BarChartPanel
          title="Samples by sign"
          description="Top represented signs for the selected quality and review filters."
          data={stats.topSignCounts}
        />
        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Review coverage</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3 xl:grid-cols-1">
            <DonutChart title="Quality status" data={stats.qualityCounts} />
            <DonutChart title="Review status" data={stats.reviewCounts} />
            <DonutChart title="Feedback result" data={stats.feedbackCounts} />
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-white p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Model and dataset health</h2>
            </div>
            {latestModel?.status === "active" ? (
              <CheckCircle2 className="h-5 w-5 text-teal" aria-hidden="true" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-coral" aria-hidden="true" />
            )}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <MetricBlock
              label="Latest model"
              value={latestModel?.version_name ?? "No model"}
              detail={
                latestModel?.accuracy === null || latestModel?.accuracy === undefined
                  ? "No accuracy recorded"
                  : `${Math.round(latestModel.accuracy * 100)}% accuracy`
              }
            />
            <MetricBlock
              label="Latest dataset"
              value={latestDataset?.version_name ?? "No dataset"}
              detail={latestDataset ? `${latestDataset.sample_count} included samples` : "No dataset registered"}
            />
          </div>
        </section>
        <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
          <DonutChart title="Model statuses" data={stats.modelStatusCounts} />
        </section>
      </section>

      <DataPanel
        title="Samples"
        empty="No samples match the current filters."
        action={
          <button
            type="button"
            onClick={handleApproveAllSamples}
            disabled={approvingAll || loading || stats.sampleTotal === 0 || reviewStatus === "approved"}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-teal transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Approve all
          </button>
        }
      >
        {(adminData?.samples ?? []).map((sample) => (
          <DataRow
            key={sample.id}
            columns={[
              sample.sign_id,
              sample.quality_status,
              sample.review_status,
              `${Math.round(sample.detector_confidence * 100)}% confidence`,
            ]}
            action={
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleReviewSample(sample.id, "approved")}
                  disabled={reviewingSampleId === sample.id || sample.review_status === "approved"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-teal transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title={`Approve ${sample.sign_id} sample`}
                  aria-label={`Approve ${sample.sign_id} sample`}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewSample(sample.id, "rejected")}
                  disabled={reviewingSampleId === sample.id || sample.review_status === "rejected"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-coral transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title={`Reject ${sample.sign_id} sample`}
                  aria-label={`Reject ${sample.sign_id} sample`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSample(sample.id, sample.sign_id)}
                  disabled={deletingSampleId === sample.id}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title={`Delete ${sample.sign_id} sample`}
                  aria-label={`Delete ${sample.sign_id} sample`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            }
          />
        ))}
      </DataPanel>

      <DataPanel title="Feedback" empty="No feedback has been submitted yet.">
        {(adminData?.feedback ?? []).map((feedback) => (
          <DataRow
            key={feedback.id}
            columns={[
              feedback.predicted_sign_id ?? "Unknown",
              feedback.expected_sign_id ?? "Not provided",
              feedback.was_correct === null ? "Unmarked" : feedback.was_correct ? "Correct" : "Wrong",
              feedback.confidence === null ? "No confidence" : `${Math.round(feedback.confidence * 100)}%`,
            ]}
          />
        ))}
      </DataPanel>

      <DataPanel title="Model versions" empty="No model versions are registered.">
        {(adminData?.modelVersions ?? []).map((modelVersion) => (
          <DataRow
            key={modelVersion.id}
            columns={[
              modelVersion.version_name,
              modelVersion.status,
              modelVersion.model_type,
              modelVersion.accuracy === null ? "No accuracy" : `${Math.round(modelVersion.accuracy * 100)}%`,
            ]}
          />
        ))}
      </DataPanel>

      <DataPanel title="Dataset versions" empty="No dataset versions are registered.">
        {(adminData?.datasetVersions ?? []).map((datasetVersion) => (
          <DataRow
            key={datasetVersion.id}
            columns={[datasetVersion.version_name, `${datasetVersion.sample_count} samples`, datasetVersion.created_at, "Read only"]}
          />
        ))}
      </DataPanel>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{value.toLocaleString()}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-mist text-teal">
          <Icon className="h-5 w-5" aria-hidden={true} />
        </span>
      </div>
      <p className="mt-3 truncate text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function BarChartPanel({ title, description, data }: { title: string; description: string; data: AdminCount[] }) {
  const maxCount = Math.max(...data.map((item) => item.count), 0);

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {data.length > 0 ? (
          data.map((item) => {
            const width = maxCount === 0 ? 0 : Math.max(8, Math.round((item.count / maxCount) * 100));

            return (
              <div key={item.label} className="grid gap-2 sm:grid-cols-[130px_1fr_56px] sm:items-center">
                <span className="truncate text-sm font-medium text-slate-700">{item.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-mist">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${width}%` }} />
                </div>
                <span className="text-sm font-semibold text-ink sm:text-right">{item.count.toLocaleString()}</span>
              </div>
            );
          })
        ) : (
          <EmptyChartState message="No sample counts are available for the current filters." />
        )}
      </div>
    </section>
  );
}

function DonutChart({ title, data }: { title: string; data: AdminCount[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const segments = buildDonutSegments(data, total);

  return (
    <div className="rounded-md border border-line bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr] sm:items-center">
        <div className="relative h-[120px] w-[120px]" aria-label={`${title}: ${total} total`}>
          <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90" role="img">
            <title>{`${title}: ${total} total`}</title>
            <circle cx="21" cy="21" r="15.92" fill="transparent" stroke="#F6F8FA" strokeWidth="7" />
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="21"
                cy="21"
                r="15.92"
                fill="transparent"
                stroke={segment.color}
                strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                strokeDashoffset={segment.offset}
                strokeLinecap="butt"
                strokeWidth="7"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-semibold text-ink">{total.toLocaleString()}</span>
            <span className="text-[11px] font-medium uppercase text-slate-500">total</span>
          </div>
        </div>
        {total > 0 ? (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={item.label} className="grid grid-cols-[12px_1fr_auto] items-center gap-2 text-sm">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                  aria-hidden="true"
                />
                <span className="truncate text-slate-600">{formatLabel(item.label)}</span>
                <span className="font-semibold text-ink">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyChartState message="No records found." compact />
        )}
      </div>
    </div>
  );
}

function buildDonutSegments(data: AdminCount[], total: number) {
  let offset = 25;

  return data.map((item, index) => {
    const percent = total === 0 ? 0 : (item.count / total) * 100;
    const segment = {
      label: item.label,
      percent,
      offset,
      color: chartColors[index % chartColors.length],
    };
    offset -= percent;
    return segment;
  });
}

function MetricBlock({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-line bg-mist p-4">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 truncate text-lg font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function EmptyChartState({ message, compact = false }: { message: string; compact?: boolean }) {
  return <p className={`rounded-md bg-mist text-sm text-slate-600 ${compact ? "mt-3 p-3" : "p-4"}`}>{message}</p>;
}

function formatLabel(label: string) {
  return label.replace(/_/g, " ");
}

function DataPanel({
  title,
  empty,
  action,
  children,
}: {
  title: string;
  empty: string;
  action?: React.ReactNode;
  children: React.ReactNode[];
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
      <div className="flex flex-col justify-between gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="divide-y divide-line">
        {children.length > 0 ? children : <p className="px-5 py-4 text-sm text-slate-600">{empty}</p>}
      </div>
    </section>
  );
}

function DataRow({ columns, action }: { columns: string[]; action?: React.ReactNode }) {
  return (
    <div
      className={`grid gap-3 px-5 py-3 text-sm text-slate-700 ${
        action ? "md:grid-cols-[repeat(4,minmax(0,1fr))_auto] md:items-center" : "md:grid-cols-4"
      }`}
    >
      {columns.map((column, index) => (
        <span key={`${column}-${index}`} className="truncate">
          {column}
        </span>
      ))}
      {action ? <span className="flex justify-start md:justify-end">{action}</span> : null}
    </div>
  );
}
