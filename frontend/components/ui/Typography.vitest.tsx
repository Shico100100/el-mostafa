import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { H1, H2, H3, H4, Label, Caption, StatValue, StatLabel, PageTitle, SectionTitle, Text, Muted } from './Typography';

describe('Typography components', () => {
  it('renders H1 with text', () => {
    render(<H1>Test Heading</H1>);
    const el = screen.getByRole('heading', { level: 1 });
    expect(el).toHaveTextContent('Test Heading');
    expect(el.className).toContain('text-2xl');
  });

  it('renders H2 with text', () => {
    render(<H2>Sub Heading</H2>);
    const el = screen.getByRole('heading', { level: 2 });
    expect(el).toHaveTextContent('Sub Heading');
    expect(el.className).toContain('text-xl');
  });

  it('renders H3 with text', () => {
    render(<H3>Section</H3>);
    const el = screen.getByRole('heading', { level: 3 });
    expect(el).toHaveTextContent('Section');
    expect(el.className).toContain('text-lg');
  });

  it('renders H4 with text', () => {
    render(<H4>Small</H4>);
    const el = screen.getByRole('heading', { level: 4 });
    expect(el).toHaveTextContent('Small');
    expect(el.className).toContain('text-base');
  });

  it('renders Label', () => {
    render(<Label>Name</Label>);
    const el = screen.getByText('Name');
    expect(el.tagName).toBe('LABEL');
    expect(el.className).toContain('text-sm');
  });

  it('renders Caption', () => {
    render(<Caption>Small text</Caption>);
    const el = screen.getByText('Small text');
    expect(el.tagName).toBe('P');
    expect(el.className).toContain('text-xs');
  });

  it('renders StatValue', () => {
    render(<StatValue>1,234</StatValue>);
    const el = screen.getByText('1,234');
    expect(el.className).toContain('text-2xl');
  });

  it('renders StatLabel', () => {
    render(<StatLabel>Total</StatLabel>);
    const el = screen.getByText('Total');
    expect(el.className).toContain('text-xs');
  });

  it('renders PageTitle', () => {
    render(<PageTitle>Dashboard</PageTitle>);
    const el = screen.getByRole('heading', { level: 1 });
    expect(el).toHaveTextContent('Dashboard');
    expect(el.className).toContain('page-title');
  });

  it('renders SectionTitle', () => {
    render(<SectionTitle>Reports</SectionTitle>);
    const el = screen.getByRole('heading', { level: 2 });
    expect(el).toHaveTextContent('Reports');
    expect(el.className).toContain('section-title');
  });

  it('renders Text', () => {
    render(<Text>Body text</Text>);
    const el = screen.getByText('Body text');
    expect(el.tagName).toBe('P');
    expect(el.className).toContain('text-sm');
  });

  it('renders Muted', () => {
    render(<Muted>Subtle</Muted>);
    const el = screen.getByText('Subtle');
    expect(el.tagName).toBe('P');
    expect(el.className).toContain('text-xs');
  });

  it('applies custom className', () => {
    render(<H1 className="custom-class">Styled</H1>);
    const el = screen.getByRole('heading', { level: 1 });
    expect(el.className).toContain('custom-class');
    expect(el.className).toContain('text-2xl');
  });

  it('renders children correctly', () => {
    render(
      <H1>
        <span>Nested</span> content
      </H1>
    );
    expect(screen.getByText('Nested')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
