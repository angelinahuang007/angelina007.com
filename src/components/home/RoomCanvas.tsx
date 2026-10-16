'use client';

import { useEffect, useRef } from 'react';
import type { RoomMode, RoomViewer } from './scene/viewer';

export function RoomCanvas({ mode, onReady, onError, onHeading, onTap }: {
  mode: RoomMode;
  onReady: (viewer: RoomViewer | null) => void;
  onError: () => void;
  onHeading?: (heading: number) => void;
  onTap?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  useEffect(() => {
    let cancelled = false;
    let viewer: RoomViewer | undefined;
    async function start() {
      try {
        const { createRoomViewer } = await import('./scene/viewer');
        if (cancelled || !canvasRef.current) return;
        viewer = await createRoomViewer(canvasRef.current, mode, {
          onHeading: heading => { if (!cancelled) onHeading?.(heading); },
          onTap: () => { if (!cancelled) onTapRef.current?.(); },
          onError: () => { if (!cancelled) onError(); },
        });
        if (cancelled) viewer.dispose();
        else onReady(viewer);
      } catch { if (!cancelled) onError(); }
    }
    start();
    return () => { cancelled = true; viewer?.dispose(); onReady(null); };
  }, [mode, onReady, onError, onHeading]);
  return <canvas ref={canvasRef} className="room-canvas" tabIndex={0}
    aria-label={`${mode === 'studio' ? 'Sunlit creative studio' : 'Night robotics laboratory'}, interactive 3D room`}
    aria-describedby="room-interaction-help" />;
}
