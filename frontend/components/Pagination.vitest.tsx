import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} totalItems={10} showingItems={10} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page info text', () => {
    render(
      <Pagination page={1} totalPages={5} totalItems={100} showingItems={20} onPageChange={vi.fn()} />
    );
    expect(screen.getByText(/عرض 20 من 100/)).toBeInTheDocument();
  });

  it('renders previous and next buttons', () => {
    render(
      <Pagination page={2} totalPages={5} totalItems={100} showingItems={20} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('السابق')).toBeInTheDocument();
    expect(screen.getByText('التالي')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination page={1} totalPages={5} totalItems={100} showingItems={20} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('السابق')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination page={5} totalPages={5} totalItems={100} showingItems={20} onPageChange={vi.fn()} />
    );
    expect(screen.getByText('التالي')).toBeDisabled();
  });

  it('calls onPageChange when clicking a page number', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination page={1} totalPages={5} totalItems={100} showingItems={20} onPageChange={onPageChange} />
    );
    await user.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with previous page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination page={3} totalPages={5} totalItems={100} showingItems={20} onPageChange={onPageChange} />
    );
    await user.click(screen.getByText('السابق'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination page={3} totalPages={5} totalItems={100} showingItems={20} onPageChange={onPageChange} />
    );
    await user.click(screen.getByText('التالي'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('highlights current page', () => {
    render(
      <Pagination page={2} totalPages={5} totalItems={100} showingItems={20} onPageChange={vi.fn()} />
    );
    const currentPageBtn = screen.getByText('2');
    expect(currentPageBtn.className).toContain('bg-blue-600');
  });

  it('shows ellipsis for large page counts', () => {
    render(
      <Pagination page={5} totalPages={20} totalItems={400} showingItems={20} onPageChange={vi.fn()} />
    );
    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it('formats totalItems with locale string', () => {
    render(
      <Pagination page={1} totalPages={5} totalItems={1000} showingItems={20} onPageChange={vi.fn()} />
    );
    expect(screen.getByText(/1,000/)).toBeInTheDocument();
  });
});
