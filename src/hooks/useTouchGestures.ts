import { useRef, useCallback, useEffect, useState } from 'react';

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down' | null;
  deltaX: number;
  deltaY: number;
}

export interface TouchGestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

export interface TouchGestureOptions {
  /** Minimum distance (in pixels) for a swipe to be registered */
  swipeThreshold?: number;
  /** Maximum time (in ms) for a swipe gesture */
  swipeTimeout?: number;
  /** Time (in ms) to trigger long press */
  longPressTimeout?: number;
  /** Whether gestures are enabled */
  enabled?: boolean;
  /** Prevent default touch behavior */
  preventDefault?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isTracking: boolean;
}

/**
 * Hook for detecting touch gestures (swipe, tap, long press)
 * Optimized for mobile touch interactions
 */
export const useTouchGestures = <T extends HTMLElement = HTMLElement>(
  handlers: TouchGestureHandlers,
  options: TouchGestureOptions = {}
) => {
  const {
    swipeThreshold = 50,
    swipeTimeout = 300,
    longPressTimeout = 500,
    enabled = true,
    preventDefault = false
  } = options;

  const elementRef = useRef<T>(null);
  const touchStateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false
  });
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });

  // Store handlers in ref to avoid recreating listeners
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    const touch = e.touches[0];
    touchStateRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isTracking: true
    };

    setIsSwiping(true);
    setSwipeOffset({ x: 0, y: 0 });

    // Start long press timer
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      if (touchStateRef.current.isTracking) {
        handlersRef.current.onLongPress?.();
        touchStateRef.current.isTracking = false;
      }
    }, longPressTimeout);

    if (preventDefault) {
      e.preventDefault();
    }
  }, [enabled, longPressTimeout, preventDefault, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStateRef.current.isTracking) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStateRef.current.startX;
    const deltaY = touch.clientY - touchStateRef.current.startY;

    setSwipeOffset({ x: deltaX, y: deltaY });

    // Cancel long press if user moves significantly
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      clearLongPressTimer();
    }

    if (preventDefault) {
      e.preventDefault();
    }
  }, [enabled, preventDefault, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !touchStateRef.current.isTracking) {
      setIsSwiping(false);
      setSwipeOffset({ x: 0, y: 0 });
      return;
    }

    clearLongPressTimer();

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStateRef.current.startX;
    const deltaY = touch.clientY - touchStateRef.current.startY;
    const deltaTime = Date.now() - touchStateRef.current.startTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine if this is a swipe
    if (deltaTime < swipeTimeout && (absX > swipeThreshold || absY > swipeThreshold)) {
      // Horizontal swipe takes precedence if movement is more horizontal
      if (absX > absY) {
        if (deltaX > 0) {
          handlersRef.current.onSwipeRight?.();
        } else {
          handlersRef.current.onSwipeLeft?.();
        }
      } else {
        if (deltaY > 0) {
          handlersRef.current.onSwipeDown?.();
        } else {
          handlersRef.current.onSwipeUp?.();
        }
      }
    } else if (absX < 10 && absY < 10 && deltaTime < 200) {
      // This is a tap (minimal movement, short duration)
      handlersRef.current.onTap?.();
    }

    touchStateRef.current.isTracking = false;
    setIsSwiping(false);
    setSwipeOffset({ x: 0, y: 0 });

    if (preventDefault) {
      e.preventDefault();
    }
  }, [enabled, swipeThreshold, swipeTimeout, preventDefault, clearLongPressTimer]);

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    touchStateRef.current.isTracking = false;
    setIsSwiping(false);
    setSwipeOffset({ x: 0, y: 0 });
  }, [clearLongPressTimer]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

    // Use passive: false for touch events to allow preventDefault
    const touchOptions = { passive: !preventDefault };

    element.addEventListener('touchstart', handleTouchStart, touchOptions);
    element.addEventListener('touchmove', handleTouchMove, touchOptions);
    element.addEventListener('touchend', handleTouchEnd, touchOptions);
    element.addEventListener('touchcancel', handleTouchCancel);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
      clearLongPressTimer();
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel, preventDefault, clearLongPressTimer]);

  return {
    ref: elementRef,
    isSwiping,
    swipeOffset
  };
};

/**
 * Hook to detect if the device supports touch input
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is IE specific
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();

    // Re-check on window resize (for hybrid devices)
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return isTouch;
};

/**
 * Hook to provide haptic feedback (vibration) on supported devices
 */
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibration not supported or disabled
      }
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(20), [vibrate]);
  const heavyTap = useCallback(() => vibrate([30, 50, 30]), [vibrate]);
  const success = useCallback(() => vibrate([10, 30, 10]), [vibrate]);
  const error = useCallback(() => vibrate([50, 100, 50]), [vibrate]);

  return { vibrate, lightTap, mediumTap, heavyTap, success, error };
};

export default useTouchGestures;
