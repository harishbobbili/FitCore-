"use client";

import React, { useMemo, useState, Suspense, lazy } from "react";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import StatChip from "@/components/ui/StatChip";
import SkeletonCard from "@/components/ui/SkeletonCard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { useBodyMetrics } from "@/hooks/useBodyMetrics";
import { useProfile } from "@/hooks/useProfile";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import { Scale, TrendingUp, Flame, CheckCircle, RefreshCw, Camera, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const WeightChart = lazy(() => import("@/components/dashboard/WeightChart").then(mod => ({ default: mod.WeightChart })));

export default function AnalyticsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { metrics, loading, logMetrics, fetchMetrics } = useBodyMetrics();
  const { photos, loading: photosLoading } = useProgressPhotos();
  const [timeframe, setTimeframe] = useState<"2W" | "1M" | "3M" | "6M">("1M");
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");
  const [hip, setHip] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [notes, setNotes] = useState("");
  const [showBodyForm, setShowBodyForm] = useState(false);

  const breadcrumbs = [{ label: "Analytics" }];

  const filteredMetrics = useMemo(() => {
    const days = timeframe === "2W" ? 14 : timeframe === "1M" ? 30 : timeframe === "3M" ? 90 : 180;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return metrics.filter((metric) => new Date(metric.date) >= cutoff);
  }, [metrics, timeframe]);

  const latestMetric = metrics[metrics.length - 1] ?? null;
  const startingMetric = metrics[0] ?? latestMetric;
  const currentWeight = latestMetric?.weight_kg ?? profile?.weight_kg ?? 0;
  const targetWeight = Math.max((profile?.weight_kg ?? currentWeight) - 5, 50);
  const weeklyLossRate = profile ? ((profile.maintenance_kcal ?? 2200) - (profile.target_kcal ?? 1800)) / 7700 : 0;

  const chartData = useMemo(() => {
    return filteredMetrics.map((metric) => ({
      date: metric.date,
      weight: metric.weight_kg ?? 0,
    }));
  }, [filteredMetrics]);

  const bodyMeasurementsData = useMemo(() => {
    return filteredMetrics
      .filter((m) => m.waist_cm || m.chest_cm || m.hip_cm)
      .map((metric) => ({
        date: metric.date,
        waist: metric.waist_cm ?? null,
        chest: metric.chest_cm ?? null,
        hip: metric.hip_cm ?? null,
      }));
  }, [filteredMetrics]);

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [photos]);

  const loadingState = loading || profileLoading || !profile;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!weight) return;

    await logMetrics({
      weight_kg: Number(weight),
      waist_cm: waist ? Number(waist) : null,
      chest_cm: chest ? Number(chest) : null,
      hip_cm: hip ? Number(hip) : null,
      body_fat_pct: bodyFat ? Number(bodyFat) : null,
      date: new Date().toISOString().split("T")[0],
    });

    setNotes("");
    await fetchMetrics(timeframe);
  };

  if (loadingState) {
    return <SkeletonCard className="h-[520px] w-full" />;
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col gap-6">
        <PageHeader title="Analytics" subtitle="Your weight trend, body metrics, and progress timeline are read from Supabase." breadcrumbs={breadcrumbs} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatChip icon={<Scale className="w-5 h-5" />} label="Current Weight" value={Math.round(currentWeight * 10) / 10} unit=" kg" color="cyan" />
        <StatChip icon={<TrendingUp className="w-5 h-5" />} label="Goal Weight" value={Math.round(targetWeight * 10) / 10} unit=" kg" color="purple" />
        <StatChip icon={<Flame className="w-5 h-5" />} label="Weekly Loss" value={Math.round(weeklyLossRate * 100) / 100} unit=" kg/wk" color="orange" />
        <StatChip icon={<CheckCircle className="w-5 h-5" />} label="Metrics Logged" value={metrics.length} unit=" entries" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-5" hoverable>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Weight Trend</h3>
            <div className="flex gap-2">
              {(["2W", "1M", "3M", "6M"] as const).map((value) => (
                <button key={value} onClick={() => setTimeframe(value)} className={`rounded-lg px-3 py-1 text-xs ${timeframe === value ? "bg-neonCyan/10 text-neonCyan" : "bg-white/[0.03] text-white/50"}`}>
                  {value}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <SkeletonCard className="h-64 w-full" />
          ) : (
            <Suspense fallback={<SkeletonCard className="h-64 w-full" />}>
              <WeightChart />
            </Suspense>
          )}

          {/* Body Measurements Chart */}
          {bodyMeasurementsData.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Body Measurements</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyMeasurementsData} margin={{ left: -25, right: 5, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.5)"
                      fontSize={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: 'white' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="waist" stroke="#a855f7" strokeWidth={2} dot={false} name="Waist (cm)" />
                    <Line type="monotone" dataKey="chest" stroke="#06b6d4" strokeWidth={2} dot={false} name="Chest (cm)" />
                    <Line type="monotone" dataKey="hip" stroke="#f97316" strokeWidth={2} dot={false} name="Hip (cm)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-3 text-xs text-white/50">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="uppercase tracking-wider text-[10px] text-white/30">Start</div>
              <div className="mt-1 text-white font-mono">{startingMetric?.weight_kg ?? currentWeight} kg</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="uppercase tracking-wider text-[10px] text-white/30">Current</div>
              <div className="mt-1 text-white font-mono">{currentWeight} kg</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <div className="uppercase tracking-wider text-[10px] text-white/30">Target</div>
              <div className="mt-1 text-white font-mono">{targetWeight} kg</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5" hoverable>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Log Measurement</h3>
            <NeonButton
              type="button"
              variant="ghost"
              onClick={() => setShowBodyForm(!showBodyForm)}
              className="text-xs px-3 py-1"
            >
              {showBodyForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </NeonButton>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.1" placeholder="Weight (kg)" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
            
            {showBodyForm && (
              <>
                <input value={waist} onChange={(e) => setWaist(e.target.value)} type="number" step="0.1" placeholder="Waist (cm)" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
                <input value={chest} onChange={(e) => setChest(e.target.value)} type="number" step="0.1" placeholder="Chest (cm)" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
                <input value={hip} onChange={(e) => setHip(e.target.value)} type="number" step="0.1" placeholder="Hip (cm)" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
                <input value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} type="number" step="0.1" placeholder="Body fat %" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none" />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none min-h-24" />
              </>
            )}
            
            <NeonButton type="submit" variant="gradient" className="w-full h-10">Save Measurement</NeonButton>
            <NeonButton type="button" variant="ghost" className="w-full h-10 border border-white/10" onClick={() => fetchMetrics(timeframe)}>
              <RefreshCw className="w-4 h-4" /> Refresh
            </NeonButton>
          </form>
        </GlassCard>
      </div>

      <GlassCard className="p-5" hoverable>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Recent Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {chartData.slice(-6).map((point) => (
            <div key={point.date} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="text-xs text-white/40">{new Date(point.date).toLocaleDateString()}</div>
              <div className="mt-1 text-lg text-white font-mono">{point.weight} kg</div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Visual Progress Timeline */}
      <GlassCard className="p-5" hoverable>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Visual Progress Timeline
          </h3>
          {sortedPhotos.length > 12 && (
            <a href="/progress" className="text-xs text-neonCyan hover:text-neonCyan/80 transition-colors">
              View All →
            </a>
          )}
        </div>

        {photosLoading ? (
          <SkeletonCard className="h-32 w-full" />
        ) : sortedPhotos.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-white/60 mb-2">Add progress photos to see your visual timeline</p>
            <a href="/progress" className="text-neonCyan hover:text-neonCyan/80 text-sm">
              Go to Progress Photos →
            </a>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {sortedPhotos.slice(0, 12).map((photo) => (
              <div key={photo.id} className="flex-shrink-0 w-32">
                {photo.signed_url && (
                  <img
                    src={photo.signed_url}
                    alt={photo.angle}
                    className="w-32 h-32 object-cover rounded-xl mb-2"
                  />
                )}
                <div className="text-xs text-white/60">{new Date(photo.date).toLocaleDateString()}</div>
                {photo.weight_kg && (
                  <div className="text-xs text-white/40">{photo.weight_kg} kg</div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
    </ErrorBoundary>
  );
}
