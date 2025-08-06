"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PlanMealModal from '@/components/modals/PlanMealModal';
import PantryModal from '@/components/modals/PantryModal';
import AddMealModal from '@/components/modals/AddMealModal';
import MealsModal from '@/components/modals/MealsModal';
import AddReceiptModal from '@/components/modals/AddReceiptModal';
import dynamic from "next/dynamic";
import { supabase } from '@/lib/supabaseClient';
import dayjs from 'dayjs';

const Package = dynamic(() => import("lucide-react/dist/esm/icons/package"), { ssr: false });
const Utensils = dynamic(() => import("lucide-react/dist/esm/icons/utensils"), { ssr: false });
const CalendarClock = dynamic(() => import("lucide-react/dist/esm/icons/calendar-clock"), { ssr: false });
const Receipt = dynamic(() => import("lucide-react/dist/esm/icons/receipt"), { ssr: false });
const CirclePlus = dynamic(() => import("lucide-react/dist/esm/icons/circle-plus"), { ssr: false });
const Calendar = dynamic(() => import("lucide-react/dist/esm/icons/calendar"), { ssr: false });
const Brain = dynamic(() => import("lucide-react/dist/esm/icons/brain"), { ssr: false });
const Search = dynamic(() => import("lucide-react/dist/esm/icons/search"), { ssr: false });
const Clock = dynamic(() => import("lucide-react/dist/esm/icons/clock"), { ssr: false });
const ChefHat = dynamic(() => import("lucide-react/dist/esm/icons/chef-hat"), { ssr: false });
const Clipboard = dynamic(() => import("lucide-react/dist/esm/icons/clipboard"), { ssr: false });
const Sparkles = dynamic(() => import("lucide-react/dist/esm/icons/sparkles"), { ssr: false });
const Drumstick = dynamic(() => import("lucide-react/dist/esm/icons/drumstick"), { ssr: false });
const Salad = dynamic(() => import("lucide-react/dist/esm/icons/salad"), { ssr: false });
const Coffee = dynamic(() => import("lucide-react/dist/esm/icons/coffee"), { ssr: false });
const Pizza = dynamic(() => import("lucide-react/dist/esm/icons/pizza"), { ssr: false });

export default function FoodHome() {
  const { user, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recentlyCooked, setRecentlyCooked] = useState([]);
  const [upcomingMeals, setUpcomingMeals] = useState([]);
  const [loadingCooked, setLoadingCooked] = useState(false);
  const [loadingPlanned, setLoadingPlanned] = useState(false);
  const [showPlanMealModal, setShowPlanMealModal] = useState(false);
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showMealsModal, setShowMealsModal] = useState(false);
  const [showAddReceiptModal, setShowAddReceiptModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  // Check for URL parameters to open modals
  useEffect(() => {
    if (searchParams.get('showAddMealModal') === 'true') {
      setShowAddMealModal(true);
      // Clean up the URL parameter
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('showAddMealModal');
      window.history.replaceState({}, '', newUrl);
    }
    
    if (searchParams.get('showMealsModal') === 'true') {
      setShowMealsModal(true);
      // Clean up the URL parameter
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('showMealsModal');
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Fetch recently cooked meals
  useEffect(() => {
    const fetchRecentlyCooked = async () => {
      if (!user) return;
      
      setLoadingCooked(true);
      try {
        const { data, error } = await supabase
          .from('cooked_meals')
          .select(`
            *,
            meals (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .order('last_cooked_at', { ascending: false })
          .limit(2);

        if (error) {
          console.error('Error fetching cooked meals:', error);
          setRecentlyCooked([]);
        } else {
          setRecentlyCooked(data || []);
        }
      } catch (err) {
        console.error('Error fetching cooked meals:', err);
        setRecentlyCooked([]);
      } finally {
        setLoadingCooked(false);
      }
    };

    fetchRecentlyCooked();
  }, [user]);

  // Fetch upcoming planned meals
  useEffect(() => {
    const fetchUpcomingMeals = async () => {
      if (!user) return;
      
      setLoadingPlanned(true);
      try {
        const today = dayjs().format('YYYY-MM-DD');
        const { data, error } = await supabase
          .from('planned_meals')
          .select(`
            *,
            meals (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .gte('planned_date', today)
          .order('planned_date', { ascending: true })
          .limit(3);

        if (error) {
          console.error('Error fetching planned meals:', error);
          setUpcomingMeals([]);
        } else {
          setUpcomingMeals(data || []);
        }
      } catch (err) {
        console.error('Error fetching planned meals:', err);
        setUpcomingMeals([]);
      } finally {
        setLoadingPlanned(false);
      }
    };

    fetchUpcomingMeals();
  }, [user]);

  const formatDate = (dateString) => {
    const date = dayjs(dateString);
    const now = dayjs();
    
    if (date.isSame(now, 'day')) {
      return 'Today';
    } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    } else if (date.isBefore(now)) {
      return date.format('MMM D');
    } else {
      return date.format('ddd, MMM D');
    }
  };

  const getMealIcon = (mealName) => {
    const name = mealName.toLowerCase();
    if (name.includes('chicken') || name.includes('meat') || name.includes('beef')) {
      return <Drumstick className="w-5 h-5 text-orange-600" />;
    } else if (name.includes('salad') || name.includes('vegetable')) {
      return <Salad className="w-5 h-5 text-green-600" />;
    } else if (name.includes('pasta') || name.includes('noodle')) {
      return <Utensils className="w-5 h-5 text-purple-600" />;
    } else if (name.includes('shake') || name.includes('smoothie') || name.includes('drink')) {
      return <Coffee className="w-5 h-5 text-yellow-600" />;
    } else {
      return <Pizza className="w-5 h-5 text-blue-600" />;
    }
  };

  const getMealIconBg = (mealName) => {
    const name = mealName.toLowerCase();
    if (name.includes('chicken') || name.includes('meat') || name.includes('beef')) {
      return 'bg-orange-100 dark:bg-orange-900/20';
    } else if (name.includes('salad') || name.includes('vegetable')) {
      return 'bg-green-100 dark:bg-green-900/20';
    } else if (name.includes('pasta') || name.includes('noodle')) {
      return 'bg-purple-100 dark:bg-purple-900/20';
    } else if (name.includes('shake') || name.includes('smoothie') || name.includes('drink')) {
      return 'bg-yellow-100 dark:bg-yellow-900/20';
    } else {
      return 'bg-blue-100 dark:bg-blue-900/20';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">
        <Utensils className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Food & Diet Dashboard
      </h1>
      
      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left Panel - Meal Information */}
        <div className="space-y-6">
          
          {/* Recently Cooked Section */}
          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mr-2">
                <ChefHat className="w-4 h-4 text-orange-600" />
              </div>
              Recently Cooked
            </h2>
            <div className="space-y-3">
              {loadingCooked ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : recentlyCooked.length > 0 ? (
                recentlyCooked.map((cookedMeal) => (
                  <Link
                    key={`${cookedMeal.user_id}-${cookedMeal.meal_id}`}
                    href={`/food/meals/${cookedMeal.meal_id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-card/80 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getMealIconBg(cookedMeal.meals?.name)} rounded-lg flex items-center justify-center`}>
                          {getMealIcon(cookedMeal.meals?.name)}
                        </div>
                        <div>
                          <h3 className="font-medium">{cookedMeal.meals?.name || 'Unknown Meal'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(cookedMeal.last_cooked_at)}
                          </p>
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ChefHat className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>You haven&apos;t cooked any meals yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Meals Section */}
          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-2">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              Upcoming Meals
            </h2>
            <div className="space-y-3">
              {loadingPlanned ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : upcomingMeals.length > 0 ? (
                upcomingMeals.map((plannedMeal) => (
                  <Link
                    key={plannedMeal.id}
                    href={`/food/planner/${plannedMeal.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg hover:bg-card/80 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${getMealIconBg(plannedMeal.meals?.name)} rounded-lg flex items-center justify-center`}>
                          {getMealIcon(plannedMeal.meals?.name)}
                        </div>
                        <div>
                          <h3 className="font-medium">{plannedMeal.meals?.name || 'Unknown Meal'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(plannedMeal.planned_date)} • {plannedMeal.meal_time}
                          </p>
                        </div>
                      </div>
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No meals planned. Let&apos;s fix that!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Quick Actions */}
        <div className="space-y-6">
          
          {/* Quick Actions Section */}
          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mr-2">
                <CirclePlus className="w-4 h-4 text-green-600" />
              </div>
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowAddMealModal(true)}
                className="block p-3 bg-card rounded-lg hover:bg-card/80 transition-colors border border-border w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <CirclePlus className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Add a Meal</h3>
                    <p className="text-xs text-muted-foreground">Create new recipe</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setShowPlanMealModal(true)}
                className="block p-3 bg-card rounded-lg hover:bg-card/80 transition-colors border border-border w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Clipboard className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Plan Weekly Meals</h3>
                    <p className="text-xs text-muted-foreground">Schedule your week</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setShowPantryModal(true)}
                className="block p-3 bg-card rounded-lg hover:bg-card/80 transition-colors border border-border w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">View Pantry</h3>
                    <p className="text-xs text-muted-foreground">Check inventory</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setShowMealsModal(true)}
                className="block p-3 bg-card rounded-lg hover:bg-card/80 transition-colors border border-border w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Recipe Search</h3>
                    <p className="text-xs text-muted-foreground">Browse recipes</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setShowAddReceiptModal(true)}
                className="block p-3 bg-card rounded-lg hover:bg-card/80 transition-colors border border-border w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Add a Receipt</h3>
                    <p className="text-xs text-muted-foreground">Log a grocery receipt</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* AI Suggestion Section */}
          <div className="bg-surface rounded-lg p-6 shadow-sm border border-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mr-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              Suggestion
            </h2>
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Need help planning this week&apos;s dinners?
              </p>
              <button
                onClick={() => console.log('AI suggestion clicked')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Ask AI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Meal Modal */}
      <PlanMealModal 
        isOpen={showPlanMealModal} 
        onClose={() => setShowPlanMealModal(false)}
        onSuccess={() => {
          // Refresh the upcoming meals when a meal is successfully planned
          const fetchUpcomingMeals = async () => {
            if (!user) return;
            
            setLoadingPlanned(true);
            try {
              const today = dayjs().format('YYYY-MM-DD');
              const { data, error } = await supabase
                .from('planned_meals')
                .select(`
                  *,
                  meals (
                    id,
                    name
                  )
                `)
                .eq('user_id', user.id)
                .gte('planned_date', today)
                .order('planned_date', { ascending: true })
                .limit(3);

              if (error) {
                console.error('Error fetching planned meals:', error);
                setUpcomingMeals([]);
              } else {
                setUpcomingMeals(data || []);
              }
            } catch (err) {
              console.error('Error fetching planned meals:', err);
              setUpcomingMeals([]);
            } finally {
              setLoadingPlanned(false);
            }
          };
          fetchUpcomingMeals();
        }}
      />

      {/* Pantry Modal */}
      <PantryModal 
        isOpen={showPantryModal} 
        onClose={() => setShowPantryModal(false)}
      />

      {/* Add Meal Modal */}
      <AddMealModal 
        isOpen={showAddMealModal} 
        onClose={() => setShowAddMealModal(false)}
        onSuccess={() => {
          // Refresh the recently cooked meals when a meal is successfully created
          const fetchRecentlyCooked = async () => {
            if (!user) return;
            
            setLoadingCooked(true);
            try {
              const { data, error } = await supabase
                .from('cooked_meals')
                .select(`
                  *,
                  meals (
                    id,
                    name
                  )
                `)
                .eq('user_id', user.id)
                .order('last_cooked_at', { ascending: false })
                .limit(2);

              if (error) {
                console.error('Error fetching cooked meals:', error);
                setRecentlyCooked([]);
              } else {
                setRecentlyCooked(data || []);
              }
            } catch (err) {
              console.error('Error fetching cooked meals:', err);
              setRecentlyCooked([]);
            } finally {
              setLoadingCooked(false);
            }
          };
          fetchRecentlyCooked();
        }}
      />

      {/* Meals Modal */}
      <MealsModal 
        isOpen={showMealsModal} 
        onClose={() => setShowMealsModal(false)}
      />

      {/* Add Receipt Modal */}
      <AddReceiptModal 
        isOpen={showAddReceiptModal} 
        onClose={() => setShowAddReceiptModal(false)}
        onSuccess={() => {
          // Optionally refresh data when a receipt is successfully added
          // This could refresh pantry items or other related data
        }}
      />
    </div>
  );
}
