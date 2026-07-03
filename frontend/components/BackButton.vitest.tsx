import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackButtonProvider, useSetBackButton, GO_BACK } from './BackButton';

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

function TestChild({ target }: { target: string | typeof GO_BACK | null }) {
  useSetBackButton(target);
  return <div>test child</div>;
}

function renderWithProvider(target: string | typeof GO_BACK | null) {
  return render(
    <BackButtonProvider>
      <TestChild target={target} />
    </BackButtonProvider>
  );
}

describe('BackButton', () => {
  it('renders back button when target is set', () => {
    renderWithProvider('/dashboard');
    expect(screen.getByLabelText('رجوع')).toBeInTheDocument();
  });

  it('does not render back button when target is null', () => {
    renderWithProvider(null);
    expect(screen.queryByLabelText('رجوع')).not.toBeInTheDocument();
  });

  it('calls router.push when target is a string', async () => {
    const user = userEvent.setup();
    renderWithProvider('/dashboard');
    await user.click(screen.getByLabelText('رجوع'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('calls router.back when target is GO_BACK', async () => {
    const user = userEvent.setup();
    renderWithProvider(GO_BACK);
    await user.click(screen.getByLabelText('رجوع'));
    expect(mockBack).toHaveBeenCalled();
  });
});
