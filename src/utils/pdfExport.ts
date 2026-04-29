import { jsPDF } from 'jspdf';
import { PensionInputs, ContributionPeriod, WorkingCondition, NonContributivePeriodType } from '../types/pensionTypes';
import { formatCurrency, formatPoints, formatYears } from './formatters';
import { PdfChartImages, ChartImageData } from './pdfChartGenerator';

/**
 * PDF Export Data Interface
 * Contains all the data needed to generate a pension calculation PDF report
 */
export interface PdfExportData {
  inputs: PensionInputs;
  pensionDetails: {
    contributionPoints: number;
    stabilityPoints: number;
    nonContributivePoints?: number;
    totalPoints: number;
    totalContributiveYears?: number;
    currentAge?: number;
    yearsUntilRetirement?: number;
  };
  monthlyPension: number;
  yearlyPension: number;
  vprInfo: {
    value: number;
    year: number;
    effectiveDate: string;
  };
  chartImages?: PdfChartImages;
}

/**
 * Translation function type
 */
type TranslateFunction = (key: string, options?: Record<string, unknown>) => string;

/**
 * Helper function to format a date string for display
 */
function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
}

/**
 * Helper function to calculate years between two dates
 */
function calculateYearsBetween(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffMs = to.getTime() - from.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, diffYears);
}

/**
 * Helper function to get working condition display text
 */
function getWorkingConditionText(condition: WorkingCondition | undefined, t: TranslateFunction): string {
  if (!condition || condition === 'normal') {
    return t('pension.contributionPeriods.workingCondition.normal');
  }
  switch (condition) {
    case 'groupII':
      return t('pension.contributionPeriods.workingCondition.groupII');
    case 'groupI':
      return t('pension.contributionPeriods.workingCondition.groupI');
    case 'specialConditions':
      return t('pension.contributionPeriods.workingCondition.specialConditions');
    default:
      return t('pension.contributionPeriods.workingCondition.normal');
  }
}

/**
 * Helper function to get non-contributive type display text
 */
function getNonContributiveTypeText(type: NonContributivePeriodType | undefined, t: TranslateFunction): string {
  if (!type) return '-';
  switch (type) {
    case 'military':
      return t('pension.contributionPeriods.nonContributivePeriod.military');
    case 'university':
      return t('pension.contributionPeriods.nonContributivePeriod.university');
    case 'childCare':
      return t('pension.contributionPeriods.nonContributivePeriod.childCare');
    case 'medical':
      return t('pension.contributionPeriods.nonContributivePeriod.medical');
    default:
      return '-';
  }
}

/**
 * Helper function to add a chart image to the PDF with page break handling
 */
function addChartToPdf(
  doc: jsPDF,
  chartImage: ChartImageData,
  yPos: number,
  margin: number,
  contentWidth: number,
  pageHeight: number
): number {
  const aspect = chartImage.height / chartImage.width;
  const imgWidth = contentWidth;
  const imgHeight = imgWidth * aspect;

  // Check if we need a page break
  if (yPos + imgHeight + 10 > pageHeight - 20) {
    doc.addPage();
    yPos = margin;
  }

  try {
    doc.addImage(chartImage.dataUrl, 'PNG', margin, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 8;
  } catch (error) {
    console.error('Failed to add chart image to PDF:', error);
  }

  return yPos;
}

/**
 * Generate and download a PDF report of pension calculation
 */
export function exportToPdf(
  data: PdfExportData,
  t: TranslateFunction,
  filename?: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald-500
  const textColor: [number, number, number] = [31, 41, 55]; // Gray-800
  const lightGray: [number, number, number] = [156, 163, 175]; // Gray-400

  // ======== HEADER ========
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.title'), margin, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const exportDate = new Date().toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`${t('pdfExport.generatedOn')}: ${exportDate}`, margin, 25);

  yPos = 45;

  // ======== PENSION ESTIMATE SUMMARY ========
  doc.setTextColor(...textColor);
  doc.setFillColor(240, 253, 244); // Emerald-50
  doc.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.stats.pensionEstimate.title'), margin + 5, yPos + 10);

  // Monthly pension
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text(formatCurrency(data.monthlyPension), margin + 5, yPos + 25);

  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text(t('pension.stats.pensionEstimate.monthlyPension'), margin + 5, yPos + 32);

  // Yearly pension
  doc.setFontSize(16);
  doc.setTextColor(...textColor);
  doc.text(formatCurrency(data.yearlyPension), margin + 80, yPos + 25);

  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text(t('pension.stats.pensionEstimate.yearlyPension'), margin + 80, yPos + 32);

  // Total points
  doc.setFontSize(14);
  doc.setTextColor(...textColor);
  doc.text(formatPoints(data.pensionDetails.totalPoints), margin + 140, yPos + 25);

  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text(t('pension.stats.pointsBreakdown.totalPoints'), margin + 140, yPos + 32);

  yPos += 50;

  // ======== PERSONAL INFORMATION ========
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.personalInfo.title'), margin, yPos);
  yPos += 8;

  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Personal info grid
  const infoColWidth = contentWidth / 2;

  // Birth date
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.personalInfo.birthDate') + ':', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(data.inputs.birthDate), margin + 45, yPos);

  // Retirement year
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.personalInfo.plannedRetirementYear') + ':', margin + infoColWidth, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(String(data.inputs.retirementYear), margin + infoColWidth + 55, yPos);

  yPos += 8;

  // Current age and years until retirement
  if (data.pensionDetails.currentAge !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.text(t('pension.stats.timeline.currentAge') + ':', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.pensionDetails.currentAge} ${t('common.years')}`, margin + 45, yPos);
  }

  if (data.pensionDetails.yearsUntilRetirement !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.text(t('pdfExport.yearsUntilRetirement') + ':', margin + infoColWidth, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.pensionDetails.yearsUntilRetirement} ${t('common.years')}`, margin + infoColWidth + 55, yPos);
  }

  yPos += 15;

  // ======== POINTS BREAKDOWN ========
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.stats.pointsBreakdown.title'), margin, yPos);
  yPos += 8;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Points breakdown table
  const pointsData = [
    { label: t('pension.stats.pointsBreakdown.contribution'), value: data.pensionDetails.contributionPoints },
    { label: t('pension.stats.pointsBreakdown.stability'), value: data.pensionDetails.stabilityPoints },
    { label: t('pension.stats.pointsBreakdown.nonContributive'), value: data.pensionDetails.nonContributivePoints || 0 },
  ];

  pointsData.forEach((item) => {
    doc.text(item.label + ':', margin, yPos);
    doc.text(formatPoints(item.value), margin + 70, yPos);
    yPos += 6;
  });

  // Total points (bold)
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.stats.pointsBreakdown.totalPoints') + ':', margin, yPos);
  doc.text(formatPoints(data.pensionDetails.totalPoints), margin + 70, yPos);
  doc.setFont('helvetica', 'normal');

  yPos += 15;

  // ======== VPR INFORMATION ========
  doc.setFontSize(10);
  doc.setTextColor(...lightGray);
  doc.text(
    `${t('pdfExport.calculationBasis')}: VPR ${data.vprInfo.year} = ${formatCurrency(data.vprInfo.value, { showDecimals: true, minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    margin,
    yPos
  );
  yPos += 15;

  // ======== CONTRIBUTION PERIODS ========
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(t('pension.contributionPeriods.title'), margin, yPos);
  yPos += 8;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;

  // Filter and display contribution periods
  const contributionPeriods = data.inputs.contributionPeriods;

  if (contributionPeriods.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(t('pension.stats.periodBreakdown.noPeriodsYet'), margin, yPos);
    yPos += 10;
  } else {
    doc.setFontSize(9);

    // Table header
    const colWidths = [50, 35, 35, 35, 25]; // Period, Dates, Condition, Salary/Type, Years
    let xPos = margin;

    doc.setFillColor(249, 250, 251); // Gray-50
    doc.rect(margin, yPos - 4, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text(t('pdfExport.period'), xPos, yPos);
    xPos += colWidths[0];
    doc.text(t('pdfExport.dates'), xPos, yPos);
    xPos += colWidths[1];
    doc.text(t('pdfExport.condition'), xPos, yPos);
    xPos += colWidths[2];
    doc.text(t('pdfExport.salaryOrType'), xPos, yPos);
    xPos += colWidths[3];
    doc.text(t('pdfExport.years'), xPos, yPos);

    yPos += 8;
    doc.setFont('helvetica', 'normal');

    // Table rows
    contributionPeriods.forEach((period: ContributionPeriod, index: number) => {
      // Check if we need a new page
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }

      xPos = margin;
      const years = calculateYearsBetween(period.fromDate, period.toDate);
      const isNonContributive = !!period.nonContributiveType;

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, yPos - 4, contentWidth, 8, 'F');
      }

      // Period name/company
      const periodName = isNonContributive
        ? getNonContributiveTypeText(period.nonContributiveType, t)
        : (period.company || `${t('pdfExport.period')} ${index + 1}`);
      doc.text(periodName.substring(0, 20), xPos, yPos);
      xPos += colWidths[0];

      // Dates
      doc.text(`${formatDate(period.fromDate).substring(0, 10)}`, xPos, yPos);
      xPos += colWidths[1];

      // Working condition or non-contributive type
      if (isNonContributive) {
        doc.text(t('pdfExport.nonContributive'), xPos, yPos);
      } else {
        const conditionText = getWorkingConditionText(period.workingCondition, t);
        // Shorten the condition text for table
        const shortCondition = conditionText.replace(' - ', '-').substring(0, 15);
        doc.text(shortCondition, xPos, yPos);
      }
      xPos += colWidths[2];

      // Salary or type
      if (isNonContributive) {
        doc.text('-', xPos, yPos);
      } else {
        doc.text(period.monthlyGrossSalary ? formatCurrency(period.monthlyGrossSalary) : '-', xPos, yPos);
      }
      xPos += colWidths[3];

      // Years
      doc.text(formatYears(years), xPos, yPos);

      yPos += 8;
    });
  }

  // ======== CHARTS & VISUALIZATIONS ========
  if (data.chartImages) {
    const { cumulativePointsChart, contributionTypePieChart, periodTypePieChart, salaryHistoryChart } = data.chartImages;
    const hasAnyChart = cumulativePointsChart || contributionTypePieChart || periodTypePieChart || salaryHistoryChart;

    if (hasAnyChart) {
      // Start charts on a new page for clean layout
      doc.addPage();
      yPos = margin;

      // Charts section header
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t('pdfExport.charts.sectionTitle'), margin, yPos);
      yPos += 4;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...lightGray);
      doc.text(t('pdfExport.charts.sectionDescription'), margin, yPos + 4);
      yPos += 12;

      doc.setDrawColor(229, 231, 235);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // ---- Cumulative Points Chart (full width) ----
      if (cumulativePointsChart) {
        yPos = addChartToPdf(doc, cumulativePointsChart, yPos, margin, contentWidth, pageHeight);
      }

      // ---- Pie Charts (side by side) ----
      if (contributionTypePieChart || periodTypePieChart) {
        const pieChartHeight = 75;
        if (yPos + pieChartHeight + 10 > pageHeight - 20) {
          doc.addPage();
          yPos = margin;
        }

        // Section subtitle for pie charts
        doc.setTextColor(...textColor);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(t('pension.contributionAnalysis.title'), margin, yPos);
        yPos += 8;

        const halfWidth = (contentWidth - 5) / 2;

        if (contributionTypePieChart && periodTypePieChart) {
          const pieAspect = contributionTypePieChart.height / contributionTypePieChart.width;
          const pieImgHeight = halfWidth * pieAspect;

          try {
            doc.addImage(contributionTypePieChart.dataUrl, 'PNG', margin, yPos, halfWidth, pieImgHeight);
            doc.addImage(periodTypePieChart.dataUrl, 'PNG', margin + halfWidth + 5, yPos, halfWidth, pieImgHeight);
            yPos += pieImgHeight + 8;
          } catch (error) {
            console.error('Failed to add pie chart images to PDF:', error);
          }
        } else if (contributionTypePieChart) {
          yPos = addChartToPdf(doc, contributionTypePieChart, yPos, margin, halfWidth, pageHeight);
        } else if (periodTypePieChart) {
          yPos = addChartToPdf(doc, periodTypePieChart, yPos, margin, halfWidth, pageHeight);
        }
      }

      // ---- Salary History Chart (full width) ----
      if (salaryHistoryChart) {
        yPos = addChartToPdf(doc, salaryHistoryChart, yPos, margin, contentWidth, pageHeight);
      }
    }
  }

    // ======== FOOTER ========
  // Add footer on the last page
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.text(t('pdfExport.disclaimer'), margin, footerY);
  doc.text(
    `${t('legal.copyright')} - ${new Date().getFullYear()}`,
    pageWidth - margin - 50,
    footerY
  );

  // Save PDF
  const date = new Date().toISOString().split('T')[0];
  const defaultFilename = `pension-report-${date}`;
  const finalFilename = filename || defaultFilename;
  doc.save(`${finalFilename}.pdf`);
}
