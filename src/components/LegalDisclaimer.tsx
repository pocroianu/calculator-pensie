import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, X, Shield, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { createFocusTrap, announceToScreenReader } from '../utils/accessibility';

const DISCLAIMER_ACCEPTED_KEY = 'legal_disclaimer_accepted';
const DISCLAIMER_VERSION = '1.0';

interface LegalDisclaimerProps {
  onAccept?: () => void;
}

const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ onAccept }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showOnStartup, setShowOnStartup] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef(createFocusTrap());

  useEffect(() => {
    // Check if user has accepted the disclaimer
    const acceptedVersion = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (acceptedVersion !== DISCLAIMER_VERSION) {
      setShowOnStartup(true);
      setIsOpen(true);
    }
  }, []);

  // Handle focus trap and escape key when modal opens/closes
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Activate focus trap
      focusTrapRef.current.activate(modalRef.current);
      // Announce modal opening to screen readers
      announceToScreenReader(t('legal.title') + '. ' + t('legal.modalOpened', 'Dialog opened'), 'polite');

      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !showOnStartup) {
          handleClose();
        }
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }

    return () => {
      focusTrapRef.current.deactivate();
    };
  }, [isOpen, showOnStartup, t]);

  const handleAccept = useCallback(() => {
    localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, DISCLAIMER_VERSION);
    focusTrapRef.current.deactivate();
    setIsOpen(false);
    setShowOnStartup(false);
    announceToScreenReader(t('legal.accepted', 'Terms accepted'), 'polite');
    onAccept?.();
  }, [onAccept, t]);

  const handleOpenDisclaimer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    // Only allow closing if not showing on startup
    if (!showOnStartup) {
      focusTrapRef.current.deactivate();
      setIsOpen(false);
      announceToScreenReader(t('legal.modalClosed', 'Dialog closed'), 'polite');
    }
  }, [showOnStartup, t]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !showOnStartup) {
      handleClose();
    }
  }, [showOnStartup, handleClose]);

  return (
    <>
      {/* Footer Link to Open Disclaimer */}
      <footer
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary border-t border-gray-200 dark:border-dark-border py-3 px-4 z-40"
        role="contentinfo"
        aria-label={t('legal.footerAriaLabel', 'Legal information and copyright')}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-dark-text-secondary">
          <button
            onClick={handleOpenDisclaimer}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            data-testid="legal-disclaimer-link"
            aria-haspopup="dialog"
          >
            <Scale className="w-4 h-4" aria-hidden="true" />
            {t('legal.footerLink')}
          </button>
          <span className="text-gray-300 dark:text-dark-border" aria-hidden="true">|</span>
          <span className="text-gray-500 dark:text-dark-text-muted">
            © {new Date().getFullYear()} {t('legal.copyright')}
          </span>
        </div>
      </footer>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          data-testid="legal-disclaimer-modal"
          onClick={handleBackdropClick}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-disclaimer-title"
            aria-describedby="legal-disclaimer-description"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full" aria-hidden="true">
                  <Scale className="w-6 h-6 text-blue-600" />
                </div>
                <h2 id="legal-disclaimer-title" className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                  {t('legal.title')}
                </h2>
              </div>
              {!showOnStartup && (
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
                  aria-label={t('common.close', 'Close dialog')}
                  data-testid="legal-disclaimer-close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Content */}
            <div
              id="legal-disclaimer-description"
              className="overflow-y-auto p-6 space-y-6 flex-1"
              tabIndex={0}
              role="document"
            >
              {/* Calculator Limitations Section */}
              <section aria-labelledby="limitations-heading">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  <h3 id="limitations-heading" className="text-lg font-medium text-gray-900 dark:text-dark-text">
                    {t('legal.limitations.title')}
                  </h3>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-700 rounded-lg p-4">
                  <ul className="space-y-2 text-gray-700 dark:text-dark-text text-sm" role="list" aria-label={t('legal.limitations.title')}>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.limitations.estimateOnly')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.limitations.notOfficial')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.limitations.lawChanges')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.limitations.noGuarantee')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.limitations.consultProfessional')}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Data Privacy Section */}
              <section aria-labelledby="privacy-heading">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-green-500" aria-hidden="true" />
                  <h3 id="privacy-heading" className="text-lg font-medium text-gray-900 dark:text-dark-text">
                    {t('legal.privacy.title')}
                  </h3>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-700 rounded-lg p-4">
                  <ul className="space-y-2 text-gray-700 dark:text-dark-text text-sm" role="list" aria-label={t('legal.privacy.title')}>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {t('legal.privacy.localStorage')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {t('legal.privacy.noServer')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {t('legal.privacy.noThirdParty')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {t('legal.privacy.gdprCompliant')}
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      {t('legal.privacy.deleteAnytime')}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Terms of Use Section */}
              <section aria-labelledby="terms-heading">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-500" aria-hidden="true" />
                  <h3 id="terms-heading" className="text-lg font-medium text-gray-900 dark:text-dark-text">
                    {t('legal.terms.title')}
                  </h3>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-700 rounded-lg p-4">
                  <ul className="space-y-2 text-gray-700 dark:text-dark-text text-sm" role="list" aria-label={t('legal.terms.title')}>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.terms.freeUse')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.terms.informationalOnly')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.terms.noLiability')}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1" aria-hidden="true">•</span>
                      {t('legal.terms.userResponsibility')}
                    </li>
                  </ul>
                </div>
              </section>

              {/* Romanian Law Compliance */}
              <section aria-labelledby="compliance-heading">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  <h3 id="compliance-heading" className="text-lg font-medium text-gray-900 dark:text-dark-text">
                    {t('legal.compliance.title')}
                  </h3>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-700 rounded-lg p-4 text-sm text-gray-700 dark:text-dark-text">
                  <p className="mb-2">{t('legal.compliance.description')}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2">
                    {t('legal.compliance.laws')}
                  </p>
                </div>
              </section>
            </div>

            {/* Footer with Accept Button */}
            <div className="p-6 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
              {showOnStartup ? (
                <button
                  onClick={handleAccept}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  data-testid="legal-disclaimer-accept"
                  aria-describedby="accept-description"
                >
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  {t('legal.acceptButton')}
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="w-full px-6 py-3 bg-gray-200 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-300 dark:hover:bg-dark-border transition-colors font-medium"
                  data-testid="legal-disclaimer-close-btn"
                >
                  {t('legal.closeButton')}
                </button>
              )}
              <p id="accept-description" className="text-xs text-gray-500 dark:text-dark-text-muted text-center mt-3">
                {t('legal.version', { version: DISCLAIMER_VERSION })}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LegalDisclaimer;
