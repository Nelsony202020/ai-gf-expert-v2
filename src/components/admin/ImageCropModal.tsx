import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Icon } from './ui';

const OUTPUT_SIZE = 800;

/** Square crop with drag + zoom before upload. */
export function ImageCropModal({
  file,
  title = 'Crop profile image',
  onConfirm,
  onCancel,
}: {
  file: File;
  title?: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }

  function onPointerUp() {
    setDragging(false);
  }

  async function handleConfirm() {
    const img = imgRef.current;
    if (!img || !natural.w) return;
    setBusy(true);
    try {
      const viewport = 280;
      const baseScale = Math.max(viewport / natural.w, viewport / natural.h);
      const scale = baseScale * zoom;
      const displayW = natural.w * scale;
      const displayH = natural.h * scale;
      const left = (viewport - displayW) / 2 + offset.x;
      const top = (viewport - displayH) / 2 + offset.y;

      const srcX = Math.max(0, -left / scale);
      const srcY = Math.max(0, -top / scale);
      const srcSize = viewport / scale;
      const cropW = Math.min(srcSize, natural.w - srcX);
      const cropH = Math.min(srcSize, natural.h - srcY);
      const side = Math.min(cropW, cropH);

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, srcX, srcY, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Crop failed'))), 'image/jpeg', 0.92);
      });
      onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  if (!src) return null;

  const baseScale = natural.w ? Math.max(280 / natural.w, 280 / natural.h) : 1;
  const scale = baseScale * zoom;
  const displayW = natural.w * scale;
  const displayH = natural.h * scale;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <Icon name="close" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          <div
            className="relative mx-auto h-[280px] w-[280px] cursor-grab overflow-hidden rounded-full border-2 border-pink-300 bg-slate-100 active:cursor-grabbing dark:border-pink-700 dark:bg-slate-800"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={onImgLoad}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: displayW || 'auto',
                height: displayH || 'auto',
                left: `calc(50% + ${offset.x}px)`,
                top: `calc(50% + ${offset.y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <p className="text-center text-xs text-slate-400">Drag to reposition · scroll zoom on trackpad</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={busy || !natural.w}>
            {busy ? 'Processing…' : 'Use cropped image'}
          </Button>
        </div>
      </div>
    </div>
  );
}
