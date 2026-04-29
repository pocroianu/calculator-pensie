/**
 * Background Sync Utility
 *
 * Manages queuing of data operations when offline and
 * syncing them when connectivity is restored.
 * Uses localStorage as a queue since this is a client-side app.
 */

const SYNC_QUEUE_KEY = 'pension_calc_sync_queue';
const LAST_SYNC_KEY = 'pension_calc_last_sync';

interface SyncQueueItem {
  id: string;
  type: 'save_calculation' | 'save_history' | 'save_settings';
  data: unknown;
  timestamp: number;
  retries: number;
}

/**
 * Add an item to the sync queue
 */
export function addToSyncQueue(
  type: SyncQueueItem['type'],
  data: unknown
): void {
  const queue = getSyncQueue();
  const item: SyncQueueItem = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(item);
  saveSyncQueue(queue);
}

/**
 * Get the current sync queue
 */
export function getSyncQueue(): SyncQueueItem[] {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save the sync queue to localStorage
 */
function saveSyncQueue(queue: SyncQueueItem[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[BackgroundSync] Failed to save sync queue:', error);
  }
}

/**
 * Process all items in the sync queue
 * Since this is a client-side app that stores data in localStorage,
 * "syncing" means ensuring data persistence and consistency
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  const queue = getSyncQueue();
  let processed = 0;
  let failed = 0;
  const remaining: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      await processQueueItem(item);
      processed++;
    } catch {
      item.retries++;
      if (item.retries < 3) {
        remaining.push(item);
      }
      failed++;
    }
  }

  saveSyncQueue(remaining);
  updateLastSyncTime();

  return { processed, failed };
}

/**
 * Process a single sync queue item
 */
async function processQueueItem(item: SyncQueueItem): Promise<void> {
  switch (item.type) {
    case 'save_calculation':
      // Ensure calculation data is persisted in localStorage
      if (item.data) {
        const key = 'pension_calculator_data';
        localStorage.setItem(key, JSON.stringify(item.data));
      }
      break;

    case 'save_history':
      // Ensure history data is persisted
      if (item.data) {
        const key = 'pension_calculation_history';
        localStorage.setItem(key, JSON.stringify(item.data));
      }
      break;

    case 'save_settings':
      // Ensure settings are persisted
      if (item.data && typeof item.data === 'object') {
        const settings = item.data as Record<string, string>;
        Object.entries(settings).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }
      break;

    default:
      console.warn('[BackgroundSync] Unknown sync type:', item.type);
  }
}

/**
 * Update the last sync timestamp
 */
function updateLastSyncTime(): void {
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
}

/**
 * Get the last sync timestamp
 */
export function getLastSyncTime(): number | null {
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  return stored ? parseInt(stored, 10) : null;
}

/**
 * Clear the sync queue
 */
export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY);
}

/**
 * Get the number of pending sync items
 */
export function getPendingSyncCount(): number {
  return getSyncQueue().length;
}

/**
 * Register for background sync when available
 * Falls back to processing immediately when online
 */
export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & {
        sync: { register: (tag: string) => Promise<void> };
      }).sync.register('pension-data-sync');
    } catch {
      // SyncManager not available, process immediately
      if (navigator.onLine) {
        await processSyncQueue();
      }
    }
  } else if (navigator.onLine) {
    // No service worker support, process immediately
    await processSyncQueue();
  }
}
