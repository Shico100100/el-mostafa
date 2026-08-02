import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartsSection } from '@/components/accounting/ChartsSection';

describe('ChartsSection', () => {
  it('renders pie chart and bar chart sections', () => {
    render(
      <ChartsSection
        accountTypeCounts={[
          { name: 'أصول', value: 3 },
          { name: 'خصوم', value: 1 },
          { name: 'حقوق ملكية', value: 1 },
          { name: 'إيرادات', value: 1 },
          { name: 'مصروفات', value: 2 },
        ]}
        topTrialBalance={[
          { name: 'المخزون', debit: 3214802.25, credit: 0 },
          { name: 'الموردين', debit: 0, credit: 1825749.64 },
          { name: 'تكلفة المبيعات', debit: 0, credit: 1235138.23 },
        ]}
      />
    );
    expect(screen.getByText('توزيع الحسابات')).toBeTruthy();
    expect(screen.getByText(/أرصدة ميزان المراجعة/)).toBeTruthy();
  });

  it('shows no-data message when all values are zero', () => {
    render(
      <ChartsSection
        accountTypeCounts={[]}
        topTrialBalance={[]}
      />
    );
    expect(screen.getAllByText('لا توجد بيانات').length).toBeGreaterThanOrEqual(1);
  });

  it('renders pie slices for each account type', () => {
    const { container } = render(
      <ChartsSection
        accountTypeCounts={[
          { name: 'أصول', value: 10 },
          { name: 'خصوم', value: 5 },
        ]}
        topTrialBalance={[
          { name: 'Account A', debit: 100, credit: 0 },
        ]}
      />
    );
    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('renders bar chart rectangles for trial balance', () => {
    const { container } = render(
      <ChartsSection
        accountTypeCounts={[]}
        topTrialBalance={[
          { name: 'حساب1', debit: 1000, credit: 0 },
          { name: 'حساب2', debit: 0, credit: 500 },
        ]}
      />
    );
    const rects = container.querySelectorAll('svg rect');
    expect(rects.length).toBeGreaterThanOrEqual(2);
  });

  it('handles single account in trial balance', () => {
    render(
      <ChartsSection
        accountTypeCounts={[{ name: 'أصول', value: 1 }]}
        topTrialBalance={[{ name: 'Account', debit: 100, credit: 0 }]}
      />
    );
    expect(screen.getByText(/أرصدة ميزان المراجعة/)).toBeTruthy();
  });
});
