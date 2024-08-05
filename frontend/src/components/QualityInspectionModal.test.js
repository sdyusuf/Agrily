import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QualityInspectionModal from './QualityInspectionModal';

describe('QualityInspectionModal Component Tests', () => {
  const mockVault = {
    vaultNumber: 'VAULT-2024-TEST-001',
    produceCategory: 'vegetables',
    produceName: 'Roma Tomatoes (Plum)',
    quantityKg: 3500,
    cratesBags: 120
  };

  test('does not render when show is false', () => {
    const { container } = render(
      <QualityInspectionModal
        show={false}
        onClose={jest.fn()}
        vault={mockVault}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal properly with vault number and produce category', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={mockVault}
      />
    );

    expect(screen.getByText(/Official Agricultural Quality Inspection/i)).toBeInTheDocument();
    expect(screen.getByText(/VAULT-2024-TEST-001/i)).toBeInTheDocument();
    expect(screen.getByTestId('quality-inspection-modal')).toBeInTheDocument();
  });

  test('calls onClose when close button or Cancel button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <QualityInspectionModal
        show={true}
        onClose={handleClose}
        vault={mockVault}
      />
    );

    fireEvent.click(screen.getByLabelText(/Close modal/i));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  test('updates metrics dynamically and adjusts grade', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={mockVault}
      />
    );

    // Initial state: Spoilage 1.5% -> Grade A
    expect(screen.getByText(/Grade A: Export Premium/i)).toBeInTheDocument();

    // Change spoilage slider to 12% -> triggers Reject
    const spoilageInput = screen.getByTestId('input-spoilage');
    fireEvent.change(spoilageInput, { target: { value: '12' } });

    expect(screen.getByText(/Rejected: Unfit for Commerce/i)).toBeInTheDocument();
  });

  test('triggers auto-reject when mold hazard is checked', () => {
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={mockVault}
      />
    );

    const moldCheckbox = screen.getByTestId('check-mold');
    fireEvent.click(moldCheckbox);

    expect(screen.getByText(/Rejected: Unfit for Commerce/i)).toBeInTheDocument();
  });

  test('submits inspection payload when submit button is clicked', () => {
    const handleSubmit = jest.fn();
    render(
      <QualityInspectionModal
        show={true}
        onClose={jest.fn()}
        vault={mockVault}
        onSubmitInspection={handleSubmit}
      />
    );

    const submitBtn = screen.getByTestId('btn-submit-inspection');
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const submitted = handleSubmit.mock.calls[0][0];
    expect(submitted.produceCategory).toBe('vegetables');
    expect(submitted.produceName).toBe('Roma Tomatoes (Plum)');
    expect(submitted.inspector.name).toBe('Chinedu Eze');
    expect(submitted.metrics).toBeDefined();
    expect(submitted.inspectorDigitalSignature).toBeDefined();
  });
});
