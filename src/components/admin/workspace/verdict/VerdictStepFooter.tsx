import { Button, Icon } from '../../ui';

export function VerdictStepFooter({
  onSuggest,
  onSave,
  saving,
  suggestDisabled,
}: {
  onSuggest: () => void;
  onSave: () => void;
  saving: boolean;
  suggestDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
      <Button
        variant="secondary"
        className="!py-2 text-sm"
        disabled={suggestDisabled}
        onClick={onSuggest}
      >
        <Icon name="sticky_note_2" className="!text-[18px]" />
        AI notes & suggestions
      </Button>
      <Button className="!py-2 text-sm" disabled={saving} onClick={onSave}>
        {saving ? 'Saving…' : 'Save section'}
      </Button>
    </div>
  );
}
