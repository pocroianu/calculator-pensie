/**
 * Memoization utilities for performance optimization
 *
 * These utilities provide caching for expensive calculations to prevent
 * UI lag when dealing with large numbers of contribution periods.
 */

/**
 * Generic memoization function with LRU (Least Recently Used) cache eviction
 *
 * @param fn - The function to memoize
 * @param maxSize - Maximum cache size (default: 100)
 * @param keyGenerator - Optional custom key generator function
 * @returns Memoized function with cache management
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  maxSize: number = 100,
  keyGenerator?: (...args: TArgs) => string
): ((...args: TArgs) => TResult) & { clearCache: () => void; getCacheSize: () => number } {
  const cache = new Map<string, { value: TResult; lastAccessed: number }>();
  let accessCounter = 0;

  const generateKey = keyGenerator || ((...args: TArgs) => JSON.stringify(args));

  const memoized = (...args: TArgs): TResult => {
    const key = generateKey(...args);

    if (cache.has(key)) {
      const entry = cache.get(key)!;
      entry.lastAccessed = ++accessCounter;
      return entry.value;
    }

    const result = fn(...args);

    // Evict LRU entries if cache is full
    if (cache.size >= maxSize) {
      let oldestKey = '';
      let oldestAccess = Infinity;

      for (const [k, v] of cache.entries()) {
        if (v.lastAccessed < oldestAccess) {
          oldestAccess = v.lastAccessed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, { value: result, lastAccessed: ++accessCounter });
    return result;
  };

  memoized.clearCache = () => {
    cache.clear();
    accessCounter = 0;
  };

  memoized.getCacheSize = () => cache.size;

  return memoized;
}

/**
 * Creates a memoized version of a function that caches results based on
 * a hash of its arguments. Uses a simpler Map-based cache without LRU eviction.
 * Suitable for functions with bounded input domains.
 *
 * @param fn - The function to memoize
 * @returns Memoized function
 */
export function simpleMemoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult
): ((...args: TArgs) => TResult) & { clearCache: () => void } {
  const cache = new Map<string, TResult>();

  const memoized = (...args: TArgs): TResult => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };

  memoized.clearCache = () => cache.clear();

  return memoized;
}

/**
 * Memoize a function with time-based cache expiration
 *
 * @param fn - The function to memoize
 * @param ttlMs - Time to live in milliseconds (default: 60000 = 1 minute)
 * @returns Memoized function with TTL-based expiration
 */
export function memoizeWithTTL<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  ttlMs: number = 60000
): ((...args: TArgs) => TResult) & { clearCache: () => void; invalidate: (...args: TArgs) => void } {
  const cache = new Map<string, { value: TResult; timestamp: number }>();

  const memoized = (...args: TArgs): TResult => {
    const key = JSON.stringify(args);
    const now = Date.now();

    if (cache.has(key)) {
      const entry = cache.get(key)!;
      if (now - entry.timestamp < ttlMs) {
        return entry.value;
      }
      // Entry expired, remove it
      cache.delete(key);
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: now });
    return result;
  };

  memoized.clearCache = () => cache.clear();

  memoized.invalidate = (...args: TArgs) => {
    const key = JSON.stringify(args);
    cache.delete(key);
  };

  return memoized;
}

/**
 * Hash function for contribution periods - creates a stable hash for caching
 */
export function hashContributionPeriods(periods: Array<{
  fromDate: string;
  toDate: string;
  monthlyGrossSalary?: number;
  workingCondition?: string;
  nonContributiveType?: string;
}>): string {
  return periods
    .map(p => `${p.fromDate}|${p.toDate}|${p.monthlyGrossSalary || 0}|${p.workingCondition || ''}|${p.nonContributiveType || ''}`)
    .sort()
    .join('::');
}

/**
 * Hash function for a single contribution period
 */
export function hashPeriod(period: {
  fromDate: string;
  toDate: string;
  monthlyGrossSalary?: number;
  workingCondition?: string;
  nonContributiveType?: string;
}): string {
  return `${period.fromDate}|${period.toDate}|${period.monthlyGrossSalary || 0}|${period.workingCondition || ''}|${period.nonContributiveType || ''}`;
}

/**
 * Batched computation utility - processes items in chunks to prevent UI blocking
 *
 * @param items - Array of items to process
 * @param processor - Function to process each item
 * @param batchSize - Number of items per batch (default: 50)
 * @returns Promise resolving to processed results
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T, index: number) => R,
  batchSize: number = 50
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Process batch synchronously
    for (let j = 0; j < batch.length; j++) {
      results.push(processor(batch[j], i + j));
    }

    // Yield to the main thread between batches if we have more to process
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
}

/**
 * Create a computation cache that can be shared across multiple functions
 * Useful for caching intermediate results in complex calculations
 */
export class ComputationCache<K, V> {
  private cache: Map<string, V>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const strKey = JSON.stringify(key);
    return this.cache.get(strKey);
  }

  set(key: K, value: V): void {
    const strKey = JSON.stringify(key);

    // Simple size limit - clear half the cache when full
    if (this.cache.size >= this.maxSize) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, this.maxSize / 2);
      keysToDelete.forEach(k => this.cache.delete(k));
    }

    this.cache.set(strKey, value);
  }

  has(key: K): boolean {
    const strKey = JSON.stringify(key);
    return this.cache.has(strKey);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Global calculation cache for pension calculations
 * Singleton instance that can be shared across the application
 */
class PensionCalculationCache {
  private static instance: PensionCalculationCache;

  readonly historicalPoints: ComputationCache<{ salary: number; from: string; to: string }, number>;
  readonly stabilityPoints: ComputationCache<{ periodsHash: string; birthDate: string }, number>;
  readonly periodPoints: ComputationCache<string, number>;
  readonly averageSalaries: Map<number, number>;

  private constructor() {
    this.historicalPoints = new ComputationCache(500);
    this.stabilityPoints = new ComputationCache(100);
    this.periodPoints = new ComputationCache(500);
    this.averageSalaries = new Map();
  }

  static getInstance(): PensionCalculationCache {
    if (!PensionCalculationCache.instance) {
      PensionCalculationCache.instance = new PensionCalculationCache();
    }
    return PensionCalculationCache.instance;
  }

  clearAll(): void {
    this.historicalPoints.clear();
    this.stabilityPoints.clear();
    this.periodPoints.clear();
    this.averageSalaries.clear();
  }
}

export const pensionCache = PensionCalculationCache.getInstance();
