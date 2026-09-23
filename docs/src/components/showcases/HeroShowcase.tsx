import React from 'react';
import { BitPreview } from '../BitPreview';
import { docsBitsById } from '../../lib/bits.generated';

interface HeroShowcaseProps {
  bitNames: string[];
  layout?: 'grid' | 'row';
  className?: string;
}

const ShowcaseItem: React.FC<{ bitName: string; className?: string }> = ({
  bitName,
  className,
}) => {
  const bit = docsBitsById[bitName];
  if (!bit) return null;

  return (
    <a
      href={`/docs/bits/${bit.id}`}
      aria-label={`Explore ${bit.title}`}
      className={`group relative block overflow-hidden rounded-xl squircle border border-white/10 bg-gray-900 shadow-lg transition-all hover:border-primary hover:shadow-primary/20 aspect-video ${className || ''}`}
    >
      <div className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
        <BitPreview
          src={bit.htmlPath}
          width={bit.width}
          height={bit.height}
          autoPlay={true}
          loop={true}
          muted={true}
          className="w-full h-full opacity-80 transition-opacity group-hover:opacity-100"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
    </a>
  );
};

export const HeroShowcase: React.FC<HeroShowcaseProps> = ({
  bitNames,
  layout = 'grid',
  className,
}) => {
  const isRow = layout === 'row';

  return (
    <div
      className={`w-full ${
        isRow
          ? 'flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory'
          : 'grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'
      } ${className || ''}`}
    >
      {bitNames.map((bitName) => (
        <ShowcaseItem
          key={bitName}
          bitName={bitName}
          className={isRow ? 'w-80 min-w-[20rem] snap-center' : 'w-full'}
        />
      ))}
    </div>
  );
};
