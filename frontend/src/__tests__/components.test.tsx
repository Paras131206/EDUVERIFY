import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { BucketBadge } from '@/components/shared/BucketBadge';
import { MaskedValue } from '@/components/shared/MaskedValue';
import { QualityScoreGauge } from '@/components/shared/QualityScoreGauge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

describe('Shared UI Components', () => {
  it('renders PriorityBadge with text and WCAG aria label', () => {
    render(<PriorityBadge priority="CRITICAL" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Priority: Critical');
  });

  it('renders BucketBadge with proper label', () => {
    render(<BucketBadge bucket="AUTO_FLAG" />);
    expect(screen.getByText('Auto Flag')).toBeInTheDocument();
  });

  it('renders MaskedValue masked by default and reveals on unmask click', () => {
    render(<MaskedValue value="123456789012" kind="apaar" canUnmask />);
    expect(screen.getByText('1234****9012')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /reveal sensitive data/i });
    fireEvent.click(button);
    expect(screen.getByText('123456789012')).toBeInTheDocument();
  });

  it('renders QualityScoreGauge with computed score and label', () => {
    render(<QualityScoreGauge score={85} scoreBefore={70} />);
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '85');
  });

  it('renders EmptyState with custom title', () => {
    render(<EmptyState title="No batches uploaded" description="Please upload a batch" />);
    expect(screen.getByText('No batches uploaded')).toBeInTheDocument();
    expect(screen.getByText('Please upload a batch')).toBeInTheDocument();
  });

  it('renders ErrorState and triggers retry', () => {
    const handleRetry = vi.fn();
    render(<ErrorState title="Failed to load" onRetry={handleRetry} />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renders OfflineBanner when navigator.onLine is false', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
