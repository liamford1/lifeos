"use client";

import { useState } from 'react';
import BaseModal from '@/components/shared/BaseModal';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormSelect from '@/components/shared/FormSelect';
import FormTextarea from '@/components/shared/FormTextarea';
import dynamic from "next/dynamic";
const Timer = dynamic(() => import("lucide-react/dist/esm/icons/timer"), { ssr: false, loading: () => <span className="inline-block w-5 h-5" /> });
const TrendingUp = dynamic(() => import("lucide-react/dist/esm/icons/trending-up"), { ssr: false, loading: () => <span className="inline-block w-8 h-8" /> });
const Heart = dynamic(() => import("lucide-react/dist/esm/icons/heart"), { ssr: false, loading: () => <span className="inline-block w-8 h-8" /> });
const Zap = dynamic(() => import("lucide-react/dist/esm/icons/zap"), { ssr: false, loading: () => <span className="inline-block w-8 h-8" /> });

export default function DailyActivityModal({ isOpen, onClose }) {
  const [activityData, setActivityData] = useState({
    steps: '',
    mood: '',
    energy: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement activity tracking
    console.log('Activity data:', activityData);
  };

  const handleChange = (field, value) => {
    setActivityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Activity"
      subtitle="Track your steps, mood, energy and daily wellness"
      icon={Timer}
      iconBgColor="bg-yellow-500/10"
      iconColor="text-yellow-500"
      maxWidth="max-w-2xl"
      data-testid="daily-activity-modal"
    >
      <div className="space-y-6">
        {/* Activity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-semibold text-sm mb-1">Steps</h4>
            <p className="text-2xl font-bold text-blue-500">8,432</p>
            <p className="text-xs text-gray-400">Today</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h4 className="font-semibold text-sm mb-1">Mood</h4>
            <p className="text-2xl font-bold text-red-500">😊</p>
            <p className="text-xs text-gray-400">Good</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <h4 className="font-semibold text-sm mb-1">Energy</h4>
            <p className="text-2xl font-bold text-yellow-500">7/10</p>
            <p className="text-xs text-gray-400">High</p>
          </div>
        </div>

        {/* Activity Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Steps Today</label>
              <FormInput
                type="number"
                value={activityData.steps}
                onChange={(e) => handleChange('steps', e.target.value)}
                placeholder="Enter step count"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mood</label>
              <FormSelect
                value={activityData.mood}
                onChange={(e) => handleChange('mood', e.target.value)}
              >
                <option value="">Select mood</option>
                <option value="excellent">😊 Excellent</option>
                <option value="good">🙂 Good</option>
                <option value="okay">😐 Okay</option>
                <option value="poor">😔 Poor</option>
                <option value="terrible">😢 Terrible</option>
              </FormSelect>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Energy Level</label>
            <FormSelect
              value={activityData.energy}
              onChange={(e) => handleChange('energy', e.target.value)}
            >
              <option value="">Select energy level</option>
              <option value="1">1 - Very Low</option>
              <option value="2">2 - Low</option>
              <option value="3">3 - Below Average</option>
              <option value="4">4 - Average</option>
              <option value="5">5 - Above Average</option>
              <option value="6">6 - Good</option>
              <option value="7">7 - Very Good</option>
              <option value="8">8 - High</option>
              <option value="9">9 - Very High</option>
              <option value="10">10 - Excellent</option>
            </FormSelect>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <FormTextarea
              value={activityData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes about your day..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className="flex-1"
            >
              Save Activity
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
} 