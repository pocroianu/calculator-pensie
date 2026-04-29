import React from 'react';
import { HelpCircle, Info } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

type TooltipVariant = 'help' | 'info';
type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
  content: string;
  variant?: TooltipVariant;
  side?: TooltipSide;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  variant = 'help',
  side = 'top',
  className = '',
  iconClassName = '',
  children
}) => {
  const Icon = variant === 'info' ? Info : HelpCircle;

  const iconColorClass = variant === 'info'
    ? 'text-blue-400 hover:text-blue-600'
    : 'text-gray-400 hover:text-gray-600';

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children || (
            <button
              type="button"
              className={`${iconColorClass} transition-colors ${className}`}
              aria-label="Help"
              data-testid="tooltip-trigger"
            >
              <Icon className={`w-4 h-4 ${iconClassName}`} />
            </button>
          )}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs z-[200] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            sideOffset={5}
            side={side}
            data-testid="tooltip-content"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};

// Wrapper component for adding tooltip to form labels
interface FieldTooltipProps {
  tooltipKey: string;
  t: (key: string) => string;
  variant?: TooltipVariant;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({ tooltipKey, t, variant = 'help' }) => {
  return <Tooltip content={t(tooltipKey)} variant={variant} />;
};

export default Tooltip;
