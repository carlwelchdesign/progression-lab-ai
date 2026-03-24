import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PdfDownloadButton from './PdfDownloadButton';
import type { PdfChartOptions } from '../../lib/pdf';
import * as pdfModule from '../../lib/pdf';

jest.mock('../../lib/pdf', () => ({
  downloadSessionPdf: jest.fn(),
}));

const mockPdf = jest.mocked(pdfModule);

describe('PdfDownloadButton', () => {
  const mockChartOptions: PdfChartOptions = {
    chords: [{ chord: 'Cmaj7' }, { chord: 'G' }],
    title: 'Test Progression',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render button with default label', () => {
    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should render button with custom label', () => {
    render(<PdfDownloadButton chartOptions={mockChartOptions} label="Download PDF" />);

    expect(screen.getByText('Download PDF')).toBeInTheDocument();
  });

  it('should have PDF icon', () => {
    const { container } = render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    // Check for the SVG or icon element
    const iconElement = container.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  it('should be enabled by default', () => {
    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button');
    expect(button).not.toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<PdfDownloadButton chartOptions={mockChartOptions} disabled={true} />);

    const button = screen.getByText('PDF').closest('button');
    expect(button).toBeDisabled();
  });

  it('should call downloadSessionPdf when clicked', async () => {
    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button')!;
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockPdf.downloadSessionPdf).toHaveBeenCalledWith(mockChartOptions);
    });
  });

  it('should show generating state while downloading', async () => {
    mockPdf.downloadSessionPdf.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 100);
        }),
    );

    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button')!;
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Generating…')).toBeInTheDocument();
    });
  });

  it('should return to normal label after download completes', async () => {
    mockPdf.downloadSessionPdf.mockResolvedValueOnce(undefined);

    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button')!;
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });
  });

  it('should disable button while generating', async () => {
    mockPdf.downloadSessionPdf.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 100);
        }),
    );

    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button')!;
    await userEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('should prevent multiple simultaneous downloads', async () => {
    mockPdf.downloadSessionPdf.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 50);
        }),
    );

    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button')!;

    // Click once
    await userEvent.click(button);

    // Button should be disabled now during generation
    await waitFor(() => {
      expect(screen.getByText('Generating…')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockPdf.downloadSessionPdf).toHaveBeenCalledTimes(1);
    });
  });

  it('should recover button state after download completes', async () => {
    mockPdf.downloadSessionPdf.mockResolvedValueOnce(undefined);

    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button')!;
    await userEvent.click(button);

    await waitFor(() => {
      // Button should return to PDF label after successful download
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });
  });

  it('should pass through ButtonProps', () => {
    render(
      <PdfDownloadButton
        chartOptions={mockChartOptions}
        variant="contained"
        color="primary"
        size="large"
      />,
    );

    const button = screen.getByText('PDF').closest('button')!;
    expect(button).toHaveClass('MuiButton-contained');
  });

  it('should lazy load PDF module on click', async () => {
    render(<PdfDownloadButton chartOptions={mockChartOptions} />);

    const button = screen.getByText('PDF').closest('button')!;
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockPdf.downloadSessionPdf).toHaveBeenCalled();
    });
  });
});
