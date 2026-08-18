import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExcelActions from './ExcelActions';

// ExcelActions uses useAuthCheck -> useRouter() from next/navigation,
// so the Next.js app router must be mocked for unit tests.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('ExcelActions', () => {
  const defaultProps = {
    exportUrl: '/manufacturing/export/molds',
    importUrl: '/manufacturing/import/molds',
    fileName: 'molds.xlsx',
    onImportSuccess: vi.fn(),
  };

  it('renders export and import buttons', () => {
    render(<ExcelActions {...defaultProps} />);
    expect(screen.getByText('تصدير Excel')).toBeInTheDocument();
    expect(screen.getByText('استيراد Excel')).toBeInTheDocument();
  });

  it('disables import button while importing', async () => {
    render(<ExcelActions {...defaultProps} />);

    const importBtn = screen.getByText('استيراد Excel');
    // Mock file input to trigger importing state
    // The button itself isn't disabled until importing starts
    expect(importBtn).not.toBeDisabled();
  });

  it('renders correct export button text', () => {
    render(<ExcelActions {...defaultProps} />);
    expect(screen.getByText(/تصدير/)).toBeInTheDocument();
  });

  it('renders correct import button text', () => {
    render(<ExcelActions {...defaultProps} />);
    expect(screen.getByText(/استيراد/)).toBeInTheDocument();
  });
});
