import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../Components/ErrorBoundary';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Suppresses the expected console.error output from React error boundaries */
const suppressErrorOutput = () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  return () => spy.mockRestore();
};

/** A component that throws on render */
const Bomb = ({ message }: { message: string }) => {
  throw new Error(message);
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p data-testid="child">Hello</p>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders the default fallback UI when a child throws', () => {
    const restore = suppressErrorOutput();
    render(
      <ErrorBoundary>
        <Bomb message="Something broke" />
      </ErrorBoundary>
    );
    restore();

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders a custom fallback when the fallback prop is provided', () => {
    const restore = suppressErrorOutput();
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom error UI</div>}>
        <Bomb message="Crash" />
      </ErrorBoundary>
    );
    restore();

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('does NOT render children after an error is caught', () => {
    const restore = suppressErrorOutput();
    render(
      <ErrorBoundary>
        <Bomb message="Crash" />
        <p data-testid="sibling">Should not render</p>
      </ErrorBoundary>
    );
    restore();

    expect(screen.queryByTestId('sibling')).not.toBeInTheDocument();
  });

  it('renders a "Reload page" button in the default fallback', () => {
    const restore = suppressErrorOutput();
    render(
      <ErrorBoundary>
        <Bomb message="Crash" />
      </ErrorBoundary>
    );
    restore();

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });
});
