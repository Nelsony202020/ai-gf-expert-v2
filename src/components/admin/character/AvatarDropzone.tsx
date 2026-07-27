import { useRef, useState } from 'react';
import { Icon } from '../ui';
import { isAcceptedMediaFile } from '../../../lib/media/mime';

type AvatarDropzoneVariant = 'default' | 'profile' | 'iconOnly';

export function AvatarDropzone({
  previewUrl,
  label,
  uploading,
  variant = 'default',
  onFileSelected,
}: {
  previewUrl?: string | null;
  label?: string;
  uploading?: boolean;
  /** profile = circular avatar picker; iconOnly = compact replace control */
  variant?: AvatarDropzoneVariant;
  onFileSelected: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const iconOnly = variant === 'iconOnly';
  const profile = variant === 'profile';

  function pickFile(file: File | undefined) {
    if (!file || !isAcceptedMediaFile(file)) return;
    onFileSelected(file);
  }

  const circleClass = profile
    ? `relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors ${
        dragOver
          ? 'border-pink-400 bg-pink-50/60 dark:border-pink-600 dark:bg-pink-950/20'
          : 'border-slate-300 bg-slate-50/50 hover:border-pink-300 dark:border-slate-600 dark:bg-slate-800/40'
      }`
    : '';

  return (
    <div className={profile ? 'flex flex-col items-center' : undefined}>
      {label && !iconOnly && !profile && (
        <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">{label}</p>
      )}
      {profile && (
        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">Profile picture</p>
      )}
      <div
        role="button"
        tabIndex={0}
        aria-label={label ?? 'Upload profile picture'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
        className={
          profile
            ? circleClass
            : `flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                iconOnly ? 'px-3 py-3' : 'flex-col px-4 py-8'
              } ${
                dragOver
                  ? 'border-pink-400 bg-pink-50/60 dark:border-pink-600 dark:bg-pink-950/20'
                  : 'border-slate-300 bg-slate-50/50 hover:border-pink-300 dark:border-slate-600 dark:bg-slate-800/40'
              }`
        }
      >
        {profile ? (
          uploading ? (
            <Icon name="progress_activity" className="!text-[28px] animate-spin text-slate-400" />
          ) : previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon name="add_a_photo" className="!text-[28px] text-slate-400" />
          )
        ) : iconOnly ? (
          uploading ? (
            <Icon name="progress_activity" className="!text-[22px] animate-spin text-slate-400" />
          ) : (
            <Icon name="add_a_photo" className="!text-[22px] text-slate-400" />
          )
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="mb-2 h-24 w-24 rounded-full border-2 border-white object-cover shadow dark:border-slate-700"
          />
        ) : (
          <Icon name="add_a_photo" className="!text-[32px] text-slate-400" />
        )}
        {!iconOnly && !profile && (
          <>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {uploading ? 'Uploading…' : dragOver ? 'Drop image here' : previewUrl ? 'Replace image' : 'Drag & drop or click to upload'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">PNG, JPG, or WebP</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.webp,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </div>
  );
}
