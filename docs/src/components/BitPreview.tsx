import React, { useEffect, useRef } from 'react';
import { loadHyperframesPlayer } from '../lib/player';

interface BitPreviewProps {
  src?: string;
  srcdoc?: string;
  width?: number;
  height?: number;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export const BitPreview: React.FC<BitPreviewProps> = ({
  src,
  srcdoc,
  width = 1920,
  height = 1080,
  className = '',
  autoPlay = true,
  loop = true,
  muted = true,
  controls = false,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let canceled = false;
    let player: HTMLElement | null = null;

    void loadHyperframesPlayer().then(() => {
      if (canceled || !hostRef.current) return;
      player = document.createElement('hyperframes-player');
      player.setAttribute('width', String(width));
      player.setAttribute('height', String(height));
      player.setAttribute('style', 'width:100%;height:100%;display:block;');
      if (muted) player.setAttribute('muted', '');
      if (loop) player.setAttribute('loop', '');
      if (autoPlay) player.setAttribute('autoplay', '');
      if (controls) player.setAttribute('controls', '');
      if (srcdoc !== undefined) {
        player.setAttribute('srcdoc', srcdoc);
      } else if (src) {
        player.setAttribute('src', src);
      }
      host.replaceChildren(player);
    });

    return () => {
      canceled = true;
      host.replaceChildren();
    };
  }, [src, srcdoc, width, height, autoPlay, loop, muted, controls]);

  return (
    <div
      ref={hostRef}
      className={`bit-preview not-content ${className}`}
      style={{ width: '100%', height: '100%', background: '#000' }}
    />
  );
};
