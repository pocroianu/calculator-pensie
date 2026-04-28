import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * PrintHeader component that is only visible when printing.
 * Shows a print timestamp and disclaimer at the top/bottom of printed pages.
 * Hidden on screen via Tailwind's hidden class, shown via print:block CSS.
 */
const PrintHeader: React.FC = () => {
  const { t } = useTranslation();
  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      {/* Print-only timestamp shown at top of printed output */}
      <div
        className="hidden print:block print-header"
        aria-hidden="true"
        data-testid="print-header"
      >
        <p style={{ fontSize: '9pt', color: '#6b7280', margin: 0 }}>
          {t('print.generatedOn', { date: formattedDate, time: formattedTime })}
        </p>
      </div>

      {/* Print-only footer disclaimer shown at bottom of every printed page */}
      <div
        className="hidden print:block print-footer"
        aria-hidden="true"
        data-testid="print-footer"
      >
        <p style={{ margin: 0 }}>
          {t('print.disclaimer')}
        </p>
      </div>
    </>
  );
};

export default PrintHeader;
