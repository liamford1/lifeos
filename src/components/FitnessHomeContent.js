"use client";
import React from 'react';
import FitnessHome from './fitness/FitnessHome';

/**
 * FitnessHomeContent Component
 * 
 * This component has been refactored to use a modular structure.
 * The original 760-line component has been broken down into focused components:
 * 
 * - FitnessHome: Main container and coordination
 * - FitnessStats: Statistics and metrics display
 * - WorkoutPlanner: Activity start functionality and forms
 * - ExerciseLibrary: Quick actions and fitness tools
 * - FitnessGoals: Charts and progress tracking
 * 
 * This wrapper maintains the same API for parent components while
 * delegating all functionality to the new modular structure.
 */
export default function FitnessHomeContent() {
  return <FitnessHome />;
} 