import { useRef, useState } from 'react';
import { Icon } from '../ui';
import { isAcceptedMediaFile } from '../../../lib/media/mime';

export function StorySlideDropzone({
  uploading,
  disabled,
  onFiles,
}: {
  uploading?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFiles(list: FileList | undefined) {
    if (!list?.length) return;
    const files = [...list].filter(isAcceptedMediaFile);
    if (files.length) onFiles(files);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Add story slides"
        aria-disabled={disabled || undefined}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(false);
          pickFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 transition-colors ${
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-50/30 opacity-40 dark:border-slate-700 dark:bg-slate-900/20'
            : dragOver
              ? 'border-pink-400 bg-pink-50/60 dark:border-pink-600 dark:bg-pink-950/20'
              : 'border-slate-300 bg-slate-50/50 hover:border-pink-300 dark:border-slate-600 dark:bg-slate-800/40'
        }`}
      >
        {uploading ? (
          <Icon name="progress_activity" className="!text-[26px] animate-spin text-slate-400" />
        ) : (
          <Icon name="add_photo_alternate" className="!text-[26px] text-slate-400" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,video/mp4,video/webm,.webp,.png,.jpg,.jpeg"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          pickFiles(e.target.files ?? undefined);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
}
