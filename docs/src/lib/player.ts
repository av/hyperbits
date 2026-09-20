const PLAYER_SRC = '/vendor/hyperframes-player.global.js';

let playerLoader: Promise<void> | null = null;

export function loadHyperframesPlayer(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (customElements.get('hyperframes-player')) {
    return Promise.resolve();
  }

  if (playerLoader) {
    return playerLoader;
  }

  playerLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PLAYER_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load hyperframes-player')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = PLAYER_SRC;
    script.async = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('Failed to load hyperframes-player')),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return playerLoader;
}

export type HyperframesPlayerElement = HTMLElement & {
  play: () => void;
  pause: () => void;
  seek: (timeSeconds: number) => void;
  iframeElement: HTMLIFrameElement;
};
