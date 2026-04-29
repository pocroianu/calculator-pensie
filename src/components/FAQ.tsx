import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItemProps {
  questionKey: string;
  answerKey: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ questionKey, answerKey, isOpen, onToggle }) => {
  const { t } = useTranslation();

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 px-4 text-left hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
        data-testid={`faq-question-${questionKey}`}
      >
        <span className="font-medium text-gray-900 pr-4">{t(questionKey)}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div
          className="px-4 pb-4 text-sm text-gray-600 leading-relaxed"
          data-testid={`faq-answer-${questionKey}`}
        >
          {t(answerKey)}
        </div>
      )}
    </div>
  );
};

const faqItems = [
  { id: 'howCalculated', questionKey: 'help.faq.questions.howCalculated.question', answerKey: 'help.faq.questions.howCalculated.answer' },
  { id: 'contributionPoints', questionKey: 'help.faq.questions.contributionPoints.question', answerKey: 'help.faq.questions.contributionPoints.answer' },
  { id: 'stabilityPoints', questionKey: 'help.faq.questions.stabilityPoints.question', answerKey: 'help.faq.questions.stabilityPoints.answer' },
  { id: 'nonContributive', questionKey: 'help.faq.questions.nonContributive.question', answerKey: 'help.faq.questions.nonContributive.answer' },
  { id: 'workingConditions', questionKey: 'help.faq.questions.workingConditions.question', answerKey: 'help.faq.questions.workingConditions.answer' },
  { id: 'minimumContribution', questionKey: 'help.faq.questions.minimumContribution.question', answerKey: 'help.faq.questions.minimumContribution.answer' },
  { id: 'retirementAge', questionKey: 'help.faq.questions.retirementAge.question', answerKey: 'help.faq.questions.retirementAge.answer' },
  { id: 'referenceValue', questionKey: 'help.faq.questions.referenceValue.question', answerKey: 'help.faq.questions.referenceValue.answer' },
];

interface FAQProps {
  className?: string;
}

const FAQ: React.FC<FAQProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`} data-testid="faq-section">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">{t('help.faq.title')}</h2>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {faqItems.map((item) => (
          <FAQItem
            key={item.id}
            questionKey={item.questionKey}
            answerKey={item.answerKey}
            isOpen={openItems.has(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
