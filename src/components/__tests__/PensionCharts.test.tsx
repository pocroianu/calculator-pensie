import { render, screen } from '@testing-library/react';
import PensionCharts from '../PensionCharts';
import { ContributionPeriod, WorkingCondition, NonContributivePeriodType } from '../../types/pensionTypes';

// Mock Chart.js to avoid canvas rendering issues in tests
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  ArcElement: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2 Pie and Line components
jest.mock('react-chartjs-2', () => ({
  Pie: jest.fn(({ data, options }) => (
    <div data-testid="mock-pie-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      <div data-testid="chart-labels">{data.labels?.join(',')}</div>
      <div data-testid="chart-data">{data.datasets?.[0]?.data?.join(',')}</div>
    </div>
  )),
  Line: jest.fn(({ data, options }) => (
    <div data-testid="mock-line-chart" data-chart-data={JSON.stringify(data)} data-chart-options={JSON.stringify(options)}>
      <div data-testid="line-chart-labels">{data.labels?.join(',')}</div>
    </div>
  )),
}));

// Mock formatters
jest.mock('../../utils/formatters', () => ({
  formatYears: jest.fn((years: number) => years.toFixed(1)),
}));

describe('PensionCharts', () => {
  // Helper function to create contribution periods
  const createContributionPeriod = (overrides: Partial<ContributionPeriod> = {}): ContributionPeriod => ({
    fromDate: '2000-01-01',
    toDate: '2010-01-01',
    company: 'Test Company',
    monthlyGrossSalary: 5000,
    workingCondition: 'normal' as WorkingCondition,
    ...overrides
  });

  // Default birth date for tests
  const defaultBirthDate = '1975-01-01';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the component with correct structure', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      expect(screen.getByText('Contribution Analysis')).toBeInTheDocument();
      expect(screen.getByText('Contribution Type Distribution')).toBeInTheDocument();
      expect(screen.getByText('Period Type Distribution')).toBeInTheDocument();
    });

    it('renders two pie charts', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      expect(pieCharts).toHaveLength(2);
    });

    it('renders with correct CSS classes for styling', () => {
      const periods = [createContributionPeriod()];
      const { container } = render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      // Check for main container styling
      expect(container.querySelector('.bg-white')).toBeInTheDocument();
      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
      expect(container.querySelector('.border-gray-200')).toBeInTheDocument();
    });

    it('renders grid layout for charts', () => {
      const periods = [createContributionPeriod()];
      const { container } = render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      expect(container.querySelector('.grid')).toBeInTheDocument();
      expect(container.querySelector('.md\\:grid-cols-2')).toBeInTheDocument();
    });
  });

  describe('Contribution Type Data Calculations', () => {
    it('calculates normal employment years correctly', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2010-01-01', // ~10 years
          workingCondition: 'normal'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Normal Employment');
      // The first value should be approximately 10 years
      expect(chartData.datasets[0].data[0]).toBeCloseTo(10, 0);
    });

    it('calculates special conditions years correctly', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2005-01-01', // ~5 years
          workingCondition: 'specialConditions'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Special Conditions');
      // The second value should be approximately 5 years
      expect(chartData.datasets[0].data[1]).toBeCloseTo(5, 0);
    });

    it('calculates group I working conditions correctly', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2005-01-01', // ~5 years
          workingCondition: 'groupI'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Special Conditions');
      // groupI counts as special conditions
      expect(chartData.datasets[0].data[1]).toBeCloseTo(5, 0);
    });

    it('calculates group II working conditions correctly', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2004-01-01', // ~4 years
          workingCondition: 'groupII'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Special Conditions');
      // groupII counts as special conditions
      expect(chartData.datasets[0].data[1]).toBeCloseTo(4, 0);
    });

    it('calculates non-contributive years correctly', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2002-01-01', // ~2 years
          nonContributiveType: 'military' as NonContributivePeriodType
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Non-contributive');
      // The third value should be approximately 2 years
      expect(chartData.datasets[0].data[2]).toBeCloseTo(2, 0);
    });

    it('handles multiple periods of different types', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2005-01-01', // ~5 years normal
          workingCondition: 'normal'
        }),
        createContributionPeriod({
          fromDate: '2005-01-01',
          toDate: '2008-01-01', // ~3 years special
          workingCondition: 'specialConditions'
        }),
        createContributionPeriod({
          fromDate: '2008-01-01',
          toDate: '2010-01-01', // ~2 years non-contributive
          nonContributiveType: 'university' as NonContributivePeriodType
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      // Verify all three types have values
      expect(chartData.datasets[0].data[0]).toBeCloseTo(5, 0); // normal
      expect(chartData.datasets[0].data[1]).toBeCloseTo(3, 0); // special
      expect(chartData.datasets[0].data[2]).toBeCloseTo(2, 0); // non-contributive
    });

    it('applies correct colors for contribution types', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.datasets[0].backgroundColor).toEqual([
        'rgba(59, 130, 246, 0.8)', // blue-500
        'rgba(139, 92, 246, 0.8)', // purple-500
        'rgba(236, 72, 153, 0.8)', // pink-500
      ]);
    });
  });

  describe('Period Type Data Calculations', () => {
    it('groups employment periods by company', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2005-01-01',
          company: 'Company A'
        }),
        createContributionPeriod({
          fromDate: '2005-01-01',
          toDate: '2010-01-01',
          company: 'Company B'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Company A (normal)');
      expect(chartData.labels).toContain('Company B (normal)');
    });

    it('handles university non-contributive periods with institution name', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2004-01-01',
          company: 'Technical University',
          nonContributiveType: 'university' as NonContributivePeriodType
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('University - Technical University');
    });

    it('handles military service periods', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2001-06-01',
          nonContributiveType: 'military' as NonContributivePeriodType
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Military Service');
    });

    it('handles child care leave periods', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2010-01-01',
          toDate: '2012-01-01',
          nonContributiveType: 'childCare' as NonContributivePeriodType
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Child Care Leave');
    });

    it('handles medical leave periods', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2015-01-01',
          toDate: '2015-06-01',
          nonContributiveType: 'medical' as NonContributivePeriodType
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Medical Leave');
    });

    it('aggregates multiple periods from same company', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2005-01-01', // ~5 years
          company: 'Same Company'
        }),
        createContributionPeriod({
          fromDate: '2007-01-01',
          toDate: '2010-01-01', // ~3 years
          company: 'Same Company'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      // Should only have one label for the same company
      const sameCompanyLabels = chartData.labels.filter((l: string) => l.includes('Same Company'));
      expect(sameCompanyLabels).toHaveLength(1);

      // Should aggregate years (~8 years total)
      expect(chartData.datasets[0].data[0]).toBeCloseTo(8, 0);
    });

    it('handles unknown company name', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2005-01-01',
          company: undefined
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Unknown (normal)');
    });
  });

  describe('Chart Configuration', () => {
    it('configures chart as responsive', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const chartOptions = JSON.parse(pieCharts[0].getAttribute('data-chart-options') || '{}');

      expect(chartOptions.responsive).toBe(true);
    });

    it('configures legend position at bottom', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const chartOptions = JSON.parse(pieCharts[0].getAttribute('data-chart-options') || '{}');

      expect(chartOptions.plugins.legend.position).toBe('bottom');
    });

    it('configures legend with point style', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const chartOptions = JSON.parse(pieCharts[0].getAttribute('data-chart-options') || '{}');

      expect(chartOptions.plugins.legend.labels.usePointStyle).toBe(true);
    });

    it('configures legend font size', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const chartOptions = JSON.parse(pieCharts[0].getAttribute('data-chart-options') || '{}');

      expect(chartOptions.plugins.legend.labels.font.size).toBe(11);
    });

    it('includes custom generateLabels function', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const chartOptions = JSON.parse(pieCharts[0].getAttribute('data-chart-options') || '{}');

      // generateLabels function should be defined (will be serialized as null in JSON)
      expect(chartOptions.plugins.legend.labels).toBeDefined();
    });

    it('includes tooltip callback configuration', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const chartOptions = JSON.parse(pieCharts[0].getAttribute('data-chart-options') || '{}');

      expect(chartOptions.plugins.tooltip).toBeDefined();
      expect(chartOptions.plugins.tooltip.callbacks).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty contribution periods array', () => {
      render(<PensionCharts contributionPeriods={[]} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      expect(pieCharts).toHaveLength(2);

      // Both charts should have zero data
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');
      expect(chartData.datasets[0].data).toEqual([0, 0, 0]);
    });

    it('handles periods with missing fromDate', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '',
          toDate: '2010-01-01'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      // Should skip periods with missing dates
      expect(chartData.datasets[0].data).toEqual([0, 0, 0]);
    });

    it('handles periods with missing toDate', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: ''
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      // Should skip periods with missing dates
      expect(chartData.datasets[0].data).toEqual([0, 0, 0]);
    });

    it('handles periods with both dates missing', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '',
          toDate: ''
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      // Should skip periods with missing dates
      expect(chartData.datasets[0].data).toEqual([0, 0, 0]);
    });

    it('handles very short periods (days)', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '2020-01-01',
          toDate: '2020-01-15' // 14 days
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      // Should calculate small fraction of year
      expect(chartData.datasets[0].data[0]).toBeLessThan(0.1);
      expect(chartData.datasets[0].data[0]).toBeGreaterThan(0);
    });

    it('handles very long periods (decades)', () => {
      const periods = [
        createContributionPeriod({
          fromDate: '1980-01-01',
          toDate: '2020-01-01' // 40 years
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const contributionTypeChart = pieCharts[0];
      const chartData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.datasets[0].data[0]).toBeCloseTo(40, 0);
    });
  });

  describe('Color Palette', () => {
    it('provides enough colors for multiple period types', () => {
      // Create periods with many different companies to test color allocation
      const periods = [
        createContributionPeriod({ company: 'Company 1', fromDate: '2000-01-01', toDate: '2001-01-01' }),
        createContributionPeriod({ company: 'Company 2', fromDate: '2001-01-01', toDate: '2002-01-01' }),
        createContributionPeriod({ company: 'Company 3', fromDate: '2002-01-01', toDate: '2003-01-01' }),
        createContributionPeriod({ company: 'Company 4', fromDate: '2003-01-01', toDate: '2004-01-01' }),
        createContributionPeriod({ company: 'Company 5', fromDate: '2004-01-01', toDate: '2005-01-01' }),
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      // Should have 5 colors allocated
      expect(chartData.datasets[0].backgroundColor.length).toBe(5);
      expect(chartData.datasets[0].borderColor.length).toBe(5);
    });

    it('border colors have opacity 1 (fully opaque)', () => {
      const periods = [createContributionPeriod()];
      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      // Border colors should end with ', 1)' instead of ', 0.8)'
      chartData.datasets[0].borderColor.forEach((color: string) => {
        expect(color).toMatch(/, 1\)$/);
      });
    });
  });

  describe('Working Condition Display', () => {
    it('shows working condition in period type labels', () => {
      const periods = [
        createContributionPeriod({
          company: 'Test Corp',
          workingCondition: 'groupI'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Test Corp (groupI)');
    });

    it('handles normal working condition', () => {
      const periods = [
        createContributionPeriod({
          company: 'Normal Corp',
          workingCondition: 'normal'
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Normal Corp (normal)');
    });

    it('handles undefined working condition', () => {
      const periods = [
        createContributionPeriod({
          company: 'Undefined Corp',
          workingCondition: undefined
        })
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      // Should default to 'normal' when undefined
      expect(chartData.labels[0]).toContain('(normal)');
    });
  });

  describe('Memoization', () => {
    it('recalculates data when contribution periods change', () => {
      const initialPeriods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2005-01-01',
          company: 'First Company'
        })
      ];

      const { rerender } = render(<PensionCharts contributionPeriods={initialPeriods} birthDate={defaultBirthDate} />);

      const updatedPeriods = [
        createContributionPeriod({
          fromDate: '2000-01-01',
          toDate: '2010-01-01',
          company: 'Updated Company'
        })
      ];

      rerender(<PensionCharts contributionPeriods={updatedPeriods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');
      const periodTypeChart = pieCharts[1];
      const chartData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      expect(chartData.labels).toContain('Updated Company (normal)');
      expect(chartData.labels).not.toContain('First Company (normal)');
    });
  });

  describe('Responsive Layout', () => {
    it('has max-width constraint on chart containers', () => {
      const periods = [createContributionPeriod()];
      const { container } = render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      // Check for max-w-[300px] class
      const chartContainers = container.querySelectorAll('.max-w-\\[300px\\]');
      expect(chartContainers.length).toBe(2);
    });

    it('centers charts within containers', () => {
      const periods = [createContributionPeriod()];
      const { container } = render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      // Check for mx-auto class
      const centeredElements = container.querySelectorAll('.mx-auto');
      expect(centeredElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Integration with Real Data Patterns', () => {
    it('handles typical Romanian pension contribution history', () => {
      const periods: ContributionPeriod[] = [
        // Military service
        {
          fromDate: '1985-01-01',
          toDate: '1986-06-01',
          nonContributiveType: 'military',
        },
        // University studies
        {
          fromDate: '1986-09-01',
          toDate: '1991-06-01',
          company: 'University of Bucharest',
          nonContributiveType: 'university',
        },
        // First job
        {
          fromDate: '1991-07-01',
          toDate: '2000-12-31',
          company: 'State Enterprise',
          monthlyGrossSalary: 3000,
          workingCondition: 'normal',
        },
        // Second job with special conditions
        {
          fromDate: '2001-01-01',
          toDate: '2010-12-31',
          company: 'Mining Company',
          monthlyGrossSalary: 5000,
          workingCondition: 'specialConditions',
        },
        // Child care leave
        {
          fromDate: '2002-01-01',
          toDate: '2004-01-01',
          nonContributiveType: 'childCare',
        },
        // Current employment
        {
          fromDate: '2011-01-01',
          toDate: '2024-01-01',
          company: 'IT Company',
          monthlyGrossSalary: 15000,
          workingCondition: 'normal',
        },
      ];

      render(<PensionCharts contributionPeriods={periods} birthDate={defaultBirthDate} />);

      const pieCharts = screen.getAllByTestId('mock-pie-chart');

      // Contribution type chart
      const contributionTypeChart = pieCharts[0];
      const contributionTypeData = JSON.parse(contributionTypeChart.getAttribute('data-chart-data') || '{}');

      // Should have all three contribution types
      expect(contributionTypeData.labels).toEqual(['Normal Employment', 'Special Conditions', 'Non-contributive']);

      // Period type chart
      const periodTypeChart = pieCharts[1];
      const periodTypeData = JSON.parse(periodTypeChart.getAttribute('data-chart-data') || '{}');

      // Should have multiple period types
      expect(periodTypeData.labels.length).toBeGreaterThan(3);
    });
  });
});
