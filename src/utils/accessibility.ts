/**
 * Accessibility Utilities
 *
 * Provides utilities for screen reader support including:
 * - Live region announcements
 * - Focus management
 * - ARIA helpers
 */

// Unique ID counter for generating IDs
let idCounter = 0;

/**
 * Generates a unique ID for ARIA attributes
 * @param prefix - Optional prefix for the ID
 * @returns A unique string ID
 */
export function generateAriaId(prefix: string = 'aria'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Announces a message to screen readers using an ARIA live region
 * @param message - The message to announce
 * @param priority - 'polite' for non-urgent, 'assertive' for urgent messages
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  // Find or create the announcer element
  let announcer = document.getElementById('sr-announcer');

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.className = 'sr-only';
    // Visually hidden but accessible to screen readers
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  // Update the live region priority if needed
  if (announcer.getAttribute('aria-live') !== priority) {
    announcer.setAttribute('aria-live', priority);
  }

  // Clear then set the message to trigger announcement
  announcer.textContent = '';
  // Use requestAnimationFrame to ensure the clear is processed first
  requestAnimationFrame(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  });
}

/**
 * Creates a status announcer for form validation
 * @param containerId - ID of the container to add the announcer to
 * @returns Object with announce function
 */
export function createFormStatusAnnouncer(containerId: string) {
  return {
    announceError: (fieldName: string, errorMessage: string) => {
      announceToScreenReader(`${fieldName}: ${errorMessage}`, 'assertive');
    },
    announceSuccess: (message: string) => {
      announceToScreenReader(message, 'polite');
    },
    announceFieldChange: (fieldName: string, newValue: string) => {
      announceToScreenReader(`${fieldName} changed to ${newValue}`, 'polite');
    }
  };
}

/**
 * Manages focus for modal dialogs
 */
export class FocusTrap {
  private container: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    this.handleKeyDown = this.onKeyDown.bind(this);
  }

  /**
   * Activates the focus trap within a container
   * @param container - The container element to trap focus within
   */
  activate(container: HTMLElement): void {
    this.container = container;
    this.previouslyFocused = document.activeElement as HTMLElement;

    this.updateFocusableElements();

    // Focus the first focusable element or the container itself
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    } else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Deactivates the focus trap and restores focus
   */
  deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown);

    // Restore focus to the previously focused element
    if (this.previouslyFocused && this.previouslyFocused.focus) {
      this.previouslyFocused.focus();
    }

    this.container = null;
    this.previouslyFocused = null;
    this.firstFocusable = null;
    this.lastFocusable = null;
  }

  private updateFocusableElements(): void {
    if (!this.container) return;

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = this.container.querySelectorAll<HTMLElement>(focusableSelectors);

    if (focusableElements.length > 0) {
      this.firstFocusable = focusableElements[0];
      this.lastFocusable = focusableElements[focusableElements.length - 1];
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;

    this.updateFocusableElements();

    if (!this.firstFocusable || !this.lastFocusable) return;

    if (e.shiftKey) {
      // Shift + Tab: moving backwards
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      // Tab: moving forwards
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }
}

/**
 * Hook-friendly focus trap creator
 */
export function createFocusTrap(): FocusTrap {
  return new FocusTrap();
}

/**
 * Returns ARIA attributes for an expandable/collapsible section
 * @param isExpanded - Whether the section is currently expanded
 * @param controlsId - ID of the controlled content element
 */
export function getExpandableAriaProps(isExpanded: boolean, controlsId: string) {
  return {
    'aria-expanded': isExpanded,
    'aria-controls': controlsId,
  };
}

/**
 * Returns ARIA attributes for a modal dialog
 * @param labelId - ID of the element containing the dialog title
 * @param descriptionId - Optional ID of the element containing the dialog description
 */
export function getModalAriaProps(labelId: string, descriptionId?: string) {
  const props: Record<string, string | boolean> = {
    'role': 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelId,
  };

  if (descriptionId) {
    props['aria-describedby'] = descriptionId;
  }

  return props;
}

/**
 * Returns ARIA attributes for form field with error
 * @param hasError - Whether the field has a validation error
 * @param errorId - ID of the error message element
 * @param describedById - Optional ID of additional description element
 */
export function getFieldAriaProps(
  hasError: boolean,
  errorId: string,
  describedById?: string
) {
  const describedBy = [describedById, hasError ? errorId : null]
    .filter(Boolean)
    .join(' ');

  return {
    'aria-invalid': hasError,
    'aria-describedby': describedBy || undefined,
  };
}

/**
 * Gets the accessible label for a chart
 * @param chartType - Type of chart (pie, bar, line, etc.)
 * @param data - Chart data
 */
export function getChartAccessibleDescription(
  chartType: string,
  data: { labels: string[]; values: number[]; unit?: string }
): string {
  const { labels, values, unit = '' } = data;

  const descriptions = labels.map((label, index) => {
    const value = values[index];
    const formattedValue = typeof value === 'number'
      ? value.toFixed(2)
      : value;
    return `${label}: ${formattedValue}${unit ? ` ${unit}` : ''}`;
  });

  return `${chartType} chart showing: ${descriptions.join(', ')}`;
}

/**
 * Checks if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns CSS class for visually hidden content (screen reader only)
 */
export const SR_ONLY_CLASS = 'sr-only';

/**
 * CSS styles for visually hidden content
 * Use this when you can't use the sr-only class
 */
export const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

/**
 * Debounced screen reader announcement to prevent announcement spam
 * @param message - The message to announce
 * @param priority - 'polite' for non-urgent, 'assertive' for urgent messages
 * @param delay - Delay in milliseconds before announcing (default 500ms)
 */
let announcementTimeout: ReturnType<typeof setTimeout> | null = null;
export function debouncedAnnounce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite',
  delay: number = 500
): void {
  if (announcementTimeout) {
    clearTimeout(announcementTimeout);
  }
  announcementTimeout = setTimeout(() => {
    announceToScreenReader(message, priority);
    announcementTimeout = null;
  }, delay);
}

/**
 * Gets accessible text description for pension calculation results
 * @param monthlyPension - The calculated monthly pension amount
 * @param totalPoints - Total pension points
 * @param yearsUntilRetirement - Years remaining until retirement
 */
export function getPensionResultDescription(
  monthlyPension: number,
  totalPoints: number,
  yearsUntilRetirement: number
): string {
  if (monthlyPension <= 0) {
    return 'Pension calculation not yet available. Please complete the minimum contribution requirements.';
  }

  const formattedPension = monthlyPension.toLocaleString('ro-RO', {
    style: 'currency',
    currency: 'RON',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const retirementText = yearsUntilRetirement > 0
    ? `${yearsUntilRetirement} years until retirement`
    : 'Eligible for retirement';

  return `Estimated monthly pension: ${formattedPension}. Total points: ${totalPoints.toFixed(2)}. ${retirementText}.`;
}

/**
 * Gets accessible text for progress bars
 * @param current - Current value
 * @param total - Total/maximum value
 * @param label - Label describing what the progress represents
 */
export function getProgressDescription(
  current: number,
  total: number,
  label: string
): string {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  return `${label}: ${current} out of ${total} (${percentage}% complete)`;
}

/**
 * Returns ARIA attributes for a tab panel
 * @param isSelected - Whether this tab is selected
 * @param tabId - ID of the associated tab button
 * @param panelId - ID of the panel
 */
export function getTabPanelAriaProps(isSelected: boolean, tabId: string, panelId: string) {
  return {
    id: panelId,
    role: 'tabpanel',
    'aria-labelledby': tabId,
    hidden: !isSelected,
    tabIndex: isSelected ? 0 : -1,
  };
}

/**
 * Returns ARIA attributes for a tab button
 * @param isSelected - Whether this tab is selected
 * @param tabId - ID of this tab button
 * @param panelId - ID of the controlled panel
 */
export function getTabAriaProps(isSelected: boolean, tabId: string, panelId: string) {
  return {
    id: tabId,
    role: 'tab',
    'aria-selected': isSelected,
    'aria-controls': panelId,
    tabIndex: isSelected ? 0 : -1,
  };
}
