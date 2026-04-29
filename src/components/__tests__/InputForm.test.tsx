import { render, screen, fireEvent } from '@testing-library/react';
import InputForm from '../InputForm';
import { PensionInputs, WorkingCondition } from '../../types/pensionTypes';
import { ToastProvider } from '../../contexts/ToastContext';

describe('InputForm', () => {
  const mockOnChange = jest.fn();

  const defaultInputs: PensionInputs = {
    birthDate: '1990-01-01',
    retirementYear: 2055,
    contributionPeriods: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderInputForm = (inputs: PensionInputs = defaultInputs) => render(
    <ToastProvider>
      <InputForm
        inputs={inputs}
        onChange={mockOnChange}
      />
    </ToastProvider>
  );

  it('renders all required fields', () => {
    renderInputForm();

    expect(screen.getByText('pension.personalInfo.birthDate')).toBeInTheDocument();
    expect(screen.getByText('pension.personalInfo.plannedRetirementYear')).toBeInTheDocument();
    expect(screen.getByText('pension.contributionPeriods.title')).toBeInTheDocument();
  });

  it('allows adding a new contribution period', () => {
    renderInputForm();

    const addButton = screen.getByTestId('add-period-button');
    fireEvent.click(addButton);

    expect(mockOnChange).toHaveBeenCalledWith('contributionPeriods', [{
      fromDate: '',
      toDate: '',
      company: '',
      monthlyGrossSalary: 0,
      workingCondition: 'normal' as WorkingCondition
    }]);
  });

  it('allows updating birth date', () => {
    renderInputForm();

    const birthDateInput = screen.getByTestId('birth-date-input');
    fireEvent.change(birthDateInput, { target: { value: '1995-01-01' } });

    expect(mockOnChange).toHaveBeenCalledWith('birthDate', '1995-01-01');
  });

  it('allows removing a contribution period', () => {
    const inputsWithPeriod = {
      ...defaultInputs,
      contributionPeriods: [{
        fromDate: '2010-01-01',
        toDate: '2015-01-01',
        company: 'Test Company',
        monthlyGrossSalary: 5000,
        workingCondition: 'normal' as WorkingCondition
      }]
    };

    renderInputForm(inputsWithPeriod);

    const removeButton = screen.getByLabelText('pension.contributionPeriods.removePeriod');
    fireEvent.click(removeButton);

    expect(mockOnChange).toHaveBeenCalledWith('contributionPeriods', []);
  });

  it('allows updating retirement year', () => {
    renderInputForm();

    const retirementYearInput = screen.getByRole('spinbutton');
    fireEvent.change(retirementYearInput, { target: { value: '2060' } });

    expect(mockOnChange).toHaveBeenCalledWith('retirementYear', 2060);
  });
});
