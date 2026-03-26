import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SelectField from '../SelectField';

describe('SelectField', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('renders with label', () => {
    render(<SelectField label="Test Select" options={mockOptions} />);
    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
  });

  it('renders all options', () => {
    const { container } = render(<SelectField label="Select" options={mockOptions} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.options.length).toBe(3);
    expect(select.options[0]).toHaveTextContent('Option 1');
    expect(select.options[1]).toHaveTextContent('Option 2');
    expect(select.options[2]).toHaveTextContent('Option 3');
  });

  it('selects option by value', async () => {
    const { container } = render(
      <SelectField label="Select" options={mockOptions} value="option2" onChange={() => {}} />,
    );
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('option2');
  });

  it('calls onChange when option is selected', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const { container } = render(
      <SelectField label="Select" options={mockOptions} value="option1" onChange={handleChange} />,
    );

    const select = container.querySelector('select') as HTMLSelectElement;
    await user.selectOptions(select, 'option3');
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies fullWidth from AppTextField', () => {
    const { container } = render(<SelectField label="Select" options={mockOptions} />);
    const formControl = container.querySelector('.MuiFormControl-root');
    expect(formControl).toHaveClass('MuiFormControl-fullWidth');
  });

  it('uses native select', () => {
    const { container } = render(<SelectField label="Select" options={mockOptions} />);
    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();
  });

  it('renders with disabled prop', () => {
    const { container } = render(<SelectField label="Select" options={mockOptions} disabled />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeDisabled();
  });

  it('renders empty when no options provided', () => {
    const { container } = render(<SelectField label="Select" options={[]} />);
    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.options.length).toBe(0);
  });
});
