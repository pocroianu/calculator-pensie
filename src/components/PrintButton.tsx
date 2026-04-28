import React, { useCallback } from 'react';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrintButtonProps {
  className?: string;
}

/**
 * PrintButton component that triggers the browser's print dialog.
 * The print stylesheet in index.css handles formatting for A4 paper.
 * This button is hidden when printing via the .print-button CSS class.
 */
const PrintButton: React.FC<PrintButtonProps> = ({ className = '' }) => {
  const { t } = useTranslation();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <button
      onClick={handlePrint}
      className={`print-button flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors text-sm font-medium text-gray-700 dark:text-dark-text ${className}`}
      aria-label={t('print.buttonLabel')}
      data-testid="print-button"
    >
      <Printer className="w-4 h-4" aria-hidden="true" />
      <span>{t('print.button')}</span>
    </button>
  );
};

export default PrintButton;
