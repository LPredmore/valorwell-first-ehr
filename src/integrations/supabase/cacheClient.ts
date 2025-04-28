import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';

// Cache configuration interface
export interface CacheConfig {
  ttl: number; // Time-to-live in milliseconds
  maxSize: number; // Maximum number of items in cache
  enabled: boolean; // Whether caching is enabled
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes default TTL
  maxSize: 100, // Store up to 100 query results by default
  enabled: true
};

/**
 * CachedSupabaseClient - Extends the Supabase client with caching capabilities
 * Provides methods to cache query results and invalidate cache entries
 */
export class CachedSupabaseClient {
  private client: SupabaseClient;
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private queryCount: number = 0;

  constructor(client: SupabaseClient = supabase, config: Partial<CacheConfig> = {}) {
    this.client = client;
    this.cache = new Map();
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    
    // Log cache configuration
    console.log('[CachedSupabaseClient] Initialized with config:', this.config);
  }

  /**
   * Generate a cache key from a query
   */
  private generateCacheKey(table: string, query: any): string {
    // Create a deterministic string representation of the query
    const queryStr = JSON.stringify(query);
    return `${table}:${queryStr}`;
  }

  /**
   * Check if a cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return now - entry.timestamp < this.config.ttl;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`[CachedSupabaseClient] Cleaned up ${expiredCount} expired cache entries`);
    }
  }

  /**
   * Enforce cache size limits
   */
  private enforceSizeLimit(): void {
    if (this.cache.size <= this.config.maxSize) return;
    
    // If cache exceeds max size, remove oldest entries
    const entriesToRemove = this.cache.size - this.config.maxSize;
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, entriesToRemove);
    
    for (const [key] of entries) {
      this.cache.delete(key);
    }
    
    console.log(`[CachedSupabaseClient] Removed ${entriesToRemove} oldest cache entries due to size limit`);
  }

  /**
   * Execute a query with caching
   */
  async query<T>(
    table: string,
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
    options: { bypassCache?: boolean; ttl?: number } = {}
  ): Promise<{ data: T | null; error: any; fromCache?: boolean }> {
    this.queryCount++;
    
    // Clean cache periodically
    if (this.queryCount % 100 === 0) {
      this.cleanCache();
    }
    
    // Generate a unique key for this query
    const cacheKey = this.generateCacheKey(table, queryFn.toString());
    
    // Check if caching is enabled and not bypassed for this query
    if (this.config.enabled && !options.bypassCache) {
      const cachedResult = this.cache.get(cacheKey);
      
      // If we have a valid cached result, return it
      if (cachedResult && this.isCacheValid(cachedResult)) {
        this.cacheHits++;
        console.log(`[CachedSupabaseClient] Cache hit for ${table} query (key: ${cacheKey.substring(0, 20)}...)`);
        return { data: cachedResult.data, error: null, fromCache: true };
      }
    }
    
    // Cache miss or bypass, execute the actual query
    this.cacheMisses++;
    console.log(`[CachedSupabaseClient] Cache miss for ${table} query`);
    
    try {
      const result = await queryFn(this.client);
      
      // If query was successful and caching is enabled, cache the result
      if (!result.error && result.data && this.config.enabled && !options.bypassCache) {
        const ttl = options.ttl || this.config.ttl;
        
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
          key: cacheKey
        });
        
        // Enforce size limit after adding new entry
        this.enforceSizeLimit();
        
        console.log(`[CachedSupabaseClient] Cached result for ${table} query (TTL: ${ttl}ms)`);
      }
      
      return { ...result, fromCache: false };
    } catch (error) {
      console.error(`[CachedSupabaseClient] Error executing query for ${table}:`, error);
      return { data: null, error, fromCache: false };
    }
  }

  /**
   * Invalidate cache entries for a specific table
   */
  invalidateTable(table: string): void {
    let count = 0;
    
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${table}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    console.log(`[CachedSupabaseClient] Invalidated ${count} cache entries for table: ${table}`);
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidateKey(key: string): void {
    const deleted = this.cache.delete(key);
    console.log(`[CachedSupabaseClient] Invalidated cache entry: ${key} (success: ${deleted})`);
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`[CachedSupabaseClient] Invalidated all ${count} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? this.cacheHits / totalRequests : 0;
    
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate
    };
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[CachedSupabaseClient] Updated config:', this.config);
    
    // If cache was disabled, clear it
    if (!this.config.enabled) {
      this.invalidateAll();
    }
    
    // If max size was reduced, enforce the new limit
    this.enforceSizeLimit();
  }

  /**
   * Get the underlying Supabase client
   */
  getClient(): SupabaseClient {
    return this.client;
  }
}

// Create and export a singleton instance with default configuration
export const cachedSupabase = new CachedSupabaseClient(supabase);