"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import SharedDeleteButton from "@/components/SharedDeleteButton";
import EditButton from "@/components/EditButton";
import BaseModal from "@/components/shared/BaseModal";
import { useCardioSessions } from "@/lib/hooks/useCardioSessions";
import dynamic from "next/dynamic";
const HeartPulse = dynamic(
  () => import("lucide-react/dist/esm/icons/heart-pulse"),
  { ssr: false, loading: () => <span className="inline-block w-4 h-4" /> },
);

// Skeleton component for cardio items
function CardioSkeleton() {
  return (
    <div className="border p-3 rounded shadow-sm animate-pulse">
      <div className="h-6 bg-gray-700 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/4"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/3"></div>
      <div className="flex gap-4 mt-2">
        <div className="h-6 bg-gray-700 rounded w-16"></div>
        <div className="h-6 bg-gray-700 rounded w-16"></div>
      </div>
    </div>
  );
}

export default function CardioHistoryModal({ isOpen, onClose }) {
  const { user } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fetchedRef = useRef({ userId: null, done: false });
  const { fetchCardioSessions, deleteCardioSession } = useCardioSessions();

  // Memoize fetchCardioSessions to avoid unnecessary effect reruns
  const memoizedFetchCardioSessions = useCallback(fetchCardioSessions, [
    fetchCardioSessions,
  ]);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  const loadSessions = useCallback(async () => {
    if (!userId) {
      setSessionsLoading(false);
      setHasInitialized(true);
      return;
    }

    setSessionsLoading(true);

    try {
      const data = await memoizedFetchCardioSessions(userId);
      setSessions(data || []);
      setSessionsLoading(false);
      setHasInitialized(true);
    } catch (error) {
      console.error("Error loading cardio sessions:", error);
      setSessionsLoading(false);
      setHasInitialized(true);
    }
  }, [userId, memoizedFetchCardioSessions]);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (fetchedRef.current.done && fetchedRef.current.userId === user.id)
      return;
    fetchedRef.current = { userId: user.id, done: true };
    loadSessions();
  }, [isOpen, user, loadSessions]);

  const handleDelete = useCallback(
    async (id) => {
      const confirm = window.confirm("Delete this session?");
      if (!confirm) return;
      if (!user) return;
      const success = await deleteCardioSession(id, user.id);
      if (success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [deleteCardioSession, user],
  );

  const handleStartCardio = useCallback(() => {
    router.push("/fitness/cardio/live");
  }, [router]);

  // Determine what to render - memoized to prevent unnecessary re-renders
  const content = useMemo(() => {
    // Don't render anything until we've initialized
    if (!hasInitialized) {
      return Array.from({ length: 3 }).map((_, index) => (
        <CardioSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (sessionsLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <CardioSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (!user) {
      return null;
    }

    if (sessions.length === 0) {
      return (
        <div className="border p-8 rounded shadow-sm text-center">
          <p className="text-muted-foreground text-sm mb-4">
            No cardio sessions yet. Click &quot;Start Cardio&quot; to begin
            tracking your first session.
          </p>
          <Button
            variant="success"
            className="flex items-center gap-2 mx-auto"
            onClick={handleStartCardio}
          >
            <HeartPulse className="w-4 h-4" />
            Start Cardio
          </Button>
        </div>
      );
    }

    return sessions.map((s) => (
      <li
        key={s.id}
        onClick={() => router.push(`/fitness/cardio/${s.id}`)}
        className="border p-3 rounded shadow-sm cursor-pointer hover:bg-[#2e2e2e] transition"
      >
        <div className="font-semibold text-lg">
          {s.activity_type || "Cardio"}
        </div>
        <div className="text-sm text-base">{s.date}</div>
        <div className="text-sm text-base">
          ⏱️ {s.duration_minutes ?? "-"} min
          {s.distance_miles && ` — 📏 ${s.distance_miles} mi`}
        </div>
        {s.location && <div className="text-sm text-base">📍 {s.location}</div>}
        {s.notes && <div className="text-sm text-base mt-1">{s.notes}</div>}

        <div className="flex gap-4 mt-2 text-sm">
          <EditButton
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/fitness/cardio/${s.id}/edit`);
            }}
          />
          <SharedDeleteButton
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(s.id);
            }}
            size="sm"
            aria-label="Delete cardio session"
            label="Delete"
          />
        </div>
      </li>
    ));
  }, [
    hasInitialized,
    sessionsLoading,
    user,
    sessions,
    router,
    handleDelete,
    handleStartCardio,
  ]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cardio History"
      subtitle="Track your running, cycling, and other cardio activities"
      icon={HeartPulse}
      iconBgColor="bg-green-500/10"
      iconColor="text-green-500"
      maxWidth="max-w-4xl"
      data-testid="cardio-history-modal"
    >
      {/* Start Cardio Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleStartCardio}
          variant="primary"
          size="md"
          className="flex items-center gap-2"
        >
          <HeartPulse className="w-4 h-4" />
          Start New Cardio Session
        </Button>
      </div>

      {/* Cardio History */}
      <div
        className="space-y-3 min-h-[300px] relative"
        data-testid="cardio-list"
      >
        {content}
      </div>
    </BaseModal>
  );
}
