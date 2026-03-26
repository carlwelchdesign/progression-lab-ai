import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TextField from '../TextField';

describe('TextField', () => {
  it('renders with label', () => {
    render(<TextField label="Test Label" />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('applies fullWidth prop', () => {
    const { container } = render(<TextField label="Full Width" />);
    const textField = container.querySelector('.MuiTextField-root');
    expect(textField).toHaveClass('MuiFormControl-fullWidth');
  });

  it('uses outlined variant', () => {
    const { container } = render(<TextField label="Test" />);
    const input = container.querySelector('.MuiOutlinedInput-root');
    expect(input).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const { container } = render(
      <TextField label="Input Field" value="initial" onChange={handleChange} />,
    );

    const input = container.querySelector('input') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'test input');
    expect(handleChange).toHaveBeenCalled();
  });

  it('accepts placeholder prop', () => {
    const { container } = render(<TextField label="Test" placeholder="Enter text" />);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('placeholder', 'Enter text');
  });

  it('accepts disabled prop', () => {
    const { container } = render(<TextField label="Test" disabled />);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('accepts additional MUI TextField props', () => {
    const { container } = render(<TextField label="Test" type="password" />);
    const input = container.querySelector('input') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders with multiline support', () => {
    const { container } = render(<TextField label="Multiline" multiline rows={4} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
  });
});
