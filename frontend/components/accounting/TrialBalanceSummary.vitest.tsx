import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrialBalanceSummary } from '@/components/accounting/TrialBalanceSummary';

describe('TrialBalanceSummary', () => {
  it('renders account type totals', () => {
    render(
      <TrialBalanceSummary
        totals={[
          { type: 'ASSET', total: 3214802.25 },
          { type: 'LIABILITY', total: 1825749.64 },
          { type: 'EQUITY', total: 0 },
          { type: 'REVENUE', total: 0 },
          { type: 'EXPENSE', total: 1389052.61 },
        ]}
      />
    );
    expect(screen.getByText('ميزان المراجعة (ملخص)')).toBeTruthy();
    expect(screen.getByText('ASSET')).toBeTruthy();
    expect(screen.getByText('LIABILITY')).toBeTruthy();
  });

  it('renders empty totals', () => {
    render(<TrialBalanceSummary totals={[]} />);
    expect(screen.getByText('ميزان المراجعة (ملخص)')).toBeTruthy();
  });

  it('formats positive totals with green color', () => {
    const { container } = render(
      <TrialBalanceSummary totals={[{ type: 'ASSET', total: 1000 }]} />
    );
    const green = container.querySelector('.text-green-400');
    expect(green).toBeTruthy();
  });

  it('formats negative totals with red color', () => {
    const { container } = render(
      <TrialBalanceSummary totals={[{ type: 'ASSET', total: -500 }]} />
    );
    const red = container.querySelector('.text-red-400');
    expect(red).toBeTruthy();
  });

  it('shows balance with two decimal places', () => {
    render(
      <TrialBalanceSummary totals={[{ type: 'ASSET', total: 1234.567 }]} />
    );
    expect(screen.getByText('1234.57')).toBeTruthy();
  });
});
