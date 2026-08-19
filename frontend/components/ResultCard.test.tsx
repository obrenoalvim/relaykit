import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultCard } from './ResultCard';

describe('ResultCard', () => {
  it('shows a waiting message when there is no outcome yet', () => {
    render(<ResultCard title="Text stats" render={() => null} />);
    expect(screen.getByText('Waiting for input.')).toBeInTheDocument();
  });

  it('renders the unavailable reason when the specialist failed', () => {
    render(
      <ResultCard
        title="Language"
        outcome={{ status: 'unavailable', reason: 'circuit_open' }}
        render={() => null}
      />,
    );
    expect(screen.getByText('circuit_open')).toBeInTheDocument();
    expect(screen.getByText('unavailable')).toBeInTheDocument();
  });

  it('renders data through the render prop on success', () => {
    render(
      <ResultCard
        title="Keywords"
        outcome={{ status: 'ok', data: { count: 3 } }}
        render={(data) => <span>count is {data.count}</span>}
      />,
    );
    expect(screen.getByText('count is 3')).toBeInTheDocument();
  });
});
