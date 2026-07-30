import { useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { EntityRow } from '../api';
import { Icon } from '../ui';
import { resolveMediaUrl } from '../../../lib/media/url';
import { proofMediaLabel } from './proofTags';

function ImageHoverPreview({ url, anchorRect, isVideo = false }: { url: string; anchorRect: DOMRect; isVideo?: boolean }) {
  const style: CSSProperties = {
    position: 'fixed',
    left: Math.min(anchorRect.left, window.innerWidth - 320),
    top: Math.max(8, anchorRect.top - 8),
    transform: 'translateY(-100%)',
    zIndex: 9999,
  };

  return createPortal(
    <div
      className="pointer-events-none overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-600 dark:bg-slate-900"
      style={style}
    >
      {isVideo ? (
        <video
          src={url}
          className="max-h-64 max-w-[min(320px,90vw)] object-contain"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img src={url} alt="" className="max-h-64 max-w-[min(320px,90vw)] object-contain" />
      )}
    </div>,
    document.body,
  );
}

function ProofHoverPreview({ media, anchorRect }: { media: EntityRow; anchorRect: DOMRect }) {
  const url = resolveMediaUrl(media);
  if (!url) return null;
  return <ImageHoverPreview url={url} anchorRect={anchorRect} isVideo={media.mediaType === 'video'} />;
}

export function ImageHoverThumb({
  url,
  title,
  onRemove,
  size = 'md',
}: {
  url: string;
  title?: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-12 w-12';
  const iconSize = size === 'sm' ? '!text-[14px]' : '!text-[18px]';

  return (
    <>
      <div
        ref={ref}
        className={`group relative ${dim} shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800`}
        onMouseEnter={() => {
          if (ref.current) setRect(ref.current.getBoundingClientRect());
          setHover(true);
        }}
        onMouseLeave={() => setHover(false)}
        title={title}
      >
        <img src={url} alt="" className="h-full w-full object-cover" />
        {onRemove && (
          <button
            type="button"
            className="absolute inset-0 flex items-start justify-end bg-black/0 p-0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100"
            aria-label="Remove screenshot"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Icon name="close" className={`${iconSize} text-white`} />
          </button>
        )}
      </div>
      {hover && rect && url && <ImageHoverPreview url={url} anchorRect={rect} />}
    </>
  );
}

export function ProofThumb({
  media,
  disabled,
  onDetach,
  size = 'md',
}: {
  media: EntityRow;
  disabled?: boolean;
  onDetach?: () => void;
  size?: 'sm' | 'md';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const isVideo = media.mediaType === 'video';
  const url = resolveMediaUrl(media);
  const title = proofMediaLabel(media.caption) || 'Proof';
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const iconSize = size === 'sm' ? '!text-[14px]' : '!text-[18px]';

  return (
    <>
      <div
        ref={ref}
        className={`group relative ${dim} shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800`}
        onMouseEnter={() => {
          if (ref.current) setRect(ref.current.getBoundingClientRect());
          setHover(true);
        }}
        onMouseLeave={() => setHover(false)}
        title={title}
      >
        {url && !isVideo ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : url && isVideo ? (
          <video src={url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
        ) : isVideo ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            <Icon name="play_arrow" className={`${iconSize} text-white/90`} />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon name="image" className={`${iconSize} text-slate-400`} />
          </div>
        )}
        {!disabled && onDetach && (
          <button
            type="button"
            className="absolute inset-0 flex items-start justify-end bg-black/0 p-0 opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100"
            aria-label="Remove proof"
            onClick={(e) => {
              e.stopPropagation();
              onDetach();
            }}
          >
            <Icon name="close" className="!text-[10px] text-white" />
          </button>
        )}
      </div>
      {hover && rect && url && <ProofHoverPreview media={media} anchorRect={rect} />}
    </>
  );
}
