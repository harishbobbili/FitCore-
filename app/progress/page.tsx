"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, Calendar, Scale, TrendingUp, Camera, X, ChevronDown, ChevronUp } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useProgressPhotos } from "@/hooks/useProgressPhotos";
import { ProgressPhoto, BodyAnalysisResult } from "@/lib/types";

export default function ProgressPage() {
  const { photos, loading, uploading, uploadPhoto, deletePhoto } = useProgressPhotos();
  
  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<"front" | "back" | "side_left" | "side_right">("front");
  const [weightKg, setWeightKg] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);

  // Group photos by month
  const groupedPhotos = useMemo(() => {
    const groups: Record<string, ProgressPhoto[]> = {};
    photos.forEach((photo) => {
      const date = new Date(photo.date);
      const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(photo);
    });
    return groups;
  }, [photos]);

  // Stats calculations
  const stats = useMemo(() => {
    if (photos.length === 0) return null;
    
    const sortedPhotos = [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstPhoto = sortedPhotos[0];
    const latestPhoto = sortedPhotos[sortedPhotos.length - 1];
    
    const daysSinceFirst = Math.floor((new Date().getTime() - new Date(firstPhoto.date).getTime()) / (1000 * 60 * 60 * 24));
    
    let weightChange = null;
    if (firstPhoto.weight_kg && latestPhoto.weight_kg) {
      weightChange = latestPhoto.weight_kg - firstPhoto.weight_kg;
    }
    
    const latestBodyFat = latestPhoto.ai_analysis?.estimated_body_fat_pct || null;
    
    return {
      totalPhotos: photos.length,
      daysSinceFirst,
      weightChange,
      latestBodyFat,
    };
  }, [photos]);

  // Comparison photos
  const comparisonPhotos = useMemo(() => {
    if (photos.length < 2) return null;
    const sortedPhotos = [...photos].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return {
      oldest: sortedPhotos[0],
      latest: sortedPhotos[sortedPhotos.length - 1],
    };
  }, [photos]);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    await uploadPhoto(
      selectedFile,
      selectedAngle,
      weightKg ? parseFloat(weightKg) : undefined,
      notes || undefined
    );
    
    // Reset form
    setSelectedFile(null);
    setPreviewUrl(null);
    setWeightKg("");
    setNotes("");
  };

  // Handle delete
  const handleDelete = async (photoId: string) => {
    if (confirm("Are you sure you want to delete this progress photo?")) {
      await deletePhoto(photoId);
    }
  };

  // Render angle button
  const renderAngleButton = (angle: "front" | "back" | "side_left" | "side_right", label: string) => (
    <button
      type="button"
      onClick={() => setSelectedAngle(angle)}
      className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
        selectedAngle === angle
          ? "border-neonPurple bg-neonPurple/20 text-white"
          : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
      }`}
    >
      <Camera className="w-5 h-5 mx-auto mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  // Render AI analysis panel
  const renderAnalysisPanel = (analysis: BodyAnalysisResult | null) => {
    if (!analysis) return null;

    const muscleVisibilityColors = {
      low: "bg-rose-500/20 text-rose-300",
      medium: "bg-yellow-500/20 text-yellow-300",
      high: "bg-emerald-500/20 text-emerald-300",
    };

    return (
      <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-neonCyan" />
          <span className="text-sm font-semibold text-white">AI Analysis</span>
        </div>
        
        <p className="text-sm text-white/80 mb-3">{analysis.progress_summary}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${muscleVisibilityColors[analysis.muscle_visibility]}`}>
            Muscle: {analysis.muscle_visibility}
          </span>
          {analysis.estimated_body_fat_pct && (
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-neonPurple/20 text-neonPurple">
              Body Fat: {analysis.estimated_body_fat_pct}%
            </span>
          )}
        </div>
        
        {analysis.recommendations.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-white/60 mb-2">Recommendations:</p>
            <ul className="text-xs text-white/80 space-y-1">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-neonCyan">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.posture_notes && (
          <p className="text-xs text-white/60 italic">{analysis.posture_notes}</p>
        )}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-brandBg p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-[0.3em] text-white mb-2">PROGRESS</h1>
            <p className="text-white/60">Upload photos for AI body analysis</p>
          </div>
          <SkeletonCard className="h-96 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brandBg p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-[0.3em] text-white mb-2">PROGRESS PHOTOS</h1>
          <p className="text-white/60">Upload photos for AI body analysis</p>
        </div>

        {/* Stats Bar */}
        {stats && (
          <GlassCard className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalPhotos}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Photos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.daysSinceFirst}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Days Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {stats.weightChange !== null ? (
                    <span className={stats.weightChange > 0 ? "text-rose-400" : "text-emerald-400"}>
                      {stats.weightChange > 0 ? "+" : ""}{stats.weightChange.toFixed(1)} kg
                    </span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Weight Change</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {stats.latestBodyFat !== null ? (
                    <span className="text-neonPurple">{stats.latestBodyFat}%</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wider">Body Fat</div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Comparison Toggle */}
        {comparisonPhotos && (
          <div className="mb-6 flex justify-end">
            <NeonButton
              variant="cyan-outline"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? "Hide Comparison" : "Compare Progress"}
            </NeonButton>
          </div>
        )}

        {/* Comparison View */}
        <AnimatePresence>
          {showComparison && comparisonPhotos && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <GlassCard>
                <h3 className="text-xl font-bold text-white mb-4">Progress Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { photo: comparisonPhotos.oldest, label: "Oldest" },
                    { photo: comparisonPhotos.latest, label: "Latest" },
                  ].map(({ photo, label }) => (
                    <div key={photo.id}>
                      <div className="text-sm text-white/60 mb-2">{label} - {new Date(photo.date).toLocaleDateString()}</div>
                      {photo.signed_url && (
                        <img
                          src={photo.signed_url}
                          alt={label}
                          className="w-full h-64 object-cover rounded-xl mb-3"
                        />
                      )}
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-1 rounded-lg text-xs bg-neonPurple/20 text-neonPurple">
                          {photo.angle}
                        </span>
                        {photo.weight_kg && (
                          <span className="px-2 py-1 rounded-lg text-xs bg-neonCyan/20 text-neonCyan">
                            {photo.weight_kg} kg
                          </span>
                        )}
                      </div>
                      {renderAnalysisPanel(photo.ai_analysis)}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Panel */}
        <GlassCard className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Upload New Photo</h2>
          
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-neonPurple bg-neonPurple/10"
                : "border-white/20 bg-white/5 hover:border-white/30"
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            />
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
                <p className="text-white/60 mb-2">Drag and drop an image here</p>
                <p className="text-white/40 text-sm">or click to select (max 5MB)</p>
              </div>
            )}
          </div>

          {/* Angle Selector */}
          <div className="mt-4">
            <label className="text-sm text-white/60 mb-2 block">Photo Angle</label>
            <div className="grid grid-cols-4 gap-2">
              {renderAngleButton("front", "Front")}
              {renderAngleButton("back", "Back")}
              {renderAngleButton("side_left", "Left")}
              {renderAngleButton("side_right", "Right")}
            </div>
          </div>

          {/* Weight Input */}
          <div className="mt-4">
            <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Weight (optional)
            </label>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g., 70.5"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-neonPurple focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="text-sm text-white/60 mb-2 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this photo..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-neonPurple focus:outline-none resize-none"
            />
          </div>

          {/* Upload Button */}
          <NeonButton
            variant="gradient"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full mt-6"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                🤖 AI is analyzing your photo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Analyze Progress
              </>
            )}
          </NeonButton>
        </GlassCard>

        {/* Photo Timeline */}
        {Object.keys(groupedPhotos).length === 0 ? (
          <GlassCard className="text-center py-12">
            <Camera className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-bold text-white mb-2">No Progress Photos Yet</h3>
            <p className="text-white/60 mb-4">Upload your first photo to start tracking your fitness journey!</p>
            <div className="text-6xl mb-4">🏋️‍♂️</div>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPhotos)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([month, monthPhotos]) => (
                <div key={month}>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-neonPurple" />
                    {month}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monthPhotos.map((photo) => (
                      <GlassCard key={photo.id} hoverable>
                        <div className="relative">
                          {photo.signed_url && (
                            <img
                              src={photo.signed_url}
                              alt={photo.angle}
                              className="w-full h-48 object-cover rounded-lg cursor-pointer"
                              onClick={() => setExpandedPhotoId(photo.id)}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(photo.id)}
                            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-2 left-2 flex gap-2">
                            <span className="px-2 py-1 rounded-lg text-xs bg-neonPurple/20 text-neonPurple">
                              {photo.angle}
                            </span>
                            {photo.weight_kg && (
                              <span className="px-2 py-1 rounded-lg text-xs bg-neonCyan/20 text-neonCyan">
                                {photo.weight_kg} kg
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-white/60">{new Date(photo.date).toLocaleDateString()}</p>
                          {photo.notes && (
                            <p className="text-xs text-white/40 mt-1">{photo.notes}</p>
                          )}
                        </div>
                        
                        {/* Collapsible Analysis */}
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setExpandedPhotoId(expandedPhotoId === photo.id ? null : photo.id)}
                            className="text-xs text-neonCyan hover:text-neonCyan/80 flex items-center gap-1"
                          >
                            {expandedPhotoId === photo.id ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                Hide Analysis
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                View Analysis
                              </>
                            )}
                          </button>
                          <AnimatePresence>
                            {expandedPhotoId === photo.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                {renderAnalysisPanel(photo.ai_analysis)}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
