import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type HyperframesPlayerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  srcdoc?: string;
  width?: string | number;
  height?: string | number;
  controls?: boolean | string;
  loop?: boolean | string;
  autoplay?: boolean | string;
  muted?: boolean | string;
  'playback-rate'?: string | number;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'hyperframes-player': HyperframesPlayerAttributes;
    }
  }
}
