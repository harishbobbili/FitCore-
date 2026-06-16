import { useState, useEffect } from "react";
import { ProgressPhoto } from "@/lib/types";
import { showSuccessToast, showErrorToast } from "@/lib/toast";

export function useProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch photos on mount
  useEffect(() => {
    let mounted = true;
    let abortController = new AbortController();

    async function fetchPhotos() {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/progress-photos", { signal: abortController.signal });
        const data = await response.json();

        if (abortController.signal.aborted || !mounted) return;

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch photos");
        }

        if (mounted) {
          setPhotos(data.data || []);
        }
      } catch (err) {
        if (abortController.signal.aborted || !mounted) return;
        
        const message = err instanceof Error ? err.message : "Failed to fetch photos";
        setError(message);
        showErrorToast(message);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPhotos();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, []);

  // Upload a new progress photo
  const uploadPhoto = async (
    file: File,
    angle: string,
    weightKg?: number,
    notes?: string
  ) => {
    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("angle", angle);
      if (weightKg !== undefined) {
        formData.append("weight_kg", weightKg.toString());
      }
      if (notes) {
        formData.append("notes", notes);
      }
      formData.append("date", new Date().toISOString().split("T")[0]);

      const response = await fetch("/api/progress-photos", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload photo");
      }

      // Prepend new photo to state
      setPhotos((prev) => [data.data.photo, ...prev]);
      showSuccessToast("Progress photo uploaded successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload photo";
      setError(message);
      showErrorToast(message);
    } finally {
      setUploading(false);
    }
  };

  // Delete a progress photo
  const deletePhoto = async (photoId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/progress-photos?id=${photoId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete photo");
      }

      // Remove from local state
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      showSuccessToast("Progress photo deleted successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete photo";
      setError(message);
      showErrorToast(message);
    }
  };

  return {
    photos,
    loading,
    uploading,
    uploadPhoto,
    deletePhoto,
  };
}
