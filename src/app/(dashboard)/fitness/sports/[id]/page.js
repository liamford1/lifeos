"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import BackButton from "@/components/BackButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import Button from "@/components/Button";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function SportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [sport, setSport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchSport() {
      if (!id) {
        setError("Missing sport ID");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("fitness_sports")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        setError("Failed to load sport entry");
      } else {
        setSport(data);
      }
      setLoading(false);
    }
    fetchSport();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this sport entry?")) return;
    setDeleting(true);
    const { error } = await supabase
      .from("fitness_sports")
      .delete()
      .eq("id", id);
    if (error) {
      showError("Failed to delete sport entry");
    } else {
      showSuccess("Sport entry deleted");
      router.push("/fitness/sports");
    }
    setDeleting(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <BackButton />
      <h1 className="text-xl font-bold mb-4">Sport Entry Details</h1>
      {sport && (
        <div className="mb-4">
          <div><strong>Sport:</strong> {sport.sport}</div>
          <div><strong>Duration:</strong> {sport.duration} min</div>
          <div><strong>Date:</strong> {sport.date}</div>
          <div><strong>Notes:</strong> {sport.notes}</div>
        </div>
      )}
      <Link href={`/fitness/sports/${id}/edit`} className="mr-2">
        <Button variant="primary">Edit</Button>
      </Link>
      <Button
        variant="danger"
        size="sm"
        onClick={handleDelete}
        aria-label="Delete sport entry"
        loading={deleting}
      >
        🗑️ Delete
      </Button>
    </div>
  );
}
