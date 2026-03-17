import { render, screen } from '@testing-library/react';

import AppCard from './AppCard';

describe('AppCard', () => {
  it('renders children within CardContent by default', () => {
    render(<AppCard>Test Content</AppCard>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies outlined variant', () => {
    const { container } = render(<AppCard>Test</AppCard>);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-outlined');
  });

  it('wraps children in CardContent by default', () => {
    const { container } = render(<AppCard>Test Content</AppCard>);
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent).toHaveTextContent('Test Content');
  });

  it('renders children directly when noPadding is true', () => {
    const { container } = render(
      <AppCard noPadding>
        <div data-testid="direct-child">Test Content</div>
      </AppCard>
    );
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).not.toBeInTheDocument();
    expect(screen.getByTestId('direct-child')).toBeInTheDocument();
  });

  it('renders children without cardContent when noPadding is true', () => {
    const { container } = render(
      <AppCard noPadding>Direct Child</AppCard>
    );
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).not.toBeInTheDocument();
  });

  it('accepts CardProps for customization', () => {
    const { container } = render(
      <AppCard sx={{ backgroundColor: 'red' }}>Test</AppCard>
    );
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('renders complex children', () => {
    render(
      <AppCard>
        <h1>Card Title</h1>
        <p>Card Description</p>
        <button>Action Button</button>
      </AppCard>
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
  });

  it('renders multiple cards independently', () => {
    const { container } = render(
      <>
        <AppCard>Card 1</AppCard>
        <AppCard noPadding>Card 2</AppCard>
      </>
    );
    const cards = container.querySelectorAll('.MuiCard-root');
    expect(cards).toHaveLength(2);
    const cardContents = container.querySelectorAll('.MuiCardContent-root');
    expect(cardContents).toHaveLength(1);
  });
});
