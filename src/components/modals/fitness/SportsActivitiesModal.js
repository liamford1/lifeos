"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import SharedDeleteButton from "@/components/SharedDeleteButton";
import EditButton from "@/components/EditButton";
import BaseModal from "@/components/shared/BaseModal";
import { useSportsSessions } from "@/lib/hooks/useSportsSessions";
import { useSportsSession } from "@/context/SportsSessionContext";
import dynamic from "next/dynamic";
const Goal = dynamic(() => import("lucide-react/dist/esm/icons/goal"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});

// Skeleton component for sports items
function SportsSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
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

export default function SportsActivitiesModal({ isOpen, onClose }) {
  const { user } = useUser();
  const { activeSportsId } = useSportsSession();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fetchedRef = useRef({ userId: null, done: false });
  const { fetchSportsSessions, deleteSportsSession } = useSportsSessions();

  // Memoize fetchSportsSessions to avoid unnecessary effect reruns
  const memoizedFetchSportsSessions = useCallback(fetchSportsSessions, [
    fetchSportsSessions,
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
      const data = await memoizedFetchSportsSessions(userId);
      setSessions(data || []);
      setSessionsLoading(false);
      setHasInitialized(true);
    } catch (error) {
      console.error("Error loading sports sessions:", error);
      setSessionsLoading(false);
      setHasInitialized(true);
    }
  }, [userId, memoizedFetchSportsSessions]);

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
      const success = await deleteSportsSession(id, user.id);
      if (success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [deleteSportsSession, user],
  );

  const handleStartActivity = useCallback(() => {
    if (!user) return router.push("/auth");
    router.push("/fitness/sports/live");
  }, [user, router]);

  // Determine what to render - memoized to prevent unnecessary re-renders
  const content = useMemo(() => {
    // Don't render anything until we've initialized
    if (!hasInitialized) {
      return Array.from({ length: 3 }).map((_, index) => (
        <SportsSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (sessionsLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <SportsSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (!user) {
      return <div data-testid="sports-no-user" />;
    }

    if (sessions.length === 0) {
      return (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
            <Goal className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No sports activities yet</h3>
            <p className="text-sm text-gray-400">Start your first activity to begin tracking</p>
          </div>
        </div>
      );
    }

    return sessions.map((s) => (
      <li key={s.id} className="group relative">
        <div 
          onClick={() => router.push(`/fitness/sports/${s.id}`)}
          className="bg-card hover:bg-[#2e2e2e] transition p-4 rounded-lg shadow cursor-pointer border border-border pr-12"
        >
          <h2 className="text-xl font-semibold text-white truncate">
            {s.activity_type || "Sports"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{s.date}</p>
          <p className="text-base mt-2">
            ⏱️ {s.duration_minutes ?? "-"} min
            {s.distance_miles && ` — 📏 ${s.distance_miles} mi`}
          </p>
          {s.location && <p className="text-base mt-1">📍 {s.location}</p>}
          {s.performance_notes && (
            <p className="text-base mt-2">{s.performance_notes}</p>
          )}
        </div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <EditButton
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/fitness/sports/${s.id}/edit`);
              }}
            />
            <SharedDeleteButton
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(s.id);
              }}
              size="sm"
              aria-label="Delete sport entry"
              label=""
              className="w-8 h-8 p-0 flex items-center justify-center"
            />
          </div>
        </div>
      </li>
    ));
  }, [hasInitialized, sessionsLoading, user, sessions, router, handleDelete]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sports & Activities"
      subtitle="Track your sports activities and games"
      icon={Goal}
      iconBgColor="bg-green-500/10"
      iconColor="text-green-500"
      maxWidth="max-w-4xl"
      data-testid="sports-activities-modal"
    >
      <div className="space-y-6">
        {/* Start Activity Button */}
        <div className="flex justify-end gap-3">
          {activeSportsId ? (
            <Button
              variant="secondary"
              size="md"
              onClick={handleStartActivity}
              data-testid="sports-in-progress-button"
              className="flex items-center justify-center gap-2"
            >
              <Goal className="w-4 h-4" />
              Continue Activity
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={handleStartActivity}
              data-testid="start-activity-button"
              className="flex items-center justify-center gap-2"
            >
              <Goal className="w-4 h-4" />
              Start New Activity
            </Button>
          )}
        </div>

        {/* Sports History */}
        <div
          className="space-y-4 min-h-[300px] relative"
          data-testid="sports-list"
        >
          {content}
        </div>
      </div>
    </BaseModal>
  );
}
