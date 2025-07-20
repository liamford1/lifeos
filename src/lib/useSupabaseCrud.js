'use client';

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';

// Fetch hook
export function useFetchEntity(table, filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useToast();

  // Memoize filters to ensure stable reference
  const memoizedFilters = useMemo(() => filters, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from(table).select('*');
    Object.entries(memoizedFilters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) {
      setError(error);
      setData(null);
      showError(error.message || 'Failed to fetch data');
    } else {
      setData(data);
      showSuccess('Fetched successfully');
    }
    setLoading(false);
  }, [table, memoizedFilters, showSuccess, showError]);

  // Fetch on mount or filters change
  // (User should call fetchData manually if they want more control)

  return { data, loading, error, refetch: fetchData };
}

// Insert hook
export function useInsertEntity(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useToast();

  const insert = async (insertData) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from(table).insert(insertData).select();
    if (error) {
      setError(error);
      showError(error.message || 'Insert failed');
      setLoading(false);
      return { data: null, error };
    } else {
      showSuccess('Inserted successfully');
      setLoading(false);
      return { data, error: null };
    }
  };

  return { insert, loading, error };
}

// Delete hook
export function useDeleteEntity(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useToast();

  const deleteByFilters = async (filters) => {
    setLoading(true);
    setError(null);
    let query = supabase.from(table).delete();
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { error } = await query;
    if (error) {
      setError(error);
      showError(error.message || 'Delete failed');
      setLoading(false);
      return { error };
    } else {
      showSuccess('Deleted successfully');
      setLoading(false);
      return { error: null };
    }
  };

  return { deleteByFilters, loading, error };
} 