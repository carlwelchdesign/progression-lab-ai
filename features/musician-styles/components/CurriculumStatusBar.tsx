type CurriculumStatusBarProps = {
  curriculumStale: boolean;
  onRegenerate: () => void;
};

export function CurriculumStatusBar({ curriculumStale, onRegenerate }: CurriculumStatusBarProps) {
  if (!curriculumStale) {
    return null;
  }

  return (
    <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
      <p className="mb-2">Your curriculum is stale due to prompt updates.</p>
      <button type="button" onClick={onRegenerate} className="rounded border px-3 py-1">
        Regenerate
      </button>
    </div>
  );
}
