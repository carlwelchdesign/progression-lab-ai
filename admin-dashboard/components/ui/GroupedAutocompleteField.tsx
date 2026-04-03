import { Autocomplete, TextField as MuiTextField } from '@mui/material';

type GroupedAutocompleteFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  freeSolo?: boolean;
  groupByName?: Record<string, string>;
  getOptionLabel?: (option: string) => string;
};

export default function GroupedAutocompleteField({
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder,
  helperText,
  error,
  freeSolo = false,
  groupByName,
  getOptionLabel,
}: GroupedAutocompleteFieldProps) {
  const resolveOptionLabel = (option: string) => getOptionLabel?.(option) ?? option;

  const resolveValueFromInput = (input: string) => {
    const matchingOption = options.find((option) => resolveOptionLabel(option) === input);
    return matchingOption ?? input;
  };

  return (
    <Autocomplete
      freeSolo={freeSolo}
      options={options}
      groupBy={groupByName ? (option) => groupByName[option] ?? 'Other' : undefined}
      getOptionLabel={(option) => resolveOptionLabel(option)}
      value={value || null}
      inputValue={value ? resolveOptionLabel(value) : ''}
      onChange={(_, newValue) => {
        onChange(typeof newValue === 'string' ? resolveValueFromInput(newValue) : (newValue ?? ''));
      }}
      onInputChange={(_, newInputValue) => {
        onChange(resolveValueFromInput(newInputValue));
      }}
      disabled={disabled}
      renderInput={(params) => (
        <MuiTextField
          {...params}
          label={label}
          placeholder={placeholder}
          fullWidth
          variant="outlined"
          InputLabelProps={{ shrink: true }}
          helperText={helperText}
          error={error}
        />
      )}
    />
  );
}
