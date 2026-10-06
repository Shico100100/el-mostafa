import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LucideProps } from 'lucide-react';
import { createElement } from 'react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/usePermission', () => ({
  usePermission: () => ({ roleId: 1 }),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  const SvgIcon = (p: LucideProps) => <svg data-testid="icon" {...p} />;
  return {
    ...actual,
    LayoutDashboard: SvgIcon,
    ShoppingCart: SvgIcon,
    Package: SvgIcon,
    Factory: SvgIcon,
    Calculator: SvgIcon,
    ShoppingBag: SvgIcon,
    ArrowLeft: SvgIcon,
    Menu: SvgIcon,
    X: SvgIcon,
    FileText: SvgIcon,
    Bell: SvgIcon,
    Settings: SvgIcon,
    Shield: SvgIcon,
    TrendingUp: SvgIcon,
    Link2: SvgIcon,
    Pin: SvgIcon,
    PinOff: SvgIcon,
  };
});

import GlobalSidebar from './GlobalSidebar';

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('GlobalSidebar auto-hide', () => {
  it('starts unpinned with a hover strip and a pin button', () => {
    render(createElement(GlobalSidebar, null, 'x'));
    expect(
      screen.getByLabelText('تثبيت القائمة الجانبية'),
    ).toBeDefined();
  });

  it('reveals the sidebar on edge hover and hides it on leave', async () => {
    const user = userEvent.setup();
    const { container } = render(createElement(GlobalSidebar, null, 'x'));
    const aside = container.querySelector('aside');
    // Hidden = shifted RIGHT off-screen (positive translate). The old
    // negative value shifted it left into the viewport instead.
    expect(aside?.className).toMatch(/(^| )translate-x-full($| )/);

    const strip = container.querySelector('div[aria-hidden="true"]');
    expect(strip).not.toBeNull();
    fireEvent.mouseEnter(strip!);
    expect(aside?.className).toMatch(/translate-x-0/);

    fireEvent.mouseLeave(aside!);
    expect(aside?.className).toMatch(/(^| )translate-x-full($| )/);
    void user;
  });

  it('pins the sidebar open and persists the choice', async () => {
    const user = userEvent.setup();
    const { container } = render(createElement(GlobalSidebar, null, 'x'));
    await user.click(screen.getByLabelText('تثبيت القائمة الجانبية'));
    expect(window.localStorage.getItem('sidebar-pinned')).toBe('1');
    expect(
      screen.getByLabelText('إلغاء تثبيت القائمة'),
    ).toBeDefined();
    const aside = container.querySelector('aside');
    expect(aside?.className).toMatch(/lg:sticky/);
    // No hover strip while pinned.
    expect(
      container.querySelector('div[aria-hidden="true"]'),
    ).toBeNull();
  });

  it('restores a pinned sidebar from storage', () => {
    window.localStorage.setItem('sidebar-pinned', '1');
    const { container } = render(createElement(GlobalSidebar, null, 'x'));
    expect(
      screen.getByLabelText('إلغاء تثبيت القائمة'),
    ).toBeDefined();
    expect(container.querySelector('aside')?.className).toMatch(
      /lg:sticky/,
    );
  });
});
