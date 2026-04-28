import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Link, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { PensionDetails } from '../types/pensionTypes';
import {
  createShareableData,
  generateShareableUrl,
  shareViaWebShareApi,
  ShareableData
} from '../utils/socialSharing';

interface ShareButtonProps {
  monthlyPension: number;
  yearlyPension: number;
  pensionDetails: PensionDetails;
  vprInfo: {
    value: number;
    year: number;
  };
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  monthlyPension,
  yearlyPension,
  pensionDetails,
  vprInfo,
  className = ''
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { track } = useAnalytics();
  const [isSharing, setIsSharing] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  // Check if we have valid data to share
  const canShare = monthlyPension > 0 && pensionDetails && vprInfo;

  const handleShare = useCallback(async () => {
    if (!canShare || isSharing) return;

    setIsSharing(true);

    try {
      // Create anonymized shareable data
      const shareableData: ShareableData = createShareableData(
        monthlyPension,
        yearlyPension,
        pensionDetails,
        vprInfo
      );

      // Generate the shareable URL
      const shareUrl = generateShareableUrl(shareableData);

      // Try to share using Web Share API or clipboard
      const result = await shareViaWebShareApi(
        shareUrl,
        t('sharing.title'),
        t('sharing.shareText')
      );

      if (result.success) {
        if (result.method === 'clipboard') {
          // Show copied feedback
          setJustCopied(true);
          setTimeout(() => setJustCopied(false), 2000);
          showToast('success', 'sharing.linkCopied');
        } else {
          showToast('success', 'sharing.sharedSuccessfully');
        }
        // Track the share event
        track('share_results', { method: result.method });
      } else if (result.method === 'share') {
        // User cancelled sharing - no need to show error
      } else {
        showToast('error', 'sharing.error.copyFailed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('error', 'sharing.error.shareFailed');
    } finally {
      setIsSharing(false);
    }
  }, [canShare, isSharing, monthlyPension, yearlyPension, pensionDetails, vprInfo, t, showToast, track]);

  if (!canShare) {
    return null;
  }

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  dark:bg-blue-500 dark:hover:bg-blue-600 ${className}`}
      aria-label={t('sharing.buttonLabel')}
      data-testid="share-button"
    >
      {justCopied ? (
        <>
          <Check className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm font-medium">{t('sharing.copied')}</span>
        </>
      ) : (
        <>
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          ) : (
            <Share2 className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">{t('sharing.shareResults')}</span>
        </>
      )}
    </button>
  );
};

export default ShareButton;
