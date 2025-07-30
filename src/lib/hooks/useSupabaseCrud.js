'use client';

import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';

// Fetch hook
export function useFetchEntity(table, filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleError, handleSuccess } = useApiError();

  // Memoize filters to ensure stable reference
  const memoizedFilters = useMemo(() => filters, [filters]);

  const fetchData = useCallback(async (options = {}) => {
    const { showToast = true } = options;
    
    setLoading(true);
    setError(null);
    let query = supabase.from(table).select('*');
    Object.entries(memoizedFilters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) {
      const errorObj = handleError(error, { 
        customMessage: 'Failed to fetch data',
        showToast 
      });
      setError(errorObj);
      setData(null);
    } else {
      setData(data);
      handleSuccess('Fetched successfully', { showToast });
    }
    setLoading(false);
  }, [table, memoizedFilters, handleError, handleSuccess]);

  // Fetch on mount or filters change
  // (User should call fetchData manually if they want more control)

  return { data, loading, error, refetch: fetchData };
}

// Insert hook
export function useInsertEntity(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleError, handleSuccess } = useApiError();

  const insert = async (insertData, options = {}) => {
    const { showToast = true } = options;
    
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from(table).insert(insertData).select();
    if (error) {
      const errorObj = handleError(error, { 
        customMessage: 'Insert failed',
        showToast 
      });
      setError(errorObj);
      setLoading(false);
      return { data: null, error: errorObj };
    } else {
      handleSuccess('Inserted successfully', { showToast });
      setLoading(false);
      return { data, error: null };
    }
  };

  return { insert, loading, error };
}

// Update hook
export function useUpdateEntity(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleError, handleSuccess } = useApiError();

  const update = async (filters, updateData, options = {}) => {
    const { showToast = true } = options;
    
    setLoading(true);
    setError(null);
    let query = supabase.from(table).update(updateData);
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query.select();
    if (error) {
      const errorObj = handleError(error, { 
        customMessage: 'Update failed',
        showToast 
      });
      setError(errorObj);
      setLoading(false);
      return { data: null, error: errorObj };
    } else {
      handleSuccess('Updated successfully', { showToast });
      setLoading(false);
      return { data, error: null };
    }
  };

  return { update, loading, error };
}

// Delete hook
export function useDeleteEntity(table) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleError, handleSuccess } = useApiError();

  const deleteByFilters = async (filters, options = {}) => {
    const { showToast = true } = options;
    
    setLoading(true);
    setError(null);
    let query = supabase.from(table).delete();
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { error } = await query;
    if (error) {
      const errorObj = handleError(error, { 
        customMessage: 'Delete failed',
        showToast 
      });
      setError(errorObj);
      setLoading(false);
      return { error: errorObj };
    } else {
      handleSuccess('Deleted successfully', { showToast });
      setLoading(false);
      return { error: null };
    }
  };

  return { deleteByFilters, loading, error };
} 