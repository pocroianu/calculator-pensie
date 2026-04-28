import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number; // Optional badge count
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  children: React.ReactNode;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, children }) => {
  const { t } = useTranslation();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeTabRef = useRef<string>(activeTab);
  const prevTabRef = useRef<string>(activeTab);

  // State for animated sliding indicator
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // State for direction-based content transitions
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  // State for badge pulse animations
  const [animatingBadges, setAnimatingBadges] = useState<Set<string>>(new Set());
  const prevCountsRef = useRef<Record<string, number>>({});

  // Update active tab ref
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Update sliding indicator position and direction
  useEffect(() => {
    const activeTabEl = tabRefs.current[activeTab];
    if (activeTabEl) {
      setIndicatorStyle({
        left: activeTabEl.offsetLeft,
        width: activeTabEl.offsetWidth,
      });
    }

    // Determine navigation direction
    const tabIds = tabs.map(t => t.id);
    const prevIndex = tabIds.indexOf(prevTabRef.current);
    const currIndex = tabIds.indexOf(activeTab);

    setDirection(currIndex > prevIndex ? 'right' : 'left');
    prevTabRef.current = activeTab;
  }, [activeTab, tabs]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard navigation if focus is on a tab
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
        // Focus the new tab
        setTimeout(() => {
          tabRefs.current[newTab.id]?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, onChange]);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label={t('pension.stats.pensionEstimate.title')}
        className="sticky top-0 z-10 bg-gradient-to-b from-gray-50/95 to-white/95
                   dark:from-dark-bg/95 dark:to-dark-bg-secondary/95
                   backdrop-blur-sm
                   border-b border-gray-200 dark:border-dark-border
                   shadow-sm
                   overflow-x-auto"
      >
        <div className="relative">
          <div className="flex gap-2 min-w-max px-4">
            {tabs.map((tab) => {
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
                  onClick={() => onChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 min-h-[44px]
                    font-medium text-sm rounded-t-lg
                    transition-all duration-200 ease-in-out
                    relative tab-focus
                    ${
                      isActive
                        ? `bg-gradient-to-b from-blue-50 to-white
                           dark:from-blue-900/20 dark:to-transparent
                           text-blue-600 dark:text-blue-400
                           shadow-sm`
                        : `text-gray-600 dark:text-dark-text-secondary
                           hover:bg-gray-50 dark:hover:bg-dark-bg
                           hover:text-gray-900 dark:hover:text-dark-text
                           hover:scale-[1.02]
                           hover:shadow-sm`
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-dark-bg
                  `}
                >
                  {tab.icon && (
                    <span className="w-4 h-4 transition-colors duration-200" aria-hidden="true">
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full
                                  bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300
                                  ${animatingBadges.has(tab.id) ? 'badge-pulse' : ''}`}
                      aria-label={`${tab.count} items`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Animated sliding indicator */}
          <div
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600
                       dark:from-blue-400 dark:to-blue-500
                       transition-all duration-300 ease-in-out rounded-full"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className={`focus:outline-none ${
          direction === 'right' ? 'animate-slideInRight' : 'animate-slideInLeft'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default Tabs;
