import { render, screen } from '@testing-library/react';

import Card from './Card';

describe('Card', () => {
  it('renders children within CardContent by default', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies outlined variant', () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-outlined');
  });

  it('wraps children in CardContent by default', () => {
    const { container } = render(<Card>Test Content</Card>);
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).toBeInTheDocument();
    expect(cardContent).toHaveTextContent('Test Content');
  });

  it('renders children directly when noPadding is true', () => {
    const { container } = render(
      <Card noPadding>
        <div data-testid="direct-child">Test Content</div>
      </Card>,
    );
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).not.toBeInTheDocument();
    expect(screen.getByTestId('direct-child')).toBeInTheDocument();
  });

  it('renders children without cardContent when noPadding is true', () => {
    const { container } = render(<Card noPadding>Direct Child</Card>);
    const cardContent = container.querySelector('.MuiCardContent-root');
    expect(cardContent).not.toBeInTheDocument();
  });

  it('accepts CardProps for customization', () => {
    const { container } = render(<Card sx={{ backgroundColor: 'red' }}>Test</Card>);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('renders complex children', () => {
    render(
      <Card>
        <h1>Card Title</h1>
        <p>Card Description</p>
        <button>Action Button</button>
      </Card>,
    );
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
  });

  it('renders multiple cards independently', () => {
    const { container } = render(
      <>
        <Card>Card 1</Card>
        <Card noPadding>Card 2</Card>
      </>,
    );
    const cards = container.querySelectorAll('.MuiCard-root');
    expect(cards).toHaveLength(2);
    const cardContents = container.querySelectorAll('.MuiCardContent-root');
    expect(cardContents).toHaveLength(1);
  });
});
