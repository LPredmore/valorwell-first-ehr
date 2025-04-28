import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAsyncState } from './useAsyncState';

export interface EntityStateOptions<T> {
  entityType: string;
  initialQuery?: Record<string, any>;
  idField?: string;
  orderBy?: { column: string; ascending?: boolean };
  cacheTime?: number;
  onError?: (error: Error) => void;
}

/**
 * A hook for managing entity data with CRUD operations.
 * 
 * @example
 * ```tsx
 * const {
 *   data: clients,
 *   isLoading,
 *   error,
 *   create: createClient,
 *   update: updateClient,
 *   remove: removeClient,
 *   refresh: refreshClients
 * } = useEntityState({
 *   entityType: 'clients',
 *   initialQuery: { client_assigned_therapist: clinicianId },
 *   orderBy: { column: 'client_last_name', ascending: true }
 * });
 * ```
 */
export function useEntityState<T extends Record<string, any>>({
  entityType,
  initialQuery = {},
  idField = 'id',
  orderBy,
  cacheTime = 5 * 60 * 1000, // 5 minutes default cache time
  onError
}: EntityStateOptions<T>) {
  // State for entities
  const [entities, setEntities] = useState<T[]>([]);
  
  // Cache for entity data
  const cache = useRef<{
    data: T[];
    timestamp: number;
    query: string;
  } | null>(null);
  
  // Current query parameters
  const [queryParams, setQueryParams] = useState(initialQuery);
  
  // Convert query params to a string for cache comparison
  const queryString = JSON.stringify(queryParams);
  
  // Fetch entities function
  const fetchEntities = useCallback(async () => {
    // Check cache first
    if (cache.current) {
      const now = Date.now();
      const isQuerySame = cache.current.query === queryString;
      const isCacheValid = (now - cache.current.timestamp) < cacheTime;
      
      if (isQuerySame && isCacheValid) {
        console.log(`[useEntityState] Using cached ${entityType} data`);
        return cache.current.data;
      }
    }
    
    console.log(`[useEntityState] Fetching ${entityType} data`);
    
    let query = supabase
      .from(entityType)
      .select('*');
    
    // Apply query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    // Apply ordering if specified
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`[useEntityState] Error fetching ${entityType}:`, error);
      throw new Error(`Failed to fetch ${entityType}: ${error.message}`);
    }
    
    // Update cache
    cache.current = {
      data: data as T[],
      timestamp: Date.now(),
      query: queryString
    };
    
    return data as T[];
  }, [entityType, queryString, queryParams, cacheTime, orderBy]);
  
  // Use async state for data fetching
  const {
    data,
    isLoading,
    error,
    execute: refresh
  } = useAsyncState({
    asyncFunction: fetchEntities,
    immediate: true,
    onSuccess: (data) => setEntities(data),
    onError
  });
  
  // Create entity function
  const create = useCallback(async (entity: Omit<T, typeof idField>) => {
    console.log(`[useEntityState] Creating ${entityType}:`, entity);
    
    const { data, error } = await supabase
      .from(entityType)
      .insert(entity)
      .select()
      .single();
    
    if (error) {
      console.error(`[useEntityState] Error creating ${entityType}:`, error);
      throw new Error(`Failed to create ${entityType}: ${error.message}`);
    }
    
    // Update local state
    setEntities(prev => [...prev, data as T]);
    
    // Invalidate cache
    cache.current = null;
    
    return data as T;
  }, [entityType]);
  
  // Update entity function
  const update = useCallback(async (id: string | number, updates: Partial<T>) => {
    console.log(`[useEntityState] Updating ${entityType} ${id}:`, updates);
    
    const { data, error } = await supabase
      .from(entityType)
      .update(updates)
      .eq(idField, id)
      .select()
      .single();
    
    if (error) {
      console.error(`[useEntityState] Error updating ${entityType}:`, error);
      throw new Error(`Failed to update ${entityType}: ${error.message}`);
    }
    
    // Update local state
    setEntities(prev => 
      prev.map(entity => 
        entity[idField] === id ? { ...entity, ...data } as T : entity
      )
    );
    
    // Invalidate cache
    cache.current = null;
    
    return data as T;
  }, [entityType, idField]);
  
  // Remove entity function
  const remove = useCallback(async (id: string | number) => {
    console.log(`[useEntityState] Removing ${entityType} ${id}`);
    
    const { error } = await supabase
      .from(entityType)
      .delete()
      .eq(idField, id);
    
    if (error) {
      console.error(`[useEntityState] Error removing ${entityType}:`, error);
      throw new Error(`Failed to remove ${entityType}: ${error.message}`);
    }
    
    // Update local state
    setEntities(prev => prev.filter(entity => entity[idField] !== id));
    
    // Invalidate cache
    cache.current = null;
    
    return true;
  }, [entityType, idField]);
  
  // Update query parameters
  const setQuery = useCallback((newParams: Record<string, any>) => {
    setQueryParams(prev => ({
      ...prev,
      ...newParams
    }));
  }, []);
  
  // Refresh data when query parameters change
  useEffect(() => {
    refresh();
  }, [queryString, refresh]);
  
  return {
    data: entities,
    isLoading,
    error,
    create,
    update,
    remove,
    refresh,
    setQuery
  };
}