import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  children: React.ReactNode;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, children }) => {
  const { t } = useTranslation();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeTabRef = useRef<string>(activeTab);
  const prevTabRef = useRef<string>(activeTab);
  const rippleIdRef = useRef(0);

  // Spring-animated indicator position
  const indicatorLeft = useMotionValue(0);
  const indicatorWidth = useMotionValue(0);

  const smoothLeft = useSpring(indicatorLeft, {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  });

  const smoothWidth = useSpring(indicatorWidth, {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  });

  // State for direction-based content transitions
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  // State for badge pulse animations
  const [animatingBadges, setAnimatingBadges] = useState<Set<string>>(new Set());
  const prevCountsRef = useRef<Record<string, number>>({});

  // Ripple effect state
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});

  // Keyboard shortcuts hint state
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const hasSeenHintRef = useRef(false);

  // Update active tab ref
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Update sliding indicator position and direction with spring physics
  useEffect(() => {
    const activeTabEl = tabRefs.current[activeTab];
    if (activeTabEl) {
      indicatorLeft.set(activeTabEl.offsetLeft);
      indicatorWidth.set(activeTabEl.offsetWidth);
    }

    // Determine navigation direction
    const tabIds = tabs.map(t => t.id);
    const prevIndex = tabIds.indexOf(prevTabRef.current);
    const currIndex = tabIds.indexOf(activeTab);

    setDirection(currIndex > prevIndex ? 'right' : 'left');
    prevTabRef.current = activeTab;
  }, [activeTab, tabs, indicatorLeft, indicatorWidth]);

  // Badge pulse animation on count change
  useEffect(() => {
    tabs.forEach(tab => {
      if (tab.count !== undefined && tab.count !== prevCountsRef.current[tab.id]) {
        setAnimatingBadges(prev => new Set(prev).add(tab.id));
        setTimeout(() => {
          setAnimatingBadges(prev => {
            const next = new Set(prev);
            next.delete(tab.id);
            return next;
          });
        }, 600);
      }
      if (tab.count !== undefined) {
        prevCountsRef.current[tab.id] = tab.count;
      }
    });
  }, [tabs]);

  // Keyboard navigation with shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab-specific shortcuts (Ctrl+1, Ctrl+2, etc.)
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          onChange(tabs[index].id);
          tabRefs.current[tabs[index].id]?.focus();

          // Show hint on first use
          if (!hasSeenHintRef.current) {
            setShowShortcutHint(true);
            hasSeenHintRef.current = true;
            setTimeout(() => setShowShortcutHint(false), 3000);
          }
        }
        return;
      }

      // Only handle arrow navigation if focus is on a tab
      const activeElement = document.activeElement;
      const isTabFocused = activeElement?.getAttribute('role') === 'tab';

      if (!isTabFocused) return;

      const currentIndex = tabs.findIndex((tab) => tab.id === activeTabRef.current);
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      const newTab = tabs[newIndex];
      if (newTab) {
        onChange(newTab.id);
        setTimeout(() => {
          tabRefs.current[newTab.id]?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, onChange]);

  // Ripple effect handler
  const createRipple = (tabId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: Ripple = {
      id: rippleIdRef.current++,
      x,
      y,
    };

    setRipples(prev => ({
      ...prev,
      [tabId]: [...(prev[tabId] || []), newRipple],
    }));

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => ({
        ...prev,
        [tabId]: (prev[tabId] || []).filter(r => r.id !== newRipple.id),
      }));
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Keyboard Shortcut Hint */}
      <AnimatePresence>
        {showShortcutHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50
                       bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-lg
                       shadow-lg text-sm"
          >
            💡 Tip: Use Ctrl+1, Ctrl+2, Ctrl+3 to switch tabs quickly
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label={t('pension.stats.pensionEstimate.title')}
        className="sticky top-0 z-10 bg-gradient-to-b from-gray-50/95 to-white/95
                   dark:from-dark-bg/95 dark:to-dark-bg-secondary/95
                   backdrop-blur-sm
                   border-b border-gray-200 dark:border-dark-border
                   elevation-multi-layer
                   overflow-x-auto"
      >
        <div className="relative">
          <div className="flex gap-2 min-w-max px-4">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => (tabRefs.current[tab.id] = el)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={(e) => {
                    createRipple(tab.id, e);
                    onChange(tab.id);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-3 min-h-[44px]
                    font-medium text-sm rounded-t-lg
                    transition-all duration-200 ease-in-out
                    relative overflow-hidden
                    ${
                      isActive
                        ? `bg-gradient-to-b from-blue-50 to-white
                           dark:from-blue-900/20 dark:to-transparent
                           text-blue-600 dark:text-blue-400
                           shadow-elevation-active`
                        : `text-gray-600 dark:text-dark-text-secondary
                           hover:bg-gray-50 dark:hover:bg-dark-bg
                           hover:text-gray-900 dark:hover:text-dark-text
                           hover:scale-[1.02]
                           shadow-elevation-hover`
                    }
                    focus-ring-enhanced
                  `}
                >
                  {/* Ripple Effect */}
                  <AnimatePresence>
                    {(ripples[tab.id] || []).map(ripple => (
                      <motion.span
                        key={ripple.id}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 4, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute rounded-full bg-blue-400/30 dark:bg-blue-500/30 pointer-events-none"
                        style={{
                          left: ripple.x,
                          top: ripple.y,
                          width: 20,
                          height: 20,
                          marginLeft: -10,
                          marginTop: -10,
                        }}
                      />
                    ))}
                  </AnimatePresence>

                  {tab.icon && (
                    <motion.span
                      className="w-4 h-4 transition-colors duration-200"
                      aria-hidden="true"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tab.icon}
                    </motion.span>
                  )}
                  <span>{tab.label}</span>

                  {/* Keyboard Shortcut Indicator */}
                  {index < 9 && (
                    <span
                      className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px]
                                 bg-gray-200/60 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400
                                 rounded font-mono"
                      aria-label={`Keyboard shortcut: Ctrl+${index + 1}`}
                    >
                      ^{index + 1}
                    </span>
                  )}

                  {tab.count !== undefined && tab.count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full
                                  bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300`}
                      aria-label={`${tab.count} items`}
                      animate={animatingBadges.has(tab.id) ? {
                        scale: [1, 1.15, 1],
                        transition: { duration: 0.6 }
                      } : {}}
                    >
                      {tab.count}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Animated sliding indicator with spring physics */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600
                       dark:from-blue-400 dark:to-blue-500 rounded-full"
            style={{
              left: smoothLeft,
              width: smoothWidth,
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Tab Content with spring transitions */}
      <motion.div
        key={activeTab}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        initial={{ opacity: 0, x: direction === 'right' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction === 'right' ? -20 : 20 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        className="focus:outline-none"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default Tabs;
