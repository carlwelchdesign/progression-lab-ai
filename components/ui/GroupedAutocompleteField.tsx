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
};

/**
 * Shared single-value autocomplete input with optional free text and grouping.
 */
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
}: GroupedAutocompleteFieldProps) {
  return (
    <Autocomplete
      freeSolo={freeSolo}
      options={options}
      groupBy={groupByName ? (option) => groupByName[option] ?? 'Other' : undefined}
      value={value || null}
      inputValue={value}
      onChange={(_, newValue) => {
        onChange(newValue ?? '');
      }}
      onInputChange={(_, newInputValue) => {
        onChange(newInputValue);
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
