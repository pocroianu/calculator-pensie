/**
 * Service Worker Registration Module
 *
 * Handles service worker lifecycle including:
 * - Registration and activation
 * - Update detection and notification
 * - Background sync registration
 * - Communication with the service worker
 */

const SW_PATH = '/calculator-pensie/sw.js';
const SYNC_TAG = 'pension-data-sync';

interface SWRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

/**
 * Check if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  config?: SWRegistrationConfig
): Promise<ServiceWorkerRegistration | undefined> {
  if (!isServiceWorkerSupported()) {
    console.log('[SWR] Service workers not supported');
    return undefined;
  }

  // Only register in production or when explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_SW) {
    console.log('[SWR] Skipping SW registration in development');
    return undefined;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: '/calculator-pensie/',
    });

    console.log('[SWR] Service worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New content available, notify the app
            console.log('[SWR] New content available');
            config?.onUpdate?.(registration);
          } else {
            // Content cached for the first time (offline ready)
            console.log('[SWR] Content cached for offline use');
            config?.onSuccess?.(registration);
          }
        }
      });
    });

    // Listen for network status changes
    window.addEventListener('online', () => {
      console.log('[SWR] Network: online');
      config?.onOnline?.();
      // Trigger background sync when back online
      requestBackgroundSync();
    });

    window.addEventListener('offline', () => {
      console.log('[SWR] Network: offline');
      config?.onOffline?.();
    });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        console.log('[SWR] Background sync completed at:', new Date(event.data.timestamp));
      }
    });

    return registration;
  } catch (error) {
    console.error('[SWR] Registration failed:', error);
    return undefined;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log('[SWR] Service worker unregistered:', success);
    return success;
  } catch (error) {
    console.error('[SWR] Unregistration failed:', error);
    return false;
  }
}

/**
 * Request a background sync operation
 */
export async function requestBackgroundSync(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if SyncManager is available
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
      console.log('[SWR] Background sync requested');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[SWR] Background sync registration failed:', error);
    return false;
  }
}

/**
 * Send a message to the active service worker
 */
export async function sendMessageToSW(
  message: Record<string, unknown>
): Promise<unknown> {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Tell the waiting service worker to skip waiting and activate
 */
export function skipWaiting(): void {
  if (!isServiceWorkerSupported() || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Get the current service worker cache version
 */
export async function getCacheVersion(): Promise<string | null> {
  const result = await sendMessageToSW({ type: 'GET_VERSION' });
  return (result as { version?: string })?.version ?? null;
}

/**
 * Clear all service worker caches
 */
export async function clearCaches(): Promise<boolean> {
  const result = await sendMessageToSW({ type: 'CLEAR_CACHES' });
  return (result as { cleared?: boolean })?.cleared ?? false;
}

/**
 * Check if the app is currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}
