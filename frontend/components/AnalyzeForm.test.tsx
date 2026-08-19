import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnalyzeForm } from './AnalyzeForm';

describe('AnalyzeForm', () => {
  it('disables the submit button while empty', () => {
    render(<AnalyzeForm onSubmit={() => {}} pending={false} />);
    expect(screen.getByRole('button', { name: /analyze/i })).toBeDisabled();
  });

  it('calls onSubmit with the entered text', () => {
    const onSubmit = vi.fn();
    render(<AnalyzeForm onSubmit={onSubmit} pending={false} />);

    fireEvent.change(screen.getByPlaceholderText(/paste a paragraph/i), {
      target: { value: 'hello world' },
    });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));

    expect(onSubmit).toHaveBeenCalledWith('hello world');
  });

  it('shows a relaying label and disables the button while pending', () => {
    render(<AnalyzeForm onSubmit={() => {}} pending />);
    expect(screen.getByRole('button', { name: /relaying/i })).toBeDisabled();
  });
});
