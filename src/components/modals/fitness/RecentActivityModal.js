"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import SharedDeleteButton from "@/components/SharedDeleteButton";
import EditButton from "@/components/EditButton";
import BaseModal from "@/components/shared/BaseModal";
import WorkoutDetailsModal from "./WorkoutDetailsModal";
import CardioDetailsModal from "./CardioDetailsModal";
import { useWorkouts } from "@/lib/hooks/useWorkouts";
import { useCardioSessions } from "@/lib/hooks/useCardioSessions";
import { useSportsSessions } from "@/lib/hooks/useSportsSessions";
import { useStretchingSessions } from "@/lib/hooks/useStretchingSessions";
import { useSportsSession } from "@/context/SportsSessionContext";
import dynamic from "next/dynamic";

// Dynamic imports for icons
const Activity = dynamic(() => import("lucide-react/dist/esm/icons/activity"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const Dumbbell = dynamic(() => import("lucide-react/dist/esm/icons/dumbbell"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const HeartPulse = dynamic(() => import("lucide-react/dist/esm/icons/heart-pulse"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const Goal = dynamic(() => import("lucide-react/dist/esm/icons/goal"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const StretchHorizontal = dynamic(() => import("lucide-react/dist/esm/icons/stretch-horizontal"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const Clock = dynamic(() => import("lucide-react/dist/esm/icons/clock"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const MapPin = dynamic(() => import("lucide-react/dist/esm/icons/map-pin"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const Ruler = dynamic(() => import("lucide-react/dist/esm/icons/ruler"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});

// Skeleton component for activity items
function ActivitySkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-700 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded mb-2 w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded mb-2 w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export default function RecentActivityModal({ isOpen, onClose, onOpenStretchingModal }) {
  const { user } = useUser();
  const { activeSportsId } = useSportsSession();
  const router = useRouter();
  
  // State for all activity types
  const [workouts, setWorkouts] = useState([]);
  const [cardioSessions, setCardioSessions] = useState([]);
  const [sportsSessions, setSportsSessions] = useState([]);
  const [stretchingSessions, setStretchingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Workout details modal state
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Cardio details modal state
  const [selectedCardioId, setSelectedCardioId] = useState(null);
  const [showCardioDetailsModal, setShowCardioDetailsModal] = useState(false);
  
  const fetchedRef = useRef({ userId: null, done: false });
  
  // Hooks for data fetching
  const { fetchWorkouts, deleteWorkout } = useWorkouts();
  const { fetchCardioSessions, deleteCardioSession } = useCardioSessions();
  const { fetchSportsSessions, deleteSportsSession } = useSportsSessions();
  const { fetchStretchingSessions, deleteStretchingSession } = useStretchingSessions();

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  const loadAllActivities = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    setLoading(true);

    try {
      const [workoutsData, cardioData, sportsData, stretchingData] = await Promise.all([
        fetchWorkouts(userId),
        fetchCardioSessions(userId),
        fetchSportsSessions(userId),
        fetchStretchingSessions(userId)
      ]);
      
      setWorkouts(workoutsData || []);
      setCardioSessions(cardioData || []);
      setSportsSessions(sportsData || []);
      setStretchingSessions(stretchingData || []);
      setLoading(false);
      setHasInitialized(true);
    } catch (error) {
      console.error("Error loading activities:", error);
      setLoading(false);
      setHasInitialized(true);
    }
  }, [userId, fetchWorkouts, fetchCardioSessions, fetchSportsSessions, fetchStretchingSessions]);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (fetchedRef.current.done && fetchedRef.current.userId === user.id)
      return;
    fetchedRef.current = { userId: user.id, done: true };
    loadAllActivities();
  }, [isOpen, user, loadAllActivities]);

  // Delete handlers
  const handleDeleteWorkout = useCallback(
    async (id) => {
      const confirm = window.confirm("Delete this workout?");
      if (!confirm) return;
      const success = await deleteWorkout(id);
      if (success) {
        setWorkouts((prev) => prev.filter((w) => w.id !== id));
      }
    },
    [deleteWorkout],
  );

  const handleDeleteCardio = useCallback(
    async (id) => {
      const confirm = window.confirm("Delete this cardio session?");
      if (!confirm) return;
      if (!user) return;
      const success = await deleteCardioSession(id, user.id);
      if (success) {
        setCardioSessions((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [deleteCardioSession, user],
  );

  const handleDeleteSports = useCallback(
    async (id) => {
      const confirm = window.confirm("Delete this sports session?");
      if (!confirm) return;
      if (!user) return;
      const success = await deleteSportsSession(id, user.id);
      if (success) {
        setSportsSessions((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [deleteSportsSession, user],
  );

  const handleDeleteStretching = useCallback(
    async (id) => {
      const confirm = window.confirm("Delete this stretching session?");
      if (!confirm) return;
      if (!user) return;
      const success = await deleteStretchingSession(id, user.id);
      if (success) {
        setStretchingSessions((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [deleteStretchingSession, user],
  );

  // Click handlers
  const handleWorkoutClick = useCallback((workoutId) => {
    setSelectedWorkoutId(workoutId);
    setShowDetailsModal(true);
  }, []);

  const handleCardioClick = useCallback((cardioId) => {
    setSelectedCardioId(cardioId);
    setShowCardioDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedWorkoutId(null);
  }, []);

  const handleCloseCardioDetailsModal = useCallback(() => {
    setShowCardioDetailsModal(false);
    setSelectedCardioId(null);
  }, []);

  // Combine and sort all activities by date
  const allActivities = useMemo(() => {
    const activities = [
      ...workouts.map(w => ({ ...w, type: 'workout', date: new Date(w.date), displayDate: w.date })),
      ...cardioSessions.map(c => ({ ...c, type: 'cardio', date: new Date(c.date), displayDate: c.date })),
      ...sportsSessions.map(s => ({ ...s, type: 'sports', date: new Date(s.date), displayDate: s.date })),
      ...stretchingSessions.map(s => ({ ...s, type: 'stretching', date: new Date(s.date), displayDate: s.date }))
    ];
    
    return activities.sort((a, b) => b.date - a.date);
  }, [workouts, cardioSessions, sportsSessions, stretchingSessions]);

  // Activity type configuration
  const activityConfig = useMemo(() => ({
    workout: {
      icon: Dumbbell,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      label: "Workout",
      onClick: handleWorkoutClick,
      onDelete: handleDeleteWorkout,
      onEdit: (id) => window.open(`/fitness/workouts/${id}/edit`, '_blank')
    },
    cardio: {
      icon: HeartPulse,
      iconColor: "text-red-500",
      bgColor: "bg-red-500/10",
      label: "Cardio",
      onClick: handleCardioClick,
      onDelete: handleDeleteCardio,
      onEdit: (id) => router.push(`/fitness/cardio/${id}/edit`)
    },
    sports: {
      icon: Goal,
      iconColor: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "Sports",
      onClick: (id) => router.push(`/fitness/sports/${id}`),
      onDelete: handleDeleteSports,
      onEdit: (id) => router.push(`/fitness/sports/${id}/edit`)
    },
    stretching: {
      icon: StretchHorizontal,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      label: "Stretching",
      onClick: (id) => {
        if (onOpenStretchingModal) {
          onOpenStretchingModal('view', id);
        }
      },
      onDelete: handleDeleteStretching,
      onEdit: (id) => {
        if (onOpenStretchingModal) {
          onOpenStretchingModal('edit', id);
        }
      }
    }
  }), [handleWorkoutClick, handleCardioClick, handleDeleteWorkout, handleDeleteCardio, handleDeleteSports, handleDeleteStretching, router, onOpenStretchingModal]);



  // Determine what to render
  const content = useMemo(() => {
    if (!hasInitialized) {
      return Array.from({ length: 3 }).map((_, index) => (
        <ActivitySkeleton key={`skeleton-${index}`} />
      ));
    }

    if (loading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <ActivitySkeleton key={`skeleton-${index}`} />
      ));
    }

    if (!user) {
      return <div data-testid="recent-activity-no-user" />;
    }

    if (allActivities.length === 0) {
      return (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No activities yet</h3>
            <p className="text-sm text-gray-400">Start your first activity to begin tracking</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {allActivities.map((activity) => {
          const config = activityConfig[activity.type];
          const IconComponent = config.icon;

          return (
            <div key={`${activity.type}-${activity.id}`} className="group relative">
              <div 
                onClick={() => config.onClick(activity.id)}
                className="bg-card hover:bg-[#2e2e2e] transition p-4 rounded-lg shadow cursor-pointer border border-border pr-12"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                    <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {activity.type === 'workout' ? activity.title : (activity.activity_type || config.label)}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${config.bgColor} ${config.iconColor}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{activity.displayDate}</p>
                    
                    {/* Activity-specific details */}
                    {activity.type === 'workout' && activity.notes && (
                      <p className="text-sm text-gray-300 mt-2 line-clamp-2">{activity.notes}</p>
                    )}
                    
                    {activity.type === 'cardio' && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activity.duration_minutes ?? "-"} min
                        </span>
                        {activity.distance_miles && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-4 h-4" />
                            {activity.distance_miles} mi
                          </span>
                        )}
                        {activity.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {activity.location}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {activity.type === 'sports' && (
                      <div className="mt-2">
                        <p className="text-base">
                          ⏱️ {activity.duration_minutes ?? "-"} min
                          {activity.distance_miles && ` — 📏 ${activity.distance_miles} mi`}
                        </p>
                        {activity.location && <p className="text-base mt-1">📍 {activity.location}</p>}
                        {activity.performance_notes && (
                          <p className="text-base mt-2">{activity.performance_notes}</p>
                        )}
                      </div>
                    )}
                    
                    {activity.type === 'stretching' && (
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {activity.duration_minutes ?? "-"} min
                        </span>
                        {activity.intensity_level && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-700">
                            {activity.intensity_level}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <EditButton
                    onClick={(e) => {
                      e.stopPropagation();
                      config.onEdit(activity.id);
                    }}
                  />
                  <SharedDeleteButton
                    onClick={(e) => {
                      e.stopPropagation();
                      config.onDelete(activity.id);
                    }}
                    size="sm"
                    aria-label={`Delete ${activity.type} entry`}
                    label=""
                    className="w-8 h-8 p-0 flex items-center justify-center"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [hasInitialized, loading, user, allActivities, activityConfig]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Recent Activity"
      subtitle="View your workouts, cardio sessions, and sports activities"
      icon={Activity}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      maxWidth="max-w-4xl"
      data-testid="recent-activity-modal"
    >
      <div className="space-y-6">
        {/* Activity History */}
        <div
          className="space-y-4 min-h-[300px] relative"
          data-testid="activity-list"
        >
          {content}
        </div>
      </div>
      
      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        workoutId={selectedWorkoutId}
      />
      
      {/* Cardio Details Modal */}
      <CardioDetailsModal
        isOpen={showCardioDetailsModal}
        onClose={handleCloseCardioDetailsModal}
        cardioId={selectedCardioId}
      />
    </BaseModal>
  );
}
