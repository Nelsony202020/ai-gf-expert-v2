import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Modal, Icon } from '../../ui';
import type { EntityRow } from '../../api';

export function MediaPreviewLightbox({
  row,
  onClose,
}: {
  row: EntityRow | null;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!row || row.mediaType !== 'video') return;
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {});
    return () => {
      video.pause();
    };
  }, [row]);

  if (!row?.url) return null;

  const label = String(row.caption ?? row.altText ?? 'Media preview');

  return (
    <Modal title={label} onClose={onClose}>
      <div className="flex max-h-[75vh] items-center justify-center overflow-hidden rounded-lg bg-black">
        {row.mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={String(row.url)}
            controls
            playsInline
            className="max-h-[75vh] w-full"
          />
        ) : (
          <img src={String(row.url)} alt={String(row.altText ?? label)} className="max-h-[75vh] w-full object-contain" />
        )}
      </div>
      {row.caption && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{String(row.caption)}</p>
      )}
    </Modal>
  );
}

function MediaHoverPreview({ row, anchorRect }: { row: EntityRow; anchorRect: DOMRect }) {
  const isVideo = row.mediaType === 'video';
  const url = String(row.url ?? '');
  const style: CSSProperties = {
    position: 'fixed',
    left: Math.min(anchorRect.left, window.innerWidth - 340),
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
          className="max-h-72 max-w-[min(340px,90vw)] object-contain"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : url ? (
        <img src={url} alt="" className="max-h-72 max-w-[min(340px,90vw)] object-contain" />
      ) : null}
    </div>,
    document.body,
  );
}

/** Inline thumb — same size/look as before; videos show a play icon, not an inline player. */
export function MediaThumb({ row, className = 'aspect-square w-full' }: { row: EntityRow; className?: string }) {
  if (row.mediaType === 'video') {
    return (
      <div className={`flex items-center justify-center rounded-md bg-slate-900 ${className}`}>
        <Icon name="play_circle" className="!text-[24px] text-white/80" />
      </div>
    );
  }
  return row.url ? (
    <img src={row.url} alt={row.altText ?? ''} className={`rounded-md object-cover ${className}`} />
  ) : (
    <div className={`flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 ${className}`}>
      <Icon name="image" className="!text-[20px] text-slate-300" />
    </div>
  );
}

export function MediaPreviewThumb({
  row,
  className = 'aspect-square w-full',
  hoverPreview = false,
  onClick,
}: {
  row: EntityRow;
  className?: string;
  hoverPreview?: boolean;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const url = String(row.url ?? '');

  function showHoverPreview() {
    if (!hoverPreview || !url || !ref.current) return;
    setRect(ref.current.getBoundingClientRect());
    setHover(true);
  }

  function hideHoverPreview() {
    setHover(false);
  }

  const thumb = <MediaThumb row={row} className={className} />;

  if (onClick) {
    return (
      <>
        <div ref={ref} onMouseEnter={showHoverPreview} onMouseLeave={hideHoverPreview}>
          <button
            type="button"
            aria-label="Preview media"
            className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
            onClick={onClick}
          >
            {thumb}
          </button>
        </div>
        {hover && rect && url && <MediaHoverPreview row={row} anchorRect={rect} />}
      </>
    );
  }

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={showHoverPreview}
        onMouseLeave={hideHoverPreview}
      >
        {thumb}
      </div>
      {hover && rect && url && <MediaHoverPreview row={row} anchorRect={rect} />}
    </>
  );
}
