import type { TimeSignature } from '../../../domain/audio/audio';

type DrumSignature = TimeSignature;

type DrumFileApiItem = {
  path: string;
  label: string;
  category: string;
  signatures: DrumSignature[];
};

type DrumFilesApiResponse = {
  files: DrumFileApiItem[];
};

export type MetronomeDrumOption = {
  value: string;
  label: string;
  group: string;
  signatures: DrumSignature[];
};

export type GroupedSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export const getCompatibleDrumOptions = (
  options: MetronomeDrumOption[],
  timeSignature: TimeSignature,
): MetronomeDrumOption[] => options.filter((option) => option.signatures.includes(timeSignature));

export const fetchMetronomeDrumOptions = async (): Promise<MetronomeDrumOption[]> => {
  const response = await fetch('/api/midi/drums', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load drum patterns');
  }

  const payload = (await response.json()) as DrumFilesApiResponse;

  return payload.files.map((item) => ({
    value: item.path,
    label: item.label,
    group: item.category,
    signatures: item.signatures,
  }));
};

export const buildGroupedDrumSelectOptions = (
  options: MetronomeDrumOption[],
): GroupedSelectOption[] => {
  const grouped = new Map<string, MetronomeDrumOption[]>();

  options.forEach((option) => {
    const groupOptions = grouped.get(option.group) ?? [];
    groupOptions.push(option);
    grouped.set(option.group, groupOptions);
  });

  const result: GroupedSelectOption[] = [];
  Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([group, groupOptions]) => {
      result.push({
        value: `__group__${group}`,
        label: `-- ${group} --`,
        disabled: true,
      });

      groupOptions
        .sort((a, b) => a.label.localeCompare(b.label))
        .forEach((option) => {
          result.push({ value: option.value, label: option.label });
        });
    });

  return result;
};
