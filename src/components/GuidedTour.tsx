import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

const TOUR_COMPLETED_KEY = 'guided_tour_completed';

interface TourStep {
  id: string;
  targetSelector?: string;
  titleKey: string;
  descriptionKey: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    titleKey: 'help.tour.welcome.title',
    descriptionKey: 'help.tour.welcome.description',
    position: 'center'
  },
  {
    id: 'birthDate',
    targetSelector: '[data-testid="birth-date-input"]',
    titleKey: 'help.tour.birthDate.title',
    descriptionKey: 'help.tour.birthDate.description',
    position: 'bottom'
  },
  {
    id: 'retirementYear',
    targetSelector: '[data-testid="retirement-year-input"]',
    titleKey: 'help.tour.retirementYear.title',
    descriptionKey: 'help.tour.retirementYear.description',
    position: 'bottom'
  },
  {
    id: 'contributionPeriods',
    targetSelector: '[data-testid="add-period-button"]',
    titleKey: 'help.tour.contributionPeriods.title',
    descriptionKey: 'help.tour.contributionPeriods.description',
    position: 'bottom'
  },
  {
    id: 'pensionEstimate',
    targetSelector: '[data-tour="pension-estimate"]',
    titleKey: 'help.tour.pensionEstimate.title',
    descriptionKey: 'help.tour.pensionEstimate.description',
    position: 'left'
  },
  {
    id: 'complete',
    titleKey: 'help.tour.complete.title',
    descriptionKey: 'help.tour.complete.description',
    position: 'center'
  }
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, onComplete }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = tourSteps[currentStep];

  const updateTargetPosition = useCallback(() => {
    if (step?.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      window.addEventListener('resize', updateTargetPosition);
      window.addEventListener('scroll', updateTargetPosition);
      return () => {
        window.removeEventListener('resize', updateTargetPosition);
        window.removeEventListener('scroll', updateTargetPosition);
      };
    }
  }, [isOpen, currentStep, updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setCurrentStep(0);
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  const isCenter = step.position === 'center' || !targetRect;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (isCenter || !targetRect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - padding;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + padding;
        break;
      default:
        top = targetRect.bottom + padding;
        left = targetRect.left;
    }

    // Keep tooltip within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`
    };
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[100]"
        onClick={handleSkip}
        data-testid="tour-overlay"
      />

      {/* Highlight target element */}
      {targetRect && !isCenter && (
        <div
          className="fixed z-[101] border-4 border-blue-500 rounded-lg pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
          }}
          data-testid="tour-highlight"
        />
      )}

      {/* Tooltip */}
      <div
        className="z-[102] bg-white rounded-xl shadow-2xl w-[360px] max-w-[calc(100vw-32px)] overflow-hidden"
        style={getTooltipStyle()}
        data-testid="tour-tooltip"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              {t('help.stepOf', { current: currentStep + 1, total: tourSteps.length })}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('help.close')}
            data-testid="tour-close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t(step.titleKey)}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t(step.descriptionKey)}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            data-testid="tour-skip"
          >
            {t('help.skipTour')}
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid="tour-prev"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('help.prevStep')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="tour-next"
            >
              {isLastStep ? t('help.finishTour') : t('help.nextStep')}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
export { TOUR_COMPLETED_KEY };
