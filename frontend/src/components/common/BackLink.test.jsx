import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import BackLink from './BackLink';

const renderInRouter = (ui) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('BackLink', () => {
  it('renders default label and points at the homepage', () => {
    renderInRouter(<BackLink />);
    const link = screen.getByRole('link', { name: /go back/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders custom label and target route', () => {
    renderInRouter(<BackLink to="/mediators-crm/cases" label="Back to cases" />);
    const link = screen.getByRole('link', { name: /back to cases/i });
    expect(link).toHaveAttribute('href', '/mediators-crm/cases');
  });

  it('uses an accessible nav landmark', () => {
    renderInRouter(<BackLink />);
    expect(screen.getByRole('navigation', { name: /back navigation/i })).toBeInTheDocument();
  });
});
